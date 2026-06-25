import json
import os
import secrets
import threading
import time
import uuid
from typing import Any, Dict, List, Optional

from flask import (
    Flask, jsonify, make_response, redirect, render_template,
    request, send_file, session, url_for, abort
)

from . import utils


_config_cache: Dict[str, Any] = {}
_config_cache_lock = threading.RLock()

# In-memory pending bets: bet_id -> {username, game, amount, settled}
_pending_bets: Dict[str, Dict[str, Any]] = {}
_pending_bets_lock = threading.Lock()

# Genie's Gold progressive jackpot pools
_jackpot_pools: Dict[str, float] = {"grand": 5000, "major": 500, "minor": 100, "mini": 25}
_jackpot_pools_lock = threading.Lock()

_activity: Dict[str, float] = {}
_activity_lock = threading.Lock()
_ACTIVE_WINDOW_SEC = 120


def _bump_activity(username: str) -> None:
    if not username:
        return
    with _activity_lock:
        _activity[username] = time.time()


def _active_users(window_sec: int = _ACTIVE_WINDOW_SEC) -> List[str]:
    cutoff = time.time() - window_sec
    with _activity_lock:
        return [u for u, t in _activity.items() if t >= cutoff]


def get_config() -> Dict[str, Any]:
    with _config_cache_lock:
        if not _config_cache:
            _config_cache.update(utils.load_config())
        return json.loads(json.dumps(_config_cache))


def set_config(cfg: Dict[str, Any]) -> None:
    with _config_cache_lock:
        utils.save_config(cfg)
        _config_cache.clear()
        _config_cache.update(cfg)


def _require_user() -> Optional[Dict[str, Any]]:
    uname = session.get("username")
    if not uname:
        return None
    rec = utils.load_user(uname)
    if rec:
        _bump_activity(rec.get("username") or uname)
    return rec


def _require_admin() -> Optional[Dict[str, Any]]:
    rec = _require_user()
    if rec and rec.get("role") == "admin":
        return rec
    return None


def _json_error(msg: str, status: int = 400):
    return jsonify({"ok": False, "error": msg}), status


def _public_user(rec: Dict[str, Any]) -> Dict[str, Any]:
    safe = dict(rec)
    safe.pop("password", None)
    return safe


def get_jackpot_pools() -> Dict[str, float]:
    with _jackpot_pools_lock:
        return dict(_jackpot_pools)


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

def create_app(base_dir: str) -> Flask:
    template_dir = os.path.join(base_dir, "templates")
    static_dir = os.path.join(base_dir, "static")
    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

    secret_path = os.path.join(utils.DATA_DIR, ".session_secret")
    if os.path.exists(secret_path):
        with open(secret_path, "rb") as f:
            app.secret_key = f.read()
    else:
        key = secrets.token_bytes(32)
        with open(secret_path, "wb") as f:
            f.write(key)
        app.secret_key = key

    with _config_cache_lock:
        _config_cache.clear()
        _config_cache.update(utils.load_config())

    # ----------------------- Pages ----------------------------------------

    @app.route("/")
    def root():
        if session.get("username"):
            return redirect(url_for("lobby"))
        return redirect(url_for("login"))

    @app.route("/login")
    def login():
        if session.get("username"):
            return redirect(url_for("lobby"))
        return render_template("login.html")

    @app.route("/lobby")
    def lobby():
        rec = _require_user()
        if not rec:
            return redirect(url_for("login"))
        return render_template("lobby.html", user=_public_user(rec),
                               tokens=utils.get_tokens(rec["username"]),
                               stats=utils.get_stats(rec["username"]),
                               min_bet=int(get_config().get("casino", {}).get("min_bet", 5)))

    @app.route("/game/<name>")
    def game(name):
        rec = _require_user()
        if not rec:
            return redirect(url_for("login"))
        if name not in ("crash", "mines", "plinko", "wheel", "geniesgold"):
            abort(404)
        return render_template(
            f"games/{name}.html",
            user=_public_user(rec),
            tokens=utils.get_tokens(rec["username"]),
            stats=utils.get_stats(rec["username"]),
            game_name=name,
            min_bet=get_config().get("casino", {}).get("min_bet", 5),
        )

    @app.route("/admincontrols")
    def admincontrols():
        rec = _require_user()
        if not rec:
            return redirect(url_for("login"))
        if rec.get("role") != "admin":
            return render_template("forbidden.html"), 403
        return render_template("admin.html", user=_public_user(rec),
                               config=get_config())

    # ----------------------- Auth API -------------------------------------

    @app.post("/api/signup")
    def api_signup():
        d = request.get_json(silent=True) or {}
        username = (d.get("username") or "").strip()
        username2 = (d.get("username2") or "").strip()
        name = (d.get("name") or "").strip()
        email = (d.get("email") or "").strip()
        password = d.get("password") or ""
        password2 = d.get("password2") or ""
        zip_code = (d.get("zip_code") or "").strip()

        if not all([username, username2, name, email, password, password2, zip_code]):
            return _json_error("All fields are required.")
        if username != username2:
            return _json_error("Usernames do not match.")
        if password != password2:
            return _json_error("Passwords do not match.")
        if len(username) < 2 or len(username) > 32:
            return _json_error("Username must be 2–32 characters.")
        if utils.user_exists(username):
            return _json_error("That username is taken.")
        if utils.find_user_by_email(email):
            return _json_error("That email is already registered.")
        if "@" not in email or "." not in email:
            return _json_error("Email looks invalid.")

        role = "base"
        if not utils.list_users():
            role = "admin"

        cfg = get_config()
        starting_tokens = int(cfg.get("casino", {}).get("starting_tokens", 1000))
        rec = utils.default_user_record(
            username=username, name=name, email=email, password=password,
            zip_code=zip_code, role=role,
        )
        rec["tokens"] = starting_tokens
        utils.save_user(rec)
        session["username"] = rec["username"]
        return jsonify({"ok": True, "user": _public_user(rec),
                        "first_admin": role == "admin"})

    @app.post("/api/login")
    def api_login():
        d = request.get_json(silent=True) or {}
        ident = (d.get("identifier") or "").strip()
        password = d.get("password") or ""
        if not ident or not password:
            return _json_error("Username/email and password are required.")

        username = ident
        if not utils.user_exists(username):
            found = utils.find_user_by_email(ident)
            if found:
                username = found
            else:
                return _json_error("No account found.")

        rec = utils.load_user(username)
        if not rec:
            return _json_error("No account found.")
        if rec.get("password") != password:
            return _json_error("Incorrect password.")

        rec["last_login"] = int(time.time())
        utils.save_user(rec)
        session["username"] = rec["username"]
        return jsonify({"ok": True, "user": _public_user(rec)})

    @app.post("/api/logout")
    def api_logout():
        session.clear()
        return jsonify({"ok": True})

    # ----------------------- User API -------------------------------------

    @app.get("/api/me")
    def api_me():
        rec = _require_user()
        if not rec:
            return _json_error("Not logged in.", 401)
        return jsonify({"ok": True, "user": _public_user(rec),
                        "tokens": utils.get_tokens(rec["username"]),
                        "stats": utils.get_stats(rec["username"])})

    @app.get("/api/balance")
    def api_balance():
        rec = _require_user()
        if not rec:
            return _json_error("Not logged in.", 401)
        return jsonify({"ok": True, "tokens": utils.get_tokens(rec["username"])})

    @app.get("/api/stats")
    def api_stats():
        rec = _require_user()
        if not rec:
            return _json_error("Not logged in.", 401)
        return jsonify({"ok": True, "stats": utils.get_stats(rec["username"])})

    PROFILE_IMG_MAX_BYTES = 1_500_000

    @app.post("/api/user/settings")
    def api_user_settings():
        rec = _require_user()
        if not rec:
            return _json_error("Not logged in.", 401)
        d = request.get_json(silent=True) or {}

        if "zip_code" in d:
            rec["zip_code"] = (d["zip_code"] or "").strip()

        ui = d.get("ui") or {}
        if isinstance(ui, dict):
            allowed_ui = ("theme", "font_size", "bubble_shape")
            for k in allowed_ui:
                if k in ui:
                    rec.setdefault("ui", {})[k] = ui[k]

        utils.save_user(rec)
        return jsonify({"ok": True, "user": _public_user(rec)})

    @app.post("/api/user/profile_image")
    def api_user_profile_image():
        rec = _require_user()
        if not rec:
            return _json_error("Not logged in.", 401)
        d = request.get_json(silent=True) or {}
        which = (d.get("which") or "").strip().lower()
        if which not in utils.PROFILE_IMG_KINDS:
            return _json_error("which must be 'user'.")
        data_url = d.get("data_url") or ""
        blob = utils.decode_data_url(data_url)
        if not blob:
            return _json_error("Could not decode image data.")
        if len(blob) > PROFILE_IMG_MAX_BYTES:
            return _json_error("Image too large (must be under 1.5 MB after compression).")
        ts = utils.save_profile_image(rec["username"], which, blob)
        return jsonify({"ok": True, "which": which, "ts": ts})

    @app.post("/api/user/profile_image/remove")
    def api_user_profile_image_remove():
        rec = _require_user()
        if not rec:
            return _json_error("Not logged in.", 401)
        d = request.get_json(silent=True) or {}
        which = (d.get("which") or "").strip().lower()
        if which not in utils.PROFILE_IMG_KINDS:
            return _json_error("which must be 'user'.")
        path = utils.profile_image_path(rec["username"], which)
        try:
            if os.path.exists(path):
                os.remove(path)
        except OSError:
            pass
        rec["avatar_ts"] = 0
        utils.save_user(rec)
        return jsonify({"ok": True})

    _TRANSPARENT_PNG = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
        b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
        b"\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02"
        b"\xfe\xdc\xccY\xe7\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    @app.get("/api/user/profile_image/<which>")
    def api_user_profile_image_get(which):
        rec = _require_user()
        if not rec:
            return _json_error("Not logged in.", 401)
        if which not in utils.PROFILE_IMG_KINDS:
            abort(404)
        path = utils.profile_image_path(rec["username"], which)
        if os.path.exists(path):
            return send_file(path, mimetype="image/jpeg",
                             max_age=60 * 60 * 24 * 30)
        default_path = utils.default_profile_image_path(which)
        if os.path.exists(default_path):
            return send_file(default_path, mimetype="image/png",
                             max_age=60 * 60 * 24 * 30)
        resp = make_response(_TRANSPARENT_PNG)
        resp.headers["Content-Type"] = "image/png"
        resp.headers["Cache-Control"] = f"public, max-age={60 * 60}"
        return resp

    # ----------------------- Casino API -----------------------------------

    @app.post("/api/bet")
    def api_bet():
        rec = _require_user()
        if not rec:
            return _json_error("Not logged in.", 401)
        d = request.get_json(silent=True) or {}
        game = (d.get("game") or "").strip().lower()
        if game not in ("crash", "mines", "plinko", "wheel", "geniesgold"):
            return _json_error("Invalid game.")
        try:
            amount = int(d.get("amount", 0))
        except (TypeError, ValueError):
            return _json_error("Invalid bet amount.")
        min_bet = int(get_config().get("casino", {}).get("min_bet", 5))
        if amount < min_bet:
            return _json_error(f"Minimum bet is {min_bet}.")

        current = utils.get_tokens(rec["username"])
        if current < amount:
            return _json_error("Not enough tokens.")

        result = utils.remove_tokens(rec["username"], amount)
        if result is None:
            return _json_error("Not enough tokens.")

        bet_id = uuid.uuid4().hex
        with _pending_bets_lock:
            _pending_bets[bet_id] = {
                "username": rec["username"],
                "game": game,
                "amount": amount,
                "settled": False,
                "ts": int(time.time()),
            }

        return jsonify({
            "ok": True,
            "bet_id": bet_id,
            "tokens": result,
            "amount": amount,
        })

    @app.post("/api/win")
    def api_win():
        rec = _require_user()
        if not rec:
            return _json_error("Not logged in.", 401)
        d = request.get_json(silent=True) or {}
        bet_id = (d.get("bet_id") or "").strip()
        try:
            payout = int(d.get("payout", 0))
        except (TypeError, ValueError):
            return _json_error("Invalid payout.")

        with _pending_bets_lock:
            bet = _pending_bets.get(bet_id)
            if not bet:
                return _json_error("Unknown bet.")
            if bet["username"] != rec["username"]:
                return _json_error("Bet does not belong to you.")
            if bet["settled"]:
                return _json_error("Bet already settled.")

            amount = bet["amount"]
            bet["settled"] = True
            _pending_bets[bet_id] = bet

        new_tokens = utils.add_tokens(rec["username"], payout)
        stats = utils.update_stats_win(rec["username"], amount, payout)

        return jsonify({
            "ok": True,
            "tokens": new_tokens,
            "stats": stats,
            "payout": payout,
        })

    @app.post("/api/loss")
    def api_loss():
        rec = _require_user()
        if not rec:
            return _json_error("Not logged in.", 401)
        d = request.get_json(silent=True) or {}
        bet_id = (d.get("bet_id") or "").strip()

        with _pending_bets_lock:
            bet = _pending_bets.get(bet_id)
            if not bet:
                return _json_error("Unknown bet.")
            if bet["username"] != rec["username"]:
                return _json_error("Bet does not belong to you.")
            if bet["settled"]:
                return _json_error("Bet already settled.")

            amount = bet["amount"]
            bet["settled"] = True
            _pending_bets[bet_id] = bet

        new_tokens = utils.get_tokens(rec["username"])
        stats = utils.update_stats_loss(rec["username"], amount)

        return jsonify({
            "ok": True,
            "tokens": new_tokens,
            "stats": stats,
        })

    @app.post("/api/reset_tokens")
    def api_reset_tokens():
        rec = _require_user()
        if not rec:
            return _json_error("Not logged in.", 401)
        cfg = get_config()
        starting = int(cfg.get("casino", {}).get("starting_tokens", 1000))
        rec["tokens"] = starting
        rec["stats"] = {"wins": 0, "losses": 0, "streak": 0,
                        "total_wagered": 0, "total_won": 0, "games_played": 0}
        utils.save_user(rec)
        return jsonify({"ok": True, "tokens": starting, "stats": rec["stats"]})

    # ----------------------- Admin API ------------------------------------

    @app.get("/api/admin/config")
    def api_admin_config():
        if not _require_admin():
            return _json_error("Admin only.", 403)
        return jsonify({"ok": True, "config": get_config()})

    @app.post("/api/admin/config")
    def api_admin_config_save():
        if not _require_admin():
            return _json_error("Admin only.", 403)
        d = request.get_json(silent=True) or {}
        new_cfg = d.get("config") or {}

        try:
            srv = new_cfg.setdefault("server", {})
            srv["port"] = int(srv.get("port", 5005))
            srv["lan_visible"] = bool(srv.get("lan_visible", True))

            casino = new_cfg.setdefault("casino", {})
            casino["starting_tokens"] = max(100, int(casino.get("starting_tokens", 1000)))
            casino["min_bet"] = max(1, int(casino.get("min_bet", 5)))
        except (ValueError, TypeError) as exc:
            return _json_error(f"Invalid number: {exc}")

        set_config(new_cfg)
        return jsonify({"ok": True, "config": get_config()})

    @app.get("/api/admin/users")
    def api_admin_users():
        if not _require_admin():
            return _json_error("Admin only.", 403)
        out = []
        for u in utils.list_users():
            out.append({
                "username": u.get("username"),
                "name": u.get("name"),
                "email": u.get("email"),
                "role": u.get("role", "base"),
                "tokens": u.get("tokens", 0),
                "stats": utils.get_stats(u.get("username") or ""),
                "created": u.get("created"),
                "last_login": u.get("last_login"),
            })
        return jsonify({"ok": True, "users": out})

    @app.get("/api/admin/stats")
    def api_admin_stats():
        if not _require_admin():
            return _json_error("Admin only.", 403)
        return jsonify({"ok": True, "stats": _gather_stats()})

    @app.post("/api/admin/user_role")
    def api_admin_user_role():
        admin = _require_admin()
        if not admin:
            return _json_error("Admin only.", 403)
        d = request.get_json(silent=True) or {}
        username = d.get("username")
        role = d.get("role")
        if role not in ("admin", "base"):
            return _json_error("Role must be 'admin' or 'base'.")
        rec = utils.load_user(username)
        if not rec:
            return _json_error("No such user.")
        if role == "base":
            admins = [u for u in utils.list_users() if u.get("role") == "admin"]
            if len(admins) <= 1 and rec.get("role") == "admin":
                return _json_error("Cannot demote the only admin.")
        rec["role"] = role
        utils.save_user(rec)
        return jsonify({"ok": True})

    @app.post("/api/admin/adjust_tokens")
    def api_admin_adjust_tokens():
        if not _require_admin():
            return _json_error("Admin only.", 403)
        d = request.get_json(silent=True) or {}
        username = d.get("username")
        try:
            amount = int(d.get("amount", 0))
        except (TypeError, ValueError):
            return _json_error("Invalid amount.")
        rec = utils.load_user(username)
        if not rec:
            return _json_error("No such user.")
        current = utils.get_tokens(username)
        if current + amount < 0:
            return _json_error("User cannot have negative tokens.")
        new_balance = utils.add_tokens(username, amount)
        return jsonify({"ok": True, "tokens": new_balance})

    # ----------------------- Genie's Gold Jackpot API ----------------------

    @app.get("/api/geniesgold/jackpots")
    def api_geniesgold_jackpots():
        cfg = get_config().get("casino", {}).get("geniesgold", {})
        pools = get_jackpot_pools()
        return jsonify({
            "ok": True,
            "pools": pools,
            "config": cfg.get("jackpots", {}),
        })

    @app.post("/api/geniesgold/jackpot_win")
    def api_geniesgold_jackpot_win():
        rec = _require_user()
        if not rec:
            return _json_error("Not logged in.", 401)
        d = request.get_json(silent=True) or {}
        tier = (d.get("tier") or "").strip().lower()
        bet_id = (d.get("bet_id") or "").strip()
        if tier not in ("grand", "major", "minor", "mini"):
            return _json_error("Invalid jackpot tier.")

        with _pending_bets_lock:
            bet = _pending_bets.get(bet_id)
            if not bet:
                return _json_error("Unknown bet.")
            if bet["username"] != rec["username"]:
                return _json_error("Bet does not belong to you.")
            if bet["settled"]:
                return _json_error("Bet already settled.")
            bet["settled"] = True
            _pending_bets[bet_id] = bet

        with _jackpot_pools_lock:
            payout = int(_jackpot_pools.get(tier, 0))
            cfg = get_config().get("casino", {}).get("geniesgold", {}).get("jackpots", {})
            seed_map = {"grand": 5000, "major": 500, "minor": 100, "mini": 25}
            seed = int(cfg.get(tier, {}).get("seed", seed_map.get(tier, 25)))
            _jackpot_pools[tier] = float(seed)

        new_tokens = utils.add_tokens(rec["username"], payout)
        stats = utils.update_stats_win(rec["username"], bet["amount"], payout)
        return jsonify({
            "ok": True,
            "tokens": new_tokens,
            "stats": stats,
            "payout": payout,
            "tier": tier,
        })

    @app.post("/api/admin/geniesgold_config")
    def api_admin_geniesgold_config():
        if not _require_admin():
            return _json_error("Admin only.", 403)
        d = request.get_json(silent=True) or {}
        cfg = get_config()
        casino = cfg.setdefault("casino", {})
        gg = casino.setdefault("geniesgold", {})

        if "jackpot_feed_pct" in d:
            gg["jackpot_feed_pct"] = max(0, min(10, float(d["jackpot_feed_pct"])))
        if "jackpots" in d:
            jp = gg.setdefault("jackpots", {})
            for tier in ("grand", "major", "minor", "mini"):
                if tier in d["jackpots"]:
                    t = d["jackpots"][tier]
                    jp.setdefault(tier, {})
                    if "seed" in t:
                        jp[tier]["seed"] = max(0, int(t["seed"]))
                    if "base_odds" in t:
                        jp[tier]["base_odds"] = max(1, int(t["base_odds"]))
                    if "min_bet" in t:
                        jp[tier]["min_bet"] = max(1, int(t["min_bet"]))

        set_config(cfg)
        return jsonify({"ok": True, "config": cfg.get("casino", {}).get("geniesgold", {})})

    @app.get("/api/admin/geniesgold_config")
    def api_admin_geniesgold_config_get():
        if not _require_admin():
            return _json_error("Admin only.", 403)
        cfg = get_config().get("casino", {}).get("geniesgold", {})
        pools = get_jackpot_pools()
        return jsonify({"ok": True, "config": cfg, "pools": pools})

    return app


# ---------------------------------------------------------------------------
# Admin stats
# ---------------------------------------------------------------------------

def _gather_stats() -> Dict[str, Any]:
    users = utils.list_users()
    total_users = len(users)
    admin_count = sum(1 for u in users if u.get("role") == "admin")
    active = _active_users()

    total_tokens = 0
    total_wagered = 0
    total_won = 0
    total_wins = 0
    total_losses = 0
    total_games = 0
    richest = {"username": None, "tokens": 0}

    for u in users:
        uname = u.get("username") or ""
        tokens = u.get("tokens", 0) or 0
        total_tokens += tokens
        if tokens > richest["tokens"]:
            richest = {"username": u.get("name") or uname, "tokens": tokens}
        s = utils.get_stats(uname)
        total_wagered += s.get("total_wagered", 0) or 0
        total_won += s.get("total_won", 0) or 0
        total_wins += s.get("wins", 0) or 0
        total_losses += s.get("losses", 0) or 0
        total_games += s.get("games_played", 0) or 0

    return {
        "ts": int(time.time()),
        "status": "online",
        "total_users": total_users,
        "admin_count": admin_count,
        "active_users": len(active),
        "active_usernames": active,
        "active_window_sec": _ACTIVE_WINDOW_SEC,
        "total_tokens": total_tokens,
        "richest": richest,
        "total_wagered": total_wagered,
        "total_won": total_won,
        "total_wins": total_wins,
        "total_losses": total_losses,
        "total_games": total_games,
    }

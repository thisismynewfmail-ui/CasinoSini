import base64
import os
import json
import shutil
import threading
import time
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
USERS_DIR = os.path.join(DATA_DIR, "users")
CONFIG_PATH = os.path.join(DATA_DIR, "config.json")

os.makedirs(USERS_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Locks
# ---------------------------------------------------------------------------

_config_lock = threading.RLock()
_user_locks: Dict[str, threading.RLock] = {}
_user_locks_guard = threading.Lock()


def _user_lock(username: str) -> threading.RLock:
    with _user_locks_guard:
        if username not in _user_locks:
            _user_locks[username] = threading.RLock()
        return _user_locks[username]


# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

def default_config() -> Dict[str, Any]:
    return {
        "server": {
            "port": 5005,
            "lan_visible": True,
        },
        "ui_defaults": {
            "theme": "shifting",
            "font_size": 15,
            "bubble_shape": "square",
        },
        "casino": {
            "starting_tokens": 1000,
            "min_bet": 5,
        },
        "config_version": 2,
        "last_saved": int(time.time()),
    }


def default_user_record(username: str, name: str, email: str, password: str,
                        zip_code: str, role: str = "base") -> Dict[str, Any]:
    return {
        "username": username,
        "name": name or username,
        "email": (email or "").strip(),
        "password": password,
        "zip_code": (zip_code or "").strip(),
        "role": role,
        "ui": {
            "theme": "shifting",
            "font_size": 15,
            "bubble_shape": "square",
        },
        "tokens": 1000,
        "stats": {
            "wins": 0,
            "losses": 0,
            "streak": 0,
            "total_wagered": 0,
            "total_won": 0,
            "games_played": 0,
        },
        "avatar_ts": 0,
        "created": int(time.time()),
        "last_login": int(time.time()),
    }


# ---------------------------------------------------------------------------
# Config IO
# ---------------------------------------------------------------------------

def _deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(base)
    for k, v in override.items():
        if k in out and isinstance(out[k], dict) and isinstance(v, dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def load_config() -> Dict[str, Any]:
    with _config_lock:
        if not os.path.exists(CONFIG_PATH):
            cfg = default_config()
            save_config(cfg)
            return cfg
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            return _deep_merge(default_config(), cfg)
        except (json.JSONDecodeError, OSError):
            cfg = default_config()
            save_config(cfg)
            return cfg


def save_config(cfg: Dict[str, Any]) -> None:
    with _config_lock:
        cfg["last_saved"] = int(time.time())
        tmp = CONFIG_PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
        os.replace(tmp, CONFIG_PATH)


# ---------------------------------------------------------------------------
# User IO
# ---------------------------------------------------------------------------

def user_dir(username: str) -> str:
    return os.path.join(USERS_DIR, _safe_username(username))


def _safe_username(username: str) -> str:
    keep = "".join(c for c in username if c.isalnum() or c in "_-.")
    return keep[:64] or "user"


def user_exists(username: str) -> bool:
    path = os.path.join(user_dir(username), "user.json")
    return os.path.exists(path)


def find_user_by_email(email: str) -> Optional[str]:
    email = (email or "").strip().lower()
    if not email:
        return None
    for name in os.listdir(USERS_DIR):
        rec_path = os.path.join(USERS_DIR, name, "user.json")
        if not os.path.exists(rec_path):
            continue
        try:
            with open(rec_path, "r", encoding="utf-8") as f:
                rec = json.load(f)
            if (rec.get("email", "") or "").strip().lower() == email:
                return rec.get("username")
        except (json.JSONDecodeError, OSError):
            continue
    return None


def load_user(username: str) -> Optional[Dict[str, Any]]:
    if not user_exists(username):
        return None
    with _user_lock(username):
        path = os.path.join(user_dir(username), "user.json")
        try:
            with open(path, "r", encoding="utf-8") as f:
                rec = json.load(f)
        except (json.JSONDecodeError, OSError):
            return None
        return rec


def save_user(rec: Dict[str, Any]) -> None:
    username = rec["username"]
    with _user_lock(username):
        _write_user(username, rec)


def _write_user(username: str, rec: Dict[str, Any]) -> None:
    d = user_dir(username)
    os.makedirs(d, exist_ok=True)
    path = os.path.join(d, "user.json")
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(rec, f, indent=2)
    os.replace(tmp, path)


def list_users() -> List[Dict[str, Any]]:
    out = []
    if not os.path.isdir(USERS_DIR):
        return out
    for name in sorted(os.listdir(USERS_DIR)):
        rec_path = os.path.join(USERS_DIR, name, "user.json")
        if os.path.exists(rec_path):
            try:
                with open(rec_path, "r", encoding="utf-8") as f:
                    out.append(json.load(f))
            except (json.JSONDecodeError, OSError):
                pass
    return out


# ---------------------------------------------------------------------------
# Token & Stats Operations
# ---------------------------------------------------------------------------

def get_tokens(username: str) -> int:
    rec = load_user(username)
    if not rec:
        return 0
    try:
        return int(rec.get("tokens", 0) or 0)
    except (TypeError, ValueError):
        return 0


def add_tokens(username: str, amount: int) -> int:
    rec = load_user(username)
    if not rec:
        return 0
    current = get_tokens(username)
    rec["tokens"] = current + amount
    save_user(rec)
    return rec["tokens"]


def remove_tokens(username: str, amount: int) -> Optional[int]:
    rec = load_user(username)
    if not rec:
        return None
    current = get_tokens(username)
    if current < amount:
        return None
    rec["tokens"] = current - amount
    save_user(rec)
    return rec["tokens"]


def update_stats_win(username: str, wagered: int, payout: int) -> Dict[str, Any]:
    rec = load_user(username)
    if not rec:
        return {}
    stats = rec.setdefault("stats", {})
    stats["wins"] = (stats.get("wins", 0) or 0) + 1
    stats["streak"] = (stats.get("streak", 0) or 0) + 1
    stats["total_wagered"] = (stats.get("total_wagered", 0) or 0) + wagered
    stats["total_won"] = (stats.get("total_won", 0) or 0) + payout
    stats["games_played"] = (stats.get("games_played", 0) or 0) + 1
    save_user(rec)
    return stats


def update_stats_loss(username: str, wagered: int) -> Dict[str, Any]:
    rec = load_user(username)
    if not rec:
        return {}
    stats = rec.setdefault("stats", {})
    stats["losses"] = (stats.get("losses", 0) or 0) + 1
    stats["streak"] = 0
    stats["total_wagered"] = (stats.get("total_wagered", 0) or 0) + wagered
    stats["games_played"] = (stats.get("games_played", 0) or 0) + 1
    save_user(rec)
    return stats


def get_stats(username: str) -> Dict[str, Any]:
    rec = load_user(username)
    if not rec:
        return {"wins": 0, "losses": 0, "streak": 0,
                "total_wagered": 0, "total_won": 0, "games_played": 0}
    s = rec.get("stats", {}) or {}
    return {
        "wins": s.get("wins", 0) or 0,
        "losses": s.get("losses", 0) or 0,
        "streak": s.get("streak", 0) or 0,
        "total_wagered": s.get("total_wagered", 0) or 0,
        "total_won": s.get("total_won", 0) or 0,
        "games_played": s.get("games_played", 0) or 0,
    }


# ---------------------------------------------------------------------------
# Profile image IO
# ---------------------------------------------------------------------------

PROFILE_IMGS_DIRNAME = "profile_imgs"
PROFILE_IMG_KINDS = ("user",)
DEFAULT_PROFILE_DIR = os.path.join(DATA_DIR, "default", "profile")


def profile_imgs_dir(username: str) -> str:
    return os.path.join(user_dir(username), PROFILE_IMGS_DIRNAME)


def profile_image_path(username: str, which: str) -> str:
    if which not in PROFILE_IMG_KINDS:
        which = "user"
    return os.path.join(profile_imgs_dir(username), f"{which}_current.jpg")


def profile_image_exists(username: str, which: str) -> bool:
    return os.path.exists(profile_image_path(username, which))


def default_profile_image_path(which: str) -> str:
    if which not in PROFILE_IMG_KINDS:
        which = "user"
    name = "nouser.png"
    return os.path.join(DEFAULT_PROFILE_DIR, name)


def save_profile_image(username: str, which: str, jpeg_bytes: bytes) -> int:
    if which not in PROFILE_IMG_KINDS:
        raise ValueError(f"unknown profile image kind: {which}")
    with _user_lock(username):
        d = profile_imgs_dir(username)
        os.makedirs(d, exist_ok=True)
        path = profile_image_path(username, which)
        tmp = path + ".tmp"
        with open(tmp, "wb") as f:
            f.write(jpeg_bytes)
        os.replace(tmp, path)
        ts = int(time.time())

        rec_path = os.path.join(user_dir(username), "user.json")
        if os.path.exists(rec_path):
            try:
                with open(rec_path, "r", encoding="utf-8") as f:
                    rec = json.load(f)
                rec["avatar_ts"] = ts
                _write_user(username, rec)
            except (json.JSONDecodeError, OSError):
                pass
        return ts


def decode_data_url(data_url: str) -> Optional[bytes]:
    if not data_url or not isinstance(data_url, str):
        return None
    if not data_url.startswith("data:"):
        return None
    try:
        _, b64 = data_url.split(",", 1)
    except ValueError:
        return None
    try:
        return base64.b64decode(b64, validate=False)
    except (ValueError, base64.binascii.Error):
        return None


# ---------------------------------------------------------------------------
# Token estimation (kept for compatibility, unused in casino context)
# ---------------------------------------------------------------------------

def est_tokens(text: str) -> int:
    if not text:
        return 0
    by_chars = len(text) / 4.0
    by_words = len(text.split()) / 0.75
    return int(max(by_chars, by_words)) + 1

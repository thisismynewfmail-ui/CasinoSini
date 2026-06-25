(function () {
    "use strict";

    const A = window.__ADMIN__ || { config: {} };
    let CONFIG = JSON.parse(JSON.stringify(A.config || {}));

    const $  = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    function showToast(msg, kind) {
        const t = $("#toast");
        if (!t) return;
        t.textContent = msg;
        t.className = "toast show " + (kind || "");
        setTimeout(() => t.classList.remove("show"), 2400);
    }

    async function getJSON(url) {
        const r = await fetch(url, { credentials: "same-origin" });
        let d = null;
        try { d = await r.json(); } catch (_) {}
        return { ok: r.ok, status: r.status, data: d || {} };
    }

    async function postJSON(url, body) {
        const r = await fetch(url, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body || {}),
        });
        let d = null;
        try { d = await r.json(); } catch (_) {}
        return { ok: r.ok, status: r.status, data: d || {} };
    }

    function activateTab(name) {
        $$(".admin-tab").forEach(t => t.classList.toggle("active", t.dataset.section === name));
        $$(".admin-section").forEach(s => s.classList.toggle("active", s.dataset.section === name));
    }

    $$(".admin-tab").forEach(t => {
        t.addEventListener("click", () => activateTab(t.dataset.section));
    });

    // ----- DASHBOARD -----
    let dashTimer = null;
    let dashCountdown = 0;

    function fmtNum(n) {
        if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
        if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
        return String(n);
    }

    async function refreshDashboard() {
        const r = await getJSON("/api/admin/stats");
        if (!r.ok || !r.data.stats) return;
        const s = r.data.stats;

        const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        setText("dash-total-users", s.total_users ?? "—");
        setText("dash-admin-count", s.admin_count ?? "—");
        setText("dash-total-tokens", fmtNum(s.total_tokens ?? 0));
        setText("dash-total-games", fmtNum(s.total_games ?? 0));

        const richest = s.richest || {};
        setText("dash-richest-name", richest.username || "—");
        setText("dash-richest-tokens", fmtNum(richest.tokens || 0));

        const wins = s.total_wins ?? 0;
        const losses = s.total_losses ?? 0;
        setText("dash-win-loss", wins + " / " + losses);
        setText("dash-net-won", fmtNum((s.total_won ?? 0) - (s.total_wagered ?? 0)));

        setText("dash-status-ts", new Date().toLocaleTimeString());
    }

    function startDashCountdown() {
        dashCountdown = 30;
        const tag = document.getElementById("dash-refresh-tag");
        const tick = () => {
            dashCountdown--;
            if (tag) tag.textContent = "refresh in " + dashCountdown + "s";
            if (dashCountdown <= 0) {
                refreshDashboard();
                dashCountdown = 30;
            }
        };
        if (dashTimer) clearInterval(dashTimer);
        dashTimer = setInterval(tick, 1000);
    }

    refreshDashboard();
    startDashCountdown();

    // ----- USERS TABLE -----
    async function refreshUsers() {
        const r = await getJSON("/api/admin/users");
        if (!r.ok || !r.data.users) return;
        const tbody = document.querySelector("#user-table tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        r.data.users.forEach(u => {
            const tr = document.createElement("tr");

            const username = u.username || "?";
            const name = u.name || "";
            const email = u.email || "";
            const role = u.role || "base";
            const tokens = u.tokens ?? 0;
            const st = u.stats || {};
            const wl = (st.wins ?? 0) + " / " + (st.losses ?? 0);
            const games = (st.wins ?? 0) + (st.losses ?? 0);

            tr.innerHTML =
                "<td>" + esc(username) + "</td>" +
                "<td>" + esc(name) + "</td>" +
                "<td>" + esc(email) + "</td>" +
                "<td>" +
                    "<select class=\"role-select\" data-username=\"" + esc(username) + "\">" +
                        "<option value=\"base\"" + (role === "base" ? " selected" : "") + ">base</option>" +
                        "<option value=\"admin\"" + (role === "admin" ? " selected" : "") + ">admin</option>" +
                    "</select>" +
                "</td>" +
                "<td class=\"tokens-cell\">" +
                    "<span class=\"token-val\">" + tokens + "</span>" +
                    " <button class=\"btn tiny\" data-action=\"adjust\" data-username=\"" + esc(username) + "\">adj</button>" +
                "</td>" +
                "<td>" + wl + "</td>" +
                "<td>" + games + "</td>" +
                "<td>" +
                    "<button class=\"btn tiny danger\" data-action=\"reset\" data-username=\"" + esc(username) + "\">reset</button>" +
                "</td>";

            tbody.appendChild(tr);
        });
    }

    function esc(s) {
        const d = document.createElement("div");
        d.textContent = s;
        return d.innerHTML;
    }

    refreshUsers();

    // ----- USER ACTIONS (delegated) -----
    document.querySelector("#user-table tbody").addEventListener("change", async function (e) {
        const sel = e.target.closest(".role-select");
        if (!sel) return;
        const username = sel.dataset.username;
        const role = sel.value;
        const r = await postJSON("/api/admin/user_role", { username, role });
        if (r.ok) {
            showToast("Updated " + username + " role to " + role, "success");
        } else {
            showToast(r.data.error || "Failed to update role", "error");
            refreshUsers();
        }
    });

    document.querySelector("#user-table tbody").addEventListener("click", async function (e) {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;
        const username = btn.dataset.username;
        const action = btn.dataset.action;

        if (action === "reset") {
            if (!confirm("Reset chips for " + username + " to 1000?")) return;
            const r = await postJSON("/api/admin/adjust_tokens", { username, amount: 1000 - (parseInt(btn.closest("tr").querySelector(".token-val").textContent) || 0) });
            if (r.ok) {
                showToast("Reset " + username + " chips to 1000", "success");
                refreshUsers();
            } else {
                showToast(r.data.error || "Failed", "error");
            }
        } else if (action === "adjust") {
            const tr = btn.closest("tr");
            const valEl = tr.querySelector(".token-val");
            const current = parseInt(valEl.textContent) || 0;
            const delta = prompt("Adjust chips for " + username + " (current: " + current + "). Enter change (e.g. +1000 or -500):");
            if (delta === null || delta === "") return;
            const amount = parseInt(delta.replace(/[+\s]/g, ""), 10);
            if (isNaN(amount)) { showToast("Invalid number", "error"); return; }
            const signed = delta.startsWith("-") ? -amount : amount;
            const r = await postJSON("/api/admin/adjust_tokens", { username, amount: signed });
            if (r.ok) {
                showToast("Adjusted " + username + " chips: " + (signed > 0 ? "+" : "") + signed, "success");
                refreshUsers();
            } else {
                showToast(r.data.error || "Failed", "error");
            }
        }
    });

    // ----- SIGN OUT -----
    document.getElementById("logout-btn").addEventListener("click", async function (e) {
        e.preventDefault();
        await postJSON("/api/logout", {});
        window.location.href = "/";
    });

    // ----- CASINO / GENIE'S GOLD -----
    async function refreshCasino() {
        const r = await getJSON("/api/admin/geniesgold_config");
        if (!r.ok || !r.data.config) return;
        const cfg = r.data.config;
        const pools = r.data.pools || {};

        const jp = cfg.jackpots || {};
        const feedEl = document.getElementById("jackpotFeed");
        if (feedEl) feedEl.value = cfg.jackpot_feed_pct || 1.5;

        // Grand
        if (jp.grand) {
            const gSeed = document.getElementById("grandSeed");
            const gOdds = document.getElementById("grandOdds");
            const gMinBet = document.getElementById("grandMinBet");
            if (gSeed) gSeed.value = jp.grand.seed ?? 5000;
            if (gOdds) gOdds.value = jp.grand.base_odds ?? 100000;
            if (gMinBet) gMinBet.value = jp.grand.min_bet ?? 10;
        }
        // Major
        if (jp.major) {
            const mSeed = document.getElementById("majorSeed");
            const mOdds = document.getElementById("majorOdds");
            const mMinBet = document.getElementById("majorMinBet");
            if (mSeed) mSeed.value = jp.major.seed ?? 500;
            if (mOdds) mOdds.value = jp.major.base_odds ?? 10000;
            if (mMinBet) mMinBet.value = jp.major.min_bet ?? 5;
        }
        // Minor
        if (jp.minor) {
            const mSeed = document.getElementById("minorSeed");
            const mOdds = document.getElementById("minorOdds");
            const mMinBet = document.getElementById("minorMinBet");
            if (mSeed) mSeed.value = jp.minor.seed ?? 100;
            if (mOdds) mOdds.value = jp.minor.base_odds ?? 1000;
            if (mMinBet) mMinBet.value = jp.minor.min_bet ?? 5;
        }
        // Mini
        if (jp.mini) {
            const mSeed = document.getElementById("miniSeed");
            const mOdds = document.getElementById("miniOdds");
            const mMinBet = document.getElementById("miniMinBet");
            if (mSeed) mSeed.value = jp.mini.seed ?? 25;
            if (mOdds) mOdds.value = jp.mini.base_odds ?? 200;
            if (mMinBet) mMinBet.value = jp.mini.min_bet ?? 5;
        }

        // Pool balances
        const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setText("poolGrand", "$" + Math.floor(pools.grand ?? 5000).toLocaleString());
        setText("poolMajor", "$" + Math.floor(pools.major ?? 500).toLocaleString());
        setText("poolMinor", "$" + Math.floor(pools.minor ?? 100).toLocaleString());
        setText("poolMini", "$" + Math.floor(pools.mini ?? 25).toLocaleString());
    }

    refreshCasino();

    // ----- APPLY SETTINGS / NETWORK / CASINO -----
    document.getElementById("btn-apply").addEventListener("click", async function () {
        const port = parseInt(document.getElementById("port").value, 10);
        const lan_visible = document.getElementById("lan_visible").checked;

        const cfg = {
            server: {
                port: port,
                lan_visible: lan_visible,
            },
            casino: CONFIG.casino || {},
            ui_defaults: CONFIG.ui_defaults || {},
        };

        const r = await postJSON("/api/admin/config", { config: cfg });
        if (r.ok) {
            CONFIG = r.data.config || cfg;

            // Save Genie's Gold jackpot config
            const feedPct = parseFloat(document.getElementById("jackpotFeed").value) || 1.5;
            const ggConfig = {
                jackpot_feed_pct: feedPct,
                jackpots: {
                    grand: {
                        seed: parseInt(document.getElementById("grandSeed").value) || 5000,
                        base_odds: parseInt(document.getElementById("grandOdds").value) || 100000,
                        min_bet: parseInt(document.getElementById("grandMinBet").value) || 10,
                    },
                    major: {
                        seed: parseInt(document.getElementById("majorSeed").value) || 500,
                        base_odds: parseInt(document.getElementById("majorOdds").value) || 10000,
                        min_bet: parseInt(document.getElementById("majorMinBet").value) || 5,
                    },
                    minor: {
                        seed: parseInt(document.getElementById("minorSeed").value) || 100,
                        base_odds: parseInt(document.getElementById("minorOdds").value) || 1000,
                        min_bet: parseInt(document.getElementById("minorMinBet").value) || 5,
                    },
                    mini: {
                        seed: parseInt(document.getElementById("miniSeed").value) || 25,
                        base_odds: parseInt(document.getElementById("miniOdds").value) || 200,
                        min_bet: parseInt(document.getElementById("miniMinBet").value) || 5,
                    },
                },
            };
            const r2 = await postJSON("/api/admin/geniesgold_config", ggConfig);
            if (r2.ok) {
                showToast("Settings saved (including Genie's Gold config)", "success");
            } else {
                showToast("Network saved, but jackpot config failed: " + (r2.data.error || "error"), "error");
            }
        } else {
            showToast(r.data.error || "Failed to save", "error");
        }
    });

    document.getElementById("btn-reload").addEventListener("click", function () {
        location.reload();
    });
})();

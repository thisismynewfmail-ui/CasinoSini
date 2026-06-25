(function () {
    "use strict";

    const tabs = document.querySelectorAll(".tab");
    const formSignin = document.getElementById("form-signin");
    const formSignup = document.getElementById("form-signup");
    const errBox = document.getElementById("msg-error");
    const noticeBox = document.getElementById("msg-notice");

    function showError(text) {
        noticeBox.style.display = "none";
        errBox.style.display = "block";
        errBox.textContent = text;
    }
    function showNotice(text) {
        errBox.style.display = "none";
        noticeBox.style.display = "block";
        noticeBox.textContent = text;
    }
    function clearMsgs() {
        errBox.style.display = "none";
        noticeBox.style.display = "none";
    }

    const headline   = document.getElementById("login-headline");
    const subhead    = document.getElementById("login-subhead");
    const modeTag    = document.getElementById("login-mode-tag");
    const modeCopy = {
        signin: {
            tag: "Returning",
            h:   "Welcome back to the tables.",
            p:   "Sign in to pick up where you left off.",
        },
        signup: {
            tag: "Beginning",
            h:   "Join the house.",
            p:   "Create an account and claim your starting chips.",
        },
    };
    function applyMode(which) {
        document.body.classList.remove("mode-signin", "mode-signup");
        document.body.classList.add("mode-" + which);
        const c = modeCopy[which] || modeCopy.signin;
        if (headline) headline.textContent = c.h;
        if (subhead)  subhead.textContent  = c.p;
        if (modeTag)  modeTag.textContent  = c.tag;
    }
    applyMode("signin");

    tabs.forEach(function(tab) {
        tab.addEventListener("click", function() {
            tabs.forEach(function(t) { t.classList.remove("active"); });
            tab.classList.add("active");
            clearMsgs();
            const which = tab.dataset.tab;
            formSignin.style.display = which === "signin" ? "" : "none";
            formSignup.style.display = which === "signup" ? "" : "none";
            applyMode(which);
        });
    });

    async function postJSON(url, body) {
        const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            credentials: "same-origin",
        });
        let data;
        try { data = await r.json(); } catch (e) { data = { ok: false, error: "Bad response." }; }
        return { status: r.status, data: data };
    }

    formSignin.addEventListener("submit", async function(e) {
        e.preventDefault();
        clearMsgs();
        const body = {
            identifier: document.getElementById("signin-id").value.trim(),
            password: document.getElementById("signin-pw").value,
        };
        const result = await postJSON("/api/login", body);
        if (result.data.ok) {
            window.location.href = "/lobby";
        } else {
            showError(result.data.error || "Sign in failed.");
        }
    });

    formSignup.addEventListener("submit", async function(e) {
        e.preventDefault();
        clearMsgs();
        const body = {
            username: document.getElementById("su-username").value.trim(),
            username2: document.getElementById("su-username2").value.trim(),
            name: document.getElementById("su-name").value.trim(),
            email: document.getElementById("su-email").value.trim(),
            password: document.getElementById("su-pw").value,
            password2: document.getElementById("su-pw2").value,
            zip_code: document.getElementById("su-zip").value.trim(),
        };
        const result = await postJSON("/api/signup", body);
        if (result.data.ok) {
            if (result.data.first_admin) {
                showNotice("Account created — you're the first user, so you've been made admin. Redirecting…");
            } else {
                showNotice("Account created. Redirecting…");
            }
            setTimeout(function() { window.location.href = "/lobby"; }, 800);
        } else {
            showError(result.data.error || "Could not create account.");
        }
    });
})();

/* boot.js — thematic startup overlay for the login page.
 *
 * Runs once per browser session (sessionStorage). On any subsequent
 * navigation back to the login page within the same session, the boot
 * screen is hidden immediately so the user lands directly on the form.
 *
 * Sequence:
 *   - stamp rises (CSS animation)
 *   - readout lines tick in one by one
 *   - bar fills
 *   - whole overlay fades out
 *
 * The overlay can also be dismissed early by pressing any key or
 * tapping the screen.
 */
(function () {
    "use strict";

    const KEY = "companion.boot.played";
    const root = document.getElementById("boot-screen");
    if (!root) return;

    // Already played this session — drop it now, no flash of overlay.
    if (sessionStorage.getItem(KEY) === "1") {
        root.parentNode && root.parentNode.removeChild(root);
        return;
    }

    const lines = Array.from(document.querySelectorAll("#boot-lines li"));
    const bar = document.getElementById("boot-bar-fill");
    const stamp = document.getElementById("boot-stamp-text");

    // A small touch of variety per boot — the "registration number" is the
    // last four digits of the timestamp. Cheap, but it makes the screen
    // feel like a real instrument that was just powered on.
    if (stamp) {
        const n = String(Date.now() % 10000).padStart(4, "0");
        stamp.textContent = "REG " + n;
    }

    let dismissed = false;
    function dismiss() {
        if (dismissed) return;
        dismissed = true;
        try { sessionStorage.setItem(KEY, "1"); } catch (_) {}
        root.classList.add("fading");
        setTimeout(() => {
            root.parentNode && root.parentNode.removeChild(root);
        }, 600);
    }

    // Tick the readout lines in, one by one. Each line advances the
    // progress bar by a roughly proportional chunk.
    const lineDelay = 380;
    lines.forEach((li, i) => {
        setTimeout(() => {
            li.classList.add("shown");
            if (bar) {
                const pct = Math.round(((i + 1) / lines.length) * 88);
                bar.style.width = pct + "%";
            }
        }, 320 + i * lineDelay);
    });

    // Final fill + auto-dismiss. Total target ~2.6s on a fresh load.
    setTimeout(() => { if (bar) bar.style.width = "100%"; }, 320 + lines.length * lineDelay + 180);
    setTimeout(dismiss, 320 + lines.length * lineDelay + 720);

    // Any keypress, click, or touch short-circuits the rest of the boot.
    window.addEventListener("keydown", dismiss, { once: true });
    root.addEventListener("click", dismiss, { once: true });
    root.addEventListener("touchstart", dismiss, { once: true, passive: true });
})();

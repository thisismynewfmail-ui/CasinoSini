// profile-pic.js — shared profile-picture widget.
//
// Wires up every [data-pic-pick] / [data-pic-input] / [data-pic-remove]
// trio on the page to a single crop modal. Each trio is identified by a
// "slot" key (the value of the data-* attributes) so the same widget can
// appear in multiple places at once (signup, settings, reset overlay).
//
// Exports:
//   window.ProfilePic = {
//     register(slot, options),    // bind a slot; options.onCropped(dataUrl, blob)
//     setPreview(slot, dataUrl),  // paint the preview tile
//     clearPreview(slot),         // wipe the preview tile
//     getDataUrl(slot),           // last-cropped data URL for this slot, or null
//   }
(function () {
    "use strict";

    // Final stored size and quality. Square, JPEG, compressed.
    const OUT_SIZE = 384;
    const OUT_QUALITY = 0.86;

    // ----- Crop modal singleton --------------------------------------------

    const scrim = document.getElementById("crop-scrim");
    const stage = document.getElementById("crop-stage");
    const image = document.getElementById("crop-image");
    const overlay = document.getElementById("crop-overlay");
    const handle = document.getElementById("crop-handle");
    const cancelBtn = document.getElementById("crop-cancel");
    const confirmBtn = document.getElementById("crop-confirm");

    // Per-slot bookkeeping:
    //   inputEl     <input type=file>
    //   removeBtn   the Remove button (we toggle visibility based on state)
    //   previewEl   the round preview tile
    //   onCropped   user-supplied callback after a successful crop
    //   dataUrl     last cropped data URL (so caller can defer upload)
    const slots = new Map();

    // Active crop session state.
    let activeSlot = null;
    let imgNaturalW = 0;
    let imgNaturalH = 0;
    let displayW = 0;
    let displayH = 0;
    // Crop rect in DISPLAY-space pixels (relative to stage).
    let cropX = 0, cropY = 0, cropSize = 0;
    // Display offset of the image inside the stage (centered "contain" fit).
    let imgOffX = 0, imgOffY = 0;

    function openModal() {
        if (!scrim) return;
        scrim.classList.add("open");
        scrim.setAttribute("aria-hidden", "false");
    }
    function closeModal() {
        if (!scrim) return;
        scrim.classList.remove("open");
        scrim.setAttribute("aria-hidden", "true");
        // Don't leave the previous image hanging around in DOM.
        if (image) image.src = "";
        activeSlot = null;
    }

    function fitImageIntoStage() {
        // Stage is a fixed-size square (CSS). Compute the largest image
        // size that fits while preserving aspect ratio, then center it.
        const rect = stage.getBoundingClientRect();
        const sw = rect.width, sh = rect.height;
        const ar = imgNaturalW / imgNaturalH;
        let w, h;
        if (ar >= 1) {
            // Landscape or square: width fills stage, height shrinks.
            w = sw;
            h = Math.round(sw / ar);
            if (h > sh) { h = sh; w = Math.round(sh * ar); }
        } else {
            h = sh;
            w = Math.round(sh * ar);
            if (w > sw) { w = sw; h = Math.round(sw / ar); }
        }
        displayW = w;
        displayH = h;
        imgOffX = Math.round((sw - w) / 2);
        imgOffY = Math.round((sh - h) / 2);
        image.style.width = w + "px";
        image.style.height = h + "px";
        image.style.left = imgOffX + "px";
        image.style.top = imgOffY + "px";

        // Default crop: largest square that fits inside the displayed image,
        // centered.
        cropSize = Math.min(w, h);
        cropX = imgOffX + Math.round((w - cropSize) / 2);
        cropY = imgOffY + Math.round((h - cropSize) / 2);
        renderOverlay();
    }

    function renderOverlay() {
        overlay.style.width = cropSize + "px";
        overlay.style.height = cropSize + "px";
        overlay.style.left = cropX + "px";
        overlay.style.top = cropY + "px";
    }

    function clampCrop() {
        // Keep the crop rect inside the displayed image's bounds.
        const minX = imgOffX;
        const minY = imgOffY;
        const maxX = imgOffX + displayW - cropSize;
        const maxY = imgOffY + displayH - cropSize;
        if (cropX < minX) cropX = minX;
        if (cropY < minY) cropY = minY;
        if (cropX > maxX) cropX = maxX;
        if (cropY > maxY) cropY = maxY;
    }

    function clampCropSize() {
        // Minimum size keeps the handle reachable.
        if (cropSize < 32) cropSize = 32;
        const maxSize = Math.min(displayW, displayH);
        if (cropSize > maxSize) cropSize = maxSize;
    }

    // Drag handlers — pointer events cover mouse + touch + pen.
    let dragMode = null;     // 'move' | 'resize'
    let dragStartX = 0, dragStartY = 0;
    let startCropX = 0, startCropY = 0, startCropSize = 0;
    let activePointerId = null;

    function onPointerDown(e, mode) {
        e.preventDefault();
        e.stopPropagation();
        dragMode = mode;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        startCropX = cropX;
        startCropY = cropY;
        startCropSize = cropSize;
        activePointerId = e.pointerId;
        try {
            (mode === "resize" ? handle : overlay).setPointerCapture(e.pointerId);
        } catch (_) { /* not all browsers, fine */ }
    }
    function onPointerMove(e) {
        if (!dragMode || e.pointerId !== activePointerId) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        if (dragMode === "move") {
            cropX = startCropX + dx;
            cropY = startCropY + dy;
            clampCrop();
        } else if (dragMode === "resize") {
            // Resize from the bottom-right corner; keep a square.
            const delta = Math.max(dx, dy);
            cropSize = startCropSize + delta;
            clampCropSize();
            clampCrop();
        }
        renderOverlay();
    }
    function onPointerUp(e) {
        if (e.pointerId !== activePointerId) return;
        dragMode = null;
        activePointerId = null;
    }

    if (overlay) {
        overlay.addEventListener("pointerdown", (e) => onPointerDown(e, "move"));
    }
    if (handle) {
        handle.addEventListener("pointerdown", (e) => onPointerDown(e, "resize"));
    }
    if (stage) {
        // Listen on the stage so dragging beyond the overlay still tracks.
        stage.addEventListener("pointermove", onPointerMove);
        stage.addEventListener("pointerup", onPointerUp);
        stage.addEventListener("pointercancel", onPointerUp);
    }

    function performCrop() {
        // Translate display-space crop rect → image natural-pixel rect.
        const scale = imgNaturalW / displayW; // displayW preserves aspect with H
        const srcX = Math.round((cropX - imgOffX) * scale);
        const srcY = Math.round((cropY - imgOffY) * scale);
        const srcSize = Math.round(cropSize * scale);

        const canvas = document.createElement("canvas");
        canvas.width = OUT_SIZE;
        canvas.height = OUT_SIZE;
        const ctx = canvas.getContext("2d");
        // Smooth the downscale.
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        // Fill with paper-cool (matches site theme) so JPEG flatten on
        // transparent PNGs doesn't go black.
        ctx.fillStyle = "#f4ede1";
        ctx.fillRect(0, 0, OUT_SIZE, OUT_SIZE);
        ctx.drawImage(image, srcX, srcY, srcSize, srcSize,
                      0, 0, OUT_SIZE, OUT_SIZE);
        const dataUrl = canvas.toDataURL("image/jpeg", OUT_QUALITY);
        return dataUrl;
    }

    function setPreview(slotKey, dataUrl) {
        const slot = slots.get(slotKey);
        if (!slot) return;
        slot.dataUrl = dataUrl || null;
        if (!slot.previewEl) return;
        if (dataUrl) {
            slot.previewEl.style.backgroundImage = `url("${dataUrl}")`;
            slot.previewEl.classList.add("has-image");
            if (slot.removeBtn) slot.removeBtn.style.display = "";
        } else {
            slot.previewEl.style.backgroundImage = "";
            slot.previewEl.classList.remove("has-image");
            if (slot.removeBtn) slot.removeBtn.style.display = "none";
        }
    }

    function clearPreview(slotKey) { setPreview(slotKey, null); }

    function getDataUrl(slotKey) {
        const slot = slots.get(slotKey);
        return slot ? slot.dataUrl : null;
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            if (activeSlot) {
                const slot = slots.get(activeSlot);
                if (slot && slot.inputEl) slot.inputEl.value = "";
            }
            closeModal();
        });
    }
    if (confirmBtn) {
        confirmBtn.addEventListener("click", () => {
            const slotKey = activeSlot;
            if (!slotKey) { closeModal(); return; }
            const dataUrl = performCrop();
            setPreview(slotKey, dataUrl);
            const slot = slots.get(slotKey);
            if (slot && typeof slot.onCropped === "function") {
                try { slot.onCropped(dataUrl); } catch (e) { /* swallow */ }
            }
            if (slot && slot.inputEl) slot.inputEl.value = "";
            closeModal();
        });
    }
    if (scrim) {
        scrim.addEventListener("click", (e) => {
            if (e.target === scrim) {
                if (cancelBtn) cancelBtn.click();
                else closeModal();
            }
        });
    }

    function startCropForSlot(slotKey, file) {
        activeSlot = slotKey;
        const reader = new FileReader();
        reader.onload = () => {
            image.onload = () => {
                imgNaturalW = image.naturalWidth || 1;
                imgNaturalH = image.naturalHeight || 1;
                // Stage must be laid out before we can size against it.
                openModal();
                // requestAnimationFrame so the stage has its real width.
                requestAnimationFrame(() => fitImageIntoStage());
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    function register(slotKey, options) {
        options = options || {};
        const inputEl  = document.querySelector(`[data-pic-input="${slotKey}"]`);
        const pickBtn  = document.querySelector(`[data-pic-pick="${slotKey}"]`);
        const removeBtn = document.querySelector(`[data-pic-remove="${slotKey}"]`);
        const previewEl = options.previewEl ||
            document.getElementById(`pic-preview-${slotKey}`);
        if (!inputEl || !pickBtn) return null;

        const slot = {
            inputEl, pickBtn, removeBtn, previewEl,
            onCropped: options.onCropped || null,
            onRemoved: options.onRemoved || null,
            dataUrl: null,
        };
        slots.set(slotKey, slot);

        pickBtn.addEventListener("click", () => inputEl.click());
        inputEl.addEventListener("change", () => {
            const file = inputEl.files && inputEl.files[0];
            if (!file) return;
            startCropForSlot(slotKey, file);
        });
        if (removeBtn) {
            removeBtn.addEventListener("click", () => {
                clearPreview(slotKey);
                if (typeof slot.onRemoved === "function") {
                    try { slot.onRemoved(); } catch (e) { /* swallow */ }
                }
            });
        }
        return slot;
    }

    window.ProfilePic = { register, setPreview, clearPreview, getDataUrl };
})();

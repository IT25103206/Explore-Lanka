/* =========================================================
   Explore Lanka - Customer portal motion & polish
   Load in <head> with `defer` on every customer page + customer login.
   ========================================================= */
(function () {
    "use strict";

    var root = document.documentElement;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.add("cm-motion");
    try {
        if (!sessionStorage.getItem("cm-seen")) { root.classList.add("cm-first"); sessionStorage.setItem("cm-seen", "1"); }
    } catch (e) { /* storage blocked */ }

    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    // ---------- Count-up ----------
    function countUp(el) {
        var text = el.textContent.trim();
        var m = text.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
        if (!m) return;
        var prefix = m[1], raw = m[2], suffix = m[3];
        var target = parseFloat(raw.replace(/,/g, ""));
        if (!isFinite(target) || target === 0) return;
        var decimals = (raw.split(".")[1] || "").length, commas = raw.indexOf(",") > -1 || target >= 1000;
        var start = null, last;
        function fmt(v) {
            var s = v.toFixed(decimals);
            if (commas) { var p = s.split("."); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); s = p.join("."); }
            return prefix + s + suffix;
        }
        function frame(t) {
            if (el.textContent !== last) return; // updated by page code - stop
            if (!start) start = t;
            var k = Math.min(1, (t - start) / 1200), e = 1 - Math.pow(1 - k, 4);
            last = k < 1 ? fmt(target * e) : text;
            el.textContent = last;
            if (k < 1) requestAnimationFrame(frame);
        }
        last = fmt(0);
        el.textContent = last;
        setTimeout(function () { requestAnimationFrame(frame); }, 300);
    }

    function onVisible(els, fn, threshold) {
        if (!("IntersectionObserver" in window)) { els.forEach(fn); return; }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); fn(en.target); } });
        }, {threshold: threshold || 0.15, rootMargin: "0px 0px -40px 0px"});
        els.forEach(function (el) { io.observe(el); });
    }

    // ---------- Grid items reveal ----------
    function reveals() {
        if (reduce) return;
        var groups = $$(".main .grid, .trip-stack, .notice-list, .faq-list, .gallery-grid");
        groups.forEach(function (grid) {
            // skip grids that are the first thing on screen (they already animate with the page)
            var kids = Array.prototype.slice.call(grid.children).filter(function (k) { return k.nodeType === 1; });
            if (kids.length < 2) return;
            var cols = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length || 1);
            kids.forEach(function (k, i) {
                if (k.getBoundingClientRect().top < window.innerHeight * 0.85) return;
                k.classList.add("cm-reveal");
                k.style.setProperty("--cm-d", ((i % cols) * 0.08).toFixed(2) + "s");
            });
            onVisible(kids.filter(function (k) { return k.classList.contains("cm-reveal"); }), function (k) { k.classList.add("cm-in"); });
        });
    }

    // ---------- Save / heart buttons ----------
    function hearts() {
        $$(".main button, .main a.btn").forEach(function (b) {
            var t = b.textContent.trim();
            if (!/^(♡|♥)/.test(t) && !/^save$/i.test(t)) return;
            b.classList.add("cm-heart");
            b.addEventListener("click", function () {
                var saved = !b.classList.contains("cm-saved");
                b.classList.toggle("cm-saved", saved);
                b.textContent = b.textContent.replace(/^[♡♥]/, saved ? "♥" : "♡");
                if (/Save$/.test(b.textContent) && saved) b.textContent = b.textContent.replace(/Save$/, "Saved");
                else if (/Saved$/.test(b.textContent) && !saved) b.textContent = b.textContent.replace(/Saved$/, "Save");
                b.classList.remove("cm-pop"); void b.offsetWidth; b.classList.add("cm-pop");
                if (!saved || reduce) return;
                for (var i = 0; i < 8; i++) {
                    var s = document.createElement("span");
                    s.className = "cm-burst";
                    var a = (Math.PI * 2 * i) / 8;
                    s.style.setProperty("--x", (Math.cos(a) * 26).toFixed(1) + "px");
                    s.style.setProperty("--y", (Math.sin(a) * 26).toFixed(1) + "px");
                    b.appendChild(s);
                    setTimeout(function (el) { el.remove(); }.bind(null, s), 650);
                }
            });
        });
    }

    // ---------- Filtered items pop back ----------
    function filters() {
        var items = $$("[data-filter-item]");
        if (!items.length) return;
        var mo = new MutationObserver(function (list) {
            list.forEach(function (m) {
                var el = m.target;
                if (el.style.display !== "none" && m.oldValue && /display:\s*none/.test(m.oldValue)) {
                    el.classList.remove("cm-pop-in"); void el.offsetWidth; el.classList.add("cm-pop-in");
                }
            });
        });
        items.forEach(function (el) { mo.observe(el, {attributes: true, attributeFilter: ["style"], attributeOldValue: true}); });
    }

    // ---------- Sidebar ----------
    function sidebar() {
        var nav = $(".sidebar .nav");
        if (!nav) return;
        var ind = document.createElement("span");
        ind.className = "cm-indicator";
        nav.classList.add("cm-glide");
        nav.insertBefore(ind, nav.firstChild);
        function moveTo(a) {
            if (!a) { ind.style.opacity = "0"; return; }
            ind.style.opacity = "1";
            ind.style.height = a.offsetHeight + "px";
            ind.style.transform = "translateY(" + a.offsetTop + "px)";
        }
        function active() { return $("a.active", nav); }
        $$("a", nav).forEach(function (a, i) {
            a.style.setProperty("--cm-row", i);
            a.addEventListener("mouseenter", function () { moveTo(a); });
            a.addEventListener("focus", function () { moveTo(a); });
        });
        nav.addEventListener("mouseleave", function () { moveTo(active()); });
        ind.style.transition = "none";
        moveTo(active());
        requestAnimationFrame(function () { requestAnimationFrame(function () { ind.style.transition = ""; }); });
        window.addEventListener("resize", function () { moveTo(active()); });
        // keep the active item in view on long menus
        var act = active(), side = $(".sidebar");
        if (act && side && act.offsetTop > side.clientHeight - 120) side.scrollTop = act.offsetTop - side.clientHeight / 2;
    }

    // ---------- Topbar ----------
    function topbar() {
        var bar = $(".main > .topbar");
        if (!bar) return;
        var actions = $(".top-actions", bar);
        var name = (sessionStorage.getItem("userName") || "").trim();

        if (actions && !$(".hero [data-user-name]")) {
            var hr = new Date().getHours();
            var greet = document.createElement("span");
            greet.className = "cm-greet";
            greet.innerHTML = (hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening") + (name ? ", <b></b>" : "");
            if (name) greet.querySelector("b").textContent = name.split(/\s+/)[0];
            actions.insertBefore(greet, actions.firstChild);
        }
        if (actions) {
            var jump = document.createElement("button");
            jump.type = "button";
            jump.className = "cm-jump";
            jump.innerHTML = "<span>Search pages</span><kbd>Ctrl K</kbd>";
            jump.addEventListener("click", openPalette);
            var g = $(".cm-greet", actions);
            actions.insertBefore(jump, g ? g.nextSibling : actions.firstChild);
        }
        var avatar = $(".avatar", bar);
        if (avatar && name) { avatar.textContent = name.charAt(0).toUpperCase(); avatar.title = name; }

        var line = document.createElement("span");
        line.className = "cm-progress";
        bar.appendChild(line);

        var top = document.createElement("button");
        top.type = "button";
        top.className = "cm-top";
        top.setAttribute("aria-label", "Back to top");
        top.textContent = "↑";
        top.addEventListener("click", function () { window.scrollTo({top: 0, behavior: reduce ? "auto" : "smooth"}); });
        document.body.appendChild(top);

        var busy = false;
        function onScroll() {
            if (busy) return;
            busy = true;
            requestAnimationFrame(function () {
                busy = false;
                var max = document.documentElement.scrollHeight - window.innerHeight;
                line.style.setProperty("--p", (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4));
                bar.classList.toggle("cm-scrolled", window.scrollY > 8);
                top.classList.toggle("cm-show", window.scrollY > 500);
            });
        }
        window.addEventListener("scroll", onScroll, {passive: true});
        onScroll();
    }

    // ---------- Progress bars, stats, rows ----------
    function numbers() {
        var bars = $$(".kpi-line");
        bars.forEach(function (b) { b.classList.add("cm-wait"); });
        onVisible(bars, function (b) { setTimeout(function () { b.classList.remove("cm-wait"); }, 120); }, 0.3);
        if (!reduce) onVisible($$(".main .stat h3"), countUp, 0.3);
    }
    function rows() {
        $$(".table-wrap tbody").forEach(function (tb) {
            function number(late) {
                $$("tr", tb).forEach(function (tr, i) { tr.style.setProperty("--cm-row", Math.min(i, 14)); if (late) tr.classList.add("cm-late"); });
            }
            number(false);
            new MutationObserver(function () { number(true); }).observe(tb, {childList: true});
        });
    }

    // ---------- Search pages palette ----------
    var pal, palInput, palList, items = [], sel = 0;
    function buildItems() {
        items = $$(".sidebar .nav a").map(function (a) {
            return {label: (a.querySelector("span") || a).textContent.trim(), icon: (a.querySelector("i") || {}).textContent || "•", href: a.getAttribute("href")};
        });
        items.push({label: "Explore Lanka home", icon: "🌴", href: "/"});
        items.push({label: "Log out", icon: "⎋", action: function () { sessionStorage.clear(); location.href = "/ui/customer-login"; }});
    }
    function renderPalette() {
        var q = palInput.value.trim().toLowerCase();
        var list = items.filter(function (it) { return !q || it.label.toLowerCase().indexOf(q) > -1; });
        sel = Math.max(0, Math.min(sel, list.length - 1));
        palList.innerHTML = "";
        if (!list.length) {
            var empty = document.createElement("div");
            empty.className = "cm-palette-empty";
            empty.textContent = 'No page matches "' + palInput.value + '".';
            palList.appendChild(empty);
        }
        list.forEach(function (it, i) {
            var row = document.createElement("div");
            row.className = "cm-palette-item" + (i === sel ? " is-on" : "");
            row.innerHTML = "<i></i><span></span>";
            row.children[0].textContent = it.icon;
            row.children[1].textContent = it.label;
            row.addEventListener("mouseenter", function () { sel = i; mark(); });
            row.addEventListener("click", function () { go(it); });
            palList.appendChild(row);
        });
        palList._list = list;
    }
    function mark() {
        $$(".cm-palette-item", palList).forEach(function (r, i) { r.classList.toggle("is-on", i === sel); });
        var on = $(".cm-palette-item.is-on", palList);
        if (on) on.scrollIntoView({block: "nearest"});
    }
    function go(it) { if (!it) return; closePalette(); if (it.action) it.action(); else location.href = it.href; }
    function openPalette() {
        if (!pal) {
            pal = document.createElement("div");
            pal.className = "cm-palette";
            pal.innerHTML = '<div class="cm-palette-backdrop"></div><div class="cm-palette-box" role="dialog" aria-label="Search pages">' +
                '<input type="text" placeholder="Where do you want to go?" aria-label="Search pages"><div class="cm-palette-list"></div>' +
                '<div class="cm-palette-foot"><span>↑ ↓ to move</span><span>Enter to open</span><span>Esc to close</span></div></div>';
            document.body.appendChild(pal);
            palInput = $("input", pal);
            palList = $(".cm-palette-list", pal);
            $(".cm-palette-backdrop", pal).addEventListener("click", closePalette);
            palInput.addEventListener("input", function () { sel = 0; renderPalette(); });
            palInput.addEventListener("keydown", function (e) {
                var list = palList._list || [];
                if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, list.length); mark(); }
                else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + list.length) % Math.max(1, list.length); mark(); }
                else if (e.key === "Enter") { e.preventDefault(); go(list[sel]); }
                else if (e.key === "Escape") { closePalette(); }
            });
        }
        buildItems();
        pal.hidden = false;
        palInput.value = "";
        sel = 0;
        renderPalette();
        setTimeout(function () { palInput.focus(); }, 10);
    }
    function closePalette() { if (pal) pal.hidden = true; }

    // ---------- Customer login / register ----------
    function initAuth() {
        root.classList.add("cm-auth");
        $$(".auth-container form").forEach(function (f) {
            Array.prototype.slice.call(f.children).forEach(function (k, i) { k.style.setProperty("--cm-row", i); });
            f.addEventListener("submit", function () { var b = $(".main-btn", f); if (b) b.classList.add("is-loading"); });
        });
        var box = $("#messageBox"), card = $(".auth-container");
        if (box) new MutationObserver(function () {
            if (box.style.display === "none") return;
            $$(".main-btn.is-loading").forEach(function (b) { b.classList.remove("is-loading"); });
            if (box.classList.contains("message-error")) { card.classList.remove("cm-shake"); void card.offsetWidth; card.classList.add("cm-shake"); }
        }).observe(box, {attributes: true, childList: true});
        // login <-> register switch slides in
        ["#loginSection", "#registerSection"].forEach(function (sel) {
            var s = $(sel);
            if (!s) return;
            new MutationObserver(function () {
                if (s.style.display !== "none") { s.classList.remove("cm-swap"); void s.offsetWidth; s.classList.add("cm-swap"); }
            }).observe(s, {attributes: true, attributeFilter: ["style"]});
        });
    }

    // ---------- Boot ----------
    function boot() {
        if ($("#loginForm") || $("#registerForm")) { initAuth(); return; }
        if (!$(".app .sidebar")) return;
        sidebar();
        topbar();
        hearts();
        filters();
        numbers();
        rows();
        reveals();
        document.addEventListener("keydown", function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal && !pal.hidden ? closePalette() : openPalette(); }
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();

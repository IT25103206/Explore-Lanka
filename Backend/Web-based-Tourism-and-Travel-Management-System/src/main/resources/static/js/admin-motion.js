/* =========================================================
   Explore Lanka - Admin motion & polish
   Load in <head> with `defer` on every admin page + admin login.
   ========================================================= */
(function () {
    "use strict";

    var root = document.documentElement;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.classList.add("el-motion");

    // Sidebar entrance only on the first admin page of the session
    try {
        if (!sessionStorage.getItem("el-seen")) {
            root.classList.add("el-first");
            sessionStorage.setItem("el-seen", "1");
        }
    } catch (e) { /* storage blocked */ }

    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

    // ---------- Contour lines (tea terraces) ----------
    function contours(host, opts) {
        if (!host || host.querySelector(".el-contours")) return;
        opts = opts || {};
        var W = 1000, H = 300, lines = opts.lines || 9;
        var ns = "http://www.w3.org/2000/svg";
        var svg = document.createElementNS(ns, "svg");
        svg.setAttribute("class", "el-contours");
        svg.setAttribute("viewBox", "0 0 " + W + " " + H);
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("aria-hidden", "true");
        var g = document.createElementNS(ns, "g");
        for (var i = 0; i < lines; i++) {
            var base = H * (0.12 + i * (0.86 / lines));
            var amp = 14 + i * 2.6, freq = 0.0042 + (i % 3) * 0.0007, phase = i * 0.65;
            var d = "M -60 " + base.toFixed(1);
            for (var x = -60; x <= W + 60; x += 20) {
                var y = base + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.7) * (amp * 0.35);
                d += " L " + x + " " + y.toFixed(1);
            }
            var path = document.createElementNS(ns, "path");
            path.setAttribute("d", d);
            path.style.setProperty("--n", i);
            path.style.setProperty("--len", "1400");
            g.appendChild(path);
        }
        svg.appendChild(g);
        host.appendChild(svg);
        // real path lengths so the draw-in finishes cleanly
        requestAnimationFrame(function () {
            $$("path", svg).forEach(function (p) {
                var L = Math.ceil(p.getTotalLength ? p.getTotalLength() : 1400);
                p.style.setProperty("--len", L);
            });
        });
    }

    // ---------- Admin login page ----------
    function initLogin() {
        root.classList.add("el-login");
        contours($(".left-section"), {lines: 11});
        var form = $("#adminLoginForm"), btn = form && $(".main-btn", form);
        var box = $("#messageBox"), card = $(".auth-container");
        if (!form || !btn) return;
        form.addEventListener("submit", function () { btn.classList.add("is-loading"); });
        if (box) new MutationObserver(function () {
            if (box.style.display === "none") return;
            if (box.classList.contains("message-error")) {
                btn.classList.remove("is-loading");
                card.classList.remove("el-shake"); void card.offsetWidth; card.classList.add("el-shake");
            }
        }).observe(box, {attributes: true, childList: true});
    }

    // ---------- Count-up numbers ----------
    function countUp(el) {
        var text = el.textContent.trim();
        var m = text.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
        if (!m) return;
        var prefix = m[1], raw = m[2], suffix = m[3];
        var target = parseFloat(raw.replace(/,/g, ""));
        if (!isFinite(target) || target === 0) return;
        var decimals = (raw.split(".")[1] || "").length, commas = raw.indexOf(",") > -1 || target >= 1000;
        var start = null, dur = 1200, last = null;
        function fmt(v) {
            var s = v.toFixed(decimals);
            if (commas) { var parts = s.split("."); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); s = parts.join("."); }
            return prefix + s + suffix;
        }
        function frame(t) {
            if (last !== null && el.textContent !== last) return; // someone else updated it - stop
            if (!start) start = t;
            var k = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - k, 4);
            last = k < 1 ? fmt(target * e) : text;
            el.textContent = last;
            if (k < 1) requestAnimationFrame(frame);
        }
        last = fmt(0);
        el.textContent = last;
        setTimeout(function () { requestAnimationFrame(frame); }, 350);
    }

    function whenVisible(els, fn) {
        if (!("IntersectionObserver" in window)) { els.forEach(fn); return; }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); fn(en.target); } });
        }, {threshold: 0.3});
        els.forEach(function (el) { io.observe(el); });
    }

    // ---------- Sidebar gliding highlight ----------
    function sidebarIndicator() {
        var nav = $(".admin-sidebar .nav");
        if (!nav) return;
        var ind = document.createElement("span");
        ind.className = "el-nav-indicator";
        nav.classList.add("el-has-indicator");
        nav.insertBefore(ind, nav.firstChild);
        function moveTo(a) {
            if (!a) { ind.style.opacity = "0"; return; }
            ind.style.opacity = "1";
            ind.style.height = a.offsetHeight + "px";
            ind.style.transform = "translateY(" + a.offsetTop + "px)";
        }
        function active() { return $("a.active", nav); }
        $$("a", nav).forEach(function (a, i) {
            a.style.setProperty("--el-row", i);
            a.addEventListener("mouseenter", function () { moveTo(a); });
            a.addEventListener("focus", function () { moveTo(a); });
        });
        nav.addEventListener("mouseleave", function () { moveTo(active()); });
        // first position without sliding
        ind.style.transition = "none";
        moveTo(active());
        requestAnimationFrame(function () { requestAnimationFrame(function () { ind.style.transition = ""; }); });
        window.addEventListener("resize", function () { moveTo(active()); });
        // staff link is added by portal.js a moment later
        new MutationObserver(function () {
            $$("a", nav).forEach(function (a, i) {
                a.style.setProperty("--el-row", i);
                if (!a._el) { a._el = 1; a.addEventListener("mouseenter", function () { moveTo(a); }); }
            });
            moveTo(active());
        }).observe(nav, {childList: true});
        $$("a", nav).forEach(function (a) { a._el = 1; });
    }

    // ---------- Topbar: clock, jump button, scroll line ----------
    function topbar() {
        var bar = $(".admin-topbar");
        if (!bar) return;
        var actions = $(".top-actions", bar);

        if (actions) {
            var clock = document.createElement("span");
            clock.className = "el-clock";
            var tick = function () {
                var d = new Date();
                clock.textContent = d.toLocaleDateString("en-GB", {weekday: "short", day: "numeric", month: "short"}) +
                    ", " + d.toLocaleTimeString("en-GB", {hour: "2-digit", minute: "2-digit"});
            };
            tick();
            setInterval(tick, 20000);
            actions.insertBefore(clock, actions.firstChild);

            var jump = document.createElement("button");
            jump.type = "button";
            jump.className = "el-jump-btn";
            jump.innerHTML = "<span>Jump to page</span><kbd>Ctrl K</kbd>";
            jump.addEventListener("click", openPalette);
            actions.insertBefore(jump, clock.nextSibling);
        }

        var avatar = $(".avatar", bar), name = sessionStorage.getItem("userName");
        if (avatar && name) { avatar.textContent = name.trim().charAt(0).toUpperCase(); avatar.title = name; }

        var line = document.createElement("span");
        line.className = "el-progress";
        bar.appendChild(line);
        var ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                ticking = false;
                var max = document.documentElement.scrollHeight - window.innerHeight;
                var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
                line.style.setProperty("--p", p.toFixed(4));
                bar.classList.toggle("el-scrolled", window.scrollY > 8);
            });
        }
        window.addEventListener("scroll", onScroll, {passive: true});
        onScroll();
    }

    // ---------- Greeting on the dashboard ----------
    function greeting() {
        var h = $(".admin-hero h2");
        if (!h || !/^welcome back/i.test(h.textContent.trim())) return;
        var name = (sessionStorage.getItem("userName") || "").trim().split(/\s+/)[0];
        var hr = new Date().getHours();
        var part = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
        h.textContent = part + (name ? ", " + name : "");
    }

    // ---------- Card light + progress bars + rows ----------
    function cards() {
        $$(".admin-app .card").forEach(function (c) {
            c.classList.add("el-glow");
            c.addEventListener("pointermove", function (e) {
                var r = c.getBoundingClientRect();
                c.style.setProperty("--mx", (e.clientX - r.left) + "px");
                c.style.setProperty("--my", (e.clientY - r.top) + "px");
            });
        });

        var bars = $$(".kpi-line");
        bars.forEach(function (b) { b.classList.add("el-wait"); });
        whenVisible(bars, function (b) { setTimeout(function () { b.classList.remove("el-wait"); }, 150); });

        if (!reduce) whenVisible($$(".admin-stat h3, .admin-progress > div:first-child span"), countUp);
    }

    function rows() {
        $$(".admin-table tbody").forEach(function (tb) {
            function number(late) {
                $$("tr", tb).forEach(function (tr, i) {
                    tr.style.setProperty("--el-row", Math.min(i, 14));
                    if (late) tr.classList.add("el-late");
                });
            }
            number(false);
            new MutationObserver(function () { number(true); }).observe(tb, {childList: true});
        });
    }

    // ---------- Jump-to palette ----------
    var pal, palInput, palList, items = [], sel = 0;
    function buildItems() {
        items = $$(".admin-sidebar .nav a").map(function (a) {
            return {label: (a.querySelector("span") || a).textContent.trim(), icon: (a.querySelector("i") || {}).textContent || "•", href: a.getAttribute("href"), hint: "Page"};
        });
        items.push({label: "Landing page", icon: "⌂", href: "/", hint: "Website"});
        items.push({label: "Log out", icon: "⎋", action: function () { sessionStorage.clear(); location.href = "/ui/admin-login"; }, hint: "Account"});
    }
    function renderPalette() {
        var q = palInput.value.trim().toLowerCase();
        var list = items.filter(function (it) { return !q || it.label.toLowerCase().indexOf(q) > -1; });
        sel = Math.max(0, Math.min(sel, list.length - 1));
        palList.innerHTML = list.length ? "" : '<div class="el-palette-empty">No page matches "' + palInput.value.replace(/</g, "&lt;") + '".</div>';
        list.forEach(function (it, i) {
            var row = document.createElement("div");
            row.className = "el-palette-item" + (i === sel ? " is-on" : "");
            row.innerHTML = "<i></i><span></span><small></small>";
            row.children[0].textContent = it.icon;
            row.children[1].textContent = it.label;
            row.children[2].textContent = it.hint;
            row.addEventListener("mouseenter", function () { sel = i; mark(); });
            row.addEventListener("click", function () { go(it); });
            palList.appendChild(row);
        });
        palList._list = list;
    }
    function mark() {
        $$(".el-palette-item", palList).forEach(function (r, i) { r.classList.toggle("is-on", i === sel); });
        var on = $(".el-palette-item.is-on", palList);
        if (on) on.scrollIntoView({block: "nearest"});
    }
    function go(it) { if (!it) return; closePalette(); if (it.action) it.action(); else location.href = it.href; }
    function openPalette() {
        if (!pal) {
            pal = document.createElement("div");
            pal.className = "el-palette";
            pal.innerHTML = '<div class="el-palette-backdrop"></div><div class="el-palette-box" role="dialog" aria-label="Jump to page">' +
                '<input type="text" placeholder="Type a page name..." aria-label="Search pages"><div class="el-palette-list"></div>' +
                '<div class="el-palette-foot"><span>↑ ↓ to move</span><span>Enter to open</span><span>Esc to close</span></div></div>';
            document.body.appendChild(pal);
            palInput = $("input", pal);
            palList = $(".el-palette-list", pal);
            $(".el-palette-backdrop", pal).addEventListener("click", closePalette);
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

    // ---------- Boot ----------
    function boot() {
        if ($("#adminLoginForm")) { initLogin(); return; }
        if (!$(".admin-app")) return;
        greeting();
        contours($(".admin-hero"));
        sidebarIndicator();
        topbar();
        cards();
        rows();
        document.addEventListener("keydown", function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal && !pal.hidden ? closePalette() : openPalette(); }
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();

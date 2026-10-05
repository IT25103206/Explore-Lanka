/* =====================================================================
   Explore Lanka - shared frontend library
   Every page loads this file. It talks to the Spring Boot REST API
   (/api/**), keeps the session cookie, sends the CSRF token and renders
   the common layouts.
   ===================================================================== */
(function () {
    "use strict";

    // ------------------------------------------------------------------ icons (inline SVG)
    const P = {
        dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
        package: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
        calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
        bed: '<path d="M3 18V7M21 18v-5a3 3 0 0 0-3-3h-8v8M3 14h18"/><circle cx="7" cy="11" r="2"/>',
        users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/>',
        user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
        card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
        chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
        bell: '<path d="M18 9a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10.5 21a1.8 1.8 0 0 0 3 0"/>',
        logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
        heart: '<path d="M12 20s-7.5-4.5-9.3-9A5 5 0 0 1 12 6a5 5 0 0 1 9.3 5c-1.8 4.5-9.3 9-9.3 9z"/>',
        star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
        map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
        tag: '<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
        handshake: '<path d="m11 17 2 2a1 1 0 0 0 1.4 0l5.6-5.6a2 2 0 0 0 0-2.8L15 5.6a2 2 0 0 0-2.8 0L11 6.8"/><path d="m13 7-4.6-1.6a2 2 0 0 0-2.1.5L3 9.2l7 7 2-2"/>',
        festival: '<path d="M12 2v3M4.9 4.9l2.1 2.1M2 12h3M19.1 4.9 17 7M22 12h-3"/><path d="M6 22l3-10h6l3 10M8.5 17h7"/>',
        menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
        x: '<path d="M18 6 6 18M6 6l12 12"/>',
        check: '<path d="m5 12 5 5L20 7"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
        trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
        eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
        route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
        print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>',
        truck: '<path d="M2 6h11v10H2zM13 10h4l4 4v2h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
        refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
        shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
        message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>',
        globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
        alert: '<path d="M12 3 2 21h20z"/><path d="M12 10v4M12 17.5v.5"/>',
        money: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',
        list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
        copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>'
    };
    function icon(name, size) {
        const s = size || 18;
        return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || "") + "</svg>";
    }

    // ------------------------------------------------------------------ helpers
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const qs = (name) => new URLSearchParams(location.search).get(name);
    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
    const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms || 300); }; };
    const titleCase = (s) => String(s || "").toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const iso = (d) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

    const fmt = {
        money(v) {
            if (v == null || v === "") return "-";
            return "LKR " + Number(v).toLocaleString("en-LK", { maximumFractionDigits: 0 });
        },
        date(d) {
            if (!d) return "-";
            const x = new Date(String(d).length === 10 ? d + "T00:00:00" : d);
            return x.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        },
        short(d) {
            if (!d) return "-";
            const x = new Date(String(d).length === 10 ? d + "T00:00:00" : d);
            return x.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        },
        dateTime(d) {
            if (!d) return "-";
            return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
        },
        time(t) { return t ? String(t).slice(0, 5) : "-"; },
        ago(d) {
            const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
            if (s < 60) return "just now";
            if (s < 3600) return Math.floor(s / 60) + " min ago";
            if (s < 86400) return Math.floor(s / 3600) + " h ago";
            if (s < 86400 * 7) return Math.floor(s / 86400) + " d ago";
            return fmt.date(d);
        },
        stars(n) { const r = Math.round(n || 0); return '<span class="stars" title="' + (n || 0) + ' / 5">' + "★".repeat(r) + '<span style="color:#D6D3D1">' + "★".repeat(5 - r) + "</span></span>"; },
        pct(v) { return (v == null ? 0 : v) + "%"; }
    };

    const STATUS_COLOURS = {
        CONFIRMED: "green", COMPLETED: "blue", PENDING_PAYMENT: "amber", AWAITING_VERIFICATION: "gold", CANCELLED: "red",
        ACTIVE: "green", INACTIVE: "red", DRAFT: "amber", PUBLISHED: "green", DEACTIVATED: "red", EXPIRED: "",
        SUCCESS: "green", PENDING: "amber", FAILED: "red", REFUNDED: "blue", APPROVED: "green", REJECTED: "red",
        PENDING_APPROVAL: "amber", SUPERSEDED: "", TERMINATED: "red", ALLOCATED: "green", RELEASED: "",
        NEW: "amber", RESPONDED: "green", HIDDEN: "red", REGISTERED: "green",
        STANDARD: "brown", SEASONAL: "gold", CUSTOM: "blue", UP: "green", DOWN: "red", STEADY: ""
    };
    const STATUS_LABELS = { PENDING_PAYMENT: "Pending payment", AWAITING_VERIFICATION: "Awaiting verification", PENDING_APPROVAL: "Needs approval" };
    function badge(status, label) {
        if (!status) return "";
        return '<span class="badge ' + (STATUS_COLOURS[status] || "") + '">' + esc(label || STATUS_LABELS[status] || titleCase(status)) + "</span>";
    }

    // ------------------------------------------------------------------ API client
    class ApiError extends Error {
        constructor(status, body) {
            super((body && body.message) || "Request failed (" + status + ")");
            this.status = status;
            this.errors = (body && body.errors) || {};
            this.details = (body && body.details) || [];
        }
    }
    function csrfToken() {
        const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : null;
    }
    async function ensureCsrf() {
        if (!csrfToken()) { await fetch("/api/auth/me", { credentials: "same-origin" }); }
    }
    async function api(path, opts) {
        const o = opts || {};
        const method = (o.method || "GET").toUpperCase();
        let url = path;
        if (o.query) {
            const p = new URLSearchParams();
            Object.entries(o.query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.append(k, v); });
            const s = p.toString();
            if (s) url += (url.includes("?") ? "&" : "?") + s;
        }
        const headers = { Accept: "application/json" };
        if (method !== "GET") {
            await ensureCsrf();
            headers["X-XSRF-TOKEN"] = csrfToken();
        }
        if (o.body !== undefined) headers["Content-Type"] = "application/json";
        let res;
        try {
            res = await fetch(url, { method, headers, credentials: "same-origin", body: o.body !== undefined ? JSON.stringify(o.body) : undefined });
        } catch (e) {
            throw new ApiError(0, { message: "Cannot reach the server. Check your internet connection and try again." });
        }
        const text = await res.text();
        let data = null;
        if (text) { try { data = JSON.parse(text); } catch (e) { data = { message: text }; } }
        if (!res.ok) {
            if (res.status === 401 && !o.allow401) {
                const page = location.pathname;
                if (page.startsWith("/customer/") || page.startsWith("/admin/")) {
                    location.href = (page.startsWith("/admin/") ? "/staff-login.html" : "/login.html") + "?next=" + encodeURIComponent(page + location.search) + "&expired=1";
                }
            }
            throw new ApiError(res.status, data);
        }
        return data;
    }

    // ------------------------------------------------------------------ session / roles
    let mePromise = null;
    function me(refresh) {
        if (!mePromise || refresh) mePromise = api("/api/auth/me", { allow401: true }).catch(() => null);
        return mePromise;
    }
    async function logout() {
        try { await api("/api/auth/logout", { method: "POST" }); } catch (e) { /* ignore */ }
        mePromise = null;
        location.href = "/index.html";
    }
    function homeFor(user) {
        if (!user) return "/login.html";
        if (user.role === "CUSTOMER") return "/customer/dashboard.html";
        if (user.partner) return "/admin/schedule.html";
        return "/admin/dashboard.html";
    }
    function initials(name) { return String(name || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase(); }
    const ROLE = {
        ADMIN: "SYSTEM_ADMIN", OPS: "TOUR_OPERATIONS_MANAGER", LOG: "LOGISTIC_SUPPLIER_MANAGER", BM: "BUSINESS_MANAGER", FIN: "FINANCE_COORDINATOR",
        MKT: "MARKETING_EXECUTIVE", EVT: "EVENT_ORGANIZER",
        HOTEL: "HOTEL_PARTNER", TRANSPORT: "TRANSPORT_PROVIDER", GUIDE: "TOUR_GUIDE", CUSTOMER: "CUSTOMER"
    };
    const STAFF = [ROLE.ADMIN, ROLE.OPS, ROLE.LOG, ROLE.BM, ROLE.FIN, ROLE.MKT, ROLE.EVT];
    const PARTNERS = [ROLE.HOTEL, ROLE.TRANSPORT, ROLE.GUIDE];

    // ------------------------------------------------------------------ toasts / modals
    function toast(message, type, details) {
        let box = $(".toasts");
        if (!box) { box = document.createElement("div"); box.className = "toasts"; box.setAttribute("role", "status"); box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
        const t = document.createElement("div");
        t.className = "toast " + (type || "");
        t.innerHTML = "<div>" + esc(message) + (details && details.length ? "<ul>" + details.map((d) => "<li>" + esc(d) + "</li>").join("") + "</ul>" : "") + "</div>";
        box.appendChild(t);
        setTimeout(() => t.remove(), details && details.length ? 9000 : 4200);
    }
    function toastError(err) { toast(err.message || "Something went wrong", "error", err.details); }

    function modal(o) {
        const back = document.createElement("div");
        back.className = "modal-backdrop";
        back.innerHTML = '<div class="modal ' + (o.size || "") + '" role="dialog" aria-modal="true"><div class="modal-head"><h3>' + esc(o.title || "") +
            '</h3><button class="icon-btn" data-close aria-label="Close">' + icon("x") + '</button></div><div class="modal-body"></div>' +
            (o.actions && o.actions.length ? '<div class="modal-foot"></div>' : "") + "</div>";
        const body = $(".modal-body", back);
        if (typeof o.body === "string") body.innerHTML = o.body; else if (o.body) body.appendChild(o.body);
        const close = () => { back.remove(); document.removeEventListener("keydown", onKey); if (o.onClose) o.onClose(); };
        const onKey = (e) => { if (e.key === "Escape") close(); };
        document.addEventListener("keydown", onKey);
        back.addEventListener("mousedown", (e) => { if (e.target === back && !o.sticky) close(); });
        $("[data-close]", back).addEventListener("click", close);
        const foot = $(".modal-foot", back);
        (o.actions || []).forEach((a) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "btn " + (a.kind || "");
            b.innerHTML = a.label;
            b.addEventListener("click", async () => {
                if (!a.onClick) return close();
                b.disabled = true;
                try { const r = await a.onClick({ close, body, button: b }); if (r !== false && a.closes !== false) close(); }
                catch (e) { if (e instanceof ApiError) handleFormError(body.querySelector("form"), e); else console.error(e); }
                finally { b.disabled = false; }
            });
            foot.appendChild(b);
        });
        document.body.appendChild(back);
        const first = body.querySelector("input:not([type=hidden]), select, textarea");
        if (first) setTimeout(() => first.focus(), 30);
        return { close, el: back, body };
    }
    function confirmBox(message, o) {
        const opt = o || {};
        return new Promise((resolve) => {
            let done = false;
            modal({
                title: opt.title || "Please confirm",
                body: "<p>" + esc(message) + "</p>",
                onClose: () => { if (!done) resolve(false); },
                actions: [
                    { label: "Cancel", kind: "ghost" },
                    { label: opt.ok || "Confirm", kind: opt.danger ? "danger" : "", onClick: () => { done = true; resolve(true); } }
                ]
            });
        });
    }
    function promptBox(o) {
        return new Promise((resolve) => {
            let done = false;
            const f = document.createElement("form");
            f.innerHTML = (o.message ? "<p>" + esc(o.message) + "</p>" : "") +
                '<div class="field"><label>' + esc(o.label || "") + '</label><textarea name="value" maxlength="' + (o.max || 500) + '" ' + (o.required ? "required" : "") +
                ' placeholder="' + esc(o.placeholder || "") + '"></textarea><span class="error">This field is required</span></div>';
            modal({
                title: o.title, body: f,
                onClose: () => { if (!done) resolve(null); },
                actions: [
                    { label: "Cancel", kind: "ghost" },
                    {
                        label: o.ok || "Submit", kind: o.danger ? "danger" : "", onClick: () => {
                            if (!validate(f)) return false;
                            done = true; resolve(f.value.value.trim()); return true;
                        }
                    }
                ]
            });
        });
    }

    // ------------------------------------------------------------------ forms
    function formData(form) {
        const out = {};
        $$("[name]", form).forEach((el) => {
            if (el.disabled) return;
            const name = el.name;
            let v;
            if (el.type === "checkbox") {
                if (el.dataset.multi !== undefined) { out[name] = out[name] || []; if (el.checked) out[name].push(el.dataset.type === "number" ? Number(el.value) : el.value); return; }
                v = el.checked;
            } else if (el.type === "radio") {
                if (!el.checked) return;
                v = el.value;
            } else if (el.tagName === "SELECT" && el.multiple) {
                v = Array.from(el.selectedOptions).map((o) => el.dataset.type === "number" ? Number(o.value) : o.value);
            } else {
                v = el.value.trim();
                if (v === "") v = null;
                else if (el.type === "number" || el.dataset.type === "number") v = Number(v);
            }
            out[name] = v;
        });
        return out;
    }
    function fill(form, data) {
        Object.entries(data || {}).forEach(([k, v]) => {
            const els = $$('[name="' + k + '"]', form);
            els.forEach((el) => {
                if (el.type === "checkbox") {
                    if (el.dataset.multi !== undefined) el.checked = Array.isArray(v) && v.map(String).includes(el.value);
                    else el.checked = !!v;
                } else if (el.type === "radio") el.checked = String(v) === el.value;
                else if (el.tagName === "SELECT" && el.multiple) Array.from(el.options).forEach((o) => { o.selected = Array.isArray(v) && v.map(String).includes(o.value); });
                else el.value = v == null ? "" : (el.type === "time" ? String(v).slice(0, 5) : v);
            });
        });
    }
    function clearErrors(form) {
        if (!form) return;
        $$(".field.invalid", form).forEach((f) => f.classList.remove("invalid"));
        $$("[aria-invalid]", form).forEach((el) => el.removeAttribute("aria-invalid"));
        const a = $(".form-alert", form); if (a) a.remove();
    }
    function setFieldError(form, name, message) {
        const el = form && form.querySelector('[name="' + name + '"]');
        const field = el && el.closest(".field");
        if (!field) return false;
        field.classList.add("invalid");
        let e = $(".error", field);
        if (!e) { e = document.createElement("span"); e.className = "error"; field.appendChild(e); }
        if (!e.id) e.id = "err_" + Math.random().toString(36).slice(2, 9);
        e.textContent = message;
        el.setAttribute("aria-invalid", "true");
        el.setAttribute("aria-describedby", e.id);
        return true;
    }
    function formAlert(form, message, details, kind) {
        if (!form) return;
        const old = $(".form-alert", form); if (old) old.remove();
        const div = document.createElement("div");
        div.className = "alert " + (kind || "error") + " form-alert";
        div.innerHTML = esc(message) + (details && details.length ? "<ul>" + details.map((d) => "<li>" + esc(d) + "</li>").join("") + "</ul>" : "");
        form.prepend(div);
        div.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    function handleFormError(form, err) {
        if (!form) { toastError(err); return; }
        clearErrors(form);
        let mapped = 0;
        Object.entries(err.errors || {}).forEach(([k, m]) => { if (setFieldError(form, k, m)) mapped++; });
        const unmapped = Object.entries(err.errors || {}).length - mapped;
        if (mapped === 0 || unmapped > 0 || (err.details && err.details.length)) formAlert(form, err.message, err.details);
        else formAlert(form, err.message);
    }
    /** The validation message for one field, or "" when it is valid. */
    function fieldProblem(form, el) {
        let msg = "";
        const v = el.value.trim();
        if (el.required && el.type === "checkbox" && !el.checked) msg = el.dataset.msg || "Please tick this box";
        else if (el.required && !v) msg = "This field is required";
        else if (v && el.pattern && !new RegExp("^(?:" + el.pattern + ")$").test(v)) msg = el.dataset.msg || el.title || "Invalid format";
        else if (v && el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = "Enter a valid email address";
        else if (v && el.type === "number") {
            const n = Number(v);
            if (Number.isNaN(n)) msg = "Enter a number";
            else if (el.min !== "" && n < Number(el.min)) msg = "Must be at least " + el.min;
            else if (el.max !== "" && n > Number(el.max)) msg = "Must be at most " + el.max;
        } else if (v && el.type === "date") {
            if (el.min && v < el.min) msg = "Choose a date on or after " + fmt.date(el.min);
            else if (el.max && v > el.max) msg = "Choose a date on or before " + fmt.date(el.max);
        } else if (v && el.maxLength > 0 && v.length > el.maxLength) msg = "Too long";
        if (!msg && el.dataset.match) {
            const other = form.querySelector('[name="' + el.dataset.match + '"]');
            if (other && other.value !== el.value) msg = el.dataset.msg || "Values do not match";
        }
        if (!msg && el.dataset.after) {
            const other = form.querySelector('[name="' + el.dataset.after + '"]');
            if (other && other.value && v && v < other.value) msg = "Must be on or after the start";
        }
        return msg;
    }
    /** HTML5 + custom checks before anything is sent to the server. */
    function validate(form) {
        clearErrors(form);
        let ok = true;
        $$("input, select, textarea", form).forEach((el) => {
            if (el.disabled || el.type === "hidden" || !el.name) return;
            const msg = fieldProblem(form, el);
            if (msg) { ok = false; if (!setFieldError(form, el.name, msg)) formAlert(form, msg); }
        });
        if (!ok) { const f = $(".field.invalid input, .field.invalid select, .field.invalid textarea", form); if (f) f.focus(); }
        return ok;
    }
    /** Wires a form: client validation, submit, error mapping, busy state. */
    function bindForm(form, onSubmit) {
        form.setAttribute("novalidate", "");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!validate(form)) return;
            const btn = form.querySelector('[type="submit"]');
            if (btn) { btn.disabled = true; btn.classList.add("loading"); }
            try { await onSubmit(formData(form), form); }
            catch (err) { if (err instanceof ApiError) handleFormError(form, err); else { console.error(err); formAlert(form, "Unexpected error"); } }
            finally { if (btn) { btn.disabled = false; btn.classList.remove("loading"); } }
        });
        form.addEventListener("input", (e) => { const f = e.target.closest(".field.invalid"); if (f) { f.classList.remove("invalid"); e.target.removeAttribute("aria-invalid"); } });
        form.addEventListener("focusout", (e) => {
            const el = e.target;
            if (!el.name || !el.matches("input, select, textarea") || el.type === "checkbox" || !el.value.trim()) return;
            const msg = fieldProblem(form, el);
            if (msg) setFieldError(form, el.name, msg);
        });
    }
    function field(o) {
        const id = "f_" + o.name + "_" + Math.random().toString(36).slice(2, 7);
        const attrs = Object.entries(o.attrs || {}).map(([k, v]) => v === true ? k : k + '="' + esc(v) + '"').join(" ");
        let input;
        if (o.type === "select") {
            input = '<select id="' + id + '" name="' + o.name + '" ' + (o.required ? "required " : "") + attrs + ">" +
                (o.placeholder !== undefined ? '<option value="">' + esc(o.placeholder) + "</option>" : "") +
                (o.options || []).map((op) => { const val = typeof op === "object" ? op.value : op; const lab = typeof op === "object" ? op.label : titleCase(op); return '<option value="' + esc(val) + '">' + esc(lab) + "</option>"; }).join("") + "</select>";
        } else if (o.type === "textarea") {
            input = '<textarea id="' + id + '" name="' + o.name + '" ' + (o.required ? "required " : "") + attrs + ' placeholder="' + esc(o.placeholder || "") + '"></textarea>';
        } else {
            input = '<input id="' + id + '" name="' + o.name + '" type="' + (o.type || "text") + '" ' + (o.required ? "required " : "") + attrs + ' placeholder="' + esc(o.placeholder || "") + '">';
        }
        return '<div class="field ' + (o.full ? "full " : "") + (o.cls || "") + '"><label for="' + id + '">' + esc(o.label) + (o.required ? ' <span style="color:var(--danger)">*</span>' : "") + "</label>" + input +
            (o.hint ? '<span class="hint">' + esc(o.hint) + "</span>" : "") + '<span class="error"></span></div>';
    }

    // ------------------------------------------------------------------ image upload (packages, events, promotions, resources)
    const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const IMAGE_MAX_MB = 5;
    /** Uploads one image file and resolves to its public URL, e.g. "/uploads/images/abc.jpg". */
    async function uploadImage(file) {
        if (!file) throw new ApiError(400, { message: "Choose an image first" });
        if (!IMAGE_TYPES.includes(file.type)) throw new ApiError(400, { message: "Only JPG, PNG, WEBP or GIF images are allowed" });
        if (file.size > IMAGE_MAX_MB * 1024 * 1024) throw new ApiError(400, { message: "The image must be " + IMAGE_MAX_MB + " MB or smaller" });
        await ensureCsrf();
        const fd = new FormData();
        fd.append("file", file);
        let res;
        try {
            res = await fetch("/api/admin/uploads/image", { method: "POST", credentials: "same-origin", headers: { Accept: "application/json", "X-XSRF-TOKEN": csrfToken() }, body: fd });
        } catch (e) {
            throw new ApiError(0, { message: "Cannot reach the server. Check your internet connection and try again." });
        }
        const text = await res.text();
        let data = null;
        if (text) { try { data = JSON.parse(text); } catch (e) { data = { message: text }; } }
        if (!res.ok) throw new ApiError(res.status, data);
        return data.url;
    }
    /** An image field: upload from the computer (or paste a URL) with a live preview. Call bindImageFields(form) after EL.fill. */
    function imageField(o) {
        const id = "f_" + o.name + "_" + Math.random().toString(36).slice(2, 7);
        return '<div class="field full img-field" data-img-field="' + esc(o.name) + '"><label for="' + id + '">' + esc(o.label || "Image") + "</label>" +
            '<div class="row" style="gap:14px;align-items:flex-start;flex-wrap:wrap">' +
            '<div class="img-preview" style="width:132px;height:92px;border-radius:10px;overflow:hidden;background:var(--brown-50,#f5f1ea);display:flex;align-items:center;justify-content:center;flex:none;border:1px solid rgba(0,0,0,.08)"><span class="small muted">No image</span></div>' +
            '<div class="grow" style="flex:1;min-width:220px;display:flex;flex-direction:column;gap:8px">' +
            '<input type="file" accept="' + IMAGE_TYPES.join(",") + '" data-img-file>' +
            '<input id="' + id + '" name="' + esc(o.name) + '" type="text" maxlength="255" placeholder="' + esc(o.placeholder || "/uploads/images/... or /images/...") + '">' +
            '<span class="hint">Upload a JPG, PNG, WEBP or GIF (max ' + IMAGE_MAX_MB + ' MB), or paste an image URL.</span>' +
            '<span class="small" data-img-status></span></div></div><span class="error"></span></div>';
    }
    function bindImageFields(form) {
        $$("[data-img-field]", form).forEach((box) => {
            const input = box.querySelector('input[name="' + box.dataset.imgField + '"]');
            const file = box.querySelector("[data-img-file]");
            const preview = box.querySelector(".img-preview");
            const status = box.querySelector("[data-img-status]");
            const show = () => {
                const url = input.value.trim();
                preview.innerHTML = url ? '<img src="' + esc(url) + '" alt="" style="width:100%;height:100%;object-fit:cover">' : '<span class="small muted">No image</span>';
                const img = preview.querySelector("img");
                if (img) img.addEventListener("error", () => { preview.innerHTML = '<span class="small" style="color:var(--danger)">Image not found</span>'; });
            };
            input.addEventListener("input", debounce(show, 300));
            file.addEventListener("change", async () => {
                const f = file.files && file.files[0];
                if (!f) return;
                status.textContent = "Uploading " + f.name + "...";
                status.style.color = "";
                file.disabled = true;
                try {
                    input.value = await uploadImage(f);
                    status.textContent = "Uploaded";
                    status.style.color = "var(--success, #2e7032)";
                    show();
                } catch (e) {
                    status.textContent = e.message || "Upload failed";
                    status.style.color = "var(--danger)";
                } finally {
                    file.disabled = false;
                    file.value = "";
                }
            });
            show();
        });
    }

    // ------------------------------------------------------------------ shared interface polish (portal pages only)
    if (/^\/(admin|customer)\//.test(location.pathname)) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "/css/ui-polish.css?v=20261004-motion2";
        document.head.appendChild(css);
        const js = document.createElement("script");
        js.src = "/js/ui-polish.js?v=20261004-motion2";
        js.defer = true;
        document.head.appendChild(js);
    }

    // ------------------------------------------------------------------ tables
    function table(el, columns, rows, o) {
        const opt = o || {};
        if (!rows || !rows.length) {
            el.innerHTML = '<div class="table-wrap"><div class="empty">' + icon(opt.emptyIcon || "list", 40) + "<div>" + esc(opt.empty || "Nothing to show yet") + "</div></div></div>";
            return;
        }
        el.innerHTML = '<div class="table-wrap"><table class="table"><thead><tr>' + columns.map((c) => '<th class="' + (c.cls || "") + '">' + esc(c.label) + "</th>").join("") +
            "</tr></thead><tbody>" + rows.map((r, i) => '<tr data-i="' + i + '" class="' + (opt.onRow ? "clickable" : "") + '">' +
                columns.map((c) => '<td class="' + (c.cls || "") + '">' + (c.render ? c.render(r) : esc(r[c.key])) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
        if (opt.onRow) {
            $$("tbody tr", el).forEach((tr) => tr.addEventListener("click", (e) => {
                if (e.target.closest("button, a, input, select")) return;
                opt.onRow(rows[Number(tr.dataset.i)]);
            }));
        }
        $$("[data-act]", el).forEach((b) => b.addEventListener("click", (e) => {
            e.stopPropagation();
            const row = rows[Number(b.closest("tr").dataset.i)];
            if (opt.actions && opt.actions[b.dataset.act]) opt.actions[b.dataset.act](row, b);
        }));
    }
    const act = (name, ic, title, cls) => '<button class="icon-btn ' + (cls || "") + '" data-act="' + name + '" title="' + esc(title) + '" aria-label="' + esc(title) + '">' + icon(ic, 16) + "</button>";
    function emptyState(msg, ic) { return '<div class="empty">' + icon(ic || "list", 40) + "<div>" + esc(msg) + "</div></div>"; }
    function skeleton(n) { return Array.from({ length: n || 3 }, () => '<div class="skeleton" style="height:60px;margin-bottom:10px"></div>').join(""); }

    // ------------------------------------------------------------------ charts (small SVG, no library)
    const PALETTE = ["#1C1917", "#244F3E", "#A16207", "#1E40AF", "#7B261D", "#0F766E", "#6D28D9", "#78716C"];
    function barChart(el, data, o) {
        const opt = o || {};
        if (!data || !data.length || data.every((d) => !d.value)) { el.innerHTML = emptyState(opt.empty || "No data for this period", "chart"); return; }
        const W = 640, H = opt.height || 240, pad = { l: 64, r: 10, t: 14, b: 44 };
        const max = Math.max(...data.map((d) => d.value)) || 1;
        const bw = (W - pad.l - pad.r) / data.length;
        const f = opt.format || ((v) => Number(v).toLocaleString());
        let svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(opt.title || "Bar chart") + '">';
        for (let i = 0; i <= 4; i++) {
            const y = pad.t + (H - pad.t - pad.b) * (1 - i / 4);
            svg += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y + '" y2="' + y + '" stroke="#E7E5E4"/>';
            svg += '<text x="' + (pad.l - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + esc(opt.axis ? opt.axis(max * i / 4) : f(max * i / 4)) + "</text>";
        }
        data.forEach((d, i) => {
            const h = (H - pad.t - pad.b) * (d.value / max);
            const x = pad.l + i * bw + bw * 0.18, w = bw * 0.64, y = H - pad.b - h;
            svg += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + Math.max(h, 0) + '" rx="4" fill="' + (opt.color || PALETTE[0]) + '"><title>' + esc(d.label + ": " + f(d.value)) + "</title></rect>";
            svg += '<text x="' + (x + w / 2) + '" y="' + (H - pad.b + 16) + '" text-anchor="middle">' + esc(String(d.label).length > 12 ? String(d.label).slice(0, 11) + "…" : d.label) + "</text>";
        });
        el.innerHTML = '<div class="chart">' + svg + "</svg></div>";
    }
    function donutChart(el, data, o) {
        const opt = o || {};
        const total = (data || []).reduce((s, d) => s + d.value, 0);
        if (!total) { el.innerHTML = emptyState(opt.empty || "No data yet", "chart"); return; }
        const R = 70, r = 44, C = 90;
        let a0 = -Math.PI / 2, paths = "";
        data.forEach((d, i) => {
            const a1 = a0 + (d.value / total) * Math.PI * 2;
            const large = a1 - a0 > Math.PI ? 1 : 0;
            const p = (ang, rad) => [C + rad * Math.cos(ang), C + rad * Math.sin(ang)];
            const [x0, y0] = p(a0, R), [x1, y1] = p(a1, R), [x2, y2] = p(a1, r), [x3, y3] = p(a0, r);
            const full = data.length === 1;
            paths += full
                ? '<circle cx="' + C + '" cy="' + C + '" r="' + (R + r) / 2 + '" fill="none" stroke="' + PALETTE[i % 8] + '" stroke-width="' + (R - r) + '"/>'
                : '<path d="M' + x0 + " " + y0 + " A" + R + " " + R + " 0 " + large + " 1 " + x1 + " " + y1 + " L" + x2 + " " + y2 + " A" + r + " " + r + " 0 " + large + " 0 " + x3 + " " + y3 + 'Z" fill="' + PALETTE[i % 8] + '"><title>' + esc(d.label + ": " + d.value) + "</title></path>";
            a0 = a1;
        });
        const f = opt.format || ((v) => v);
        el.innerHTML = '<div class="row" style="gap:18px;align-items:center"><svg viewBox="0 0 180 180" width="170" height="170" role="img" aria-label="' + esc(opt.title || "Donut chart") + '">' + paths +
            '<text x="90" y="86" text-anchor="middle" style="font:700 15px Inter,sans-serif;fill:#0C0A09">' + esc(opt.center || f(total)) + '</text><text x="90" y="104" text-anchor="middle" style="font-size:10px;fill:#6B6560">' + esc(opt.centerLabel || "total") + "</text></svg>" +
            '<div class="legend" style="flex-direction:column;gap:6px">' + data.map((d, i) => "<span><i style=\"background:" + PALETTE[i % 8] + '"></i>' + esc(titleCase(d.label)) + " - <b>" + esc(f(d.value)) + "</b> (" + Math.round(d.value * 100 / total) + "%)</span>").join("") + "</div></div>";
    }

    // ------------------------------------------------------------------ public layout
    // logged-in customers use the dashboard versions of these pages instead of the public ones
    const CUSTOMER_PAGES = { "/packages.html": "/customer/packages.html", "/events.html": "/customer/festivals.html", "/offers.html": "/customer/offers.html" };
    function publicLayout(active) {
        const dashboardPage = CUSTOMER_PAGES[location.pathname];
        if (dashboardPage) {
            document.documentElement.style.visibility = "hidden";
            me().then((u) => {
                if (u && u.role === "CUSTOMER") { location.replace(dashboardPage + location.search); return; }
                document.documentElement.style.visibility = "";
            });
        }
        const header = document.createElement("header");
        header.className = "site-header";
        header.innerHTML = '<div class="container"><a class="brand" href="/index.html">' + "<div><b>EXPLORE LANKA</b><small>Trips of a thousand lifetimes</small></div></a>" +
            '<nav class="nav" id="siteNav">' +
            [["home", "/index.html", "Home"], ["packages", "/packages.html", "Tour Packages"], ["events", "/events.html", "Festivals & Events"], ["offers", "/offers.html", "Offers"]]
                .map(([k, h, l]) => '<a href="' + h + '" class="' + (k === active ? "active" : "") + '">' + l + "</a>").join("") +
            '</nav><div class="header-actions" id="headerActions"><a class="btn sm outline" href="/login.html">Login</a><a class="btn sm" href="/login.html#register">Register</a></div>' +
            '<button class="icon-btn menu-toggle" id="navToggle" aria-label="Menu">' + icon("menu") + "</button></div>";
        document.body.prepend(header);
        $("#navToggle").addEventListener("click", () => $("#siteNav").classList.toggle("open"));

        const footer = document.createElement("footer");
        footer.className = "site-footer";
        footer.innerHTML = '<div class="container"><div class="grid"><div><a class="brand" href="/index.html">' + "<div><b>EXPLORE LANKA</b><small>Trips of a thousand lifetimes</small></div></a>" +
            '<p class="small" style="margin-top:14px;color:#D8C6B4">Tailor-made tours across Sri Lanka - culture, wildlife, tea country and beaches, with local festivals built into every journey.</p></div>' +
            '<div><h4>Explore</h4><ul><li><a href="/packages.html">Tour packages</a></li><li><a href="/events.html">Festival calendar</a></li><li><a href="/offers.html">Special offers</a></li></ul></div>' +
            '<div><h4>Account</h4><ul><li><a href="/login.html">Customer login</a></li><li><a href="/login.html#register">Create account</a></li><li><a href="/staff-login.html">Staff & partner portal</a></li></ul></div>' +
            '<div><h4>Contact</h4><ul><li>No. 25, Galle Road, Colombo 03</li><li>+94 11 234 5678</li><li>hello@explorelanka.lk</li><li>Open 24/7 online</li></ul></div></div>' +
            '<div class="bottom"><span>© ' + new Date().getFullYear() + ' Explore Lanka · SE2030 Group 2026-Y2-S1-MLB-B11G1-10</span><span>' + icon("shield", 14) + " Secure, role-based access · Simulated payment gateway</span></div></div>";
        document.body.appendChild(footer);

        me().then((u) => {
            if (!u) return;
            $("#headerActions").innerHTML = '<div class="user-menu"><button class="user-chip" id="umBtn"><span class="avatar">' + esc(initials(u.fullName)) +
                '</span><span class="who"><b>' + esc(u.fullName.split(" ")[0]) + "</b><small>" + esc(u.roleName) + '</small></span></button><div class="dropdown" id="umDrop">' +
                '<a href="' + homeFor(u) + '">' + icon("dashboard", 16) + " My dashboard</a>" +
                (u.role === "CUSTOMER" ? '<a href="/customer/bookings.html">' + icon("calendar", 16) + ' My bookings</a><a href="/customer/wishlist.html">' + icon("heart", 16) + " Wishlist</a>" : "") +
                '<button id="umLogout">' + icon("logout", 16) + " Log out</button></div></div>";
            $("#umBtn").addEventListener("click", (e) => { e.stopPropagation(); $("#umDrop").classList.toggle("open"); });
            document.addEventListener("click", () => $("#umDrop") && $("#umDrop").classList.remove("open"));
            $("#umLogout").addEventListener("click", logout);
        });
    }

    // ------------------------------------------------------------------ portal layout (customer / staff / partner)
    const CUSTOMER_NAV = [
        ["dashboard", "/customer/dashboard.html", "Dashboard", "dashboard"],
        ["packages", "/customer/packages.html", "Tour Packages", "package"],
        ["festivals", "/customer/festivals.html", "Festivals & Events", "festival"],
        ["offers", "/customer/offers.html", "Offers", "tag"],
        ["bookings", "/customer/bookings.html", "My Bookings", "calendar"],
        ["payments", "/customer/payments.html", "Payments & Refunds", "card"],
        ["wishlist", "/customer/wishlist.html", "Wishlist", "heart"],
        ["events", "/customer/events.html", "My Events", "list"],
        ["reviews", "/customer/reviews.html", "Reviews", "star"],
        ["notifications", "/customer/notifications.html", "Notifications", "bell"],
        ["profile", "/customer/profile.html", "Profile", "user"]
    ];
    const ADMIN_NAV = [
        { group: "Overview" },
        ["dashboard", "/admin/dashboard.html", "Dashboard", "dashboard", STAFF],
        ["schedule", "/admin/schedule.html", "My Schedule", "calendar", PARTNERS],
        { group: "Operations" },
        ["packages", "/admin/packages.html", "Tour Packages", "package", [ROLE.OPS, ROLE.ADMIN]],
        ["bookings", "/admin/bookings.html", "Bookings", "calendar", [ROLE.FIN, ROLE.ADMIN]],
        ["allocations", "/admin/allocations.html", "Resource Allocation", "route", [ROLE.LOG, ROLE.ADMIN]],
        ["resources", "/admin/resources.html", "Hotels & Vehicles", "bed", [ROLE.LOG, ROLE.ADMIN]],
        { group: "Partners" },
        ["guides", "/admin/guides.html", "Tour Guides", "user", [ROLE.BM, ROLE.ADMIN]],
        ["transport", "/admin/partners.html?type=TRANSPORT", "Transport Providers", "truck", [ROLE.BM, ROLE.ADMIN]],
        ["partners", "/admin/partners.html", "Partners & Rates", "handshake", [ROLE.BM, ROLE.ADMIN]],
        { group: "Marketing" },
        ["events", "/admin/events.html", "Events & Festivals", "festival", [ROLE.EVT, ROLE.ADMIN]],
        ["promotions", "/admin/promotions.html", "Promotions & Offers", "tag", [ROLE.MKT, ROLE.ADMIN]],
        { group: "Finance & insight" },
        ["payments", "/admin/payments.html", "Payments & Refunds", "card", [ROLE.FIN, ROLE.ADMIN]],
        ["feedback", "/admin/feedback.html", "Feedback", "message", [ROLE.BM, ROLE.FIN, ROLE.ADMIN]],
        ["reports", "/admin/reports.html", "Reports", "chart", [ROLE.BM, ROLE.FIN, ROLE.ADMIN]],
        { group: "System" },
        ["users", "/admin/users.html", "Users & Roles", "users", [ROLE.ADMIN]],
        ["notifications", "/admin/notifications.html", "Notifications", "bell", null],
        ["profile", "/admin/profile.html", "My Profile", "user", null]
    ];

    /**
     * Builds the sidebar + topbar around the page content and checks access.
     * Redirects to the right login page when the session is missing or the role is not allowed.
     */
    async function portal(o) {
        const kind = o.kind || "admin";
        document.body.classList.add("el-refresh", kind === "customer" ? "el-customer" : "el-management");
        const user = await me();
        const loginPage = kind === "customer" ? "/login.html" : "/staff-login.html";
        if (!user) { location.replace(loginPage + "?next=" + encodeURIComponent(location.pathname + location.search)); throw new Error("redirect"); }
        if (kind === "customer" && user.role !== "CUSTOMER") { location.replace(homeFor(user)); throw new Error("redirect"); }
        if (kind === "admin" && user.role === "CUSTOMER") { location.replace("/customer/dashboard.html"); throw new Error("redirect"); }
        if (o.roles && !o.roles.includes(user.role)) {
            document.body.innerHTML = '<div class="auth-page"><div class="card center" style="max-width:440px">' + icon("shield", 40) +
                '<h2 style="margin-top:10px">Access restricted</h2><p class="muted">Your role (' + esc(user.roleName) + ") cannot open this page.</p><a class=\"btn\" href=\"" + homeFor(user) + '">Go to my dashboard</a></div></div>';
            throw new Error("forbidden");
        }

        const page = document.getElementById("page");
        const shell = document.createElement("div");
        shell.className = "portal";
        const nav = (kind === "customer" ? CUSTOMER_NAV.map((n) => n) : ADMIN_NAV).filter((n) => n.group || !n[4] || n[4].includes(user.role));
        // drop empty groups
        const items = nav.filter((n, i) => !n.group || (nav[i + 1] && !nav[i + 1].group));
        shell.innerHTML = '<aside class="sidebar ' + (kind === "customer" ? "customer" : "") + '" id="sidebar"><a class="brand" href="/index.html">' +
            "<div><b>EXPLORE LANKA</b><small>" + (kind === "customer" ? "Traveller portal" : user.partner ? "Partner portal" : "Management portal") + "</small></div></a><nav>" +
            items.map((n) => n.group ? '<div class="group">' + esc(n.group) + "</div>" : '<a href="' + n[1] + '" class="' + (n[0] === o.active ? "active" : "") + '" data-nav="' + n[0] + '">' + icon(n[3]) + "<span>" + esc(n[2]) + "</span></a>").join("") +
            '<a href="#" id="navLogout">' + icon("logout") + "<span>Log out</span></a></nav><div class=\"side-foot\">" + icon("shield", 13) + " Signed in as " + esc(user.roleName) + "</div></aside>" +
            '<div class="main"><header class="topbar"><button class="icon-btn menu-toggle" id="sideToggle" aria-label="Menu">' + icon("menu") + "</button><h1>" + esc(o.title) +
            '</h1><div class="spacer"></div><a class="icon-btn bell" href="/' + kind + '/notifications.html" title="Notifications" aria-label="Notifications">' + icon("bell") +
            '<span class="dot hidden" id="bellDot"></span></a><div class="user-menu"><button class="user-chip" id="umBtn"><span class="avatar">' + esc(initials(user.fullName)) +
            '</span><span class="who"><b>' + esc(user.fullName) + "</b><small>" + esc(user.roleName) + '</small></span></button><div class="dropdown" id="umDrop"><a href="/' + kind + '/profile.html">' + icon("user", 16) +
            ' My profile</a><a href="/index.html">' + icon("globe", 16) + ' Public website</a><button id="umLogout">' + icon("logout", 16) + ' Log out</button></div></div></header><main class="content" id="contentSlot"></main></div>';
        document.body.prepend(shell);
        $("#contentSlot").appendChild(page);
        page.hidden = false;
        $("#sideToggle").addEventListener("click", (e) => { e.stopPropagation(); $("#sidebar").classList.toggle("open"); });
        document.addEventListener("click", (e) => { if (!e.target.closest("#sidebar")) $("#sidebar").classList.remove("open"); $("#umDrop").classList.remove("open"); });
        $("#umBtn").addEventListener("click", (e) => { e.stopPropagation(); $("#umDrop").classList.toggle("open"); });
        $("#umLogout").addEventListener("click", logout);
        $("#navLogout").addEventListener("click", (e) => { e.preventDefault(); logout(); });
        refreshBell();
        document.title = o.title + " · Explore Lanka";
        return user;
    }
    function refreshBell() {
        api("/api/notifications/unread-count").then((r) => {
            const d = $("#bellDot");
            if (!d) return;
            d.textContent = r.count > 9 ? "9+" : r.count;
            d.classList.toggle("hidden", !r.count);
        }).catch(() => { });
    }

    // ------------------------------------------------------------------ CSV export
    function downloadCsv(filename, columns, rows) {
        const cell = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
        const csv = [columns.map((c) => cell(c.label)).join(",")].concat(rows.map((r) => columns.map((c) => cell(c.value ? c.value(r) : r[c.key])).join(","))).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    // ------------------------------------------------------------------ shared constants
    const REGIONS = ["Western", "Central", "Southern", "Uva", "Sabaragamuwa", "North Central", "North Western", "Northern", "Eastern"];
    const CATEGORIES = ["CULTURAL", "WILDLIFE", "BEACH", "HILL_COUNTRY", "ADVENTURE", "RELIGIOUS", "HONEYMOON", "FAMILY"];
    const EVENT_CATEGORIES = ["CULTURAL_FESTIVAL", "RELIGIOUS", "MUSIC", "FOOD_AND_DRINK", "EXHIBITION", "SPORTS", "ENTERTAINMENT"];
    const COUNTRIES = ["Sri Lanka", "India", "United Kingdom", "Germany", "France", "Australia", "United States", "China", "Japan", "Maldives", "Netherlands", "Italy", "Canada", "Russia", "Other"];
    const PATTERNS = {
        name: "[A-Za-z][A-Za-z .'\\-]{1,99}",
        phone: "\\+?[0-9]{9,15}",
        password: "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,64}",
        code: "[A-Za-z0-9\\-]{3,30}"
    };

    // the page guard stops page scripts with these errors after redirecting / showing "Access restricted"
    window.addEventListener("unhandledrejection", (e) => {
        if (e.reason && (e.reason.message === "redirect" || e.reason.message === "forbidden")) e.preventDefault();
    });

    window.EL = {
        api, ApiError, me, logout, homeFor, ROLE, STAFF, PARTNERS, icon, esc, qs, $, $$, debounce, titleCase, iso, addDays,
        fmt, badge, toast, toastError, modal, confirm: confirmBox, prompt: promptBox, formData, fill, validate, bindForm,
        handleFormError, formAlert, clearErrors, field, table, act, emptyState, skeleton, barChart, donutChart,
        publicLayout, portal, refreshBell, downloadCsv, initials, uploadImage, imageField, bindImageFields, REGIONS, CATEGORIES, EVENT_CATEGORIES, COUNTRIES, PATTERNS
    };
})();

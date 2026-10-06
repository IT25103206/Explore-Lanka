/* =========================================================
   Explore Lanka - Staff accounts & roles (User & Role Management)
   Page: /ui/admin-staff   (OWNER and SYSTEM_ADMIN)
   ========================================================= */
(function () {
    "use strict";

    var API = "/api/staff";
    var PAGE_NAMES = {dashboard: "Dashboard", notifications: "Notifications", packages: "Packages", bookings: "Bookings", resources: "Resources",
        partners: "Partners", events: "Events", promotions: "Promotions", feedback: "Reviews", payments: "Payments", reports: "Reports",
        users: "Customers", staff: "Staff & Roles", approvals: "Rate approvals"};

    function $(s) { return document.querySelector(s); }
    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c];
        });
    }
    function fmtDate(v) {
        if (!v) return "-";
        var d = new Date(v);
        return isNaN(d) ? v : d.toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"});
    }
    function genPassword() {
        var letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz", digits = "23456789", all = letters + digits + "@#$";
        var arr = new Uint32Array(10);
        window.crypto.getRandomValues(arr);
        var p = letters[arr[0] % letters.length] + digits[arr[1] % digits.length];
        for (var i = 2; i < 10; i++) p += all[arr[i] % all.length];
        return p.split("").sort(function () { return 0.5 - Math.random(); }).join("");
    }
    function validPassword(p) { return p.length >= 8 && p.length <= 45 && /[A-Za-z]/.test(p) && /\d/.test(p); }
    function toast(msg, bad) {
        var t = document.createElement("div");
        t.className = "toast";
        t.textContent = msg;
        if (bad) t.style.background = "#9f3b32";
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 2600);
    }

    function api(method, url, body) {
        return fetch(url, {
            method: method,
            credentials: "same-origin",
            headers: {"Content-Type": "application/json"},
            body: body ? JSON.stringify(body) : undefined
        }).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
                if (!res.ok) throw new Error(data.message || "Request failed (" + res.status + ").");
                return data;
            });
        });
    }

    var alertBox, staff = [], roles = [], me = null;
    function roleLabel(r) { var x = roles.filter(function (o) { return o.role === r; })[0]; return x ? x.label : r; }
    function showAlert(msg, type) { alertBox.textContent = msg; alertBox.className = "st-alert show " + (type || "error"); }
    function hideAlert() { alertBox.className = "st-alert"; }

    function showCredentials(u, password) {
        $("#credEmpty").hidden = true;
        $("#credBody").hidden = false;
        $("#credName").textContent = u.name || "";
        $("#credRole").textContent = u.roleLabel || roleLabel(u.role);
        $("#credUrl").textContent = location.origin + "/admin/login";
        $("#credEmail").textContent = u.email || "";
        $("#credUserRow").hidden = !u.username;
        $("#credUser").textContent = u.username || "";
        $("#credPass").textContent = password;
    }

    function render() {
        var q = ($("#staffSearch").value || "").trim().toLowerCase(), rf = $("#staffRoleFilter").value;
        var rows = staff.filter(function (u) {
            return (!q || [u.name, u.email, u.phone, u.username].join(" ").toLowerCase().indexOf(q) > -1) && (!rf || u.role === rf);
        });
        $("#kpiTotal").textContent = staff.length;
        $("#kpiActive").textContent = staff.filter(function (u) { return (u.status || "").toUpperCase() === "ACTIVE"; }).length;
        $("#kpiInactive").textContent = staff.filter(function (u) { return (u.status || "").toUpperCase() !== "ACTIVE"; }).length;
        $("#kpiRoles").textContent = Object.keys(staff.reduce(function (o, u) { o[u.role] = 1; return o; }, {})).length;

        var body = $("#staffBody");
        if (!rows.length) {
            body.innerHTML = '<tr><td colspan="7" class="st-empty">' + (staff.length ? "No staff match your search." : "No staff accounts yet. Create the first one above.") + "</td></tr>";
            return;
        }
        body.innerHTML = rows.map(function (u) {
            var active = (u.status || "").toUpperCase() === "ACTIVE", self = me && String(me) === String(u.userId);
            return '<tr data-id="' + u.userId + '"><td><b>' + esc(u.name) + "</b><small>" + esc(u.username || "") + "</small></td>" +
                "<td>" + (self ? esc(u.roleLabel || roleLabel(u.role)) : '<select class="st-role" aria-label="Role">' + roles.map(function (r) {
                    return '<option value="' + r.role + '"' + (r.role === u.role ? " selected" : "") + ">" + esc(r.label) + "</option>";
                }).join("") + "</select>") + "</td>" +
                "<td>" + esc(u.email) + "</td><td>" + esc(u.phone || "-") + "</td><td>" + fmtDate(u.createdAt) + "</td>" +
                '<td><span class="badge ' + (active ? "success" : "danger") + '">' + (active ? "Active" : "Inactive") + "</span></td>" +
                '<td><div class="st-actions">' + (self ? "<small>You</small>" :
                    '<button class="table-action" data-act="toggle">' + (active ? "Deactivate" : "Activate") + '</button>' +
                    '<button class="table-action" data-act="reset">Reset password</button>' +
                    '<button class="table-action danger" data-act="delete">Delete</button>') + "</div></td></tr>";
        }).join("");
    }

    function load() {
        return api("GET", API).then(function (list) { staff = list || []; render(); })
            .catch(function (e) { $("#staffBody").innerHTML = '<tr><td colspan="7" class="st-empty">' + esc(e.message) + "</td></tr>"; });
    }

    function loadRoles() {
        return api("GET", API + "/roles").then(function (list) {
            roles = list || [];
            $("#stRole").innerHTML = '<option value="">Choose a role…</option>' + roles.map(function (r) { return '<option value="' + r.role + '">' + esc(r.label) + "</option>"; }).join("");
            $("#staffRoleFilter").innerHTML = '<option value="">All roles</option>' + roles.map(function (r) { return '<option value="' + r.role + '">' + esc(r.label) + "</option>"; }).join("");
            $("#roleCards").innerHTML = roles.map(function (r) {
                return '<div class="card st-role-card"><h4>' + esc(r.label) + "</h4><p>" + (r.pages || []).map(function (p) { return '<span class="st-chip">' + esc(PAGE_NAMES[p] || p) + "</span>"; }).join("") + "</p></div>";
            }).join("");
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        alertBox = $("#staffAlert");
        var ready = window.portalReady && window.portalReady.then ? window.portalReady : Promise.resolve();
        ready.then(function () {
            me = sessionStorage.getItem("userId");
            loadRoles().then(load).catch(function (e) { showAlert(e.message); });
        });

        $("#genPw").addEventListener("click", function () { $("#stPassword").value = genPassword(); });
        $("#stRole").addEventListener("change", function () {
            var r = roles.filter(function (o) { return o.role === $("#stRole").value; })[0];
            $("#stRoleHint").textContent = r ? "Can open: " + (r.pages || []).map(function (p) { return PAGE_NAMES[p] || p; }).join(", ") : "";
        });
        $("#staffSearch").addEventListener("input", render);
        $("#staffRoleFilter").addEventListener("change", render);
        $("#staffRefresh").addEventListener("click", function () { load().then(function () { toast("List refreshed"); }); });

        $("#copyCred").addEventListener("click", function () {
            var text = ["Explore Lanka staff login", "Name: " + $("#credName").textContent, "Role: " + $("#credRole").textContent,
                "Login page: " + $("#credUrl").textContent, "Email: " + $("#credEmail").textContent,
                $("#credUser").textContent ? "Username: " + $("#credUser").textContent : "", "Password: " + $("#credPass").textContent].filter(Boolean).join("\n");
            (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { toast("Credentials copied"); }, function () { toast("Copy failed - select and copy manually", true); });
        });

        $("#staffForm").addEventListener("submit", function (e) {
            e.preventDefault();
            hideAlert();
            var v = {name: $("#stName").value.trim(), role: $("#stRole").value, email: $("#stEmail").value.trim(), phone: $("#stPhone").value.trim(),
                nic: $("#stNic").value.trim(), username: $("#stUsername").value.trim(), password: $("#stPassword").value, address: $("#stAddress").value.trim()};
            var err = [];
            if (!v.name) err.push("Name is required.");
            if (!v.role) err.push("Choose a role.");
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) err.push("Enter a valid email.");
            if (!/^0\d{9}$/.test(v.phone)) err.push("Phone must be 10 digits and start with 0.");
            if (v.nic && !/^(\d{9}[VvXx]|\d{12})$/.test(v.nic)) err.push("NIC must be 9 digits + V/X or 12 digits.");
            if (!validPassword(v.password)) err.push("Password must be 8-45 characters with letters and numbers.");
            if (err.length) { showAlert(err.join(" ")); return; }
            var btn = $("#staffSubmit"); btn.disabled = true; btn.textContent = "Creating...";
            api("POST", API, v).then(function (u) {
                showCredentials(u, v.password);
                showAlert("Account created for " + u.name + " (" + (u.roleLabel || roleLabel(u.role)) + ").", "ok");
                $("#staffForm").reset(); $("#stRoleHint").textContent = "";
                load();
            }).catch(function (er) { showAlert(er.message); })
                .then(function () { btn.disabled = false; btn.textContent = "＋ Create staff account"; });
        });

        $("#staffBody").addEventListener("change", function (e) {
            var sel = e.target.closest(".st-role"); if (!sel) return;
            var tr = sel.closest("tr"), u = staff.filter(function (x) { return String(x.userId) === tr.dataset.id; })[0];
            api("PUT", API + "/" + u.userId + "/role", {role: sel.value}).then(function (x) { toast(u.name + " is now " + (x.roleLabel || roleLabel(x.role))); load(); })
                .catch(function (er) { toast(er.message, true); sel.value = u.role; });
        });

        $("#staffBody").addEventListener("click", function (e) {
            var b = e.target.closest("button[data-act]"); if (!b) return;
            var tr = b.closest("tr"), u = staff.filter(function (x) { return String(x.userId) === tr.dataset.id; })[0];
            if (!u) return;
            var act = b.dataset.act;
            if (act === "toggle") {
                var next = (u.status || "").toUpperCase() === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                if (next === "INACTIVE" && !confirm("Deactivate " + u.name + "? They won't be able to log in.")) return;
                api("PUT", API + "/" + u.userId + "/status", {status: next}).then(function () { toast(u.name + " is now " + next.toLowerCase()); load(); }).catch(function (er) { toast(er.message, true); });
            } else if (act === "reset") {
                var pw = genPassword();
                if (!confirm("Reset the password for " + u.name + "?")) return;
                api("PUT", API + "/" + u.userId + "/password", {password: pw}).then(function (x) { showCredentials(x, pw); toast("Password reset"); window.scrollTo({top: 0, behavior: "smooth"}); })
                    .catch(function (er) { toast(er.message, true); });
            } else if (act === "delete") {
                if (!confirm("Delete " + u.name + "'s account? This cannot be undone.")) return;
                api("DELETE", API + "/" + u.userId).then(function () { toast("Account deleted"); load(); }).catch(function (er) { toast(er.message, true); });
            }
        });
    });
})();

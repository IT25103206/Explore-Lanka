/* =========================================================
   Explore Lanka - OWNER: management staff accounts
   Page: /ui/admin-staff
   ========================================================= */
(function () {
    "use strict";

    var API = "/api/staff";
    var role = (sessionStorage.getItem("userRole") || "").trim().toUpperCase();
    var ownerId = sessionStorage.getItem("userId");

    // Owner only - management staff get sent back to the dashboard
    if (role !== "OWNER" || !ownerId) {
        if (role === "MANAGEMENT_SERVICE") window.location.replace("/ui/admin-dashboard");
        return;
    }

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
        (window.crypto || window.msCrypto).getRandomValues(arr);
        var p = letters[arr[0] % letters.length] + digits[arr[1] % digits.length];
        for (var i = 2; i < 10; i++) p += all[arr[i] % all.length];
        return p.split("").sort(function () { return 0.5 - Math.random(); }).join("");
    }
    function validPassword(p) { return p.length >= 8 && p.length <= 45 && /[A-Za-z]/.test(p) && /\d/.test(p); }

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

    var alertBox, staff = [];
    function showAlert(msg, type) { alertBox.textContent = msg; alertBox.className = "st-alert show " + (type || "error"); }
    function hideAlert() { alertBox.className = "st-alert"; }

    function showCredentials(u, password) {
        $("#credEmpty").hidden = true;
        $("#credBody").hidden = false;
        $("#credName").textContent = u.name || "";
        $("#credUrl").textContent = location.origin + "/ui/admin-login";
        $("#credEmail").textContent = u.email || "";
        $("#credUserRow").style.display = u.username ? "" : "none";
        $("#credUser").textContent = u.username || "";
        $("#credPass").textContent = password;
        var card = $("#credCard");
        card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
        if (window.innerWidth < 980) card.scrollIntoView({behavior: "smooth"});
    }

    function render() {
        var q = ($("#staffSearch").value || "").toLowerCase();
        var rows = staff.filter(function (s) {
            return !q || [s.name, s.email, s.phone, s.username].join(" ").toLowerCase().indexOf(q) > -1;
        });
        var now = new Date();
        $("#kpiTotal").textContent = staff.length;
        $("#kpiActive").textContent = staff.filter(function (s) { return (s.status || "").toUpperCase() === "ACTIVE"; }).length;
        $("#kpiInactive").textContent = staff.filter(function (s) { return (s.status || "").toUpperCase() !== "ACTIVE"; }).length;
        $("#kpiMonth").textContent = staff.filter(function (s) {
            var d = new Date(s.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        var body = $("#staffBody");
        if (!rows.length) {
            body.innerHTML = '<tr><td colspan="8" class="st-empty">' +
                (staff.length ? "No staff match your search." : "No staff accounts yet. Create the first one above.") + "</td></tr>";
            return;
        }
        body.innerHTML = rows.map(function (s) {
            var active = (s.status || "").toUpperCase() === "ACTIVE";
            return "<tr><td>" + s.userId + "</td><td>" + esc(s.name) + "</td><td>" + esc(s.email) + "</td><td>" +
                esc(s.username || "-") + "</td><td>" + esc(s.phone) + "</td><td>" + fmtDate(s.createdAt) + "</td><td>" +
                '<span class="badge ' + (active ? "success" : "danger") + '">' + (active ? "ACTIVE" : "INACTIVE") + "</span></td>" +
                '<td><div class="st-actions" data-id="' + s.userId + '">' +
                '<button data-act="status">' + (active ? "Deactivate" : "Activate") + "</button>" +
                '<button data-act="reset">Reset password</button>' +
                '<button data-act="delete" class="danger">Delete</button></div></td></tr>';
        }).join("");
    }

    function load() {
        api("GET", API).then(function (list) { staff = list || []; render(); })
            .catch(function (e) {
                $("#staffBody").innerHTML = '<tr><td colspan="8" class="st-empty">' + esc(e.message) + "</td></tr>";
            });
    }

    function onAction(e) {
        var btn = e.target.closest("button[data-act]");
        if (!btn) return;
        var id = btn.parentNode.dataset.id;
        var s = staff.filter(function (x) { return String(x.userId) === id; })[0];
        if (!s) return;
        var act = btn.dataset.act;

        if (act === "status") {
            var next = (s.status || "").toUpperCase() === "ACTIVE" ? "INACTIVE" : "ACTIVE";
            if (next === "INACTIVE" && !confirm("Deactivate " + s.name + "? They won't be able to log in.")) return;
            btn.disabled = true;
            api("PUT", API + "/" + id + "/status", {status: next})
                .then(function () { showAlert(s.name + " is now " + next.toLowerCase() + ".", "ok"); load(); })
                .catch(function (err) { showAlert(err.message); btn.disabled = false; });
        }
        if (act === "reset") {
            var pw = prompt("New password for " + s.name + " (8+ chars, letters and numbers):", genPassword());
            if (pw === null) return;
            pw = pw.trim();
            if (!validPassword(pw)) { showAlert("Password must be 8-45 characters with letters and numbers."); return; }
            btn.disabled = true;
            api("PUT", API + "/" + id + "/password", {password: pw})
                .then(function (u) { showAlert("Password reset for " + s.name + ".", "ok"); showCredentials(u, pw); btn.disabled = false; })
                .catch(function (err) { showAlert(err.message); btn.disabled = false; });
        }
        if (act === "delete") {
            if (!confirm("Delete " + s.name + "'s account permanently?")) return;
            btn.disabled = true;
            api("DELETE", API + "/" + id)
                .then(function () { showAlert(s.name + "'s account was deleted.", "ok"); load(); })
                .catch(function (err) { showAlert(err.message); btn.disabled = false; });
        }
    }

    function onSubmit(e) {
        e.preventDefault();
        hideAlert();
        var f = {
            name: $("#stName").value.trim(),
            email: $("#stEmail").value.trim(),
            phone: $("#stPhone").value.trim(),
            nic: $("#stNic").value.trim(),
            username: $("#stUsername").value.trim(),
            password: $("#stPassword").value.trim(),
            address: $("#stAddress").value.trim()
        };
        var errs = [];
        function bad(id, msg) { errs.push(msg); $(id).classList.add("invalid"); }
        if (!f.name) bad("#stName", "Name is required.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) bad("#stEmail", "Enter a valid email.");
        if (!/^0\d{9}$/.test(f.phone)) bad("#stPhone", "Phone must be 10 digits starting with 0.");
        if (f.nic && !/^(\d{9}[VvXx]|\d{12})$/.test(f.nic)) bad("#stNic", "NIC must be 9 digits + V/X or 12 digits.");
        if (!validPassword(f.password)) bad("#stPassword", "Password must be 8-45 characters with letters and numbers.");
        if (errs.length) { showAlert(errs.join(" ")); return; }

        var btn = $("#staffSubmit");
        btn.disabled = true;
        btn.textContent = "Creating...";
        api("POST", API, f)
            .then(function (u) {
                showAlert("Staff account created for " + u.name + ". Share the credentials on the right.", "ok");
                showCredentials(u, f.password);
                $("#staffForm").reset();
                $("#stPassword").value = genPassword();
                load();
            })
            .catch(function (err) { showAlert(err.message); })
            .then(function () { btn.disabled = false; btn.textContent = "＋ Create staff account"; });
    }

    document.addEventListener("DOMContentLoaded", function () {
        alertBox = $("#staffAlert");
        $("#stPassword").value = genPassword();
        $("#genPw").onclick = function () { $("#stPassword").value = genPassword(); $("#stPassword").classList.remove("invalid"); };
        $("#staffForm").addEventListener("submit", onSubmit);
        $("#staffForm").addEventListener("input", function (e) { if (e.target.classList) e.target.classList.remove("invalid"); });
        $("#staffBody").addEventListener("click", onAction);
        $("#staffSearch").addEventListener("input", render);
        $("#staffRefresh").onclick = load;
        $("#copyCred").onclick = function () {
            var text = "Explore Lanka - Admin login\n" +
                "Login page: " + $("#credUrl").textContent + "\n" +
                "Email: " + $("#credEmail").textContent + "\n" +
                ($("#credUser").textContent ? "Username: " + $("#credUser").textContent + "\n" : "") +
                "Password: " + $("#credPass").textContent;
            var done = function () { $("#copyCred").textContent = "Copied ✓"; setTimeout(function () { $("#copyCred").textContent = "Copy credentials"; }, 1500); };
            if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done);
            else { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); done(); }
        };
        load();
    });
})();

/* Notifications and profile pages - shared by the customer and management portals (data-page / data-kind on <body>). */
(async function () {
    const { $, $$, esc, fmt, icon, api } = EL;
    const which = document.body.dataset.page;
    const kind = document.body.dataset.kind;
    const user = await EL.portal({ kind, active: which, title: which === "profile" ? "My Profile" : "Notifications" });
    const page = $("#page");

    const TYPE_ICON = { BOOKING: "calendar", PAYMENT: "card", ALLOCATION: "route", SCHEDULE: "bed", PROMOTION: "tag", EVENT: "festival", RATE: "handshake", FEEDBACK: "message", SYSTEM: "bell" };

    async function notifications() {
        page.innerHTML = '<div class="page-intro"><p>Booking confirmations, reminders and updates.</p><button class="btn ghost" id="readAll">' + icon("check", 16) + " Mark all as read</button></div><div class=\"card\" id=\"list\" style=\"padding:6px 0\"></div>";
        const list = await api("/api/notifications");
        $("#list").innerHTML = list.length ? list.map((n) => '<div class="row" data-id="' + n.id + '" data-link="' + esc(n.link || "") + '" style="gap:14px;padding:14px 20px;border-bottom:1px solid var(--line-2);cursor:pointer;align-items:flex-start;background:' + (n.read ? "transparent" : "#FCF7EE") + '">' +
            '<div class="avatar" style="background:' + (n.read ? "var(--line-2)" : "var(--brown-50)") + ';color:var(--brown)">' + icon(TYPE_ICON[n.type] || "bell", 16) + '</div><div class="grow"><div class="row between"><b style="font-weight:' + (n.read ? 500 : 700) + '">' + esc(n.title) + '</b><span class="small muted nowrap">' + fmt.ago(n.createdAt) + '</span></div><div class="small" style="color:var(--ink-2)">' + esc(n.message) + "</div></div></div>").join("")
            : EL.emptyState("You're all caught up - no notifications.", "bell");
        $$("[data-id]").forEach((row) => row.addEventListener("click", async () => {
            await api("/api/notifications/" + row.dataset.id + "/read", { method: "POST" }).catch(() => { });
            if (row.dataset.link) location.href = row.dataset.link; else notifications();
            EL.refreshBell();
        }));
        $("#readAll").addEventListener("click", async () => { await api("/api/notifications/read-all", { method: "POST" }); EL.refreshBell(); notifications(); });
    }

    async function profile() {
        const p = await api("/api/profile");
        const isCustomer = user.role === "CUSTOMER";
        page.innerHTML = '<div class="grid grid-2" style="align-items:start"><form class="card" id="pf"><div class="row" style="gap:14px;margin-bottom:16px"><div class="avatar" style="width:64px;height:64px;font-size:1.3rem">' + esc(EL.initials(p.user.fullName)) + "</div><div><h3 style=\"margin:0\">" + esc(p.user.fullName) +
            '</h3><div class="small muted">' + esc(p.user.email) + " · " + esc(p.user.roleName) + (p.user.supplierName ? " · " + esc(p.user.supplierName) : "") + '</div><div class="small muted">Member since ' + fmt.date(p.user.createdAt) + "</div></div></div>" +
            '<h3>Personal info</h3><div class="form-grid">' +
            EL.field({ name: "fullName", label: "Full name", required: true, attrs: { pattern: EL.PATTERNS.name, "data-msg": "Letters and spaces only", maxlength: 100 } }) +
            EL.field({ name: "phone", label: "Phone", attrs: { pattern: EL.PATTERNS.phone, "data-msg": "e.g. 0771234567", inputmode: "tel" } }) +
            (isCustomer ? EL.field({ name: "country", label: "Country", type: "select", placeholder: "Select", options: EL.COUNTRIES }) +
                EL.field({ name: "nationality", label: "Nationality", attrs: { maxlength: 60 } }) +
                EL.field({ name: "dateOfBirth", label: "Date of birth", type: "date", attrs: { max: EL.iso(EL.addDays(new Date(), -1)) } }) +
                EL.field({ name: "address", label: "Address", attrs: { maxlength: 255 } }) +
                EL.field({ name: "travelPreferences", label: "Travel preferences", type: "textarea", full: true, placeholder: "e.g. wildlife, vegetarian meals, accessible rooms", attrs: { maxlength: 500 } }) +
                '<label class="check full"><input type="checkbox" name="marketingConsent"> Send me promotional offers and festival news. You can opt out at any time.</label>' : "") +
            '</div><div class="form-actions"><button class="btn" type="submit">Update profile</button></div></form>' +
            '<div class="stack"><form class="card" id="pw"><h3>Change password</h3><div class="stack">' +
            EL.field({ name: "currentPassword", label: "Current password", type: "password", required: true, attrs: { autocomplete: "current-password" } }) +
            EL.field({ name: "newPassword", label: "New password", type: "password", required: true, hint: "8+ characters with upper-case, lower-case and a number", attrs: { pattern: EL.PATTERNS.password, "data-msg": "8+ characters with upper-case, lower-case and a number", autocomplete: "new-password" } }) +
            EL.field({ name: "confirmPassword", label: "Confirm new password", type: "password", required: true, attrs: { "data-match": "newPassword", "data-msg": "Passwords do not match", autocomplete: "new-password" } }) +
            '</div><div class="form-actions"><button class="btn outline" type="submit">Change password</button></div></form>' +
            '<div class="card"><h3>' + icon("shield") + ' Your data & privacy</h3><p class="small muted">Explore Lanka stores only what is needed to run your trips. Passport numbers are shown masked to staff, payment cards are never stored (only the last four digits), and partners only see the bookings assigned to them. Passwords are encrypted with BCrypt.</p></div></div></div>';
        const pf = $("#pf");
        EL.fill(pf, Object.assign({ fullName: p.user.fullName, phone: p.user.phone }, p));
        EL.bindForm(pf, async (d) => {
            await api("/api/profile", { method: "PUT", body: d });
            EL.me(true);
            EL.toast("Profile updated", "success");
        });
        EL.bindForm($("#pw"), async (d, form) => {
            await api("/api/profile/password", { method: "PUT", body: d });
            form.reset();
            EL.toast("Password changed", "success");
        });
    }

    try { await (which === "profile" ? profile() : notifications()); } catch (e) { EL.toastError(e); }
})();

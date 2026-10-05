/* User & Role Management (System Administrator). */
(async function () {
    const { $, esc, fmt, icon, api, badge, ROLE } = EL;
    const me = await EL.portal({ kind: "admin", active: "users", title: "Users & Roles", roles: [ROLE.ADMIN] });
    const page = $("#page");
    page.innerHTML = '<div class="page-intro"><p>Create staff and partner accounts, assign roles and deactivate access. Customers register themselves on the public website.</p><button class="btn" id="add">' + icon("plus", 16) + " Add user</button></div>" +
        '<div class="card toolbar"><input class="search grow" id="q" placeholder="Search name or email"><select id="fr"><option value="">All roles</option></select></div><div id="list"></div>';
    const [roles, suppliers] = await Promise.all([api("/api/admin/users/roles"), api("/api/admin/suppliers")]);
    roles.forEach((r) => $("#fr").insertAdjacentHTML("beforeend", '<option value="' + r.value + '">' + esc(r.label) + "</option>"));

    async function load() {
        const users = await api("/api/admin/users", { query: { role: $("#fr").value, q: $("#q").value } });
        EL.table($("#list"), [
            { label: "Name", render: (u) => '<div class="row" style="gap:10px;flex-wrap:nowrap"><span class="avatar">' + esc(EL.initials(u.fullName)) + "</span><div><b>" + esc(u.fullName) + '</b><div class="small muted">' + esc(u.email) + "</div></div></div>" },
            { label: "Role", render: (u) => esc(u.roleName) + (u.supplierName ? '<div class="small muted">' + esc(u.supplierName) + "</div>" : "") },
            { label: "Phone", render: (u) => esc(u.phone || "-") },
            { label: "Last login", render: (u) => u.lastLoginAt ? fmt.ago(u.lastLoginAt) : '<span class="muted small">Never</span>' },
            { label: "Status", render: (u) => badge(u.active ? "ACTIVE" : "INACTIVE") },
            { label: "", cls: "right", render: (u) => u.id === me.id ? '<span class="small muted">You</span>' : '<div class="actions">' + EL.act("edit", "edit", "Edit") + EL.act("del", "trash", "Delete", "danger") + "</div>" }
        ], users, {
            empty: "No users found", emptyIcon: "users", onRow: (u) => u.id !== me.id && edit(u),
            actions: {
                edit,
                del: async (u) => {
                    if (!(await EL.confirm("Delete " + u.fullName + "'s account? Customers with bookings must be deactivated instead.", { danger: true, ok: "Delete" }))) return;
                    try { await api("/api/admin/users/" + u.id, { method: "DELETE" }); EL.toast("User deleted", "success"); load(); } catch (e) { EL.toastError(e); }
                }
            }
        });
    }
    $("#q").addEventListener("input", EL.debounce(load, 300));
    $("#fr").addEventListener("change", load);
    $("#add").addEventListener("click", () => edit(null));

    function edit(u) {
        const form = document.createElement("form");
        form.innerHTML = '<div class="form-grid">' + EL.field({ name: "fullName", label: "Full name", required: true, attrs: { pattern: EL.PATTERNS.name, "data-msg": "Letters and spaces only" } }) +
            (u ? '<div class="field"><label>Email</label><input value="' + esc(u.email) + '" disabled></div>' : EL.field({ name: "email", label: "Email", type: "email", required: true })) +
            EL.field({ name: "phone", label: "Phone", attrs: { pattern: EL.PATTERNS.phone, "data-msg": "e.g. 0771234567" } }) +
            EL.field({ name: "role", label: "Role", type: "select", required: true, options: roles.map((r) => ({ value: r.value, label: r.label })) }) +
            EL.field({ name: "supplierId", label: "Supplier (hotel partners & transport providers)", type: "select", placeholder: "None", full: true, options: suppliers.map((s) => ({ value: s.id, label: s.name + " (" + EL.titleCase(s.type) + ")" })), attrs: { "data-type": "number" } }) +
            (u ? '<label class="check full"><input type="checkbox" name="active"> Account active (can log in)</label>'
                : EL.field({ name: "password", label: "Initial password", type: "password", required: true, full: true, hint: "8+ characters with upper-case, lower-case and a number. Ask the user to change it after first login.", attrs: { pattern: EL.PATTERNS.password, "data-msg": "8+ characters with upper-case, lower-case and a number" } })) +
            '<p class="full small muted">Tour guide accounts are linked to a guide profile on the Hotels, Vehicles & Guides page.</p></div>';
        EL.fill(form, u || { role: "TOUR_OPERATIONS_MANAGER" });
        const sync = () => { const r = form.role.value; const need = r === "HOTEL_PARTNER" || r === "TRANSPORT_PROVIDER"; form.supplierId.closest(".field").style.display = need ? "" : "none"; form.supplierId.required = need; };
        form.role.addEventListener("change", sync);
        sync();
        EL.modal({
            title: u ? "Edit " + u.fullName : "Add user", body: form, size: "lg",
            actions: [{ label: "Cancel", kind: "ghost" }, {
                label: "Save", onClick: async () => {
                    if (!EL.validate(form)) return false;
                    const d = EL.formData(form);
                    if (!(d.role === "HOTEL_PARTNER" || d.role === "TRANSPORT_PROVIDER")) d.supplierId = null;
                    await api("/api/admin/users" + (u ? "/" + u.id : ""), { method: u ? "PUT" : "POST", body: d });
                    EL.toast("User saved", "success");
                    load();
                }
            }]
        });
    }

    load().catch(EL.toastError);
})();

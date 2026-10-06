/*
 * Partner & Supplier Management (IT25102242 Nethwin S.W.S) - UC-02 Manage Service Rate.
 * Supplier records, versioned contracts, service rates with approval/versioning, performance, remove inactive suppliers.
 */
(async function () {
    const { $, $$, esc, fmt, icon, api, badge, ROLE } = EL;
    const transportView = EL.qs("type") === "TRANSPORT";   // "Transport Providers" menu item
    const user = await EL.portal({ kind: "admin", active: transportView ? "transport" : "partners", title: transportView ? "Transport Providers" : "Partners & Rates", roles: [ROLE.BM, ROLE.ADMIN] });
    const isAdmin = user.role === ROLE.ADMIN;
    const page = $("#page");
    page.innerHTML = '<div class="page-intro"><p>Hotels, transport providers and guide associations. Rate changes above 20% are sent to the System Administrator for approval; every contract and rate change is kept as a new version.</p><button class="btn" id="add">' + icon("plus", 16) + " Add supplier</button></div>" +
        '<section class="card" id="approvals"></section>' +
        '<div class="card toolbar"><input class="search grow" id="q" placeholder="Search suppliers"><select id="ft"><option value="">All types</option><option value="HOTEL">Hotel</option><option value="TRANSPORT">Transport</option><option value="TOUR_GUIDE">Tour guide</option></select><select id="fs"><option value="">All statuses</option><option>ACTIVE</option><option>INACTIVE</option></select></div><div id="list"></div>';

    let suppliers = [];
    async function load() {
        const [s, pending] = await Promise.all([api("/api/admin/suppliers"), api("/api/admin/rates/pending")]);
        suppliers = s;
        renderApprovals(pending);
        render();
    }
    function renderApprovals(pending) {
        const box = $("#approvals");
        if (!pending.length) { box.innerHTML = '<div class="row" style="gap:10px">' + icon("check") + '<span class="muted">No rate changes are waiting for approval.</span></div>'; return; }
        box.innerHTML = '<div class="card-head"><h3>' + icon("alert") + " Rate changes awaiting approval</h3>" + (isAdmin ? "" : '<span class="small muted">Only the System Administrator can approve</span>') + '</div><div id="pl"></div>';
        EL.table($("#pl"), [
            { label: "Supplier", render: (r) => "<b>" + esc(r.supplierName) + '</b><div class="small muted">' + esc(r.serviceName) + "</div>" },
            { label: "Change", render: (r) => fmt.money(r.previousAmount) + " &rarr; <b>" + fmt.money(r.amount) + '</b> <span class="badge ' + (r.changePercent > 0 ? "red" : "green") + '">' + (r.changePercent > 0 ? "+" : "") + r.changePercent + "%</span>" },
            { label: "Effective", render: (r) => fmt.date(r.effectiveFrom) },
            { label: "Requested", render: (r) => esc(r.requestedBy) + '<div class="small muted">' + fmt.dateTime(r.createdAt) + "</div>" },
            { label: "", cls: "right", render: () => isAdmin ? '<div class="actions"><button class="btn sm green" data-act="ok">Approve</button><button class="btn sm danger outline" data-act="no">Reject</button></div>' : badge("PENDING_APPROVAL") }
        ], pending, {
            actions: {
                ok: async (r) => { try { await api("/api/admin/rates/" + r.id + "/decision", { method: "POST", body: { approve: true } }); EL.toast("Rate approved and now in force", "success"); load(); } catch (e) { EL.toastError(e); } },
                no: async (r) => {
                    const note = await EL.prompt({ title: "Reject rate change", label: "Reason (shared with operations and the partner)", required: true, danger: true, ok: "Reject" });
                    if (!note) return;
                    try { await api("/api/admin/rates/" + r.id + "/decision", { method: "POST", body: { approve: false, note } }); EL.toast("Rate change rejected"); load(); } catch (e) { EL.toastError(e); }
                }
            }
        });
        if (location.hash === "#approvals") box.scrollIntoView({ behavior: "smooth" });
    }
    function render() {
        const q = $("#q").value.trim().toLowerCase();
        const rows = suppliers.filter((s) => (!q || (s.name + s.email + (s.contactPerson || "")).toLowerCase().includes(q)) && (!$("#ft").value || s.type === $("#ft").value) && (!$("#fs").value || s.status === $("#fs").value));
        EL.table($("#list"), [
            { label: "Supplier", render: (s) => "<b>" + esc(s.name) + '</b><div class="small muted">' + esc(s.contactPerson || "") + " · " + esc(s.email) + "</div>" },
            { label: "Type", render: (s) => esc(EL.titleCase(s.type)) + '<div class="small muted">' + s.resources + " resource(s)</div>" },
            { label: "Contract", render: (s) => s.contractVersion ? "v" + s.contractVersion + " · " + Number(s.commissionPercent) + '%<div class="small muted">until ' + fmt.date(s.contractEnd) + "</div>" : '<span class="muted small">None</span>' },
            { label: "Rating", render: (s) => s.ratingCount ? fmt.stars(s.averageRating) + ' <span class="small">' + s.averageRating + " (" + s.ratingCount + ")</span>" : '<span class="muted small">No ratings</span>' },
            { label: "Bookings served", cls: "right", key: "allocations" },
            { label: "Revenue", cls: "right", render: (s) => fmt.money(s.revenue) },
            { label: "Status", render: (s) => badge(s.status) + (s.pendingRates ? ' <span class="badge amber">' + s.pendingRates + " pending</span>" : "") },
            { label: "", cls: "right", render: (s) => '<div class="actions">' + EL.act("open", "eye", "Contracts & rates") + EL.act("edit", "edit", "Edit") + EL.act("toggle", s.status === "ACTIVE" ? "x" : "check", s.status === "ACTIVE" ? "Deactivate" : "Reactivate") + EL.act("del", "trash", "Remove", "danger") + "</div>" }
        ], rows, {
            empty: "No suppliers found", emptyIcon: "handshake", onRow: details,
            actions: {
                open: details, edit,
                toggle: async (s) => {
                    const status = s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                    if (status === "INACTIVE" && !(await EL.confirm("Deactivate " + s.name + "? Its hotels, vehicles or guides will no longer be offered or allocated. Upcoming bookings using them will be flagged for re-allocation.", { danger: true, ok: "Deactivate" }))) return;
                    await api("/api/admin/suppliers/" + s.id + "/status", { method: "PATCH", body: { status } }); EL.toast(s.name + " is now " + status.toLowerCase(), "success"); load();
                },
                del: async (s) => {
                    if (!(await EL.confirm("Remove " + s.name + " completely? Suppliers that served bookings must be deactivated instead.", { danger: true, ok: "Remove" }))) return;
                    try { await api("/api/admin/suppliers/" + s.id, { method: "DELETE" }); EL.toast("Supplier removed", "success"); load(); } catch (e) { EL.toastError(e); }
                }
            }
        });
    }
    ["q", "ft", "fs"].forEach((id) => $("#" + id).addEventListener("input", render));
    if (transportView) { $("#ft").value = "TRANSPORT"; $("#add").innerHTML = icon("plus", 16) + " Add transport provider"; }
    $("#add").addEventListener("click", () => edit(null));

    function edit(s) {
        const form = document.createElement("form");
        form.innerHTML = '<div class="form-grid">' + EL.field({ name: "name", label: "Supplier name", required: true, full: true, attrs: { minlength: 2, maxlength: 120 } }) +
            EL.field({ name: "type", label: "Type", type: "select", required: true, options: [{ value: "HOTEL", label: "Hotel" }, { value: "TRANSPORT", label: "Transport provider" }, { value: "TOUR_GUIDE", label: "Tour guide association" }] }) +
            EL.field({ name: "contactPerson", label: "Contact person", attrs: { pattern: EL.PATTERNS.name, "data-msg": "Letters and spaces only" } }) +
            EL.field({ name: "email", label: "Email", type: "email", required: true }) + EL.field({ name: "phone", label: "Phone", attrs: { pattern: EL.PATTERNS.phone, "data-msg": "e.g. 0112345678" } }) +
            EL.field({ name: "address", label: "Address", full: true, attrs: { maxlength: 255 } }) + EL.field({ name: "notes", label: "Notes", type: "textarea", full: true, attrs: { maxlength: 500 } }) + "</div>";
        EL.fill(form, s || { type: transportView ? "TRANSPORT" : "HOTEL" });
        EL.modal({
            title: s ? "Edit supplier" : "Add supplier", body: form, size: "lg",
            actions: [{ label: "Cancel", kind: "ghost" }, { label: "Save", onClick: async () => { if (!EL.validate(form)) return false; await api("/api/admin/suppliers" + (s ? "/" + s.id : ""), { method: s ? "PUT" : "POST", body: EL.formData(form) }); EL.toast("Supplier saved", "success"); load(); } }]
        });
    }

    async function details(s) {
        const box = document.createElement("div");
        box.innerHTML = '<div class="tabs" id="dt"><button class="active" data-t="rates">Service rates</button><button data-t="contracts">Contracts</button><button data-t="info">Details & performance</button></div><div id="dbody" style="margin-top:14px"></div>';
        EL.modal({ title: s.name, body: box, size: "xl", actions: [{ label: "Close" }] });
        const dbody = box.querySelector("#dbody");
        const showTab = (t) => { $$("#dt button", box).forEach((b) => b.classList.toggle("active", b.dataset.t === t)); ({ rates, contracts, info })[t]().catch(EL.toastError); };
        $$("#dt button", box).forEach((b) => b.addEventListener("click", () => showTab(b.dataset.t)));

        async function rates() {
            const [list, resources] = await Promise.all([api("/api/admin/suppliers/" + s.id + "/rates"), resourceOptions(s)]);
            dbody.innerHTML = '<form id="rf" class="panel"><h4>Enter / modify a service rate</h4><div class="form-grid cols-3">' +
                EL.field({ name: "serviceName", label: "Service", required: true, placeholder: "Deluxe room per night", attrs: { maxlength: 120, list: "svcList" } }) +
                EL.field({ name: "unit", label: "Unit", type: "select", required: true, options: ["PER_NIGHT", "PER_DAY", "PER_PERSON", "PER_KM", "PER_TRIP"] }) +
                EL.field({ name: "amount", label: "Rate (LKR)", type: "number", required: true, attrs: { min: 1, max: 10000000, step: "0.01" } }) +
                EL.field({ name: "effectiveFrom", label: "Effective from", type: "date", required: true, attrs: { min: EL.iso(new Date()) } }) +
                EL.field({ name: "resource", label: "Applies to resource (optional)", type: "select", placeholder: "Not linked", options: resources, hint: "Linked rates update the price used for new bookings", cls: "" }) +
                '<div class="field" style="justify-content:end"><button class="btn" type="submit">Submit rate</button></div></div><datalist id="svcList">' + [...new Set(list.map((r) => r.serviceName))].map((n) => '<option value="' + esc(n) + '">').join("") + "</datalist></form>" +
                '<h4 style="margin-top:16px">Rate history (all versions)</h4><div id="rl"></div>';
            const rf = dbody.querySelector("#rf");
            rf.effectiveFrom.value = EL.iso(new Date());
            rf.serviceName.addEventListener("change", () => {
                const cur = list.find((r) => r.serviceName.toLowerCase() === rf.serviceName.value.trim().toLowerCase() && r.status === "ACTIVE");
                if (cur) { rf.unit.value = cur.unit; rf.amount.placeholder = "Current " + cur.amount; if (cur.resourceType) rf.resource.value = cur.resourceType + ":" + cur.resourceId; }
            });
            EL.bindForm(rf, async (d) => {
                const [rt, rid] = d.resource ? d.resource.split(":") : [null, null];
                const res = await api("/api/admin/suppliers/" + s.id + "/rates", { method: "POST", body: { serviceName: d.serviceName, unit: d.unit, amount: d.amount, effectiveFrom: d.effectiveFrom, resourceType: rt, resourceId: rid ? Number(rid) : null } });
                EL.toast(res.message, res.data.status === "PENDING_APPROVAL" ? "" : "success");
                load();
                rates();
            });
            EL.table(dbody.querySelector("#rl"), [
                { label: "Service", render: (r) => "<b>" + esc(r.serviceName) + '</b><div class="small muted">v' + r.version + (r.resourceType ? " · linked to " + r.resourceType.toLowerCase() : "") + "</div>" },
                { label: "Rate", cls: "right", render: (r) => fmt.money(r.amount) + '<div class="small muted">' + EL.titleCase(r.unit) + "</div>" },
                { label: "Change", render: (r) => r.changePercent != null ? (r.changePercent > 0 ? "+" : "") + r.changePercent + '%<div class="small muted">was ' + fmt.money(r.previousAmount) + "</div>" : '<span class="muted small">First rate</span>' },
                { label: "Effective", render: (r) => fmt.date(r.effectiveFrom) },
                { label: "Status", render: (r) => badge(r.status) + (r.decisionNote ? '<div class="small muted">' + esc(r.decisionNote) + "</div>" : "") },
                { label: "By", render: (r) => '<span class="small">' + esc(r.requestedBy || "") + (r.decidedBy ? "<br>decided: " + esc(r.decidedBy) : "") + "</span>" }
            ], list, { empty: "No rates recorded yet", emptyIcon: "money" });
        }

        async function contracts() {
            const list = await api("/api/admin/suppliers/" + s.id + "/contracts");
            const active = list.find((c) => c.status === "ACTIVE");
            dbody.innerHTML = '<form id="cf" class="panel"><h4>' + (active ? "Create new contract version (v" + (list[0].version + 1) + ")" : "Create contract") + '</h4><div class="form-grid cols-3">' +
                EL.field({ name: "startDate", label: "Start date", type: "date", required: true }) + EL.field({ name: "endDate", label: "End date", type: "date", required: true, attrs: { "data-after": "startDate" } }) +
                EL.field({ name: "commissionPercent", label: "Commission (%)", type: "number", required: true, attrs: { min: 0, max: 50, step: "0.01" } }) +
                EL.field({ name: "paymentTerms", label: "Payment terms", attrs: { maxlength: 120 } }) +
                EL.field({ name: "terms", label: "Contract terms", type: "textarea", required: true, full: true, attrs: { minlength: 10, maxlength: 2000 } }) +
                '<div class="full right"><button class="btn" type="submit">Save contract</button></div></div></form><h4 style="margin-top:16px">Version history</h4><div id="cl"></div>';
            const cf = dbody.querySelector("#cf");
            EL.fill(cf, active ? { startDate: EL.iso(new Date()), endDate: active.endDate, commissionPercent: active.commissionPercent, paymentTerms: active.paymentTerms, terms: active.terms } : { startDate: EL.iso(new Date()), endDate: EL.iso(EL.addDays(new Date(), 365)) });
            EL.bindForm(cf, async (d) => {
                if (d.terms && d.terms.length < 10) { EL.handleFormError(cf, { message: "Please correct the highlighted fields", errors: { terms: "Terms must be at least 10 characters" } }); return; }
                await api("/api/admin/suppliers/" + s.id + "/contracts", { method: "POST", body: d });
                EL.toast("Contract version saved", "success");
                load();
                contracts();
            });
            EL.table(dbody.querySelector("#cl"), [
                { label: "Version", render: (c) => "<b>v" + c.version + "</b>" },
                { label: "Valid", render: (c) => fmt.date(c.startDate) + " - " + fmt.date(c.endDate) },
                { label: "Commission", render: (c) => Number(c.commissionPercent) + "%" },
                { label: "Terms", render: (c) => '<span class="small">' + esc(c.terms) + "</span>" },
                { label: "Status", render: (c) => badge(c.status) },
                { label: "Created", render: (c) => '<span class="small">' + esc(c.createdBy || "") + "<br>" + fmt.date(c.createdAt) + "</span>" }
            ], list, { empty: "No contracts yet", emptyIcon: "handshake" });
        }

        async function info() {
            const x = await api("/api/admin/suppliers/" + s.id);
            dbody.innerHTML = '<div class="grid grid-2"><dl class="kv"><dt>Type</dt><dd>' + EL.titleCase(x.type) + "</dd><dt>Contact</dt><dd>" + esc(x.contactPerson || "-") + "</dd><dt>Email</dt><dd>" + esc(x.email) + "</dd><dt>Phone</dt><dd>" + esc(x.phone || "-") +
                "</dd><dt>Address</dt><dd>" + esc(x.address || "-") + "</dd><dt>Status</dt><dd>" + badge(x.status) + "</dd><dt>Notes</dt><dd>" + esc(x.notes || "-") + "</dd></dl>" +
                '<div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat"><div class="ico">' + icon("star") + "</div><div><b>" + (x.averageRating || "-") + "</b><span>Average rating (" + x.ratingCount + ")</span></div></div>" +
                '<div class="stat green"><div class="ico">' + icon("calendar") + "</div><div><b>" + x.allocations + "</b><span>Bookings served</span></div></div>" +
                '<div class="stat gold"><div class="ico">' + icon("money") + "</div><div><b>" + fmt.money(x.revenue) + "</b><span>Revenue generated</span></div></div>" +
                '<div class="stat"><div class="ico">' + icon("bed") + "</div><div><b>" + x.resources + "</b><span>Resources</span></div></div></div></div>";
        }
        showTab("rates");
    }

    async function resourceOptions(s) {
        const path = { HOTEL: "hotels", TRANSPORT: "vehicles", TOUR_GUIDE: "guides" }[s.type];
        const type = { HOTEL: "HOTEL", TRANSPORT: "VEHICLE", TOUR_GUIDE: "GUIDE" }[s.type];
        const list = await api("/api/admin/resources/" + path).catch(() => []);
        return list.filter((r) => r.supplierId === s.id).map((r) => ({ value: type + ":" + r.id, label: r.name || r.label || r.fullName }));
    }

    load().catch(EL.toastError);
})();

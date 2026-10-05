/*
 * Event & Festival Information Management (IT25100579 Jayasena J.A.D.K) - UC-04 Create Event.
 * Validation (4a), max participants (5), clash check (6a, server), submit/publish (7) or save as draft (7a).
 */
(async function () {
    const { $, $$, esc, fmt, icon, api, badge, ROLE } = EL;
    await EL.portal({ kind: "admin", active: "events", title: "Events & Festivals", roles: [ROLE.EVT, ROLE.ADMIN] });
    const page = $("#page");
    page.innerHTML = '<div class="page-intro"><p>Publish Sri Lankan festivals and cultural events, link them to tours and monitor registrations. Past events expire automatically every night.</p><button class="btn" id="add">' + icon("plus", 16) + " Create new event</button></div>" +
        '<div class="card toolbar"><input class="search grow" id="q" placeholder="Search events"><select id="fStatus"><option value="">All statuses</option><option>PUBLISHED</option><option>DRAFT</option><option>DEACTIVATED</option><option>EXPIRED</option></select><select id="fRegion"><option value="">All regions</option></select></div><div id="list"></div>';
    EL.REGIONS.forEach((r) => $("#fRegion").insertAdjacentHTML("beforeend", "<option>" + r + "</option>"));

    let all = [];
    let packages = [];
    async function load() { [all, packages] = await Promise.all([api("/api/admin/events"), packages.length ? packages : api("/api/admin/packages/options")]); render(); }
    function render() {
        const q = $("#q").value.trim().toLowerCase();
        const rows = all.filter((e) => (!q || (e.name + e.location).toLowerCase().includes(q)) && (!$("#fStatus").value || e.status === $("#fStatus").value) && (!$("#fRegion").value || e.region === $("#fRegion").value));
        EL.table($("#list"), [
            { label: "Event", render: (e) => "<b>" + esc(e.name) + '</b><div class="small muted">' + esc(EL.titleCase(e.category)) + " · " + esc(e.location) + "</div>" },
            { label: "Region", key: "region" },
            { label: "When", render: (e) => '<span class="nowrap">' + (e.startDate === e.endDate ? fmt.date(e.startDate) : fmt.short(e.startDate) + " - " + fmt.date(e.endDate)) + '</span><div class="small muted">' + fmt.time(e.startTime) + "-" + fmt.time(e.endTime) + "</div>" },
            { label: "Registrations", render: (e) => { const p = Math.min(100, Math.round(e.registered * 100 / e.maxParticipants)); return '<div class="small">' + e.registered + " / " + e.maxParticipants + '</div><div class="progress ' + (p >= 100 ? "full" : p > 80 ? "warn" : "") + '" style="width:110px"><i style="width:' + p + '%"></i></div>'; } },
            { label: "Status", render: (e) => badge(e.status) },
            { label: "", cls: "right", render: (e) => '<div class="actions">' + EL.act("regs", "users", "Registrations") + EL.act("edit", "edit", "Edit") +
                (e.status === "PUBLISHED" ? EL.act("deact", "eye", "Deactivate") : e.status !== "EXPIRED" ? EL.act("pub", "check", "Publish") : "") + EL.act("del", "trash", "Delete", "danger") + "</div>" }
        ], rows, {
            empty: "No events found", emptyIcon: "festival", onRow: edit,
            actions: {
                edit, regs: registrations,
                pub: async (e) => { try { await api("/api/admin/events/" + e.id + "/publish", { method: "POST" }); EL.toast("Event published - now visible to customers", "success"); load(); } catch (err) { EL.toastError(err); } },
                deact: async (e) => {
                    if (!(await EL.confirm("Deactivate " + e.name + "? It will be hidden from customers and registered tourists will be notified.", { danger: true, ok: "Deactivate" }))) return;
                    await api("/api/admin/events/" + e.id + "/deactivate", { method: "POST" }); EL.toast("Event deactivated"); load();
                },
                del: async (e) => {
                    if (!(await EL.confirm("Delete " + e.name + " permanently?" + (e.registered ? " " + e.registered + " registered people will be notified." : ""), { danger: true, ok: "Delete" }))) return;
                    await api("/api/admin/events/" + e.id, { method: "DELETE" }); EL.toast("Event deleted"); load();
                }
            }
        });
    }
    ["q", "fStatus", "fRegion"].forEach((id) => $("#" + id).addEventListener("input", render));
    $("#add").addEventListener("click", () => edit(null));

    function edit(e) {
        const form = document.createElement("form");
        const today = EL.iso(new Date());
        form.innerHTML = '<div class="form-grid">' +
            EL.field({ name: "name", label: "Event name", required: true, full: true, attrs: { minlength: 3, maxlength: 120 } }) +
            EL.field({ name: "category", label: "Category", type: "select", required: true, placeholder: "Select", options: EL.EVENT_CATEGORIES }) +
            EL.field({ name: "region", label: "Region", type: "select", required: true, placeholder: "Select", options: EL.REGIONS }) +
            EL.field({ name: "location", label: "Location / venue", required: true, full: true, placeholder: "Temple of the Tooth, Kandy", hint: "Used to detect scheduling clashes", attrs: { maxlength: 150 } }) +
            EL.field({ name: "startDate", label: "Start date", type: "date", required: true, attrs: e ? {} : { min: today } }) +
            EL.field({ name: "endDate", label: "End date", type: "date", required: true, attrs: { "data-after": "startDate" } }) +
            EL.field({ name: "startTime", label: "Start time", type: "time", required: true }) +
            EL.field({ name: "endTime", label: "End time", type: "time", required: true }) +
            EL.field({ name: "maxParticipants", label: "Maximum participants", type: "number", required: true, attrs: { min: 1, max: 100000 } }) +
            EL.field({ name: "ticketPrice", label: "Ticket price (LKR, 0 = free)", type: "number", required: true, attrs: { min: 0, step: "0.01" } }) +
            EL.field({ name: "dressCode", label: "Dress code", full: true, placeholder: "Modest clothing - shoulders and knees covered", attrs: { maxlength: 150 } }) +
            EL.field({ name: "description", label: "Description", type: "textarea", full: true, attrs: { maxlength: 2000 } }) +
            EL.imageField({ name: "imageUrl", label: "Event image" }) +
            '<div class="field full"><label>Link to tour packages</label><div class="panel" style="max-height:150px;overflow:auto;display:grid;gap:4px">' +
            packages.map((p) => '<label class="check"><input type="checkbox" name="packageIds" data-multi data-type="number" value="' + p.id + '"> ' + esc(p.name) + ' <span class="muted small">(' + esc(p.region) + ")</span></label>").join("") + "</div></div></div>";
        EL.fill(form, e ? Object.assign({}, e, { packageIds: e.linkedPackages.map((p) => p.id) }) : { startTime: "18:00", endTime: "22:00", maxParticipants: 200, ticketPrice: 0 });
        EL.bindImageFields(form);
        const save = (publish) => async () => {
            if (!EL.validate(form)) return false;
            const d = EL.formData(form);
            if (d.startDate === d.endDate && d.endTime <= d.startTime) { EL.handleFormError(form, { message: "Please correct the highlighted fields", errors: { endTime: "End time must be after the start time" } }); return false; }
            d.publish = publish;
            await api("/api/admin/events" + (e ? "/" + e.id : ""), { method: e ? "PUT" : "POST", body: d });
            EL.toast(publish ? "Event saved and published" : "Event saved as draft", "success");
            load();
        };
        EL.modal({
            title: e ? "Edit event" : "Create new event", body: form, size: "lg", sticky: true,
            actions: [{ label: "Cancel", kind: "ghost" }, { label: e && e.status === "PUBLISHED" ? "Save" : "Save as draft", kind: "outline", onClick: save(e ? e.status === "PUBLISHED" : false) },
                ...(e && e.status === "PUBLISHED" ? [] : [{ label: icon("check", 16) + " Submit & publish", kind: "green", onClick: save(true) }])]
        });
    }

    async function registrations(e) {
        const list = await api("/api/admin/events/" + e.id + "/registrations");
        const box = document.createElement("div");
        box.innerHTML = '<div class="row between" style="margin-bottom:10px"><span>' + e.registered + " of " + e.maxParticipants + " places taken</span><b>" + e.spotsLeft + " left</b></div><div id=\"rl\"></div>";
        EL.table(box.querySelector("#rl"), [
            { label: "Customer", render: (r) => esc(r.customerName) + '<div class="small muted">' + esc(r.customerEmail) + "</div>" },
            { label: "Places", key: "participants" },
            { label: "Registered", render: (r) => fmt.dateTime(r.createdAt) },
            { label: "Status", render: (r) => badge(r.status) }
        ], list, { empty: "No registrations yet", emptyIcon: "users" });
        EL.modal({ title: "Registrations · " + e.name, body: box, size: "lg", actions: [{ label: "Close" }] });
    }

    load().catch(EL.toastError);
})();

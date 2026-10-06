/*
 * Logistic partner portal (IT25103206 Kodagoda O.I)
 *  Hotel partner      - UC-03 Update Hotel Schedule Manually + booking notifications (PBI-09, PBI-12)
 *  Transport provider - vehicle choices and unavailable days (PBI-11)
 *  Tour guide         - assigned tours, route plan and manual waypoints (PBI-10)
 */
(async function () {
    const { $, $$, esc, fmt, icon, api, badge, ROLE } = EL;
    const user = await EL.portal({ kind: "admin", active: "schedule", title: "My Schedule", roles: EL.PARTNERS });
    const page = $("#page");
    const r = user.role;

    const tabs = r === ROLE.HOTEL ? [["schedule", "Room availability"], ["bookings", "Guest bookings"], ["agreement", "Contract & rates"]]
        : r === ROLE.TRANSPORT ? [["vehicles", "My vehicles"], ["bookings", "Trips"], ["agreement", "Contract & rates"]]
            : [["tours", "My tours"], ["availability", "Unavailable days"]];
    page.innerHTML = '<div class="page-intro"><p>' + esc(user.supplierName ? user.supplierName + " · " : "") + esc(user.roleName) + ' portal. Changes here sync immediately with the central booking system.</p></div>' +
        '<div class="tabs" id="tabs">' + tabs.map(([k, l], i) => '<button data-t="' + k + '" class="' + (i === 0 ? "active" : "") + '">' + l + "</button>").join("") + '</div><div id="body" class="stack"></div>';
    $$("#tabs button").forEach((b) => b.addEventListener("click", () => { $$("#tabs button").forEach((x) => x.classList.toggle("active", x === b)); show(b.dataset.t); }));
    const body = () => $("#body");

    async function show(t) {
        body().innerHTML = '<div class="card">' + EL.skeleton(3) + "</div>";
        try { await ({ schedule, bookings, agreement, vehicles, tours, availability })[t](); } catch (e) { body().innerHTML = '<div class="card">' + EL.emptyState(e.message, "alert") + "</div>"; }
    }

    // ------------------------------------------------------------------ UC-03 hotel schedule
    async function schedule() {
        const hotels = await api("/api/partner/hotels");
        if (!hotels.length) { body().innerHTML = '<div class="card">' + EL.emptyState("No hotels are linked to your company yet.", "bed") + "</div>"; return; }
        const today = EL.iso(new Date());
        body().innerHTML = '<div class="grid" style="grid-template-columns:minmax(0,1fr) 340px;align-items:start" id="sg"><section class="card"><div class="card-head"><h3>Availability calendar</h3><div class="row"><select id="hotel" style="width:auto">' +
            hotels.map((h) => '<option value="' + h.id + '">' + esc(h.name) + "</option>").join("") + '</select><input type="date" id="from" value="' + today + '" min="' + today + '" style="width:auto"></div></div><div id="cal"></div></section>' +
            '<form class="card" id="upd"><h3>Update schedule</h3><p class="small muted">Select dates and enter the rooms you can offer Explore Lanka per night.</p><div class="stack">' +
            EL.field({ name: "startDate", label: "From", type: "date", required: true, attrs: { min: today } }) +
            EL.field({ name: "endDate", label: "To", type: "date", required: true, attrs: { min: today, "data-after": "startDate" } }) +
            EL.field({ name: "availableRooms", label: "Available rooms per night", type: "number", required: true, attrs: { min: 0, max: 500 }, hint: "Enter 0 to close the dates" }) +
            '</div><div class="form-actions"><button class="btn green" type="submit">Submit schedule update</button></div></form></div>';
        if (window.matchMedia("(max-width: 900px)").matches) $("#sg").style.gridTemplateColumns = "1fr";
        const draw = async () => {
            const from = $("#from").value || today;
            const days = await api("/api/partner/hotels/" + $("#hotel").value + "/calendar", { query: { from, to: EL.iso(EL.addDays(new Date(from), 41)) } });
            $("#cal").innerHTML = ResourceWidgets.calendarHtml(days);
        };
        $("#hotel").addEventListener("change", draw);
        $("#from").addEventListener("change", draw);
        EL.bindForm($("#upd"), async (d, f) => {
            try {
                const res = await api("/api/partner/hotels/" + $("#hotel").value + "/availability", { method: "PUT", body: d });
                EL.toast(res.message, "success");
                f.reset();
                $("#from").value = d.startDate;
                draw();
            } catch (e) {
                if (e.status === 409) { EL.formAlert(f, e.message, e.details); return; }   // 5a booking conflict
                throw e;
            }
        });
        await draw();
    }

    // ------------------------------------------------------------------ assignments (hotel guests / transport trips)
    async function bookings() {
        const list = await api("/api/partner/assignments");
        body().innerHTML = '<section class="card"><div class="card-head"><h3>' + (r === ROLE.HOTEL ? "Upcoming guest bookings" : "Upcoming trips") + '</h3><span class="small muted">You are notified as soon as a booking is allocated to you</span></div><div id="al"></div></section>';
        EL.table($("#al"), [
            { label: "Booking", render: (a) => "<b>" + esc(a.reference) + '</b><div class="small muted">' + esc(a.packageName) + "</div>" },
            { label: r === ROLE.HOTEL ? "Hotel" : "Vehicle", render: (a) => esc(a.resourceName) },
            { label: "Dates", render: (a) => fmt.short(a.startDate) + " - " + fmt.date(a.endDate) },
            { label: r === ROLE.HOTEL ? "Rooms / guests" : "Passengers", render: (a) => (r === ROLE.HOTEL ? a.quantity + " room(s) · " : "") + a.travellers + " guest(s)" },
            { label: "Lead traveller", render: (a) => esc(a.leadTraveller) + (a.contactPhone ? '<div class="small muted">' + esc(a.contactPhone) + "</div>" : "") },
            { label: "Requests", render: (a) => '<span class="small">' + esc(a.specialRequests || "-") + "</span>" }
        ], list, { empty: "No upcoming bookings", emptyIcon: "calendar" });
    }

    // ------------------------------------------------------------------ contract & rates (view updated contract terms)
    async function agreement() {
        const a = await api("/api/partner/agreement");
        const c = a.contract;
        body().innerHTML = '<div class="grid grid-2" style="align-items:start"><section class="card"><h3>Current contract</h3>' + (c ? '<dl class="kv"><dt>Version</dt><dd>' + c.version + "</dd><dt>Valid</dt><dd>" + fmt.date(c.startDate) + " - " + fmt.date(c.endDate) +
            "</dd><dt>Commission</dt><dd>" + Number(c.commissionPercent) + "%</dd><dt>Payment terms</dt><dd>" + esc(c.paymentTerms || "-") + '</dd></dl><p class="small" style="margin-top:12px">' + esc(c.terms) + "</p>" : EL.emptyState("No active contract", "handshake")) + "</section>" +
            '<section class="card"><h3>Service rates</h3><div id="rt"></div></section></div>';
        EL.table($("#rt"), [
            { label: "Service", render: (x) => esc(x.serviceName) + '<div class="small muted">v' + x.version + " · from " + fmt.date(x.effectiveFrom) + "</div>" },
            { label: "Rate", cls: "right", render: (x) => fmt.money(x.amount) + '<div class="small muted">' + EL.titleCase(x.unit) + "</div>" },
            { label: "Status", render: (x) => badge(x.status) }
        ], a.rates, { empty: "No rates agreed yet", emptyIcon: "money" });
    }

    // ------------------------------------------------------------------ transport: vehicles (PBI-11)
    async function vehicles() {
        const list = await api("/api/partner/vehicles");
        body().innerHTML = '<section class="card"><div class="card-head"><h3>Vehicle choices offered to tourists</h3><button class="btn sm" id="addV">' + icon("plus", 14) + ' Add vehicle</button></div><div id="vl"></div></section>';
        EL.table($("#vl"), [
            { label: "Vehicle", render: (v) => "<b>" + esc(v.model) + '</b><div class="small muted">' + esc(v.registrationNo) + " · " + EL.titleCase(v.type) + "</div>" },
            { label: "Seats", cls: "right", key: "seats" },
            { label: "Driver", render: (v) => esc(v.driverName || "-") },
            { label: "Price / day", cls: "right", render: (v) => fmt.money(v.pricePerDay) },
            { label: "Status", render: (v) => badge(v.active ? "ACTIVE" : "INACTIVE") },
            { label: "", cls: "right", render: () => '<div class="actions">' + EL.act("blk", "calendar", "Unavailable days") + EL.act("edit", "edit", "Edit") + "</div>" }
        ], list, { empty: "No vehicles yet", emptyIcon: "truck", onRow: editVehicle, actions: { edit: editVehicle, blk: (v) => ResourceWidgets.blockedDatesModal("/api/partner", "VEHICLE", v.id, v.model) } });
        $("#addV").addEventListener("click", () => editVehicle(null));
    }
    function editVehicle(v) {
        const form = document.createElement("form");
        form.innerHTML = '<div class="form-grid">' + EL.field({ name: "model", label: "Model", required: true, attrs: { maxlength: 80 } }) +
            EL.field({ name: "type", label: "Type", type: "select", required: true, options: ["CAR", "SUV", "VAN", "MINI_COACH", "COACH", "TUK_TUK"] }) +
            EL.field({ name: "registrationNo", label: "Registration no.", required: true, placeholder: "CAB-1234", attrs: { pattern: "[A-Za-z]{2,3}[\\- ]?[A-Za-z]{0,3}[\\- ]?[0-9]{4}", "data-msg": "e.g. CAB-1234" } }) +
            EL.field({ name: "seats", label: "Passenger seats", type: "number", required: true, attrs: { min: 1, max: 60 }, hint: "Validated against the vehicle type" }) +
            EL.field({ name: "pricePerDay", label: "Price per day (LKR)", type: "number", required: true, attrs: { min: 1000, step: "0.01" } }) +
            EL.field({ name: "driverName", label: "Driver name", attrs: { pattern: EL.PATTERNS.name, "data-msg": "Letters and spaces only" } }) +
            '<label class="check"><input type="checkbox" name="airConditioned"> Air conditioned</label><label class="check"><input type="checkbox" name="active"> Available for bookings</label></div>';
        EL.fill(form, v || { active: true, airConditioned: true, type: "VAN" });
        EL.modal({
            title: v ? "Edit vehicle" : "Add vehicle", body: form, size: "lg",
            actions: [{ label: "Cancel", kind: "ghost" }, {
                label: "Save", onClick: async () => {
                    if (!EL.validate(form)) return false;
                    const d = EL.formData(form);
                    d.registrationNo = d.registrationNo.toUpperCase();
                    await api("/api/partner/vehicles" + (v ? "/" + v.id : ""), { method: v ? "PUT" : "POST", body: d });
                    EL.toast("Vehicle saved", "success");
                    vehicles();
                }
            }]
        });
    }

    // ------------------------------------------------------------------ tour guide (PBI-10)
    async function tours() {
        const [g, list] = await Promise.all([api("/api/partner/guide"), api("/api/partner/assignments")]);
        body().innerHTML = '<section class="card row" style="gap:16px"><div class="avatar" style="width:56px;height:56px;font-size:1.2rem">' + esc(EL.initials(g.fullName)) + '</div><div class="grow"><h3 style="margin:0">' + esc(g.fullName) + '</h3><div class="small muted">Licence ' + esc(g.licenseNo) + " · " + esc(g.languages) + " · " + g.experienceYears + " years · " + esc(g.specialization || "") + "</div></div></section>" +
            '<section class="card"><div class="card-head"><h3>Assigned tours</h3><span class="small muted">No GPS - follow the planned route and add waypoints for your group</span></div><div id="tl"></div></section>';
        EL.table($("#tl"), [
            { label: "Booking", render: (a) => "<b>" + esc(a.reference) + '</b><div class="small muted">' + esc(a.packageName) + "</div>" },
            { label: "Dates", render: (a) => fmt.short(a.startDate) + " - " + fmt.date(a.endDate) },
            { label: "Group", render: (a) => a.travellers + " traveller(s)" + (a.guideLanguage ? '<div class="small muted">' + esc(a.guideLanguage) + "</div>" : "") },
            { label: "Lead traveller", render: (a) => esc(a.leadTraveller) },
            { label: "", cls: "right", render: () => '<div class="actions">' + EL.act("route", "route", "View route") + EL.act("wp", "plus", "Add waypoint") + "</div>" }
        ], list, {
            empty: "No tours assigned yet", emptyIcon: "route", onRow: (a) => BookingViews.showItinerary(a.bookingId),
            actions: { route: (a) => BookingViews.showItinerary(a.bookingId), wp: addWaypoint }
        });
    }
    function addWaypoint(a) {
        const days = Math.round((new Date(a.endDate) - new Date(a.startDate)) / 86400000) + 1;
        const form = document.createElement("form");
        form.innerHTML = '<div class="form-grid">' + EL.field({ name: "dayNumber", label: "Day", type: "number", required: true, attrs: { min: 1, max: days }, hint: "1 to " + days }) +
            EL.field({ name: "title", label: "Stop", required: true, placeholder: "Tea factory visit", attrs: { maxlength: 150 } }) +
            EL.field({ name: "location", label: "Location", attrs: { maxlength: 80 } }) + EL.field({ name: "route", label: "Route", placeholder: "Ella -> Demodara", attrs: { maxlength: 300 } }) +
            EL.field({ name: "description", label: "Notes for the group", type: "textarea", full: true, attrs: { maxlength: 1000 } }) + "</div>";
        EL.modal({
            title: "Add waypoint · " + a.reference, body: form,
            actions: [{ label: "Cancel", kind: "ghost" }, {
                label: "Add to route", onClick: async () => {
                    if (!EL.validate(form)) return false;
                    const r2 = await api("/api/partner/bookings/" + a.bookingId + "/waypoints", { method: "POST", body: EL.formData(form) });
                    EL.toast(r2.message, "success");
                }
            }]
        });
    }
    async function availability() {
        const g = await api("/api/partner/guide");
        body().innerHTML = '<section class="card"><h3>Unavailable days</h3><p class="muted small">Mark days when you cannot guide (leave, illness). Days already assigned to a tour cannot be blocked - contact the operations team.</p><button class="btn" id="openBlk">' + icon("calendar", 16) + " Manage unavailable days</button></section>";
        $("#openBlk").addEventListener("click", () => ResourceWidgets.blockedDatesModal("/api/partner", "GUIDE", g.id, g.fullName));
    }

    show(tabs[0][0]);
})();

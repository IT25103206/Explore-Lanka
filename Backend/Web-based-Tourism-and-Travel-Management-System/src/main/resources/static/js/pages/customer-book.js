/*
 * UC-06 Book Tour Package (IT25100080 Rodrigo K.Y.S) - booking wizard.
 *  Step 1 trip details -> Step 2 accommodation & transport preferences (PBI-02)
 *  Step 3 travellers, special requests, promo code (3a) -> Step 4 summary with total cost and availability (4, 4a, 5, 6)
 *  Confirm -> booking saved as PENDING_PAYMENT -> payment page (7)
 * Also used to modify an unpaid booking (?edit=<bookingId>).
 */
(async function () {
    const { $, $$, esc, fmt, icon, api } = EL;
    const editId = EL.qs("edit");
    await EL.portal({ kind: "customer", active: "bookings", title: editId ? "Modify booking" : "Book a tour" });
    const page = $("#page");

    let existing = null;
    let packageId = EL.qs("package");
    if (editId) {
        existing = await api("/api/customer/bookings/" + editId);
        if (!existing.canEditAll) { location.replace("/customer/bookings.html?open=" + editId); return; }
        packageId = existing.packageId;
    }
    if (!packageId) { location.replace("/customer/packages.html"); return; }
    let pkg;
    try { pkg = await api("/api/public/packages/" + packageId); }
    catch (e) { page.innerHTML = '<div class="card">' + EL.emptyState("This tour cannot be booked right now.", "package") + "</div>"; return; }

    const minDate = EL.iso(EL.addDays(new Date(), 2));
    const firstDate = pkg.availableFrom > minDate ? pkg.availableFrom : minDate;
    const state = {
        step: 1,
        startDate: existing ? existing.startDate : firstDate,
        adults: existing ? existing.adults : 2,
        children: existing ? existing.children : 0,
        extraDays: existing ? existing.extraDays : 0,
        guideRequired: existing ? existing.guideRequired : pkg.guideRecommended,
        guideLanguage: existing ? existing.guideLanguage || "English" : "English",
        hotelId: existing ? existing.hotelId : null,
        vehicleId: existing ? existing.vehicleId : null,
        rooms: existing ? existing.rooms : 0,
        travelers: existing ? existing.travelers : [],
        specialRequests: existing ? existing.specialRequests || "" : "",
        promoCode: existing ? existing.promoCode || "" : (EL.qs("promo") || ""),
        options: null,
        quote: null
    };

    page.innerHTML =
        '<div class="card"><div class="row between"><div class="row" style="gap:14px"><img src="' + esc(pkg.imageUrl) + '" alt="" style="width:92px;height:68px;object-fit:cover;border-radius:10px">' +
        '<div><div class="small muted">' + (editId ? "Modifying " + esc(existing.reference) : "Selected package") + '</div><h3 style="margin:0">' + esc(pkg.name) + '</h3><div class="small muted">' + pkg.durationDays + " days · " + esc(pkg.destinations.join(", ")) + " · from " + fmt.money(pkg.currentPrice) + " per adult</div></div></div>" +
        '<div class="stepper" id="stepper"></div></div></div>' +
        '<div id="stepBody"></div>';

    const STEPS = ["Trip details", "Hotel & transport", "Travellers", "Review & confirm"];
    function renderStepper() {
        $("#stepper").innerHTML = STEPS.map((s, i) => '<div class="step ' + (i + 1 === state.step ? "active" : i + 1 < state.step ? "done" : "") + '"><i>' + (i + 1 < state.step ? "✓" : i + 1) + "</i>" + s + "</div>").join("");
    }
    function go(step) { state.step = step; renderStepper(); [null, step1, step2, step3, step4][step](); window.scrollTo({ top: 0, behavior: "smooth" }); }
    const body = () => $("#stepBody");

    // ------------------------------------------------------------------ step 1
    function step1() {
        body().innerHTML = '<form class="card" id="f1"><h3>When are you travelling and who is coming?</h3><div class="form-grid cols-3">' +
            EL.field({ name: "startDate", label: "Travel date", type: "date", required: true, attrs: { min: firstDate, max: pkg.availableTo }, hint: "Book at least 2 days ahead. Tour runs until " + fmt.date(pkg.availableTo) }) +
            EL.field({ name: "adults", label: "Adults (12+)", type: "number", required: true, attrs: { min: 1, max: pkg.maxGroupSize } }) +
            EL.field({ name: "children", label: "Children (under 12)", type: "number", required: true, attrs: { min: 0, max: pkg.maxGroupSize }, hint: "Children pay 50% of the package price" }) +
            (pkg.type === "CUSTOM" ? EL.field({ name: "extraDays", label: "Extra days (customise)", type: "number", attrs: { min: 0, max: pkg.maxExtraDays }, hint: "Up to " + pkg.maxExtraDays + " extra day(s), " + fmt.money(pkg.extraDayPrice) + " per traveller per day" }) : "") +
            '</div><hr class="divider"><div class="form-grid"><label class="check full"><input type="checkbox" name="guideRequired"> I would like a licensed tour guide' + (pkg.guideRecommended ? " (recommended for this tour)" : "") + "</label>" +
            EL.field({ name: "guideLanguage", label: "Preferred guide language", type: "select", options: ["English", "German", "French", "Japanese", "Chinese", "Tamil", "Arabic"] }) +
            '</div><div class="form-actions"><a class="btn ghost" href="/tour.html?id=' + pkg.id + '">Back to tour</a><button class="btn" type="submit">Continue ' + icon("check", 16) + "</button></div></form>";
        const f = $("#f1");
        EL.fill(f, state);
        const syncGuide = () => { f.guideLanguage.disabled = !f.guideRequired.checked; };
        f.guideRequired.addEventListener("change", syncGuide);
        syncGuide();
        EL.bindForm(f, async (d) => {
            const travellers = d.adults + d.children;
            if (travellers > pkg.maxGroupSize) { EL.formAlert(f, "This tour allows at most " + pkg.maxGroupSize + " travellers per booking."); return; }
            Object.assign(state, d, { extraDays: d.extraDays || 0, guideLanguage: d.guideRequired ? d.guideLanguage : null });
            state.options = await api("/api/customer/bookings/options", { query: { packageId: pkg.id, startDate: state.startDate, adults: state.adults, children: state.children, extraDays: state.extraDays, guideLanguage: state.guideLanguage } });
            if (!state.rooms || state.options.nights === 0) state.rooms = state.options.suggestedRooms;
            go(2);
        });
    }

    // ------------------------------------------------------------------ step 2 (preferences)
    function optionCard(o, selectedId, name) {
        const disabled = !o.available;
        return '<label class="option ' + (o.id === selectedId ? "selected " : "") + (disabled ? "disabled" : "") + '">' +
            '<input type="radio" name="' + name + '" value="' + o.id + '" ' + (o.id === selectedId ? "checked" : "") + " " + (disabled ? "disabled" : "") + ">" +
            (o.imageUrl ? '<img src="' + esc(o.imageUrl) + '" alt="">' : '<div class="avatar" style="width:44px;height:44px;background:var(--brown-50);color:var(--brown)">' + icon(o.type === "VEHICLE" ? "truck" : "user") + "</div>") +
            '<div class="grow"><div class="t">' + esc(o.name) + '</div><div class="d">' + esc(o.detail) + "</div>" +
            '<div class="p">' + fmt.money(o.price) + (o.type === "HOTEL" ? " / room / night" : " / day") + "</div>" +
            (disabled ? '<div class="d" style="color:var(--danger)">' + esc(o.unavailableReason) + "</div>" : "") + "</div>" +
            (o.alternative && o.available ? '<span class="badge amber flag">Nearby town</span>' : "") + "</label>";
    }
    function step2() {
        const o = state.options;
        const travellers = state.adults + state.children;
        if (state.hotelId && !o.hotels.some((h) => h.id === state.hotelId && h.available)) state.hotelId = null;
        if (state.vehicleId && !o.vehicles.some((v) => v.id === state.vehicleId && v.available)) state.vehicleId = null;
        body().innerHTML = '<form class="stack" id="f2">' +
            (o.warnings.length ? '<div class="alert warning">' + o.warnings.map(esc).join("<br>") + ' <button type="button" class="link-btn" id="changeDates">Change dates</button></div>' : "") +
            '<div class="card"><div class="card-head"><h3>' + icon("bed") + " Accommodation</h3><span class=\"muted small\">" + fmt.date(o.startDate) + " - " + fmt.date(o.endDate) + " · " + o.nights + " night(s)</span></div>" +
            (o.nights === 0 ? '<p class="muted">This is a day tour - no accommodation is needed.</p>'
                : '<div class="row" style="margin-bottom:12px"><div class="field" style="width:160px"><label>Rooms</label><input type="number" name="rooms" min="' + Math.ceil(travellers / 3) + '" max="' + travellers + '" required><span class="error"></span><span class="hint">Max 3 guests per room</span></div></div>' +
                '<div class="options">' + o.hotels.map((h) => optionCard(h, state.hotelId, "hotelId")).join("") + "</div>") + "</div>" +
            '<div class="card"><div class="card-head"><h3>' + icon("truck") + ' Transport <span class="badge" style="font-family:var(--font-body)">Optional</span></h3><span class="muted small">Vehicles with ' + travellers + "+ seats and a driver</span></div>" +
            '<div class="options">' +
            '<label class="option ' + (!state.vehicleId ? "selected" : "") + '"><input type="radio" name="vehicleId" value="" ' + (!state.vehicleId ? "checked" : "") + '>' +
            '<div class="avatar" style="width:44px;height:44px;background:var(--stone-100);color:var(--stone-700)">' + icon("map") + '</div>' +
            '<div class="grow"><div class="t">I\'ll arrange my own transport</div><div class="d">No vehicle is booked - you travel between stops yourself.</div><div class="p">No transport cost</div></div></label>' +
            o.vehicles.map((v) => optionCard(v, state.vehicleId, "vehicleId")).join("") + "</div></div>" +
            (state.guideRequired ? '<div class="card"><h3>' + icon("user") + " Tour guide</h3>" + (o.guideAvailable
                ? '<p class="muted" style="margin:0">A licensed ' + esc(state.guideLanguage || "") + "-speaking guide will be assigned after payment (from " + fmt.money(o.guideDailyRate) + " per day).</p>"
                : '<div class="alert warning">No guide is free on these dates. Change the dates or continue without a guide.</div>') + "</div>" : "") +
            '<div class="form-actions"><button type="button" class="btn ghost" id="back">Back</button><button class="btn" type="submit">Continue</button></div></form>';
        const f = $("#f2");
        if (f.rooms) f.rooms.value = state.rooms;
        $$(".option input", f).forEach((inp) => inp.addEventListener("change", () => {
            $$('input[name="' + inp.name + '"]', f).forEach((x) => x.closest(".option").classList.toggle("selected", x.checked));
        }));
        $("#back").addEventListener("click", () => go(1));
        if ($("#changeDates")) $("#changeDates").addEventListener("click", () => go(1));
        EL.bindForm(f, async (d) => {
            if (o.nights > 0 && !d.hotelId) { EL.formAlert(f, "Choose your accommodation"); return; }
            if (state.guideRequired && !o.guideAvailable) { EL.formAlert(f, "No guide is available - go back and untick the guide option or pick other dates."); return; }
            state.hotelId = d.hotelId ? Number(d.hotelId) : null;
            state.vehicleId = d.vehicleId ? Number(d.vehicleId) : null;
            state.rooms = o.nights === 0 ? 0 : d.rooms;
            go(3);
        });
    }

    // ------------------------------------------------------------------ step 3 (travellers)
    function step3() {
        const rows = [];
        for (let i = 0; i < state.adults; i++) rows.push("ADULT");
        for (let i = 0; i < state.children; i++) rows.push("CHILD");
        const prevA = state.travelers.filter((t) => t.type === "ADULT");
        const prevC = state.travelers.filter((t) => t.type === "CHILD");
        let ai = 0, ci = 0;
        const data = rows.map((type) => type === "ADULT" ? prevA[ai++] || { type } : prevC[ci++] || { type });
        body().innerHTML = '<form class="stack" id="f3"><div class="card"><h3>Traveller details</h3><p class="muted small">Names must match passports or NICs. Details are only shared with the hotel and guide assigned to your trip.</p>' +
            data.map((t, i) => '<div class="panel" style="margin-bottom:10px" data-row="' + i + '"><div class="row between"><b>' + (t.type === "ADULT" ? "Adult" : "Child") + " " + (i + 1) + "</b>" + (i === 0 ? '<span class="badge green">Lead traveller</span>' : "") + "</div>" +
                '<div class="form-grid cols-3" style="margin-top:8px">' +
                EL.field({ name: "t" + i + "_fullName", label: "Full name", required: true, attrs: { pattern: EL.PATTERNS.name, "data-msg": "Letters and spaces only", maxlength: 100 } }) +
                EL.field({ name: "t" + i + "_age", label: "Age", type: "number", required: true, attrs: t.type === "ADULT" ? { min: 12, max: 120 } : { min: 0, max: 11 } }) +
                EL.field({ name: "t" + i + "_nationality", label: "Nationality", attrs: { maxlength: 60 } }) +
                (t.type === "ADULT" ? EL.field({ name: "t" + i + "_passportOrNic", label: "Passport / NIC no.", attrs: { pattern: "[A-Za-z0-9]{5,20}", "data-msg": "5-20 letters and digits" } }) : "") +
                "</div></div>").join("") + "</div>" +
            '<div class="card"><h3>Anything else?</h3><div class="form-grid">' +
            EL.field({ name: "specialRequests", label: "Special requests", type: "textarea", full: true, placeholder: "Dietary needs, accessibility, celebrations...", attrs: { maxlength: 1000 } }) +
            EL.field({ name: "promoCode", label: "Promotion / coupon code", placeholder: "e.g. EARLYBIRD15", attrs: { pattern: EL.PATTERNS.code, "data-msg": "3-30 letters, digits or hyphens", maxlength: 30 }, hint: "Optional - see current offers on the Offers page" }) +
            '</div></div><div class="form-actions"><button type="button" class="btn ghost" id="back">Back</button><button class="btn" type="submit">Review booking</button></div></form>';
        const f = $("#f3");
        data.forEach((t, i) => {
            const user = i === 0 && !t.fullName ? null : t;
            if (user) EL.fill(f, { ["t" + i + "_fullName"]: t.fullName, ["t" + i + "_age"]: t.age, ["t" + i + "_nationality"]: t.nationality, ["t" + i + "_passportOrNic"]: t.passportOrNic });
        });
        if (!data[0].fullName) EL.me().then((u) => { f.t0_fullName.value = u.fullName; });
        EL.fill(f, { specialRequests: state.specialRequests, promoCode: state.promoCode });
        $("#back").addEventListener("click", () => go(2));
        EL.bindForm(f, async (d) => {
            state.travelers = data.map((t, i) => ({ type: t.type, fullName: d["t" + i + "_fullName"], age: d["t" + i + "_age"], nationality: d["t" + i + "_nationality"], passportOrNic: d["t" + i + "_passportOrNic"] || null }));
            state.specialRequests = d.specialRequests || "";
            state.promoCode = d.promoCode ? d.promoCode.toUpperCase() : "";
            go(4);
        });
    }

    // ------------------------------------------------------------------ step 4 (summary + confirm)
    function payload() {
        return {
            packageId: pkg.id, startDate: state.startDate, adults: state.adults, children: state.children, extraDays: state.extraDays || 0,
            rooms: state.rooms || 0, hotelId: state.hotelId, vehicleId: state.vehicleId, guideRequired: !!state.guideRequired,
            guideLanguage: state.guideRequired ? state.guideLanguage : null, promoCode: state.promoCode || null,
            specialRequests: state.specialRequests || null, travelers: state.travelers
        };
    }
    async function step4() {
        body().innerHTML = '<div class="card">' + EL.skeleton(4) + "</div>";
        let q;
        try { q = await api("/api/customer/bookings/quote", { method: "POST", body: payload() }); }
        catch (e) { EL.toastError(e); go(e.status === 400 ? 1 : 3); return; }
        state.quote = q;
        const line = (label, v, cls) => '<tr class="' + (cls || "") + '"><td>' + label + "</td><td>" + v + "</td></tr>";
        body().innerHTML = '<div class="grid grid-2" style="align-items:start">' +
            '<div class="card stack"><h3>Booking summary</h3><dl class="kv"><dt>Tour</dt><dd>' + esc(q.packageName) + "</dd><dt>Dates</dt><dd>" + fmt.date(q.startDate) + " - " + fmt.date(q.endDate) + " (" + q.days + " days, " + q.nights + " nights)</dd>" +
            "<dt>Travellers</dt><dd>" + q.adults + " adult(s)" + (q.children ? ", " + q.children + " child(ren)" : "") + "</dd>" +
            (q.hotelName ? "<dt>Hotel</dt><dd>" + esc(q.hotelName) + " · " + q.rooms + " room(s)</dd>" : "") + "<dt>Transport</dt><dd>" + (q.vehicleName ? esc(q.vehicleName) : "Own arrangement (not included)") + "</dd>" +
            "<dt>Guide</dt><dd>" + (q.guideRequired ? "Yes - " + esc(state.guideLanguage || "") : "No") + "</dd>" + (state.specialRequests ? "<dt>Requests</dt><dd>" + esc(state.specialRequests) + "</dd>" : "") + "</dl>" +
            (q.available ? '<div class="alert success">' + icon("check", 15) + " Everything you selected is available for these dates.</div>"
                : '<div class="alert error"><b>Not available (4a):</b><ul>' + q.availabilityIssues.map((x) => "<li>" + esc(x) + "</li>").join("") + '</ul><button class="btn sm outline" id="toDates" style="margin-top:8px">Choose other dates or options</button></div>') +
            '<div class="small muted">' + icon("shield", 13) + " Free changes and full refund up to 7 days before travel. After payment your hotel, vehicle and guide are reserved automatically.</div></div>" +
            '<div class="card"><h3>Total cost</h3><table class="breakdown">' +
            line("Package (" + fmt.money(q.adultPrice) + " x " + q.adults + (q.children ? " + 50% x " + q.children : "") + (q.extraDays ? ", +" + q.extraDays + " day(s)" : "") + ")", fmt.money(q.packageCost)) +
            (q.nights ? line("Accommodation (" + q.rooms + " room(s) x " + q.nights + " night(s))", fmt.money(q.accommodationCost)) : "") +
            (q.vehicleId ? line("Transport (" + q.days + " day(s))", fmt.money(q.transportCost)) : "") +
            (q.guideRequired ? line("Tour guide (" + q.days + " day(s))", fmt.money(q.guideCost)) : "") +
            line("Subtotal", fmt.money(q.subtotal)) +
            (Number(q.discount) > 0 ? line("Discount (" + esc(q.promoCode) + ")", "- " + fmt.money(q.discount), "discount") : "") +
            line("Total", fmt.money(q.total), "total") + "</table>" +
            (q.pricingNote ? '<p class="small" style="color:var(--gold);margin-top:10px">' + esc(q.pricingNote) + "</p>" : "") +
            '<form class="row" id="promoForm" style="margin-top:14px;align-items:end"><div class="field grow"><label>Promotion code</label><input name="promoCode" value="' + esc(state.promoCode) + '" placeholder="Enter code" maxlength="30"></div><button class="btn ghost" type="submit">Apply</button></form>' +
            (q.promoMessage ? '<div class="alert ' + (q.promoApplied ? "success" : "warning") + ' small" style="margin-top:8px">' + esc(q.promoMessage) + "</div>" : "") +
            '<div class="form-actions"><button class="btn ghost" id="back">Back</button><button class="btn green" id="confirm" ' + (q.available && (!q.promoCode || q.promoApplied) ? "" : "disabled") + ">" +
            (editId ? "Save changes" : "Confirm & continue to payment") + "</button></div></div></div>";
        $("#back").addEventListener("click", () => go(3));
        if ($("#toDates")) $("#toDates").addEventListener("click", () => go(1));
        $("#promoForm").addEventListener("submit", (e) => { e.preventDefault(); state.promoCode = e.target.promoCode.value.trim().toUpperCase(); step4(); });
        $("#confirm").addEventListener("click", async (e) => {
            e.target.disabled = true;
            try {
                const b = editId
                    ? await api("/api/customer/bookings/" + editId, { method: "PUT", body: payload() })
                    : await api("/api/customer/bookings", { method: "POST", body: payload() });
                EL.toast(editId ? "Booking updated" : "Booking " + b.reference + " created - complete the payment to confirm it", "success");
                location.href = "/customer/pay.html?booking=" + b.id;
            } catch (err) {
                EL.toastError(err);
                e.target.disabled = false;
                if (err.status === 409) step4();
            }
        });
    }

    renderStepper();
    step1();
})();

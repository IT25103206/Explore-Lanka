/*
 * Hotels & vehicles (Logistic Supplier Management, resources.html) and tour guides (Business Manager, guides.html).
 * The page is chosen by data-page on <body>.
 */
(async function () {
    const { $, $$, esc, fmt, icon, api, badge, ROLE } = EL;
    const guidesPage = document.body.dataset.page === "guides";
    const me = await EL.portal(guidesPage
        ? { kind: "admin", active: "guides", title: "Tour Guides", roles: [ROLE.BM, ROLE.ADMIN] }
        : { kind: "admin", active: "resources", title: "Hotels & Vehicles", roles: [ROLE.LOG, ROLE.ADMIN] });
    const page = $("#page");
    page.innerHTML = '<div class="page-intro"><p>Resources of inactive suppliers and inactive resources are never offered to tourists or allocated to bookings.</p><button class="btn" id="add">' + icon("plus", 16) + " Add</button></div>" +
        '' + (guidesPage ? '<div id="tabs" class="hidden"><button data-t="guides" class="active"></button></div>'
            : '<div class="tabs" id="tabs"><button data-t="hotels" class="active">Hotels</button><button data-t="vehicles">Vehicles</button></div>') + '<div class="card toolbar"><input class="search grow" id="q" placeholder="Search"></div><div id="list"></div>';

    let tab = guidesPage ? "guides" : "hotels";
    let data = [];
    let suppliers = [];
    let guideUsers = [];
    const types = { hotels: "HOTEL", vehicles: "TRANSPORT", guides: "TOUR_GUIDE" };

    async function load() {
        $("#list").innerHTML = EL.skeleton(3);
        [data, suppliers] = await Promise.all([api("/api/admin/resources/" + tab), suppliers.length ? Promise.resolve(suppliers) : api("/api/admin/suppliers")]);
        render();
    }
    function render() {
        const q = $("#q").value.trim().toLowerCase();
        const rows = data.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q));
        const status = (r) => r.active ? badge("ACTIVE") : badge("INACTIVE");
        const cols = {
            hotels: [
                { label: "Hotel", render: (h) => "<b>" + esc(h.name) + '</b><div class="small muted">' + esc(h.city) + " · " + "★".repeat(h.starRating) + "</div>" },
                { label: "Supplier", render: (h) => esc(h.supplierName || "-") },
                { label: "Rooms", cls: "right", key: "totalRooms" },
                { label: "Price / night", cls: "right", render: (h) => fmt.money(h.pricePerNight) },
                { label: "Status", render: status },
                { label: "", cls: "right", render: () => '<div class="actions">' + EL.act("cal", "calendar", "Room calendar") + EL.act("edit", "edit", "Edit") + EL.act("del", "trash", "Remove", "danger") + "</div>" }
            ],
            vehicles: [
                { label: "Vehicle", render: (v) => "<b>" + esc(v.model) + '</b><div class="small muted">' + esc(v.registrationNo) + " · " + EL.titleCase(v.type) + "</div>" },
                { label: "Supplier", render: (v) => esc(v.supplierName || "-") },
                { label: "Seats", cls: "right", key: "seats" },
                { label: "Driver", render: (v) => esc(v.driverName || "-") },
                { label: "Price / day", cls: "right", render: (v) => fmt.money(v.pricePerDay) },
                { label: "Status", render: status },
                { label: "", cls: "right", render: () => '<div class="actions">' + EL.act("blk", "calendar", "Unavailable days") + EL.act("edit", "edit", "Edit") + EL.act("del", "trash", "Remove", "danger") + "</div>" }
            ],
            guides: [
                { label: "Guide", render: (g) => "<b>" + esc(g.fullName) + '</b><div class="small muted">' + esc(g.licenseNo) + " · " + g.experienceYears + " yrs</div>" },
                { label: "Languages", render: (g) => esc(g.languages) },
                { label: "Specialisation", render: (g) => esc(g.specialization || "-") },
                { label: "Portal login", render: (g) => g.userEmail ? '<span class="small">' + esc(g.userEmail) + "</span>" : '<span class="muted small">None</span>' },
                { label: "Price / day", cls: "right", render: (g) => fmt.money(g.pricePerDay) },
                { label: "Status", render: status },
                { label: "", cls: "right", render: () => '<div class="actions">' + EL.act("blk", "calendar", "Unavailable days") + EL.act("edit", "edit", "Edit") + EL.act("del", "trash", "Remove", "danger") + "</div>" }
            ]
        };
        EL.table($("#list"), cols[tab], rows, {
            empty: "Nothing here yet", emptyIcon: "bed", onRow: edit,
            actions: {
                edit,
                cal: calendar,
                blk: (r) => ResourceWidgets.blockedDatesModal("/api/admin/resources", tab === "vehicles" ? "VEHICLE" : "GUIDE", r.id, r.model || r.fullName),
                del: async (r) => {
                    if (!(await EL.confirm("Remove " + (r.name || r.model || r.fullName) + "? Resources with booking history must be marked inactive instead.", { danger: true, ok: "Remove" }))) return;
                    try { await api("/api/admin/resources/" + tab + "/" + r.id, { method: "DELETE" }); EL.toast("Removed", "success"); load(); } catch (e) { EL.toastError(e); }
                }
            }
        });
    }
    $$("#tabs button").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.t; $$("#tabs button").forEach((x) => x.classList.toggle("active", x === b)); $("#q").value = ""; load(); }));
    $("#q").addEventListener("input", render);
    $("#add").addEventListener("click", () => edit(null));

    async function calendar(h) {
        const from = new Date();
        const body = document.createElement("div");
        body.innerHTML = '<div class="row" style="margin-bottom:12px"><label class="small">From <input type="date" id="cf" value="' + EL.iso(from) + '" style="width:auto"></label></div><div id="calBox">' + EL.skeleton(2) + "</div>";
        EL.modal({ title: "Room calendar · " + h.name, body, size: "lg" });
        const draw = async () => {
            const f = body.querySelector("#cf").value;
            const days = await api("/api/admin/resources/hotels/" + h.id + "/calendar", { query: { from: f, to: EL.iso(EL.addDays(new Date(f), 34)) } });
            body.querySelector("#calBox").innerHTML = ResourceWidgets.calendarHtml(days);
        };
        body.querySelector("#cf").addEventListener("change", draw);
        draw().catch(EL.toastError);
    }

    async function edit(r) {
        const supplierOptions = suppliers.filter((s) => s.type === types[tab]).map((s) => ({ value: s.id, label: s.name + (s.status === "INACTIVE" ? " (inactive)" : "") }));
        const form = document.createElement("form");
        let html = '<div class="form-grid">';
        if (tab === "hotels") {
            html += EL.field({ name: "name", label: "Hotel name", required: true, full: true, attrs: { maxlength: 120 } }) +
                EL.field({ name: "supplierId", label: "Supplier", type: "select", placeholder: "No supplier", options: supplierOptions, attrs: { "data-type": "number" } }) +
                EL.field({ name: "city", label: "Town / city", required: true, hint: "Must match package destinations, e.g. Kandy", attrs: { maxlength: 60 } }) +
                EL.field({ name: "starRating", label: "Star rating", type: "number", required: true, attrs: { min: 1, max: 5 } }) +
                EL.field({ name: "totalRooms", label: "Rooms offered per night", type: "number", required: true, attrs: { min: 1, max: 500 } }) +
                EL.field({ name: "pricePerNight", label: "Price per room per night (LKR)", type: "number", required: true, attrs: { min: 500, step: "0.01" } }) +
                EL.field({ name: "address", label: "Address", attrs: { maxlength: 255 } }) +
                EL.field({ name: "amenities", label: "Amenities", full: true, attrs: { maxlength: 500 } }) +
                EL.field({ name: "description", label: "Description", type: "textarea", full: true, attrs: { maxlength: 1000 } }) +
                EL.imageField({ name: "imageUrl", label: "Image" });
        } else if (tab === "vehicles") {
            html += EL.field({ name: "model", label: "Model", required: true, attrs: { maxlength: 80 } }) +
                EL.field({ name: "type", label: "Type", type: "select", required: true, options: ["CAR", "SUV", "VAN", "MINI_COACH", "COACH", "TUK_TUK"] }) +
                EL.field({ name: "registrationNo", label: "Registration no.", required: true, placeholder: "CAB-1234", attrs: { pattern: "[A-Za-z]{2,3}[\\- ]?[A-Za-z]{0,3}[\\- ]?[0-9]{4}", "data-msg": "e.g. CAB-1234 or WP KA-4567" } }) +
                EL.field({ name: "supplierId", label: "Supplier", type: "select", placeholder: "No supplier", options: supplierOptions, attrs: { "data-type": "number" } }) +
                EL.field({ name: "seats", label: "Passenger seats", type: "number", required: true, attrs: { min: 1, max: 60 } }) +
                EL.field({ name: "pricePerDay", label: "Price per day (LKR)", type: "number", required: true, attrs: { min: 1000, step: "0.01" } }) +
                EL.field({ name: "driverName", label: "Driver name", attrs: { pattern: EL.PATTERNS.name, "data-msg": "Letters and spaces only" } }) +
                '<label class="check"><input type="checkbox" name="airConditioned"> Air conditioned</label>';
        } else {
            const isAdmin = me.role === ROLE.ADMIN;
            if (isAdmin && !guideUsers.length) guideUsers = (await api("/api/admin/users", { query: { role: "TOUR_GUIDE" } }).catch(() => []));
            html += EL.field({ name: "fullName", label: "Full name", required: true, attrs: { pattern: EL.PATTERNS.name, "data-msg": "Letters and spaces only" } }) +
                EL.field({ name: "licenseNo", label: "SLTDA licence no.", required: true, attrs: { pattern: "[A-Za-z0-9/\\-]{4,30}", "data-msg": "4-30 letters, digits, / or -" } }) +
                EL.field({ name: "languages", label: "Languages", required: true, placeholder: "English, German", attrs: { maxlength: 200 } }) +
                EL.field({ name: "specialization", label: "Specialisation", attrs: { maxlength: 200 } }) +
                EL.field({ name: "experienceYears", label: "Experience (years)", type: "number", required: true, attrs: { min: 0, max: 60 } }) +
                EL.field({ name: "pricePerDay", label: "Price per day (LKR)", type: "number", required: true, attrs: { min: 1000, step: "0.01" } }) +
                EL.field({ name: "phone", label: "Phone", attrs: { pattern: EL.PATTERNS.phone, "data-msg": "e.g. 0771234567" } }) +
                EL.field({ name: "email", label: "Email", type: "email" }) +
                EL.field({ name: "supplierId", label: "Guide association", type: "select", placeholder: "Independent", options: supplierOptions, attrs: { "data-type": "number" } }) +
                (isAdmin ? EL.field({ name: "userId", label: "Portal login (Tour Guide account)", type: "select", placeholder: "Not linked", options: guideUsers.map((u) => ({ value: u.id, label: u.fullName + " - " + u.email })), attrs: { "data-type": "number" } })
                    : '<div class="field"><label>Portal login</label><input value="' + esc(r && r.userEmail ? r.userEmail : "Not linked") + '" disabled><span class="hint">Linked by the System Administrator</span></div>');
        }
        html += '<label class="check full"><input type="checkbox" name="active"> Active (offered for bookings)</label></div>';
        form.innerHTML = html;
        EL.fill(form, r || { active: true, airConditioned: true, starRating: 3, experienceYears: 1 });
        EL.bindImageFields(form);
        EL.modal({
            title: (r ? "Edit " : "Add ") + { hotels: "hotel", vehicles: "vehicle", guides: "tour guide" }[tab], body: form, size: "lg",
            actions: [{ label: "Cancel", kind: "ghost" }, {
                label: "Save", onClick: async () => {
                    if (!EL.validate(form)) return false;
                    const d = EL.formData(form);
                    if (d.registrationNo) d.registrationNo = d.registrationNo.toUpperCase();
                    if (d.licenseNo) d.licenseNo = d.licenseNo.toUpperCase();
                    await api("/api/admin/resources/" + tab + (r ? "/" + r.id : ""), { method: r ? "PUT" : "POST", body: d });
                    EL.toast("Saved", "success");
                    load();
                }
            }]
        });
    }

    load().catch(EL.toastError);
})();

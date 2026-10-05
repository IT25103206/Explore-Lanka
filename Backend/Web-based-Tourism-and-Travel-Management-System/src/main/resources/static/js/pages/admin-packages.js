/*
 * Tour Package & Experience Management (IT25101444 Meheramba E.N.)
 * Create / update / categorise packages, manage schedules & pricing, seasonal and customisable plans,
 * deactivate or delete inactive packages. The type chosen here is passed to TourPackageFactory on the server.
 */
(async function () {
    const { $, $$, esc, fmt, icon, api, badge, ROLE } = EL;
    const user = await EL.portal({ kind: "admin", active: "packages", title: "Tour Packages", roles: [ROLE.OPS, ROLE.ADMIN] });
    const canDelete = [ROLE.OPS, ROLE.ADMIN].includes(user.role);
    const page = $("#page");
    page.innerHTML = '<div class="page-intro"><p>Create standard, seasonal and customisable tour packages with schedules, pricing and day-by-day itineraries.</p><button class="btn" id="add">' + icon("plus", 16) + " Add package</button></div>" +
        '<div class="card toolbar"><input class="search grow" id="q" placeholder="Search by name, code or destination"><select id="fStatus"><option value="">All statuses</option><option>ACTIVE</option><option>INACTIVE</option></select>' +
        '<select id="fType"><option value="">All types</option><option>STANDARD</option><option>SEASONAL</option><option>CUSTOM</option></select><select id="fCat"><option value="">All themes</option></select></div><div id="list"></div>';
    EL.CATEGORIES.forEach((c) => $("#fCat").insertAdjacentHTML("beforeend", '<option value="' + c + '">' + EL.titleCase(c) + "</option>"));

    let all = [];
    async function load() { all = await api("/api/admin/packages"); render(); }
    function render() {
        const q = $("#q").value.trim().toLowerCase();
        const rows = all.filter((p) => (!q || (p.name + p.code + p.destinations.join(" ")).toLowerCase().includes(q)) && (!$("#fStatus").value || p.status === $("#fStatus").value)
            && (!$("#fType").value || p.type === $("#fType").value) && (!$("#fCat").value || p.category === $("#fCat").value));
        EL.table($("#list"), [
            { label: "Package", render: (p) => '<div class="row" style="gap:10px;flex-wrap:nowrap">' + (p.imageUrl ? '<img src="' + esc(p.imageUrl) + '" alt="" style="width:54px;height:40px;object-fit:cover;border-radius:7px">' : '<div style="width:54px;height:40px;border-radius:7px;background:var(--brown-50,#f5f1ea);flex:none"></div>') + '<div><b>' + esc(p.name) + '</b><div class="small muted">' + esc(p.code) + " · " + esc(p.destinations.join(", ")) + "</div></div></div>" },
            { label: "Type", render: (p) => badge(p.type) },
            { label: "Theme", render: (p) => esc(EL.titleCase(p.category)) },
            { label: "Duration", render: (p) => p.durationDays + " d" },
            { label: "Price / adult", cls: "right", render: (p) => fmt.money(p.currentPrice) + (p.inSeasonNow ? '<div class="small" style="color:var(--gold)">in season</div>' : "") },
            { label: "Schedule", render: (p) => '<span class="small">' + fmt.short(p.availableFrom) + " - " + fmt.date(p.availableTo) + "</span>" },
            { label: "Sold", cls: "right", render: (p) => p.bookingCount + (p.trending ? ' <span class="badge solid">Trending</span>' : "") },
            { label: "Status", render: (p) => badge(p.status) },
            { label: "", cls: "right", render: (p) => '<div class="actions">' + EL.act("edit", "edit", "Edit") + EL.act("toggle", p.status === "ACTIVE" ? "eye" : "check", p.status === "ACTIVE" ? "Deactivate" : "Activate") + (canDelete ? EL.act("del", "trash", "Delete", "danger") : "") + "</div>" }
        ], rows, {
            empty: "No packages match", emptyIcon: "package", onRow: (p) => edit(p),
            actions: {
                edit: (p) => edit(p),
                toggle: async (p) => {
                    const status = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                    try { await api("/api/admin/packages/" + p.id + "/status", { method: "PATCH", body: { status } }); EL.toast(p.name + " is now " + status.toLowerCase(), "success"); load(); } catch (e) { EL.toastError(e); }
                },
                del: async (p) => {
                    if (!(await EL.confirm("Delete " + p.name + "? This cannot be undone.", { danger: true, ok: "Delete" }))) return;
                    try { await api("/api/admin/packages/" + p.id, { method: "DELETE" }); EL.toast("Package deleted", "success"); load(); } catch (e) { EL.toastError(e); }
                }
            }
        });
    }
    ["q", "fStatus", "fType", "fCat"].forEach((id) => $("#" + id).addEventListener("input", render));
    $("#add").addEventListener("click", () => edit(null));

    function dayRow(d) {
        return '<div class="panel day-row" style="margin-bottom:8px"><div class="form-grid cols-3">' +
            '<div class="field"><label>Day</label><input type="number" data-k="dayNumber" min="1" max="30" required value="' + (d.dayNumber || "") + '"><span class="error"></span></div>' +
            '<div class="field" style="grid-column:span 2"><label>Title</label><input data-k="title" maxlength="120" required value="' + esc(d.title || "") + '"><span class="error"></span></div>' +
            '<div class="field"><label>Location</label><input data-k="location" maxlength="80" value="' + esc(d.location || "") + '"></div>' +
            '<div class="field" style="grid-column:span 2"><label>Route / waypoints</label><input data-k="route" maxlength="300" placeholder="Colombo -> Kandy" value="' + esc(d.route || "") + '"></div>' +
            '<div class="field full"><label>Description</label><textarea data-k="description" maxlength="1000" style="min-height:56px">' + esc(d.description || "") + '</textarea></div></div>' +
            '<div class="right"><button type="button" class="btn sm danger outline" data-rm>Remove day</button></div></div>';
    }

    function edit(p) {
        const form = document.createElement("form");
        form.innerHTML = '<div class="form-grid">' +
            EL.field({ name: "type", label: "Package type (factory)", type: "select", required: true, options: [{ value: "STANDARD", label: "Standard - fixed price" }, { value: "SEASONAL", label: "Seasonal - price changes in season" }, { value: "CUSTOM", label: "Custom - tourists can add days" }], hint: p ? "The type cannot change after creation" : "" }) +
            EL.field({ name: "code", label: "Package code", required: true, placeholder: "EL-KAN-02", attrs: { pattern: "[A-Za-z0-9\\-]{3,30}", "data-msg": "3-30 letters, digits or hyphens" } }) +
            EL.field({ name: "name", label: "Package name", required: true, full: true, attrs: { minlength: 3, maxlength: 120 } }) +
            EL.field({ name: "category", label: "Theme / category", type: "select", required: true, options: EL.CATEGORIES }) +
            EL.field({ name: "region", label: "Region (province)", type: "select", required: true, options: EL.REGIONS }) +
            EL.field({ name: "destinations", label: "Destinations (towns, comma separated)", required: true, full: true, placeholder: "Kandy, Nuwara Eliya, Ella", hint: "Hotels in these towns are offered when booking", attrs: { maxlength: 255 } }) +
            EL.field({ name: "durationDays", label: "Duration (days)", type: "number", required: true, attrs: { min: 1, max: 30 } }) +
            EL.field({ name: "maxGroupSize", label: "Max group size", type: "number", required: true, attrs: { min: 1, max: 60 } }) +
            EL.field({ name: "basePrice", label: "Base price per adult (LKR)", type: "number", required: true, attrs: { min: 1000, max: 5000000, step: "0.01" } }) +
            EL.field({ name: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE"] }) +
            EL.field({ name: "availableFrom", label: "Schedule: available from", type: "date", required: true }) +
            EL.field({ name: "availableTo", label: "Schedule: available to", type: "date", required: true, attrs: { "data-after": "availableFrom" } }) +
            '<div class="full panel seasonal-only"><h4>Seasonal pricing</h4><div class="form-grid">' +
            EL.field({ name: "seasonName", label: "Season name", placeholder: "Esala festival season", attrs: { maxlength: 60 } }) +
            EL.field({ name: "seasonalAdjustmentPercent", label: "Price adjustment (%)", type: "number", hint: "-50 to +100, e.g. 20 for +20%", attrs: { min: -50, max: 100, step: "0.01" } }) +
            EL.field({ name: "seasonStart", label: "Season start", type: "date" }) + EL.field({ name: "seasonEnd", label: "Season end", type: "date", attrs: { "data-after": "seasonStart" } }) + "</div></div>" +
            '<div class="full panel custom-only"><h4>Customisable tour plan</h4><div class="form-grid">' +
            EL.field({ name: "extraDayPrice", label: "Price per extra day per traveller (LKR)", type: "number", attrs: { min: 1, step: "0.01" } }) +
            EL.field({ name: "maxExtraDays", label: "Max extra days", type: "number", attrs: { min: 1, max: 14 } }) + "</div></div>" +
            '<label class="check full"><input type="checkbox" name="guideRecommended"> Recommend a tour guide for this package</label>' +
            EL.field({ name: "description", label: "Description", type: "textarea", full: true, attrs: { maxlength: 2000 } }) +
            EL.field({ name: "highlights", label: "Highlights (separate with ;)", type: "textarea", full: true, attrs: { maxlength: 1000 } }) +
            EL.field({ name: "inclusions", label: "Included (separate with ;)", type: "textarea", attrs: { maxlength: 1000 } }) +
            EL.field({ name: "exclusions", label: "Not included (separate with ;)", type: "textarea", attrs: { maxlength: 1000 } }) +
            EL.imageField({ name: "imageUrl", label: "Package image", placeholder: "/images/destinations/kandy.png" }) +
            '</div><hr class="divider"><div class="row between"><h4 style="margin:0">Itinerary</h4><button type="button" class="btn sm ghost" id="addDay">' + icon("plus", 14) + ' Add day</button></div><div id="days" style="margin-top:10px"></div>';
        const today = EL.iso(new Date());
        EL.fill(form, p ? Object.assign({}, p, { destinations: p.destinations.join(", ") }) : { type: "STANDARD", status: "ACTIVE", durationDays: 3, maxGroupSize: 15, guideRecommended: true, availableFrom: today, availableTo: EL.iso(EL.addDays(new Date(), 365)) });
        EL.bindImageFields(form);
        if (p) form.type.disabled = true;
        const days = $("#days", form);
        (p ? p.itinerary : [{ dayNumber: 1 }]).forEach((d) => days.insertAdjacentHTML("beforeend", dayRow(d)));
        const syncType = () => {
            const t = form.type.value;
            $$(".seasonal-only", form).forEach((x) => x.classList.toggle("hidden", t !== "SEASONAL"));
            $$(".custom-only", form).forEach((x) => x.classList.toggle("hidden", t !== "CUSTOM"));
            ["seasonStart", "seasonEnd", "seasonalAdjustmentPercent"].forEach((n) => { form[n].required = t === "SEASONAL"; });
            ["extraDayPrice", "maxExtraDays"].forEach((n) => { form[n].required = t === "CUSTOM"; });
        };
        form.type.addEventListener("change", syncType);
        syncType();
        days.addEventListener("click", (e) => { if (e.target.matches("[data-rm]")) e.target.closest(".day-row").remove(); });
        $("#addDay", form).addEventListener("click", () => days.insertAdjacentHTML("beforeend", dayRow({ dayNumber: $$(".day-row", days).length + 1 })));

        EL.modal({
            title: p ? "Edit " + p.name : "New tour package", body: form, size: "xl", sticky: true,
            actions: [{ label: "Cancel", kind: "ghost" }, {
                label: p ? "Save changes" : "Create package", onClick: async () => {
                    $$(".day-row [data-k]", form).forEach((el) => { el.removeAttribute("name"); });
                    if (!EL.validate(form)) return false;
                    const d = EL.formData(form);
                    if (p) d.type = p.type;
                    d.itinerary = $$(".day-row", days).map((row) => {
                        const o = {}; $$("[data-k]", row).forEach((el) => { o[el.dataset.k] = el.dataset.k === "dayNumber" ? Number(el.value) : (el.value.trim() || null); }); return o;
                    });
                    const bad = d.itinerary.find((x) => !x.title || !x.dayNumber || x.dayNumber > d.durationDays);
                    if (bad) { EL.formAlert(form, "Each itinerary day needs a title and a day number between 1 and " + d.durationDays); return false; }
                    if (p) await api("/api/admin/packages/" + p.id, { method: "PUT", body: d });
                    else await api("/api/admin/packages", { method: "POST", body: d });
                    EL.toast(p ? "Package updated" : "Package created", "success");
                    load();
                }
            }]
        });
    }

    load().catch(EL.toastError);
})();

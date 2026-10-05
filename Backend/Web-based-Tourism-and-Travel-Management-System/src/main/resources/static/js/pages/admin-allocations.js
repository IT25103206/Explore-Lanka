/*
 * UC-01 Allocate Resources to Confirmed Booking (IT25101444 Meheramba E.N.)
 * 1 select booking -> 2 details -> 3/4 real-time availability -> 5 select -> 6 verify -> 7-9 allocate & confirm.
 * Extensions 3a-3c (alternatives), 6a/6b (conflict details from the server), 7a (error, nothing saved).
 */
(async function () {
    const { $, $$, esc, fmt, icon, api, badge, ROLE } = EL;
    const user = await EL.portal({ kind: "admin", active: "allocations", title: "Resource Allocation", roles: [ROLE.LOG, ROLE.ADMIN] });
    const page = $("#page");
    page.innerHTML = '<div class="page-intro"><p>Assign hotels, vehicles and tour guides to confirmed bookings. Availability is checked in real time to prevent double bookings.</p>' +
        '<label class="check"><input type="checkbox" id="onlyMissing" checked> Show only bookings that need resources</label></div>' +
        '<div class="grid" style="grid-template-columns:minmax(260px,340px) minmax(0,1fr);align-items:start" id="layout"><section class="card" style="padding:12px"><h3 style="padding:6px 8px">Confirmed bookings</h3><div id="queue"></div></section><section id="detail" class="stack"><div class="card">' +
        EL.emptyState("Select a booking to see available resources", "route") + "</div></section></div>";
    if (window.matchMedia("(max-width: 900px)").matches) $("#layout").style.gridTemplateColumns = "1fr";

    let queue = [];
    let current = null;
    async function loadQueue() {
        queue = await api("/api/admin/allocations");
        renderQueue();
    }
    function renderQueue() {
        const only = $("#onlyMissing").checked;
        const list = queue.filter((q) => !only || q.missing.length);
        $("#queue").innerHTML = list.length ? list.map((q) => '<button class="option ' + (current === q.bookingId ? "selected" : "") + '" data-b="' + q.bookingId + '" style="width:100%;text-align:left;margin-bottom:8px;display:block;font:inherit">' +
            '<div class="row between"><b>' + esc(q.reference) + "</b>" + (q.missing.length ? '<span class="badge amber">Needs ' + esc(q.missing.join(", ")) + "</span>" : '<span class="badge green">Allocated</span>') + "</div>" +
            '<div class="small">' + esc(q.packageName) + '</div><div class="small muted">' + esc(q.customerName) + " · " + fmt.short(q.startDate) + " - " + fmt.short(q.endDate) + " · " + q.travellers + " pax</div></button>").join("")
            : EL.emptyState(only ? "Every confirmed booking has its resources." : "No upcoming confirmed bookings.", "check");
        $$("[data-b]", $("#queue")).forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.b))));
    }
    $("#onlyMissing").addEventListener("change", renderQueue);

    function options(list, type, currentId, preferredId) {
        if (!list.length) return EL.emptyState("No " + type.toLowerCase() + "s found", "alert");
        return '<div class="options" style="grid-template-columns:1fr">' + list.map((o) => {
            const isCurrent = o.id === currentId;
            return '<label class="option ' + (isCurrent ? "selected " : "") + (o.available || isCurrent ? "" : "disabled") + '"><input type="radio" name="' + type + '" value="' + o.id + '" ' + (isCurrent ? "checked" : "") + " " + (o.available || isCurrent ? "" : "disabled") + ">" +
                '<div class="grow"><div class="t">' + esc(o.name) + "</div><div class=\"d\">" + esc(o.detail) + '</div><div class="p">' + fmt.money(o.price) + "</div>" +
                (!o.available && !isCurrent ? '<div class="d" style="color:var(--danger)">' + esc(o.unavailableReason || "Unavailable") + "</div>" : "") + "</div>" +
                '<div class="flag">' + (isCurrent ? badge("ALLOCATED", "Current") : o.id === preferredId ? '<span class="badge blue">Tourist\'s choice</span>' : o.alternative ? '<span class="badge amber">Alternative</span>' : "") + "</div></label>";
        }).join("") + "</div>";
    }

    async function select(id) {
        current = id;
        renderQueue();
        $("#detail").innerHTML = '<div class="card">' + EL.skeleton(4) + "</div>";
        let v;
        try { v = await api("/api/admin/allocations/bookings/" + id); } catch (e) { EL.toastError(e); return; }
        const cur = (t) => (v.current.find((a) => a.resourceType === t) || {}).resourceId;
        $("#detail").innerHTML =
            '<div class="card"><div class="row between"><div><h3 style="margin:0">' + esc(v.reference) + " · " + esc(v.packageName) + '</h3><div class="small muted">' + esc(v.customerName) + " · " + fmt.date(v.startDate) + " - " + fmt.date(v.endDate) + " · " + v.nights + " night(s) · " + v.travellers + " traveller(s)" +
            (v.nights ? " · " + v.rooms + " room(s)" : "") + (v.guideRequired ? " · guide (" + esc(v.guideLanguage || "any language") + ")" : "") + "</div>" +
            '<div class="small muted">Destinations: ' + esc(v.destinations.join(", ")) + "</div>" + (v.specialRequests ? '<div class="small">Requests: ' + esc(v.specialRequests) + "</div>" : "") + "</div>" +
            (user.role === ROLE.ADMIN ? '<a class="btn sm ghost" href="/admin/bookings.html?open=' + v.bookingId + '">Booking details</a>' : "") + "</div>" +
            (v.warnings.length ? '<div class="alert warning small" style="margin-top:12px">' + v.warnings.map(esc).join("<br>") + "</div>" : "") +
            (v.current.length ? '<div class="small" style="margin-top:10px"><b>Currently allocated:</b> ' + v.current.map((a) => esc(a.resourceType + ": " + a.resourceName)).join(" · ") + "</div>" : "") + "</div>" +
            '<form id="allocForm" class="stack"><div class="grid grid-3" style="align-items:start">' +
            '<div class="card"><h3>' + icon("bed") + " Hotel</h3>" + (v.nights ? options(v.hotels, "HOTEL", cur("HOTEL"), v.preferredHotelId) : '<p class="muted small">Day tour - no hotel needed.</p>') + "</div>" +
            '<div class="card"><h3>' + icon("truck") + " Vehicle</h3>" + options(v.vehicles, "VEHICLE", cur("VEHICLE"), v.preferredVehicleId) + "</div>" +
            '<div class="card"><h3>' + icon("user") + " Tour guide</h3>" + (v.guideRequired ? "" : '<p class="small muted">The tourist did not request a guide, but you may assign one.</p>') + options(v.guides, "GUIDE", cur("GUIDE")) + "</div></div>" +
            '<div class="card row between"><span class="small muted">Only changed selections are sent. The system re-checks availability before saving.</span><button class="btn green" type="submit">' + icon("check", 16) + " Allocate selected resources</button></div></form>";

        $$("#allocForm .option input").forEach((inp) => inp.addEventListener("change", () => $$('#allocForm input[name="' + inp.name + '"]').forEach((x) => x.closest(".option").classList.toggle("selected", x.checked))));
        EL.bindForm($("#allocForm"), async (d) => {
            const body = {};
            [["HOTEL", "hotelId"], ["VEHICLE", "vehicleId"], ["GUIDE", "guideId"]].forEach(([t, k]) => { if (d[t] && Number(d[t]) !== cur(t)) body[k] = Number(d[t]); });
            if (!Object.keys(body).length) { EL.toast("Nothing changed - select a different resource to re-allocate"); return; }
            const r = await api("/api/admin/allocations/bookings/" + id, { method: "POST", body });
            EL.toast(r.message, "success");
            await loadQueue();
            select(id);
        });
    }

    await loadQueue();
    const pre = EL.qs("booking");
    if (pre) { $("#onlyMissing").checked = false; renderQueue(); select(Number(pre)); }
})();

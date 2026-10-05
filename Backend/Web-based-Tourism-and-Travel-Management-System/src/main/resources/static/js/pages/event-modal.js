/* Event details + registration (PBI-07, PBI-20). Used by the public calendar. */
(function () {
    const { esc, fmt, icon, api, titleCase } = EL;

    async function open(id) {
        let e;
        try { e = await api("/api/public/events/" + id); } catch (err) { EL.toastError(err); return; }
        const user = await EL.me();
        const pct = e.maxParticipants ? Math.min(100, Math.round(e.registered * 100 / e.maxParticipants)) : 0;
        const body = document.createElement("div");
        body.innerHTML = '<img src="' + esc(e.imageUrl) + '" alt="" style="width:100%;height:220px;object-fit:cover;border-radius:12px;margin-bottom:14px">' +
            '<div class="row" style="gap:6px;margin-bottom:8px"><span class="badge brown">' + esc(titleCase(e.category)) + "</span>" + (Number(e.ticketPrice) === 0 ? '<span class="badge green">Free entry</span>' : '<span class="badge gold">' + fmt.money(e.ticketPrice) + "</span>") + "</div>" +
            "<p>" + esc(e.description || "") + "</p>" +
            '<dl class="kv"><dt>When</dt><dd>' + (e.startDate === e.endDate ? fmt.date(e.startDate) : fmt.date(e.startDate) + " - " + fmt.date(e.endDate)) + ", " + fmt.time(e.startTime) + " - " + fmt.time(e.endTime) + " (" + esc(e.duration) + ")</dd>" +
            "<dt>Where</dt><dd>" + esc(e.location) + ", " + esc(e.region) + " Province</dd>" +
            (e.dressCode ? "<dt>Dress code</dt><dd>" + esc(e.dressCode) + "</dd>" : "") +
            (e.linkedPackages.length ? "<dt>Related tours</dt><dd>" + e.linkedPackages.map((p) => '<a href="/tour.html?id=' + p.id + '">' + esc(p.name) + "</a>").join(", ") + "</dd>" : "") + "</dl>" +
            '<div style="margin-top:14px"><div class="row between small"><span>' + e.registered + " of " + e.maxParticipants + " places taken</span><b>" + e.spotsLeft + ' left</b></div><div class="progress ' + (pct >= 100 ? "full" : pct > 80 ? "warn" : "") + '"><i style="width:' + pct + '%"></i></div></div>' +
            '<form id="regForm" class="row" style="margin-top:16px;align-items:end"><div class="field" style="width:140px"><label>Participants</label><input type="number" name="participants" min="1" max="' + Math.min(20, Math.max(1, e.spotsLeft)) + '" value="1" required><span class="error"></span></div>' +
            '<button class="btn green" type="submit" ' + (e.spotsLeft <= 0 ? "disabled" : "") + ">" + (e.spotsLeft <= 0 ? "Fully booked" : icon("check", 16) + " Register") + "</button></form>";
        const m = EL.modal({ title: e.name, body, size: "lg" });
        const form = body.querySelector("#regForm");
        EL.bindForm(form, async (data) => {
            if (!user) { location.href = "/login.html?next=" + encodeURIComponent("/events.html?event=" + e.id); return; }
            if (user.role !== "CUSTOMER") { EL.toast("Event registration is for customer accounts"); return; }
            await api("/api/customer/events/" + e.id + "/register", { method: "POST", body: data });
            EL.toast("You are registered for " + e.name, "success");
            m.close();
        });
    }

    window.EventModal = { open };
})();

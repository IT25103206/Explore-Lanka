/* Feedback management: view ratings and complaints, respond, moderate. */
(async function () {
    const { $, esc, fmt, icon, api, badge } = EL;
    await EL.portal({ kind: "admin", active: "feedback", title: "Feedback", roles: [EL.ROLE.BM, EL.ROLE.FIN, EL.ROLE.ADMIN] });
    const page = $("#page");
    page.innerHTML = '<div class="stats" id="stats"></div><div class="card toolbar"><input class="search grow" id="q" placeholder="Search package, customer or text"><select id="fs"><option value="">All</option><option value="NEW">New</option><option value="RESPONDED">Responded</option><option value="HIDDEN">Hidden</option><option value="COMPLAINT">Complaints</option></select>' +
        '<select id="fr"><option value="">Any rating</option><option value="1">1-2 stars</option><option value="3">3 stars</option><option value="4">4-5 stars</option></select></div><div id="list" class="stack"></div>';
    let all = [];
    async function load() {
        all = await api("/api/admin/feedback");
        const avg = all.length ? (all.reduce((s, f) => s + f.overallRating, 0) / all.length).toFixed(1) : "-";
        $("#stats").innerHTML = [["star", avg, "Average rating", "gold"], ["message", all.length, "Reviews", ""], ["alert", all.filter((f) => f.complaint).length, "Complaints", "red"], ["clock", all.filter((f) => f.status === "NEW").length, "Awaiting response", "green"]]
            .map(([ic, v, l, c]) => '<div class="stat ' + c + '"><div class="ico">' + icon(ic) + "</div><div><b>" + v + "</b><span>" + l + "</span></div></div>").join("");
        render();
    }
    function render() {
        const q = $("#q").value.trim().toLowerCase();
        const s = $("#fs").value, r = $("#fr").value;
        const rows = all.filter((f) => (!q || (f.packageName + f.customerName + f.comment).toLowerCase().includes(q))
            && (!s || (s === "COMPLAINT" ? f.complaint : f.status === s))
            && (!r || (r === "1" ? f.overallRating <= 2 : r === "3" ? f.overallRating === 3 : f.overallRating >= 4)));
        $("#list").innerHTML = rows.length ? rows.map((f) => '<article class="card" style="padding:16px" data-id="' + f.id + '"><div class="row between"><div><b>' + esc(f.packageName) + '</b> <span class="small muted">· ' + esc(f.bookingReference) + " · " + esc(f.customerName) + " · " + fmt.date(f.createdAt) + "</span></div>" +
            '<div class="row" style="gap:6px">' + (f.complaint ? badge("FAILED", "Complaint") : "") + badge(f.status) + "</div></div>" +
            '<div class="row" style="gap:16px;margin:6px 0" ><span>' + fmt.stars(f.overallRating) + ' <b>' + f.overallRating + "/5</b></span>" +
            (f.hotelRating ? '<span class="small muted">Hotel ' + f.hotelRating + "/5</span>" : "") + (f.transportRating ? '<span class="small muted">Transport ' + f.transportRating + "/5</span>" : "") + (f.guideRating ? '<span class="small muted">Guide ' + f.guideRating + "/5</span>" : "") + "</div>" +
            "<p style=\"margin:0 0 8px\">" + esc(f.comment) + "</p>" +
            (f.response ? '<div class="panel small"><b>Response by ' + esc(f.respondedBy) + " (" + fmt.date(f.respondedAt) + "):</b> " + esc(f.response) + "</div>" : "") +
            '<div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn sm ghost" data-hide="' + f.id + '">' + (f.status === "HIDDEN" ? "Show publicly" : "Hide from public") + '</button><button class="btn sm" data-respond="' + f.id + '">' + icon("message", 14) + (f.response ? " Edit response" : " Respond") + "</button></div></article>").join("")
            : '<div class="card">' + EL.emptyState("No feedback matches", "message") + "</div>";
        EL.$$("[data-respond]").forEach((b) => b.addEventListener("click", async () => {
            const f = all.find((x) => x.id === Number(b.dataset.respond));
            const text = await EL.prompt({ title: "Respond to " + f.customerName, label: "Your response (the customer is notified)", required: true, max: 1000, ok: "Send response" });
            if (!text) return;
            await api("/api/admin/feedback/" + f.id + "/respond", { method: "POST", body: { response: text } }).catch(EL.toastError);
            EL.toast("Response sent", "success");
            load();
        }));
        EL.$$("[data-hide]").forEach((b) => b.addEventListener("click", async () => {
            const f = all.find((x) => x.id === Number(b.dataset.hide));
            await api("/api/admin/feedback/" + f.id + "/visibility", { method: "POST", body: { hidden: f.status !== "HIDDEN" } });
            load();
        }));
    }
    ["q", "fs", "fr"].forEach((id) => $("#" + id).addEventListener("input", render));
    load().catch(EL.toastError);
})();

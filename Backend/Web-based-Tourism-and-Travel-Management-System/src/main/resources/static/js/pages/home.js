/* Landing page: search, destinations, featured packages, upcoming events and offers. */
(function () {
    const { $, esc, api } = EL;
    EL.publicLayout("home");
    Cards.fillIcons(document);

    const cat = $('#heroSearch [name="category"]');
    EL.CATEGORIES.forEach((c) => cat.insertAdjacentHTML("beforeend", '<option value="' + c + '">' + EL.titleCase(c) + "</option>"));
    $("#heroSearch").addEventListener("submit", (e) => {
        e.preventDefault();
        const d = EL.formData(e.target);
        const p = new URLSearchParams();
        Object.entries(d).forEach(([k, v]) => { if (v) p.set(k, v); });
        location.href = "/packages.html?" + p.toString();
    });

    const DEST = [["Sigiriya", "sigiriya"], ["Kandy", "kandy"], ["Ella", "ella"], ["Mirissa", "mirissa"], ["Yala", "yala"], ["Nuwara Eliya", "nuwara-eliya"],
        ["Galle", "unawatuna"], ["Trincomalee", "trincomalee"], ["Arugam Bay", "arugam-bay"], ["Anuradhapura", "anuradhapura"], ["Adam's Peak", "adams-peak"], ["Horton Plains", "horton-plains"]];
    $("#destinations").innerHTML = DEST.map(([n, img]) => '<a class="dest-card" href="/packages.html?q=' + encodeURIComponent(n) + '"><img loading="lazy" src="/images/destinations/' + img + '.png" alt="' + esc(n) + '"><span>' + esc(n) + "</span></a>").join("");

    $("#featured").innerHTML = EL.skeleton(3);
    api("/api/public/packages", { query: { sort: "popular" } }).then((list) => {
        $("#featured").innerHTML = list.slice(0, 6).map((p) => Cards.packageCard(p)).join("") || EL.emptyState("No tours available right now");
        Cards.bindFavourites($("#featured"));
    }).catch(EL.toastError);

    api("/api/public/events").then((list) => {
        $("#events").innerHTML = list.slice(0, 4).map(Cards.eventCard).join("") || EL.emptyState("No upcoming events", "festival");
        EL.$$("[data-event]").forEach((c) => c.addEventListener("click", () => { location.href = "/events.html?event=" + c.dataset.event; }));
    }).catch(EL.toastError);

    api("/api/public/promotions").then((list) => {
        if (!list.length) { $("#offersSection").classList.add("hidden"); return; }
        $("#offers").innerHTML = list.slice(0, 3).map(Cards.offerCard).join("");
        Cards.bindCopy($("#offers"));
    }).catch(EL.toastError);
})();

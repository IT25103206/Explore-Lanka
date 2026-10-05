/* Customer dashboard - overview & quick access. */
(async function () {
    const { $, esc, fmt, icon, api, badge } = EL;
    const user = await EL.portal({ kind: "customer", active: "dashboard", title: "Dashboard" });
    const page = $("#page");
    page.innerHTML = '<div class="page-intro"><div><h2 style="margin:0">Hello, ' + esc(user.fullName.split(" ")[0]) + '</h2><p>Let\'s plan your next adventure.</p></div>' +
        '<a class="btn green" href="/customer/packages.html">' + icon("plus", 16) + " Book a new tour</a></div>" +
        '<div class="stats" id="stats">' + EL.skeleton(1) + "</div>" +
        '<div class="grid grid-2"><section class="card"><div class="card-head"><h3>My upcoming trips</h3><a href="/customer/bookings.html" class="small">View all</a></div><div id="upcoming"></div></section>' +
        '<section class="card"><div class="card-head"><h3>Action needed</h3></div><div id="actions"></div></section></div>' +
        '<section class="card"><div class="card-head"><h3>Recommended for you</h3><a href="/customer/packages.html" class="small">Browse all</a></div><div class="cards" id="recommended"></div></section>' +
        '<section class="card"><div class="card-head"><h3>Festivals coming up</h3><a href="/customer/festivals.html" class="small">Calendar</a></div><div class="grid grid-2" id="events"></div></section>';

    const d = await api("/api/customer/dashboard");
    $("#stats").innerHTML = [
        ["calendar", d.totalBookings, "Total bookings", "", "/customer/bookings.html"],
        ["route", d.upcomingTrips, "Upcoming trips", "green", "/customer/bookings.html"],
        ["heart", d.wishlistItems, "Wishlist items", "gold", "/customer/wishlist.html"],
        ["star", d.reviews, "Reviews written", "", "/customer/reviews.html"]
    ].map(([ic, n, l, c, h]) => '<a class="stat ' + c + '" href="' + h + '"><div class="ico">' + icon(ic) + "</div><div><b>" + n + "</b><span>" + l + "</span></div></a>").join("");

    $("#upcoming").innerHTML = d.upcoming.length ? d.upcoming.map((b) => '<a class="row" href="/customer/bookings.html?open=' + b.id + '" style="gap:12px;padding:10px 0;border-bottom:1px solid var(--line-2);color:inherit;text-decoration:none;flex-wrap:nowrap">' +
        '<img src="' + esc(b.packageImage) + '" alt="" style="width:84px;height:62px;object-fit:cover;border-radius:10px"><div class="grow"><b>' + esc(b.packageName) + '</b><div class="small muted">' +
        fmt.date(b.startDate) + " - " + fmt.date(b.endDate) + " · " + b.adults + " adult(s)" + (b.children ? ", " + b.children + " child(ren)" : "") + '</div><div class="small muted">Starts in ' + b.daysUntilTravel + " day(s)</div></div>" + badge(b.status) + "</a>").join("")
        : EL.emptyState("No upcoming trips yet. Your next adventure is one click away!", "route");

    $("#actions").innerHTML = d.actionNeeded.length ? d.actionNeeded.map((b) => '<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--line-2)"><div><b>' + esc(b.packageName) + '</b><div class="small muted">' + esc(b.reference) + " · " + fmt.date(b.startDate) + "</div></div>" +
        (b.canPay ? '<a class="btn sm green" href="/customer/pay.html?booking=' + b.id + '">Pay ' + fmt.money(b.totalAmount) + "</a>" : '<a class="btn sm gold" href="/customer/reviews.html?booking=' + b.id + '">' + icon("star", 14) + " Rate your trip</a>") + "</div>").join("")
        : EL.emptyState("You're all set - nothing needs your attention.", "check");

    const [pkgs, events] = await Promise.all([api("/api/public/packages", { query: { sort: "rating" } }), api("/api/public/events")]);
    $("#recommended").innerHTML = pkgs.slice(0, 3).map((p) => Cards.packageCard(p)).join("");
    Cards.bindFavourites($("#recommended"), () => EL.api("/api/customer/dashboard").then((x) => { EL.$("#stats .stat:nth-child(3) b").textContent = x.wishlistItems; }));
    $("#events").innerHTML = events.slice(0, 4).map(Cards.eventCard).join("") || EL.emptyState("No upcoming events", "festival");
    EL.$$("#events [data-event]").forEach((c) => c.addEventListener("click", () => { location.href = "/customer/festivals.html?event=" + c.dataset.event; }));
})();

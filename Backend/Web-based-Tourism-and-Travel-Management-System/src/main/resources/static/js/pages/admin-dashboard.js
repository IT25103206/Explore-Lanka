/* Management dashboard - KPIs and to-do items tailored to the logged-in role. */
(async function () {
    const { $, esc, fmt, icon, api, badge, ROLE } = EL;
    const user = await EL.portal({ kind: "admin", active: "dashboard", title: "Dashboard", roles: EL.STAFF });
    const page = $("#page");
    page.innerHTML = '<div class="page-intro"><div><h2 style="margin:0">Welcome, ' + esc(user.fullName.split(" ")[0]) + '</h2><p>' + esc(user.roleName) + " · " + new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + "</p></div></div>" +
        '<div class="stats" id="stats">' + EL.skeleton(1) + "</div><div id=\"todo\"></div>" +
        '<div class="grid grid-2"><section class="card"><div class="card-head"><h3>Revenue - last 6 months</h3></div><div id="revenue"></div></section>' +
        '<section class="card"><div class="card-head"><h3>Confirmed bookings by theme</h3></div><div id="cats"></div></section></div>' +
        '<section class="card"><div class="card-head"><h3>Recent bookings</h3><a class="small" href="/admin/bookings.html" id="allLink">View all</a></div><div id="recent"></div></section>';

    const d = await api("/api/admin/dashboard");
    const r = user.role;
    const tile = (ic, v, l, c, href) => '<a class="stat ' + (c || "") + '" href="' + href + '"><div class="ico">' + icon(ic) + "</div><div><b>" + v + "</b><span>" + l + "</span></div></a>";
    const tiles = [];
    if ([ROLE.ADMIN, ROLE.FIN].includes(r)) tiles.push(tile("calendar", d.totalBookings, "Total bookings (" + d.bookingsToday + " today)", "", "/admin/bookings.html"));
    if (r === ROLE.LOG) tiles.push(tile("route", d.pendingAllocations, "Bookings needing resources", "red", "/admin/allocations.html"));
    if ([ROLE.ADMIN, ROLE.FIN].includes(r)) tiles.push(tile("money", fmt.money(d.revenueThisMonth), "Revenue this month", "green", "/admin/reports.html"));
    if ([ROLE.ADMIN, ROLE.OPS].includes(r)) tiles.push(tile("package", d.activePackages, "Active packages", "gold", "/admin/packages.html"));
    if (r === ROLE.LOG) tiles.push(tile("bed", d.activeSuppliers, "Active logistic suppliers", "", "/admin/resources.html"));
    if ([ROLE.ADMIN, ROLE.BM].includes(r)) tiles.push(tile("handshake", d.activeSuppliers, "Active partners", "", "/admin/partners.html"));
    if ([ROLE.ADMIN, ROLE.FIN].includes(r)) tiles.push(tile("card", d.pendingPayments + d.awaitingVerification, "Pending payments", "red", "/admin/payments.html"));
    if ([ROLE.ADMIN, ROLE.EVT].includes(r)) tiles.push(tile("festival", d.upcomingEvents, "Upcoming events", "green", "/admin/events.html"));
    if ([ROLE.ADMIN, ROLE.MKT].includes(r)) tiles.push(tile("tag", d.activePromotions, "Running offers", "gold", "/admin/promotions.html"));
    if (r === ROLE.ADMIN) tiles.push(tile("users", d.customers, "Registered customers", "", "/admin/users.html"));
    $("#stats").innerHTML = tiles.join("");

    const todo = [];
    if ([ROLE.ADMIN, ROLE.LOG].includes(r) && d.pendingAllocations) todo.push(["route", d.pendingAllocations + " confirmed booking(s) still need hotels, vehicles or guides", "/admin/allocations.html", "Allocate"]);
    if ([ROLE.ADMIN, ROLE.FIN].includes(r) && d.awaitingVerification) todo.push(["money", d.awaitingVerification + " bank transfer(s) waiting for verification", "/admin/payments.html#verify", "Verify"]);
    if ([ROLE.ADMIN, ROLE.FIN].includes(r) && d.pendingRefunds) todo.push(["card", d.pendingRefunds + " refund request(s) to process", "/admin/payments.html#refunds", "Review"]);
    if (r === ROLE.BM && d.pendingRates) todo.push(["clock", d.pendingRates + " rate change(s) waiting for System Administrator approval", "/admin/partners.html#approvals", "View"]);
    if (r === ROLE.ADMIN && d.pendingRates) todo.push(["handshake", d.pendingRates + " service rate change(s) above 20% need your approval", "/admin/partners.html#approvals", "Approve"]);
    $("#todo").innerHTML = todo.length ? '<section class="card"><div class="card-head"><h3>' + icon("alert") + " Needs attention</h3></div>" + todo.map(([ic, t, h, b]) =>
        '<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--line-2)"><span class="row" style="gap:10px">' + icon(ic) + esc(t) + '</span><a class="btn sm" href="' + h + '">' + b + "</a></div>").join("") + "</section>" : "";

    if (![ROLE.ADMIN, ROLE.FIN].includes(r)) $("#revenue").closest("section").remove();
    else EL.barChart($("#revenue"), d.monthlyRevenue.map((m) => ({ label: m.label.slice(0, 3), value: Number(m.amount) })), { format: fmt.money, axis: (v) => (v / 1000).toFixed(0) + "k", title: "Monthly revenue" });
    if ([ROLE.MKT, ROLE.EVT].includes(r)) $("#cats").closest("section").remove();
    else EL.donutChart($("#cats"), d.bookingsByCategory.map((c) => ({ label: c.label, value: c.count })), { centerLabel: "bookings" });

    if ([ROLE.ADMIN, ROLE.FIN].includes(r)) {
        EL.table($("#recent"), [
            { label: "Booking", render: (b) => "<b>" + esc(b.reference) + "</b>" },
            { label: "Customer", key: "customerName" },
            { label: "Package", key: "packageName" },
            { label: "Travel date", render: (b) => fmt.date(b.startDate) },
            { label: "Status", render: (b) => badge(b.status) },
            { label: "Amount", cls: "right", render: (b) => fmt.money(b.total) }
        ], d.recentBookings, { onRow: (b) => { location.href = "/admin/bookings.html?open=" + b.id; } });
    } else {
        $("#recent").closest("section").remove();
    }
})();

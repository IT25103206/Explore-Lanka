/* Report generation (IT25102242 Nethwin S.W.S): financial & operational report (PBI-24) and tour / supply records (PBI-22). */
(async function () {
    const { $, $$, esc, fmt, icon, api, badge, ROLE } = EL;
    await EL.portal({ kind: "admin", active: "reports", title: "Reports", roles: [ROLE.BM, ROLE.FIN, ROLE.ADMIN] });
    const page = $("#page");
    const today = new Date();
    page.innerHTML = '<div class="tabs" id="tabs"><button class="active" data-t="summary">Financial & operational</button><button data-t="records">Tour & supply records</button></div><div id="body" class="stack" style="margin-top:14px"></div>';
    $$("#tabs button").forEach((b) => b.addEventListener("click", () => { $$("#tabs button").forEach((x) => x.classList.toggle("active", x === b)); (b.dataset.t === "summary" ? summary : records)(); }));

    async function summary() {
        $("#body").innerHTML = '<form class="card toolbar no-print" id="rf"><label class="small row" style="gap:6px">From <input type="date" name="from" required></label><label class="small row" style="gap:6px">To <input type="date" name="to" required></label>' +
            '<select name="category"><option value="">All themes</option>' + EL.CATEGORIES.map((c) => '<option value="' + c + '">' + EL.titleCase(c) + "</option>").join("") + "</select>" +
            '<div class="row" style="gap:6px">' + [["30", "30 days"], ["90", "90 days"], ["365", "12 months"]].map(([d, l]) => '<button type="button" class="chip" data-range="' + d + '">' + l + "</button>").join("") + '</div><span class="grow"></span>' +
            '<button class="btn" type="submit">Generate report</button><button type="button" class="btn ghost" onclick="window.print()">' + icon("print", 16) + '</button></form><div id="out"></div>';
        const f = $("#rf");
        f.from.value = EL.iso(EL.addDays(today, -180));
        f.to.value = EL.iso(today);
        $$("[data-range]").forEach((c) => c.addEventListener("click", () => { f.from.value = EL.iso(EL.addDays(today, -Number(c.dataset.range))); f.to.value = EL.iso(today); f.requestSubmit(); }));
        EL.bindForm(f, async (d) => {
            if (d.to < d.from) { EL.formAlert(f, "The end date must be after the start date"); return; }
            const r = await api("/api/admin/reports/summary", { query: d });
            render(r);
        });
        f.requestSubmit();
    }

    function render(r) {
        const kpi = (ic, v, l, c) => '<div class="stat ' + (c || "") + '"><div class="ico">' + icon(ic) + "</div><div><b>" + v + "</b><span>" + l + "</span></div></div>";
        $("#out").innerHTML = '<div class="print-only"><h2>Explore Lanka - Financial & operational report</h2><p>' + fmt.date(r.from) + " - " + fmt.date(r.to) + (r.category ? " · " + EL.titleCase(r.category) : "") + "</p></div>" +
            '<div class="stats">' + kpi("money", fmt.money(r.netRevenue), "Net revenue", "green") + kpi("card", fmt.money(r.grossRevenue), "Collected payments") + kpi("refresh", fmt.money(r.refunds), "Refunds", "red") +
            kpi("calendar", r.bookings, "Bookings made (" + r.confirmed + " confirmed)") + kpi("users", r.travellers, "Travellers", "gold") + kpi("alert", r.cancellationRate + "%", "Cancellation rate", "red") +
            kpi("tag", fmt.money(r.discounts), "Discounts given") + kpi("star", r.averageRating || "-", "Average rating", "gold") + "</div>" +
            '<div class="grid grid-2"><section class="card"><h3>Revenue by month</h3><div id="c1"></div></section><section class="card"><h3>Bookings by status</h3><div id="c2"></div></section>' +
            '<section class="card"><h3>Revenue by theme</h3><div id="c3"></div></section><section class="card"><h3>Payment methods</h3><div id="c4"></div></section></div>' +
            '<div class="grid grid-2"><section class="card"><div class="card-head"><h3>Top packages</h3><button class="btn sm ghost no-print" id="csv1">' + icon("download", 14) + ' CSV</button></div><div id="t1"></div></section>' +
            '<section class="card"><h3>Trending destinations</h3><div id="t2"></div></section></div>' +
            '<section class="card"><div class="card-head"><h3>Partner performance</h3><button class="btn sm ghost no-print" id="csv2">' + icon("download", 14) + ' CSV</button></div><div id="t3"></div></section>';
        EL.barChart($("#c1"), r.revenueByMonth.map((m) => ({ label: m.label.slice(0, 3) + " " + m.label.slice(-2), value: Number(m.amount) })), { format: fmt.money, axis: (v) => (v / 1000).toFixed(0) + "k" });
        EL.donutChart($("#c2"), r.bookingsByStatus.filter((s) => s.count).map((s) => ({ label: s.label, value: s.count })), { centerLabel: "bookings" });
        EL.donutChart($("#c3"), r.bookingsByCategory.map((c) => ({ label: c.label, value: Number(c.amount) })), { format: fmt.money, center: r.bookingsByCategory.length + " themes", centerLabel: "revenue split" });
        EL.donutChart($("#c4"), r.revenueByMethod.filter((m) => m.count).map((m) => ({ label: m.label, value: Number(m.amount) })), { format: fmt.money, center: r.revenueByMethod.reduce((s, m) => s + m.count, 0) + "", centerLabel: "payments" });
        EL.table($("#t1"), [{ label: "Package", key: "label" }, { label: "Bookings", cls: "right", key: "count" }, { label: "Revenue", cls: "right", render: (x) => fmt.money(x.amount) }], r.topPackages, { empty: "No confirmed bookings in this period" });
        EL.table($("#t2"), [{ label: "Destination", key: "label" }, { label: "Bookings", cls: "right", key: "count" }, { label: "Travellers", cls: "right", render: (x) => Number(x.amount) }], r.topDestinations, { empty: "No data" });
        EL.table($("#t3"), [
            { label: "Supplier", render: (s) => "<b>" + esc(s.name) + '</b><div class="small muted">' + EL.titleCase(s.type) + "</div>" },
            { label: "Status", render: (s) => badge(s.status) },
            { label: "Rating", render: (s) => s.ratingCount ? s.averageRating + " / 5 (" + s.ratingCount + ")" : "-" },
            { label: "Bookings served", cls: "right", key: "allocations" },
            { label: "Revenue", cls: "right", render: (s) => fmt.money(s.revenue) }
        ], r.partnerPerformance, { empty: "No partners" });
        $("#csv1").onclick = () => EL.downloadCsv("top-packages.csv", [{ label: "Package", key: "label" }, { label: "Bookings", key: "count" }, { label: "Revenue", key: "amount" }], r.topPackages);
        $("#csv2").onclick = () => EL.downloadCsv("partner-performance.csv", [{ label: "Supplier", key: "name" }, { label: "Type", key: "type" }, { label: "Status", key: "status" }, { label: "Rating", key: "averageRating" }, { label: "Bookings", key: "allocations" }, { label: "Revenue", key: "revenue" }], r.partnerPerformance);
    }

    async function records() {
        $("#body").innerHTML = '<form class="card toolbar" id="ff"><select name="category"><option value="">All themes</option>' + EL.CATEGORIES.map((c) => '<option value="' + c + '">' + EL.titleCase(c) + "</option>").join("") + '</select>' +
            '<select name="supplierType"><option value="">All supplier types</option><option value="HOTEL">Hotels</option><option value="TRANSPORT">Transport</option><option value="TOUR_GUIDE">Guides</option></select><select name="trend"><option value="">Any trend</option><option value="UP">Trending up</option><option value="DOWN">Trending down</option><option value="STEADY">Steady</option></select></form>' +
            '<section class="card"><div class="card-head"><h3>Tour records</h3><span class="small muted">Bookings in the last 90 days compared with the 90 days before</span></div><div id="tr"></div></section><section class="card"><h3>Logistic supply records</h3><div id="sr"></div></section>';
        const load = async () => {
            const d = EL.formData($("#ff"));
            const r = await api("/api/admin/reports/records", { query: { category: d.category, supplierType: d.supplierType } });
            const tours = r.tours.filter((t) => !d.trend || t.trend === d.trend);
            EL.table($("#tr"), [
                { label: "Package", render: (t) => "<b>" + esc(t.name) + '</b><div class="small muted">' + esc(t.code) + " · " + EL.titleCase(t.category) + " · " + esc(t.region) + "</div>" },
                { label: "Type", render: (t) => badge(t.type) },
                { label: "Status", render: (t) => badge(t.status) },
                { label: "Total sold", cls: "right", key: "totalBookings" },
                { label: "Last 90 d", cls: "right", key: "last90Days" },
                { label: "Prev. 90 d", cls: "right", key: "previous90Days" },
                { label: "Trend", render: (t) => badge(t.trend, t.trend === "UP" ? "▲ Up" : t.trend === "DOWN" ? "▼ Down" : "Steady") },
                { label: "Rating", render: (t) => t.rating || "-" },
                { label: "Revenue", cls: "right", render: (t) => fmt.money(t.revenue) }
            ], tours, { empty: "No tours" });
            EL.table($("#sr"), [
                { label: "Supplier", render: (s) => "<b>" + esc(s.name) + '</b><div class="small muted">' + EL.titleCase(s.type) + "</div>" },
                { label: "Status", render: (s) => badge(s.status) },
                { label: "Resources", cls: "right", key: "resources" },
                { label: "Contract", render: (s) => s.contractVersion ? "v" + s.contractVersion + " until " + fmt.date(s.contractEnd) : "-" },
                { label: "Rating", render: (s) => s.ratingCount ? s.averageRating + " (" + s.ratingCount + ")" : "-" },
                { label: "Bookings served", cls: "right", key: "allocations" },
                { label: "Revenue", cls: "right", render: (s) => fmt.money(s.revenue) }
            ], r.suppliers, { empty: "No suppliers" });
        };
        $("#ff").addEventListener("change", load);
        load().catch(EL.toastError);
    }

    summary();
})();

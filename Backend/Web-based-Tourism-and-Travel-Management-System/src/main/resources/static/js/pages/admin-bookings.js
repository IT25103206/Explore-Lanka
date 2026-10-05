/* Booking management (Finance & Booking Coordinator, Tour Operations Manager): search, view, cancel, complete. */
(async function () {
    const { $, esc, fmt, icon, api, badge, ROLE } = EL;
    const user = await EL.portal({ kind: "admin", active: "bookings", title: "Booking Management", roles: [ROLE.FIN, ROLE.ADMIN] });
    const page = $("#page");
    page.innerHTML = '<div class="page-intro"><p>All reservations across the platform. Passport numbers are masked for privacy.</p><button class="btn ghost" id="csv">' + icon("download", 16) + " Export CSV</button></div>" +
        '<form class="card toolbar" id="filters"><input class="search grow" name="q" placeholder="Search reference, customer or package"><select name="status"><option value="">All statuses</option>' +
        ["PENDING_PAYMENT", "AWAITING_VERIFICATION", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => '<option value="' + s + '">' + EL.titleCase(s) + "</option>").join("") +
        '</select><label class="small row" style="gap:6px">Travel from <input type="date" name="from"></label><label class="small row" style="gap:6px">to <input type="date" name="to"></label></form><div id="list"></div>';

    let rows = [];
    async function load() {
        const q = EL.formData($("#filters"));
        rows = await api("/api/admin/bookings", { query: q });
        EL.table($("#list"), [
            { label: "Booking", render: (b) => "<b>" + esc(b.reference) + '</b><div class="small muted">' + fmt.date(b.createdAt) + "</div>" },
            { label: "Customer", render: (b) => esc(b.customerName) + '<div class="small muted">' + esc(b.customerEmail) + "</div>" },
            { label: "Package", render: (b) => esc(b.packageName) + '<div class="small muted">' + b.adults + "A" + (b.children ? " + " + b.children + "C" : "") + "</div>" },
            { label: "Travel", render: (b) => '<span class="nowrap">' + fmt.short(b.startDate) + " - " + fmt.date(b.endDate) + "</span>" },
            { label: "Status", render: (b) => badge(b.status) + (b.missingResources.length ? '<div class="small" style="color:var(--warning)">Needs ' + esc(b.missingResources.join(", ")) + "</div>" : "") + (b.refundStatus ? "<div>" + badge(b.refundStatus, "Refund " + b.refundStatus.toLowerCase()) + "</div>" : "") },
            { label: "Total", cls: "right", render: (b) => fmt.money(b.totalAmount) }
        ], rows, { empty: "No bookings match these filters", emptyIcon: "calendar", onRow: open });
    }
    $("#filters").addEventListener("input", EL.debounce(load, 350));
    $("#csv").addEventListener("click", () => EL.downloadCsv("bookings.csv", [
        { label: "Reference", key: "reference" }, { label: "Customer", key: "customerName" }, { label: "Email", key: "customerEmail" }, { label: "Package", key: "packageName" },
        { label: "Start", key: "startDate" }, { label: "End", key: "endDate" }, { label: "Adults", key: "adults" }, { label: "Children", key: "children" },
        { label: "Status", key: "status" }, { label: "Total (LKR)", key: "totalAmount" }, { label: "Promo", key: "promoCode" }
    ], rows));

    function open(b) {
        const actions = [];
        if (b.status === "CONFIRMED" || b.status === "COMPLETED") actions.push({ label: icon("route", 16) + " Itinerary", kind: "ghost", closes: false, onClick: () => { BookingViews.showItinerary(b.id); return false; } });
        if (Number(b.paidAmount) > 0) actions.push({ label: icon("print", 16) + " Invoice", kind: "ghost", onClick: () => { location.href = "/admin/invoice.html?booking=" + b.id; } });
        if (b.status === "CONFIRMED" && user.role === ROLE.ADMIN) actions.push({ label: icon("route", 16) + " Allocate resources", kind: "outline", onClick: () => { location.href = "/admin/allocations.html?booking=" + b.id; } });
        if (b.status === "AWAITING_VERIFICATION" && [ROLE.FIN, ROLE.ADMIN].includes(user.role)) actions.push({ label: "Verify transfer", kind: "green", onClick: () => { location.href = "/admin/payments.html#verify"; } });
        if (b.status === "CONFIRMED" && b.endDate < EL.iso(new Date())) actions.push({ label: "Mark completed", kind: "outline", onClick: async () => { await api("/api/admin/bookings/" + b.id + "/complete", { method: "POST" }); EL.toast("Booking completed", "success"); load(); } });
        if (["PENDING_PAYMENT", "AWAITING_VERIFICATION", "CONFIRMED"].includes(b.status)) actions.push({
            label: "Cancel booking", kind: "danger outline", onClick: async () => {
                const reason = await EL.prompt({ title: "Cancel " + b.reference, label: "Reason (shared with the customer)", required: true, danger: true, ok: "Cancel booking",
                    message: Number(b.paidAmount) > 0 ? "A refund request for " + fmt.money(b.paidAmount) + " will be created automatically." : "" });
                if (!reason) return;
                try { await api("/api/admin/bookings/" + b.id + "/cancel", { method: "POST", body: { reason } }); EL.toast("Booking cancelled", "success"); load(); } catch (e) { EL.toastError(e); }
            }
        });
        EL.modal({ title: "Booking " + b.reference, size: "xl", body: BookingViews.detailsHtml(b, true), actions: actions.length ? actions : [{ label: "Close" }] });
    }

    await load();
    const openId = EL.qs("open");
    if (openId) { const b = rows.find((x) => String(x.id) === openId); if (b) open(b); else api("/api/admin/bookings/" + openId).then(open).catch(EL.toastError); }
})();

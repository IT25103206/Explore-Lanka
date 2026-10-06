/* Printable invoice (Payment Management). ?booking=<id>; staff pages use data-kind="admin". */
(async function () {
    const { $, esc, fmt, api, icon } = EL;
    const kind = document.body.dataset.kind;
    await EL.portal({ kind, active: kind === "customer" ? "payments" : "bookings", title: "Invoice" });
    const id = EL.qs("booking");
    const page = $("#page");
    let inv;
    try { inv = await api(kind === "customer" ? "/api/customer/bookings/" + id + "/invoice" : "/api/admin/bookings/" + id + "/invoice"); }
    catch (e) { page.innerHTML = '<div class="card">' + EL.emptyState(e.message, "card") + "</div>"; return; }
    page.innerHTML = '<div class="row between no-print"><a class="btn ghost" href="javascript:history.back()">&larr; Back</a><button class="btn" onclick="window.print()">' + icon("print", 16) + " Print / Save as PDF</button></div>" +
        '<article class="card" style="max-width:820px;margin:0 auto;width:100%;padding:34px"><div class="row between" style="align-items:flex-start"><div class="brand"><div><b>EXPLORE LANKA</b><small>Trips of a thousand lifetimes</small></div></div>' +
        '<div class="right"><h2 style="margin:0">Invoice</h2><div class="small muted">' + esc(inv.invoiceNo) + "<br>Issued " + fmt.date(inv.issuedAt) + "</div></div></div><hr class=\"divider\">" +
        '<div class="grid grid-2"><div><div class="label">Billed to</div><b>' + esc(inv.customerName) + '</b><div class="small">' + esc(inv.customerEmail) + '</div></div><div><div class="label">Booking</div><b>' + esc(inv.bookingReference) + "</b><div class=\"small\">" +
        esc(inv.packageName) + "<br>" + fmt.date(inv.startDate) + " - " + fmt.date(inv.endDate) + " · " + inv.adults + " adult(s)" + (inv.children ? ", " + inv.children + " child(ren)" : "") + "</div></div></div>" +
        '<table class="breakdown" style="margin-top:22px">' + inv.lines.map((l) => "<tr><td>" + esc(l.description) + "</td><td>" + fmt.money(l.amount) + "</td></tr>").join("") +
        "<tr><td><b>Subtotal</b></td><td>" + fmt.money(inv.subtotal) + "</td></tr>" + (Number(inv.discount) ? '<tr class="discount"><td>Discount ' + esc(inv.promoCode || "") + "</td><td>- " + fmt.money(inv.discount) + "</td></tr>" : "") +
        '<tr class="total"><td>Total paid</td><td>' + fmt.money(inv.total) + "</td></tr></table>" +
        '<p class="small muted" style="margin-top:20px">Paid by ' + esc(EL.titleCase(inv.paymentMethod || "")) + " on " + fmt.dateTime(inv.paidAt) + " · Transaction " + esc(inv.transactionRef || "-") +
        "<br>Explore Lanka (Pvt) Ltd · No. 25, Galle Road, Colombo 03 · +94 11 234 5678 · hello@explorelanka.lk</p></article>";
})();

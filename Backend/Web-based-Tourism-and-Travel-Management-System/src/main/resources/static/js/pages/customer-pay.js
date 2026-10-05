/* Payment interface (UC-06 step 7, extension 7a). Simulated gateway - card numbers are never stored. */
(async function () {
    const { $, $$, esc, fmt, icon, api } = EL;
    await EL.portal({ kind: "customer", active: "bookings", title: "Payment" });
    const page = $("#page");
    const id = EL.qs("booking");
    let b;
    try { b = await api("/api/customer/bookings/" + id); } catch (e) { page.innerHTML = '<div class="card">' + EL.emptyState("Booking not found", "card") + "</div>"; return; }
    if (!b.canPay) {
        page.innerHTML = '<div class="card center stack">' + EL.emptyState("This booking does not need a payment (" + EL.titleCase(b.status) + ").", "check") +
            '<a class="btn" href="/customer/bookings.html?open=' + b.id + '">View booking</a></div>';
        return;
    }

    page.innerHTML = '<div class="grid grid-2" style="align-items:start">' +
        '<div class="card"><h3>Payment summary</h3><div class="row" style="gap:12px;margin-bottom:12px"><img src="' + esc(b.packageImage) + '" alt="" style="width:90px;height:66px;object-fit:cover;border-radius:10px"><div><b>' + esc(b.packageName) + '</b><div class="small muted">' + esc(b.reference) + " · " + fmt.date(b.startDate) + " - " + fmt.date(b.endDate) + '</div><div class="small muted">' +
        b.adults + " adult(s)" + (b.children ? ", " + b.children + " child(ren)" : "") + "</div></div></div>" +
        '<table class="breakdown"><tr><td>Package</td><td>' + fmt.money(b.packageCost) + "</td></tr>" + (Number(b.accommodationCost) ? "<tr><td>Accommodation - " + esc(b.hotelName) + "</td><td>" + fmt.money(b.accommodationCost) + "</td></tr>" : "") +
        (b.vehicleName ? "<tr><td>Transport - " + esc(b.vehicleName) + "</td><td>" + fmt.money(b.transportCost) + "</td></tr>" : "") + (Number(b.guideCost) ? "<tr><td>Tour guide</td><td>" + fmt.money(b.guideCost) + "</td></tr>" : "") +
        (Number(b.discountAmount) ? '<tr class="discount"><td>Discount (' + esc(b.promoCode) + ")</td><td>- " + fmt.money(b.discountAmount) + "</td></tr>" : "") +
        '<tr class="total"><td>Total to pay</td><td>' + fmt.money(b.totalAmount) + "</td></tr></table>" +
        '<div class="row" style="margin-top:14px"><a class="btn ghost sm" href="/customer/book.html?edit=' + b.id + '">' + icon("edit", 14) + " Change booking</a></div></div>" +
        '<form class="card" id="payForm"><h3>Select payment method</h3>' +
        '<div class="options" style="grid-template-columns:1fr">' +
        [["CARD", "card", "Credit / Debit card", "Visa, Mastercard, Amex - confirmed instantly"], ["BANK_TRANSFER", "money", "Online bank transfer", "Confirmed after our finance team verifies the transfer"], ["EZ_CASH", "message", "Mobile payment (eZ Cash)", "Pay from your eZ Cash wallet - confirmed instantly"]]
            .map(([v, ic, t, d], i) => '<label class="option ' + (i === 0 ? "selected" : "") + '"><input type="radio" name="method" value="' + v + '" ' + (i === 0 ? "checked" : "") + '><div class="avatar" style="background:var(--brown-50);color:var(--brown)">' + icon(ic) + '</div><div><div class="t">' + t + '</div><div class="d">' + d + "</div></div></label>").join("") +
        "</div>" +
        '<div data-m="CARD" class="form-grid" style="margin-top:16px">' +
        EL.field({ name: "cardHolder", label: "Name on card", required: true, full: true, attrs: { pattern: EL.PATTERNS.name, "data-msg": "Enter the name shown on the card", autocomplete: "cc-name" } }) +
        EL.field({ name: "cardNumber", label: "Card number", required: true, full: true, placeholder: "1234 5678 9012 3456", attrs: { inputmode: "numeric", pattern: "[0-9 ]{13,23}", "data-msg": "Enter a valid card number", autocomplete: "cc-number", maxlength: 23 } }) +
        EL.field({ name: "expiry", label: "Expiry (MM/YY)", required: true, placeholder: "08/28", attrs: { pattern: "(0[1-9]|1[0-2])/[0-9]{2}", "data-msg": "Use MM/YY", autocomplete: "cc-exp", maxlength: 5 } }) +
        EL.field({ name: "cvv", label: "CVV", type: "password", required: true, attrs: { inputmode: "numeric", pattern: "[0-9]{3,4}", "data-msg": "3 or 4 digits", autocomplete: "cc-csc", maxlength: 4 } }) +
        '<div class="full small muted">Test cards: 4242 4242 4242 4242 (success) · 4000 0000 0000 0002 (declined)</div></div>' +
        '<div data-m="BANK_TRANSFER" class="form-grid hidden" style="margin-top:16px"><div class="full alert info small">Transfer <b>' + fmt.money(b.totalAmount) + "</b> to Explore Lanka (Pvt) Ltd · Bank of Ceylon · A/C 0081234567 · Ref: " + esc(b.reference) + "</div>" +
        EL.field({ name: "bankName", label: "Your bank", type: "select", required: true, placeholder: "Select bank", options: ["Bank of Ceylon", "People's Bank", "Commercial Bank", "Hatton National Bank", "Sampath Bank", "NDB Bank", "Seylan Bank"] }) +
        EL.field({ name: "bankReference", label: "Transfer reference no.", required: true, attrs: { pattern: "[A-Za-z0-9\\-]{6,30}", "data-msg": "6-30 letters or digits", maxlength: 30 } }) + "</div>" +
        '<div data-m="EZ_CASH" class="form-grid hidden" style="margin-top:16px">' +
        EL.field({ name: "mobileNumber", label: "eZ Cash mobile number", required: true, placeholder: "0771234567", attrs: { inputmode: "tel", pattern: "07[0-9]{8}", "data-msg": "Enter a mobile number like 0771234567", maxlength: 10 } }) +
        EL.field({ name: "pin", label: "eZ Cash PIN", type: "password", required: true, attrs: { inputmode: "numeric", pattern: "[0-9]{4}", "data-msg": "4 digits", maxlength: 4 } }) + "</div>" +
        '<button class="btn green block" type="submit" style="margin-top:18px">' + icon("shield", 16) + " Pay " + fmt.money(b.totalAmount) + "</button>" +
        '<p class="notice" style="margin-top:10px">' + icon("shield", 13) + " Your payment is secure. This academic system uses a simulated payment gateway.</p></form></div>";

    const f = $("#payForm");
    const sync = () => {
        const m = f.querySelector('[name="method"]:checked').value;
        $$("[data-m]", f).forEach((s) => { const on = s.dataset.m === m; s.classList.toggle("hidden", !on); $$("input,select", s).forEach((x) => { x.disabled = !on; }); });
        $$(".option", f).forEach((o) => o.classList.toggle("selected", o.querySelector("input").checked));
    };
    $$('[name="method"]', f).forEach((r) => r.addEventListener("change", sync));
    sync();
    f.cardNumber.addEventListener("input", (e) => { e.target.value = e.target.value.replace(/[^\d]/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim(); });
    f.expiry.addEventListener("input", (e) => { let v = e.target.value.replace(/[^\d]/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); e.target.value = v; });

    EL.bindForm(f, async (d) => {
        try {
            const r = await api("/api/customer/bookings/" + b.id + "/payments", { method: "POST", body: d });
            const ok = r.data.status === "SUCCESS";
            page.innerHTML = '<div class="card center stack" style="max-width:560px;margin:0 auto"><div style="color:' + (ok ? "var(--green)" : "var(--gold)") + '">' + icon(ok ? "check" : "clock", 54) + "</div>" +
                "<h2>" + (ok ? "Payment successful!" : "Transfer recorded") + '</h2><p class="muted">' + esc(r.message) + "</p>" +
                '<dl class="kv" style="text-align:left;margin:0 auto"><dt>Booking</dt><dd>' + esc(b.reference) + "</dd><dt>Amount</dt><dd>" + fmt.money(r.data.amount) + "</dd><dt>Method</dt><dd>" + esc(r.data.maskedDetails) + "</dd><dt>Transaction</dt><dd>" + esc(r.data.transactionRef) + "</dd></dl>" +
                '<div class="row" style="justify-content:center"><a class="btn" href="/customer/bookings.html?open=' + b.id + '">View booking</a>' + (ok ? '<a class="btn ghost" href="/customer/invoice.html?booking=' + b.id + '">' + icon("print", 16) + " Invoice</a>" : "") + "</div></div>";
            EL.refreshBell();
        } catch (err) {
            if (err.status === 402) { EL.formAlert(f, err.message); return; }   // 7a: retry or choose another method
            throw err;
        }
    });
})();

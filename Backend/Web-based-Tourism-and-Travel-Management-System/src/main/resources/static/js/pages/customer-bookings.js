/* My bookings: view, pay, modify, cancel (PBI-06), itinerary, invoice, review. */
(async function () {
    const { $, $$, esc, fmt, icon, api, badge } = EL;
    await EL.portal({ kind: "customer", active: "bookings", title: "My Bookings" });
    const page = $("#page");
    page.innerHTML = '<div class="page-intro"><p>Changes and cancellations are possible up to 7 days before travel. Confirmed bookings can update traveller details and special requests.</p><a class="btn green" href="/packages.html">' + icon("plus", 16) + " New booking</a></div>" +
        '<div class="tabs" id="tabs"></div><div id="list" class="stack"></div>';

    let bookings = [];
    let tab = "upcoming";
    const today = EL.iso(new Date());
    const groups = {
        upcoming: (b) => (b.status === "CONFIRMED" || b.status === "AWAITING_VERIFICATION") && b.endDate >= today,
        pending: (b) => b.status === "PENDING_PAYMENT",
        past: (b) => b.status === "COMPLETED" || (b.status === "CONFIRMED" && b.endDate < today),
        cancelled: (b) => b.status === "CANCELLED"
    };

    async function load() {
        bookings = await api("/api/customer/bookings");
        render();
        const open = EL.qs("open");
        if (open) { history.replaceState(null, "", location.pathname); const b = bookings.find((x) => String(x.id) === open); if (b) openDetails(b); }
    }
    function render() {
        $("#tabs").innerHTML = [["upcoming", "Upcoming"], ["pending", "Awaiting payment"], ["past", "Past trips"], ["cancelled", "Cancelled"]]
            .map(([k, l]) => '<button data-tab="' + k + '" class="' + (k === tab ? "active" : "") + '">' + l + '<span class="count">' + bookings.filter(groups[k]).length + "</span></button>").join("");
        $$("#tabs button").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; render(); }));
        const list = bookings.filter(groups[tab]);
        $("#list").innerHTML = list.length ? list.map((b) => '<article class="card" style="padding:14px"><div class="row" style="gap:14px;align-items:flex-start">' +
            '<img src="' + esc(b.packageImage) + '" alt="" style="width:120px;height:86px;object-fit:cover;border-radius:10px">' +
            '<div class="grow" style="min-width:200px"><div class="row" style="gap:8px">' + badge(b.status) + (b.refundStatus ? badge(b.refundStatus, "Refund " + b.refundStatus.toLowerCase()) : "") + '<span class="small muted">' + esc(b.reference) + "</span></div>" +
            '<h3 style="margin:6px 0 2px">' + esc(b.packageName) + '</h3><div class="small muted">' + fmt.date(b.startDate) + " - " + fmt.date(b.endDate) + " · " + b.adults + " adult(s)" + (b.children ? ", " + b.children + " child(ren)" : "") +
            (b.hotelName ? " · " + esc(b.hotelName) : "") + "</div>" + (b.status === "CONFIRMED" && b.daysUntilTravel >= 0 ? '<div class="small" style="color:var(--green)">Starts in ' + b.daysUntilTravel + " day(s)</div>" : "") + "</div>" +
            '<div class="right"><div style="font-weight:700;color:var(--brown);font-size:1.1rem">' + fmt.money(b.totalAmount) + '</div><div class="row" style="justify-content:flex-end;margin-top:8px;gap:6px">' +
            (b.canPay ? '<a class="btn sm green" href="/customer/pay.html?booking=' + b.id + '">Pay now</a>' : "") +
            (b.canReview ? '<button class="btn sm gold" data-review="' + b.id + '">' + icon("star", 14) + " Rate trip</button>" : "") +
            '<button class="btn sm ghost" data-open="' + b.id + '">Details</button></div></div></div></article>').join("")
            : '<div class="card">' + EL.emptyState({ upcoming: "No upcoming trips.", pending: "No bookings waiting for payment.", past: "No past trips yet.", cancelled: "No cancelled bookings." }[tab], "calendar") + "</div>";
        $$("[data-open]").forEach((btn) => btn.addEventListener("click", () => openDetails(bookings.find((x) => x.id === Number(btn.dataset.open)))));
        $$("[data-review]").forEach((btn) => btn.addEventListener("click", () => BookingViews.reviewForm(bookings.find((x) => x.id === Number(btn.dataset.review)), load)));
    }

    function openDetails(b) {
        const actions = [];
        if (b.status === "CONFIRMED" || b.status === "COMPLETED") actions.push({ label: icon("route", 16) + " Itinerary", kind: "ghost", closes: false, onClick: () => { BookingViews.showItinerary(b.id); return false; } });
        if (Number(b.paidAmount) > 0 && b.status !== "AWAITING_VERIFICATION") actions.push({ label: icon("print", 16) + " Invoice", kind: "ghost", onClick: () => { location.href = "/customer/invoice.html?booking=" + b.id; } });
        if (b.canModify) actions.push({ label: icon("edit", 16) + " Modify", kind: "outline", onClick: () => (b.canEditAll ? (location.href = "/customer/book.html?edit=" + b.id) : editTravellers(b)) });
        if (b.canCancel) actions.push({ label: "Cancel booking", kind: "danger outline", onClick: () => cancel(b) });
        if (b.canPay) actions.push({ label: "Pay " + fmt.money(b.totalAmount), kind: "green", onClick: () => { location.href = "/customer/pay.html?booking=" + b.id; } });
        if (b.canReview) actions.push({ label: icon("star", 16) + " Rate trip", kind: "gold", onClick: () => BookingViews.reviewForm(b, load) });
        const note = b.status !== "CANCELLED" && b.status !== "COMPLETED" && !b.canModify
            ? '<div class="alert info small" style="margin-bottom:14px">This trip starts within 7 days, so it can no longer be changed online. Please contact support on +94 11 234 5678.</div>' : "";
        EL.modal({ title: "Booking " + b.reference, size: "xl", body: note + BookingViews.detailsHtml(b, false), actions: actions.length ? actions : [{ label: "Close" }] });
    }

    function editTravellers(b) {
        const form = document.createElement("form");
        form.innerHTML = '<p class="muted small">Your booking is paid, so only traveller details and special requests can be changed. To change dates or options, cancel and book again.</p>' +
            b.travelers.map((t, i) => '<div class="panel" style="margin-bottom:10px"><b>' + (t.type === "ADULT" ? "Adult" : "Child") + '</b><div class="form-grid cols-3" style="margin-top:6px">' +
                EL.field({ name: "t" + i + "_fullName", label: "Full name", required: true, attrs: { pattern: EL.PATTERNS.name, "data-msg": "Letters and spaces only" } }) +
                EL.field({ name: "t" + i + "_age", label: "Age", type: "number", required: true, attrs: t.type === "ADULT" ? { min: 12, max: 120 } : { min: 0, max: 11 } }) +
                EL.field({ name: "t" + i + "_passportOrNic", label: "Passport / NIC", attrs: { pattern: "[A-Za-z0-9]{5,20}", "data-msg": "5-20 letters and digits" } }) + "</div></div>").join("") +
            EL.field({ name: "specialRequests", label: "Special requests", type: "textarea", attrs: { maxlength: 1000 } });
        const vals = { specialRequests: b.specialRequests };
        b.travelers.forEach((t, i) => { vals["t" + i + "_fullName"] = t.fullName; vals["t" + i + "_age"] = t.age; vals["t" + i + "_passportOrNic"] = t.passportOrNic; });
        EL.fill(form, vals);
        EL.modal({
            title: "Update travellers · " + b.reference, body: form, size: "lg",
            actions: [{ label: "Cancel", kind: "ghost" }, {
                label: "Save changes", onClick: async () => {
                    if (!EL.validate(form)) return false;
                    const d = EL.formData(form);
                    const travelers = b.travelers.map((t, i) => ({ type: t.type, nationality: t.nationality, fullName: d["t" + i + "_fullName"], age: d["t" + i + "_age"], passportOrNic: d["t" + i + "_passportOrNic"] }));
                    await api("/api/customer/bookings/" + b.id + "/travellers", { method: "PUT", body: { specialRequests: d.specialRequests, travelers } });
                    EL.toast("Booking updated", "success");
                    load();
                }
            }]
        });
    }

    async function cancel(b) {
        const paid = Number(b.paidAmount) > 0;
        const reason = await EL.prompt({
            title: "Cancel booking " + b.reference, label: "Reason for cancelling", required: true, ok: "Cancel booking", danger: true,
            message: paid ? "You are cancelling more than 7 days before travel, so a full refund of " + fmt.money(b.paidAmount) + " will be requested for you." : "Your unpaid reservation will be released."
        });
        if (!reason) return;
        try {
            await api("/api/customer/bookings/" + b.id + "/cancel", { method: "POST", body: { reason } });
            EL.toast("Booking cancelled" + (paid ? " - refund requested" : ""), "success");
            load();
        } catch (e) { EL.toastError(e); }
    }

    load();
})();

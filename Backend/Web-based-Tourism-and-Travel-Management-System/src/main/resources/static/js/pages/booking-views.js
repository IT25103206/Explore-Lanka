/* Booking detail views shared by the customer and staff portals: details, itinerary, review form. */
(function () {
    const { esc, fmt, icon, api, badge, titleCase } = EL;

    function costTable(b) {
        return '<table class="breakdown"><tr><td>Package</td><td>' + fmt.money(b.packageCost) + "</td></tr>" +
            (Number(b.accommodationCost) ? "<tr><td>Accommodation</td><td>" + fmt.money(b.accommodationCost) + "</td></tr>" : "") +
            (Number(b.transportCost) ? "<tr><td>Transport</td><td>" + fmt.money(b.transportCost) + "</td></tr>" : "") +
            (Number(b.guideCost) ? "<tr><td>Tour guide</td><td>" + fmt.money(b.guideCost) + "</td></tr>" : "") +
            (Number(b.discountAmount) ? '<tr class="discount"><td>Discount ' + esc(b.promoCode || "") + "</td><td>- " + fmt.money(b.discountAmount) + "</td></tr>" : "") +
            '<tr class="total"><td>Total</td><td>' + fmt.money(b.totalAmount) + "</td></tr></table>";
    }

    function detailsHtml(b, staff) {
        const allocations = b.allocations.length ? b.allocations.map((a) => '<li><span class="badge ' + (a.resourceType === "HOTEL" ? "brown" : a.resourceType === "VEHICLE" ? "blue" : "green") + '">' + a.resourceType + "</span> " + esc(a.resourceName) +
            (a.resourceType === "HOTEL" ? " · " + a.quantity + " room(s)" : "") + "</li>").join("") : '<li class="muted">Assigned after payment</li>';
        return '<div class="grid grid-2" style="align-items:start"><div class="stack">' +
            '<div class="row" style="gap:12px"><img src="' + esc(b.packageImage) + '" alt="" style="width:96px;height:70px;object-fit:cover;border-radius:10px"><div><h3 style="margin:0">' + esc(b.packageName) + "</h3>" +
            '<div class="small muted">' + esc(b.reference) + " · booked " + fmt.date(b.createdAt) + '</div><div style="margin-top:4px">' + badge(b.status) + (b.refundStatus ? " " + badge(b.refundStatus, "Refund " + b.refundStatus.toLowerCase()) : "") + "</div></div></div>" +
            '<dl class="kv"><dt>Dates</dt><dd>' + fmt.date(b.startDate) + " - " + fmt.date(b.endDate) + " (" + (b.nights + 1) + " days)</dd>" +
            (staff ? "<dt>Customer</dt><dd>" + esc(b.customerName) + "<br><span class=\"small muted\">" + esc(b.customerEmail) + (b.customerPhone ? " · " + esc(b.customerPhone) : "") + "</span></dd>" : "") +
            "<dt>Travellers</dt><dd>" + b.adults + " adult(s)" + (b.children ? ", " + b.children + " child(ren)" : "") + "</dd>" +
            (b.hotelName ? "<dt>Hotel choice</dt><dd>" + esc(b.hotelName) + " · " + b.rooms + " room(s)</dd>" : "") +
            "<dt>Transport choice</dt><dd>" + (b.vehicleName ? esc(b.vehicleName) : "Own arrangement (not included)") + "</dd><dt>Guide</dt><dd>" + (b.guideRequired ? "Yes" + (b.guideLanguage ? " (" + esc(b.guideLanguage) + ")" : "") : "No") + "</dd>" +
            (b.specialRequests ? "<dt>Requests</dt><dd>" + esc(b.specialRequests) + "</dd>" : "") +
            (b.cancellationReason ? "<dt>Cancelled</dt><dd>" + fmt.dateTime(b.cancelledAt) + "<br><span class=\"small muted\">" + esc(b.cancellationReason) + "</span></dd>" : "") + "</dl>" +
            "<div><h4>Allocated resources</h4><ul class=\"small\" style=\"padding-left:0;list-style:none;display:grid;gap:6px\">" + allocations + "</ul>" +
            (b.missingResources && b.missingResources.length ? '<div class="alert warning small">Still to be assigned: ' + esc(b.missingResources.join(", ")) + "</div>" : "") + "</div></div>" +
            '<div class="stack"><div><h4>Costs</h4>' + costTable(b) + (Number(b.paidAmount) ? '<div class="small muted" style="margin-top:6px">Paid: ' + fmt.money(b.paidAmount) + "</div>" : "") + "</div>" +
            "<div><h4>Travellers</h4><div class=\"table-wrap\"><table class=\"table\"><thead><tr><th>Name</th><th>Type</th><th>Age</th><th>ID</th></tr></thead><tbody>" +
            b.travelers.map((t) => "<tr><td>" + esc(t.fullName) + "</td><td>" + titleCase(t.type) + "</td><td>" + t.age + "</td><td>" + esc(t.passportOrNic || "-") + "</td></tr>").join("") + "</tbody></table></div></div></div></div>";
    }

    async function showItinerary(bookingId) {
        try {
            const it = await api("/api/itineraries/" + bookingId);
            EL.modal({
                title: "Itinerary · " + it.reference, size: "lg",
                body: '<p class="muted small">' + esc(it.packageName) + " · " + fmt.date(it.startDate) + " - " + fmt.date(it.endDate) + "</p>" +
                    (it.resources.length ? '<div class="panel small" style="margin-bottom:14px">' + it.resources.map(esc).join("<br>") + "</div>" : "") +
                    '<ol class="timeline">' + it.items.map((i) => '<li class="' + i.type.toLowerCase() + '"><b>Day ' + i.dayNumber + " · " + fmt.short(i.date) + " - " + esc(i.title) + "</b>" +
                        (i.type !== "ACTIVITY" ? " " + badge(i.type === "EVENT" ? "PUBLISHED" : "STANDARD", i.type === "EVENT" ? "Festival" : "Guide waypoint") : "") +
                        (i.description ? '<div class="small">' + esc(i.description) + "</div>" : "") +
                        (i.location ? '<div class="small muted">' + icon("map", 12) + " " + esc(i.location) + "</div>" : "") +
                        (i.route ? '<div class="small muted">' + icon("route", 12) + " " + esc(i.route) + "</div>" : "") + "</li>").join("") + "</ol>",
                actions: [{ label: icon("print", 16) + " Print", kind: "ghost", closes: false, onClick: () => { window.print(); return false; } }, { label: "Close" }]
            });
        } catch (e) { EL.toastError(e); }
    }

    function starInput(name, value) {
        return '<div class="star-input" data-stars="' + name + '"><input type="hidden" name="' + name + '" value="' + (value || "") + '">' +
            [1, 2, 3, 4, 5].map((n) => '<button type="button" data-v="' + n + '" class="' + (n <= (value || 0) ? "on" : "") + '" aria-label="' + n + ' stars">★</button>').join("") + "</div>";
    }
    function bindStars(root) {
        EL.$$("[data-stars]", root).forEach((box) => {
            const input = box.querySelector("input");
            EL.$$("button", box).forEach((b) => b.addEventListener("click", () => {
                input.value = b.dataset.v;
                EL.$$("button", box).forEach((x) => x.classList.toggle("on", Number(x.dataset.v) <= Number(b.dataset.v)));
                const f = box.closest(".field"); if (f) f.classList.remove("invalid");
            }));
        });
    }

    /** PBI-08 submit feedback & ratings after the tour. */
    function reviewForm(b, onDone) {
        const form = document.createElement("form");
        form.innerHTML = '<p class="muted small">' + esc(b.packageName) + " · " + fmt.date(b.startDate) + " - " + fmt.date(b.endDate) + "</p>" +
            '<div class="form-grid"><div class="field full"><label>Overall experience *</label>' + starInput("overallRating") + '<span class="error"></span></div>' +
            (b.rooms ? '<div class="field"><label>Hotel</label>' + starInput("hotelRating") + "</div>" : "") +
            (b.vehicleName ? '<div class="field"><label>Transport & driver</label>' + starInput("transportRating") + "</div>" : "") +
            (b.guideRequired ? '<div class="field"><label>Tour guide</label>' + starInput("guideRating") + "</div>" : "") +
            EL.field({ name: "comment", label: "Your review", type: "textarea", required: true, full: true, placeholder: "What did you enjoy? What could be better?", attrs: { minlength: 10, maxlength: 2000 } }) +
            '<label class="check full"><input type="checkbox" name="complaint"> This is a complaint - please contact me</label></div>';
        bindStars(form);
        EL.modal({
            title: "Rate your trip", body: form, size: "lg",
            actions: [{ label: "Cancel", kind: "ghost" }, {
                label: "Submit review", kind: "green", onClick: async () => {
                    if (!EL.validate(form)) return false;
                    const d = EL.formData(form);
                    if (!d.overallRating) { form.querySelector('[data-stars="overallRating"]').closest(".field").classList.add("invalid"); form.querySelector('[data-stars="overallRating"]').closest(".field").querySelector(".error").textContent = "Choose a rating"; return false; }
                    if (d.comment && d.comment.length < 10) { EL.handleFormError(form, { message: "Please correct the highlighted fields", errors: { comment: "Write at least 10 characters" } }); return false; }
                    ["overallRating", "hotelRating", "transportRating", "guideRating"].forEach((k) => { d[k] = d[k] ? Number(d[k]) : null; });
                    await api("/api/customer/bookings/" + b.id + "/feedback", { method: "POST", body: d });
                    EL.toast("Thank you for your feedback!", "success");
                    if (onDone) onDone();
                }
            }]
        });
    }

    window.BookingViews = { detailsHtml, costTable, showItinerary, reviewForm, starInput, bindStars };
})();

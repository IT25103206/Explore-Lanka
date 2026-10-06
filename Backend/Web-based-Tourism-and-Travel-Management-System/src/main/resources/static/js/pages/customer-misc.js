/* Smaller customer pages: wishlist, payments & refunds, my events, reviews. The page is chosen by data-page on <body>. */
(async function () {
    const { $, $$, esc, fmt, icon, api, badge } = EL;
    const which = document.body.dataset.page;
    const titles = { wishlist: "Wishlist", payments: "Payments & Refunds", events: "My Events", reviews: "Reviews" };
    await EL.portal({ kind: "customer", active: which, title: titles[which] });
    const page = $("#page");

    // ------------------------------------------------------------------ wishlist
    async function wishlist() {
        page.innerHTML = '<div class="page-intro"><p>Packages you saved for later. Prices shown are today\'s price per adult.</p></div><div class="cards" id="list"></div>';
        const list = await api("/api/customer/wishlist");
        $("#list").innerHTML = list.length ? list.map((w) => '<article class="pkg-card"><div class="media"><img src="' + esc(w.imageUrl) + '" alt=""></div><div class="body"><h3><a href="/tour.html?id=' + w.packageId + '">' + esc(w.name) + "</a></h3>" +
            '<div class="meta"><span>' + icon("clock", 13) + " " + w.durationDays + " days</span><span>" + esc(w.region) + "</span><span>Saved " + fmt.date(w.addedAt) + "</span></div>" +
            '<div class="price"><div><small>Per adult</small><b>' + fmt.money(w.price) + '</b></div><div class="row" style="gap:6px"><button class="icon-btn danger" data-remove="' + w.packageId + '" title="Remove">' + icon("trash", 16) + "</button>" +
            (w.bookable ? '<a class="btn sm green" href="/customer/book.html?package=' + w.packageId + '">Book</a>' : '<span class="badge red">Unavailable</span>') + "</div></div></div></article>").join("")
            : '<div class="card" style="grid-column:1/-1">' + EL.emptyState("Your wishlist is empty. Tap the heart on any tour to save it.", "heart") + '<div class="center"><a class="btn" href="/customer/packages.html">View tour packages</a></div></div>';
        $$("[data-remove]").forEach((b) => b.addEventListener("click", async () => {
            await api("/api/customer/wishlist/" + b.dataset.remove, { method: "DELETE" });
            EL.toast("Removed from wishlist");
            wishlist();
        }));
    }

    // ------------------------------------------------------------------ payments & refunds
    async function payments() {
        page.innerHTML = '<section class="card"><div class="card-head"><h3>Payment history</h3></div><div id="pay"></div></section><section class="card"><div class="card-head"><h3>Refunds</h3></div><div id="ref"></div></section>';
        const [pays, refunds] = await Promise.all([api("/api/customer/payments"), api("/api/customer/refunds")]);
        EL.table($("#pay"), [
            { label: "Date", render: (p) => fmt.dateTime(p.createdAt) },
            { label: "Booking", render: (p) => '<a href="/customer/bookings.html?open=' + p.bookingId + '">' + esc(p.bookingReference) + "</a>" },
            { label: "Method", render: (p) => esc(EL.titleCase(p.method)) + '<div class="small muted">' + esc(p.maskedDetails || "") + "</div>" },
            { label: "Transaction", render: (p) => '<span class="small">' + esc(p.transactionRef) + "</span>" },
            { label: "Amount", cls: "right", render: (p) => fmt.money(p.amount) },
            { label: "Status", render: (p) => badge(p.status) + (p.failureReason ? '<div class="small muted">' + esc(p.failureReason) + "</div>" : "") },
            { label: "", cls: "right", render: (p) => p.status === "SUCCESS" || p.status === "REFUNDED" ? '<a class="btn sm ghost" href="/customer/invoice.html?booking=' + p.bookingId + '">' + icon("print", 14) + " Invoice</a>" : "" }
        ], pays, { empty: "No payments yet", emptyIcon: "card" });
        EL.table($("#ref"), [
            { label: "Requested", render: (r) => fmt.date(r.createdAt) },
            { label: "Booking", key: "bookingReference" },
            { label: "Reason", render: (r) => esc(r.reason) },
            { label: "Amount", cls: "right", render: (r) => fmt.money(r.amount) },
            { label: "Status", render: (r) => badge(r.status) + (r.financeNote ? '<div class="small muted">' + esc(r.financeNote) + "</div>" : "") }
        ], refunds, { empty: "No refunds", emptyIcon: "money" });
    }

    // ------------------------------------------------------------------ my events
    async function events() {
        page.innerHTML = '<div class="page-intro"><p>Festivals and events you registered for.</p><a class="btn" href="/customer/festivals.html">' + icon("festival", 16) + ' Find events</a></div><div id="list"></div>';
        const list = await api("/api/customer/events/registrations");
        EL.table($("#list"), [
            { label: "Event", render: (r) => "<b>" + esc(r.eventName) + '</b><div class="small muted">' + esc(r.location) + "</div>" },
            { label: "Date", render: (r) => fmt.date(r.eventDate) },
            { label: "Places", key: "participants" },
            { label: "Registered", render: (r) => fmt.date(r.createdAt) },
            { label: "", cls: "right", render: () => EL.act("cancel", "x", "Cancel registration", "danger") }
        ], list, {
            empty: "You have not registered for any events yet.", emptyIcon: "festival",
            onRow: (r) => { location.href = "/customer/festivals.html?event=" + r.eventId; },
            actions: {
                cancel: async (r) => {
                    if (!(await EL.confirm("Cancel your registration for " + r.eventName + "?", { danger: true, ok: "Cancel registration" }))) return;
                    await api("/api/customer/events/" + r.eventId + "/register", { method: "DELETE" }).catch(EL.toastError);
                    EL.toast("Registration cancelled");
                    events();
                }
            }
        });
    }

    // ------------------------------------------------------------------ reviews
    async function reviews() {
        page.innerHTML = '<section class="card"><div class="card-head"><h3>Trips waiting for your review</h3></div><div id="todo"></div></section><section class="card"><div class="card-head"><h3>My reviews</h3></div><div id="mine" class="stack"></div></section>';
        const [bookings, mine] = await Promise.all([api("/api/customer/bookings"), api("/api/customer/feedback")]);
        const todo = bookings.filter((b) => b.canReview);
        $("#todo").innerHTML = todo.length ? todo.map((b) => '<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--line-2)"><div><b>' + esc(b.packageName) + '</b><div class="small muted">' + fmt.date(b.startDate) + " - " + fmt.date(b.endDate) + '</div></div><button class="btn sm gold" data-review="' + b.id + '">' + icon("star", 14) + " Write review</button></div>").join("")
            : EL.emptyState("No trips to review right now.", "star");
        $$("[data-review]").forEach((btn) => btn.addEventListener("click", () => BookingViews.reviewForm(todo.find((b) => b.id === Number(btn.dataset.review)), reviews)));
        $("#mine").innerHTML = mine.length ? mine.map((r) => '<div class="panel"><div class="row between"><b>' + esc(r.packageName) + "</b>" + fmt.stars(r.overallRating) + '</div><p style="margin:6px 0">' + esc(r.comment) + '</p><div class="small muted">' +
            esc(r.bookingReference) + " · " + fmt.date(r.createdAt) + (r.complaint ? " · " + badge("PENDING", "Complaint") : "") + "</div>" +
            (r.response ? '<div class="alert success small" style="margin-top:8px"><b>Explore Lanka replied:</b> ' + esc(r.response) + "</div>" : "") + "</div>").join("")
            : EL.emptyState("You have not written any reviews yet.", "message");
        const target = EL.qs("booking");
        if (target) { const b = todo.find((x) => String(x.id) === target); if (b) BookingViews.reviewForm(b, reviews); }
    }

    try { await ({ wishlist, payments, events, reviews })[which](); } catch (e) { EL.toastError(e); }
})();

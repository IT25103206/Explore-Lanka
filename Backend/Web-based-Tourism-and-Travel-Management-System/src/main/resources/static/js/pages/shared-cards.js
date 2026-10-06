/* Card renderers shared by the public pages and the customer portal. */
(function () {
    const { esc, fmt, icon, badge, titleCase } = EL;

    function packageCard(p, saved) {
        const tags = [badge(p.type)];
        if (p.trending) tags.push('<span class="badge solid">Trending</span>');
        if (p.inSeasonNow && p.seasonalAdjustmentPercent) tags.push('<span class="badge gold">' + esc(p.seasonName) + "</span>");
        return '<article class="pkg-card"><div class="media"><a href="/tour.html?id=' + p.id + '"><img loading="lazy" src="' + esc(p.imageUrl) + '" alt="' + esc(p.name) + '"></a>' +
            '<div class="tags">' + tags.join("") + '</div><button class="fav ' + (saved ? "on" : "") + '" data-fav="' + p.id + '" title="Save to wishlist" aria-label="Save to wishlist">' + icon("heart", 18) + "</button></div>" +
            '<div class="body"><div class="meta"><span>' + icon("map", 14) + " " + esc(p.destinations.join(", ")) + "</span></div>" +
            '<h3><a href="/tour.html?id=' + p.id + '">' + esc(p.name) + "</a></h3>" +
            '<div class="meta"><span>' + icon("clock", 14) + " " + p.durationDays + " day" + (p.durationDays > 1 ? "s" : "") + (p.nights ? " / " + p.nights + " night" + (p.nights > 1 ? "s" : "") : "") + "</span><span>" + esc(titleCase(p.category)) + "</span>" +
            (p.reviewCount ? "<span>" + fmt.stars(p.averageRating) + " " + p.averageRating + " (" + p.reviewCount + ")</span>" : "") + "</div>" +
            '<div class="price"><div><small>From, per adult</small><b>' + fmt.money(p.currentPrice) + '</b></div><a class="btn sm" href="/tour.html?id=' + p.id + '">View tour</a></div></div></article>';
    }

    function eventCard(e) {
        const d = new Date(e.startDate + "T00:00:00");
        const multi = e.endDate !== e.startDate;
        return '<article class="event-card" data-event="' + e.id + '" tabindex="0"><div class="date-block"><b>' + d.getDate() + "</b><span>" + d.toLocaleString("en-GB", { month: "short" }) + "</span></div>" +
            '<div style="min-width:0"><div class="row" style="gap:6px;margin-bottom:4px">' + badge("STANDARD", titleCase(e.category)) + (Number(e.ticketPrice) === 0 ? '<span class="badge green">Free</span>' : "") + "</div>" +
            '<h3 style="margin:0 0 4px;font-size:1.02rem">' + esc(e.name) + '</h3><div class="muted small">' + icon("map", 13) + " " + esc(e.location) + " · " + esc(e.region) + "</div>" +
            '<div class="muted small">' + icon("clock", 13) + " " + (multi ? fmt.short(e.startDate) + " - " + fmt.date(e.endDate) : fmt.date(e.startDate)) + ", " + fmt.time(e.startTime) + "-" + fmt.time(e.endTime) + "</div></div></article>";
    }

    function offerCard(o) {
        const value = o.discountType === "PERCENTAGE" ? Number(o.discountValue) + "% OFF" : fmt.money(o.discountValue) + " OFF";
        return '<article class="offer-card"><div class="eyebrow" style="color:var(--gold-soft)">' + esc(titleCase(o.offerType)) + '</div><div class="big">' + esc(value) + "</div>" +
            '<h3 style="margin:8px 0 6px">' + esc(o.title) + '</h3><p class="small" style="color:#E7D6C4">' + esc(o.description || "") + "</p>" +
            '<div class="small" style="color:#E7D6C4">Valid until ' + fmt.date(o.endDate) + (o.minSpend ? " · Min. spend " + fmt.money(o.minSpend) : "") +
            (o.packageNames && o.packageNames.length ? "<br>For: " + esc(o.packageNames.join(", ")) : "") +
            (o.audiences && !o.audiences.includes("ALL_CUSTOMERS") ? "<br>For: " + esc(o.audiences.map(titleCase).join(", ")) : "") + "</div>" +
            '<button class="code" data-code="' + esc(o.couponCode) + '" title="Copy code">' + icon("copy", 15) + " " + esc(o.couponCode) + "</button></article>";
    }

    /** Heart buttons: logged-in customers save packages; guests are sent to log in. */
    async function bindFavourites(root, onChange) {
        const user = await EL.me();
        let saved = new Set();
        if (user && user.role === "CUSTOMER") {
            try { (await EL.api("/api/customer/wishlist")).forEach((w) => saved.add(w.packageId)); } catch (e) { /* ignore */ }
        }
        EL.$$("[data-fav]", root).forEach((b) => {
            const id = Number(b.dataset.fav);
            b.classList.toggle("on", saved.has(id));
            b.onclick = async (e) => {
                e.preventDefault();
                if (!user) { location.href = "/login.html?next=" + encodeURIComponent(location.pathname + location.search); return; }
                if (user.role !== "CUSTOMER") { EL.toast("Wishlists are for customer accounts"); return; }
                try {
                    if (saved.has(id)) { await EL.api("/api/customer/wishlist/" + id, { method: "DELETE" }); saved.delete(id); EL.toast("Removed from wishlist"); }
                    else { const r = await EL.api("/api/customer/wishlist", { method: "POST", body: { packageId: id } }); saved.add(id); EL.toast(r.message, "success"); }
                    b.classList.toggle("on", saved.has(id));
                    if (onChange) onChange();
                } catch (err) { EL.toastError(err); }
            };
        });
    }

    function bindCopy(root) {
        EL.$$("[data-code]", root).forEach((b) => b.addEventListener("click", () => {
            navigator.clipboard && navigator.clipboard.writeText(b.dataset.code);
            EL.toast("Code " + b.dataset.code + " copied - apply it when you book", "success");
        }));
    }

    function fillIcons(root) {
        EL.$$("[data-icon]", root).forEach((s) => { s.outerHTML = EL.icon(s.dataset.icon, Number(s.dataset.size) || 18); });
    }

    window.Cards = { packageCard, eventCard, offerCard, bindFavourites, bindCopy, fillIcons };
})();

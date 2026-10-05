/* =========================================================
   Explore Lanka - Customer portal (connected to the real API)
   Follows the project proposal: browse packages, book tours (availability,
   traveler details, preferences, coupon codes), modify / cancel, pay,
   itineraries, events & registrations, offers, reviews, profile.
   Each page sets <body data-cpage="...">.
   ========================================================= */
(function () {
    "use strict";

    var CHANGE_DAYS = 7; // UC-06: changes / cancellations up to 7 days before travel
    var IMAGES = ["/images/sigiriya-card.png", "/images/ella-card.png", "/images/mirissa-card.png", "/images/kandy-card.png", "/images/nuwara-eliya-card.png", "/images/anuradhapura-card.png"];

    // ---------- helpers ----------
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }
    function money(v) { return "LKR " + Number(v || 0).toLocaleString("en-LK", {maximumFractionDigits: 0}); }
    function todayIso() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
    function addDays(iso, n) { var d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
    function daysUntil(iso) { return Math.round((new Date(iso + "T00:00:00") - new Date(todayIso() + "T00:00:00")) / 86400000); }
    function fmtDate(v) { if (!v) return "-"; var d = new Date(String(v).length <= 10 ? v + "T00:00:00" : v); return isNaN(d) ? v : d.toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"}); }
    function up(v) { return String(v || "").trim().toUpperCase(); }
    function label(s) { s = up(s); return s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ") : "-"; }
    function code(id) { return "#BK-" + String(id).padStart(4, "0"); }
    function qs(k) { return new URLSearchParams(location.search).get(k); }
    function lines(t) { return String(t || "").split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
    function img(p, i) { return p.imageUrl || IMAGES[(i || 0) % IMAGES.length]; }
    function stars(n) { n = Math.max(0, Math.min(5, Math.round(Number(n) || 0))); return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
    function toast(m, bad) { if (window.customerToast) window.customerToast(m); else alert(m); if (bad) console.warn(m); }
    function userId() { return sessionStorage.getItem("userId"); }
    var BADGE = {PENDING: "warning", CONFIRMED: "success", COMPLETED: "info", CANCELLED: "danger", PAID: "success", UNPAID: "warning", REFUND_PENDING: "warning", REFUNDED: "info", UPCOMING: "success", ONGOING: "info", ACTIVE: "success"};
    function badge(s, text) { var v = up(s); return '<span class="badge ' + (BADGE[v] || "info") + '">' + esc(text || label(v)) + "</span>"; }
    function payStatus(b) {
        if (b.paymentStatus) return up(b.paymentStatus);
        var s = up(b.status);
        return s === "CONFIRMED" || s === "COMPLETED" ? "PAID" : s === "CANCELLED" ? "REFUNDED" : "UNPAID";
    }
    function api(method, url, body) {
        return fetch(url, {method: method, credentials: "same-origin", headers: body ? {"Content-Type": "application/json"} : {}, body: body ? JSON.stringify(body) : undefined})
            .then(function (res) {
                return res.text().then(function (t) {
                    var d = null; try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; }
                    if (!res.ok) throw new Error((d && d.message) || "Something went wrong (" + res.status + ").");
                    return d;
                });
            });
    }
    function list(url) { return api("GET", url).then(function (d) { return Array.isArray(d) ? d : []; }); }
    function alertBox(el, msg, type) { if (!el) return; el.textContent = msg; el.className = "bk-alert show " + (type || "error"); }
    function hideAlert(el) { if (el) el.className = "bk-alert"; }
    function empty(title, text, link) {
        return '<div class="card bk-empty"><h4>' + esc(title) + "</h4><p>" + esc(text || "") + "</p>" + (link ? '<a class="btn btn-primary" href="' + link[1] + '">' + esc(link[0]) + "</a>" : "") + "</div>";
    }
    function isActivePkg(p) { return !p.status || up(p.status) === "ACTIVE"; }
    function departures(p) { return String(p.departureDates || "").split(",").map(function (x) { return x.trim(); }).filter(function (d) { return d && d > todayIso(); }); }
    function offerFor(p, promos) {
        return promos.filter(function (o) { return !o.tourPackage || o.tourPackage.packageId === p.packageId; })
            .sort(function (a, b) { return (b.discountPercentage || 0) - (a.discountPercentage || 0); })[0];
    }
    function printDoc(title, html) {
        var w = window.open("", "_blank");
        if (!w) { toast("Allow pop-ups to print"); return; }
        w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font-family:Segoe UI,Arial,sans-serif;color:#2b2b2b;max-width:760px;margin:30px auto;padding:0 20px}h1{font-family:Georgia,serif;color:#6b4429;margin:0}h2{font-family:Georgia,serif;color:#2e7032;font-size:17px;margin:24px 0 8px;border-bottom:1px solid #e6dccf;padding-bottom:6px}table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:7px 8px;border-bottom:1px solid #eee;text-align:left}.muted{color:#777;font-size:12px}.day{display:grid;grid-template-columns:110px 1fr;gap:10px;padding:8px 0;border-bottom:1px dashed #e6dccf;font-size:13px}.brand{display:flex;justify-content:space-between;align-items:end;border-bottom:3px solid #2e7032;padding-bottom:10px}@media print{button{display:none}}</style></head><body>' + html + '<p style="margin-top:30px"><button onclick="window.print()">Print</button></p></body></html>');
        w.document.close();
        setTimeout(function () { try { w.print(); } catch (e) { /* ignore */ } }, 400);
    }

    // ---------- shared renderers ----------
    function packageCard(p, i, promos) {
        var o = offerFor(p, promos || []), dep = departures(p);
        return '<article class="card place cp-pkg" data-filter-item>' +
            '<div class="place-cover" style="background-image:url(\'' + esc(img(p, i)) + '\')">' +
            (o ? '<span class="cp-ribbon">' + esc(o.discountPercentage) + "% OFF</span>" : "") + "</div>" +
            '<div class="place-body"><h4>' + esc(p.packageName) + "</h4><p>" + esc(p.destinations || p.description || "") + "</p>" +
            '<div class="meta"><span>' + (p.durationDays || "-") + " days</span><span>" + esc(p.category || "Tour") + "</span>" +
            (p.seasonal ? "<span>🗓 Seasonal</span>" : "") + (p.customizable ? "<span>🧩 Customizable</span>" : "") +
            (dep.length ? "<span>" + dep.length + " departures</span>" : "<span>Flexible dates</span>") + "</div>" +
            '<div class="cp-price-row"><div><small>From</small><b class="price">' + money(p.price) + '</b><small>per person</small></div>' +
            '<div class="cp-actions"><a class="btn btn-soft" href="/ui/customer-package-details?id=' + p.packageId + '">Details</a>' +
            '<a class="btn btn-primary" href="/ui/customer-booking?packageId=' + p.packageId + '">Book</a></div></div></div></article>';
    }
    function eventCard(e, i, regIds) {
        var left = e.maxParticipants ? Math.max(0, e.maxParticipants - (e.registeredCount || 0)) : null;
        var reg = regIds && regIds.indexOf(e.eventId) > -1;
        return '<article class="card place cp-event" data-filter-item><div class="place-cover" style="background-image:url(\'' + esc(e.imageUrl || IMAGES[(i + 3) % IMAGES.length]) + '\')">' +
            '<span class="cp-date"><b>' + new Date(e.eventDate + "T00:00:00").getDate() + "</b>" + new Date(e.eventDate + "T00:00:00").toLocaleDateString("en-GB", {month: "short"}) + "</span></div>" +
            '<div class="place-body"><h4>' + esc(e.eventName) + "</h4><p>" + esc(e.location || "") + (e.region ? " · " + esc(e.region) + " Province" : "") + "</p>" +
            '<div class="meta"><span>' + esc(e.category || "Event") + "</span><span>" + fmtDate(e.eventDate) + (e.endDate ? " – " + fmtDate(e.endDate) : "") + "</span>" +
            (e.startTime ? "<span>" + esc(e.startTime) + "</span>" : "") + (left != null ? "<span>" + (left ? left + " places left" : "Full") + "</span>" : "") + (reg ? '<span class="cp-ok">✓ Registered</span>' : "") + "</div>" +
            '<div class="cp-actions" style="margin-top:12px"><a class="btn btn-primary" href="/ui/customer-event-details?id=' + e.eventId + '">View & register</a></div></div></article>';
    }

    // =====================================================
    // DASHBOARD
    // =====================================================
    function pageDashboard() {
        Promise.all([list("/api/bookings/customer/" + userId()).catch(function () { return []; }), list("/api/packages"), list("/api/events"), list("/api/promotions/active").catch(function () { return []; }),
            list("/api/feedback/customer/" + userId()).catch(function () { return []; })]).then(function (r) {
            var bk = r[0], pk = r[1].filter(isActivePkg), ev = r[2], pr = r[3], fb = r[4], t = todayIso();
            var active = bk.filter(function (b) { return up(b.status) !== "CANCELLED"; });
            var upcoming = active.filter(function (b) { return b.travelDate >= t; }).sort(function (a, b) { return a.travelDate.localeCompare(b.travelDate); });
            $("#kUpcoming").textContent = upcoming.length;
            $("#kBookings").textContent = bk.length;
            $("#kSpent").textContent = money(bk.filter(function (b) { return payStatus(b) === "PAID"; }).reduce(function (s, b) { return s + (b.totalAmount || 0); }, 0));
            $("#kReviews").textContent = fb.length;
            var next = upcoming[0], box = $("#dbNext");
            box.innerHTML = next ? '<div class="card cp-next"><div><small>Next trip in ' + daysUntil(next.travelDate) + " days</small><h3>" + esc(next.tourPackage ? next.tourPackage.packageName : "Trip") + "</h3><p>" +
                fmtDate(next.travelDate) + " · " + next.numberOfPeople + " traveler(s) · " + badge(next.status) + " " + badge(payStatus(next)) + '</p></div><div class="cp-actions">' +
                (up(next.status) === "CONFIRMED" && payStatus(next) === "UNPAID" ? '<a class="btn btn-gold" href="/ui/customer-booking-details?id=' + next.bookingId + '#pay">Pay now</a>' : "") +
                '<a class="btn btn-primary" href="/ui/customer-booking-details?id=' + next.bookingId + '">View trip</a></div></div>'
                : '<div class="card cp-next"><div><h3>No upcoming trips yet</h3><p>Pick a package and plan your Sri Lankan adventure.</p></div><a class="btn btn-primary" href="/ui/customer-tour-packages">Browse packages</a></div>';
            $("#dbPackages").innerHTML = pk.slice(0, 3).map(function (p, i) { return packageCard(p, i, pr); }).join("") || empty("No packages yet", "Check back soon.");
            var evs = ev.filter(function (e) { return (e.endDate || e.eventDate) >= t && up(e.status) !== "CANCELLED"; }).sort(function (a, b) { return a.eventDate.localeCompare(b.eventDate); });
            $("#dbEvents").innerHTML = evs.slice(0, 3).map(function (e, i) { return eventCard(e, i); }).join("") || empty("No upcoming events", "");
            $("#dbOffers").innerHTML = pr.slice(0, 3).map(offerCard).join("") || '<p class="cp-muted">No offers running right now.</p>';
        }).catch(function (e) { toast(e.message, true); });
    }

    // =====================================================
    // TOUR PACKAGES
    // =====================================================
    function pagePackages() {
        var grid = $("#pkgGrid"), all = [], promos = [];
        function render() {
            var q = ($("#pkgSearch").value || "").toLowerCase(), cat = $("#pkgCategory").value, dur = $("#pkgDuration").value, sort = $("#pkgSort").value;
            var rows = all.filter(function (p) {
                var d = p.durationDays || 0;
                return (!q || [p.packageName, p.destinations, p.description, p.category].join(" ").toLowerCase().indexOf(q) > -1) &&
                    (!cat || p.category === cat) &&
                    (!dur || (dur === "short" ? d <= 3 : dur === "mid" ? d >= 4 && d <= 7 : d > 7)) &&
                    ($("#pkgSeasonal").checked ? p.seasonal : true);
            });
            rows.sort(function (a, b) { return sort === "price" ? a.price - b.price : sort === "priceDesc" ? b.price - a.price : sort === "days" ? a.durationDays - b.durationDays : a.packageName.localeCompare(b.packageName); });
            $("#pkgCount").textContent = rows.length + " package" + (rows.length === 1 ? "" : "s");
            grid.innerHTML = rows.length ? rows.map(function (p, i) { return packageCard(p, i, promos); }).join("") : empty("No packages match", "Try a different search or filter.");
        }
        Promise.all([list("/api/packages"), list("/api/promotions/active").catch(function () { return []; })]).then(function (r) {
            all = r[0].filter(isActivePkg); promos = r[1];
            var cats = Object.keys(all.reduce(function (o, p) { if (p.category) o[p.category] = 1; return o; }, {})).sort();
            $("#pkgCategory").innerHTML = '<option value="">All categories</option>' + cats.map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("");
            render();
        }).catch(function (e) { grid.innerHTML = empty("Could not load packages", e.message); });
        ["#pkgSearch", "#pkgCategory", "#pkgDuration", "#pkgSort", "#pkgSeasonal"].forEach(function (s) { $(s).addEventListener("input", render); $(s).addEventListener("change", render); });
    }

    // =====================================================
    // PACKAGE DETAILS (schedule, availability check, itinerary, reviews, offers)
    // =====================================================
    function pagePackageDetails() {
        var box = $("#pkgDetails"), id = qs("id");
        if (!id) { box.innerHTML = empty("Package not found", "", ["Browse packages", "/ui/customer-tour-packages"]); return; }
        Promise.all([api("GET", "/api/packages/" + id), list("/api/feedback/package/" + id).catch(function () { return []; }), list("/api/promotions/active").catch(function () { return []; }), list("/api/events").catch(function () { return []; })])
            .then(function (r) {
                var p = r[0], reviews = r[1], promos = r[2].filter(function (o) { return !o.tourPackage || o.tourPackage.packageId === p.packageId; }), events = r[3];
                if (!isActivePkg(p)) { box.innerHTML = empty("This package is not available", "Please choose another package.", ["Browse packages", "/ui/customer-tour-packages"]); return; }
                document.title = "Explore Lanka | " + p.packageName;
                var dep = departures(p), plan = lines(p.itinerary), inc = lines(p.inclusions);
                var avg = reviews.length ? reviews.reduce(function (s, f) { return s + (parseInt(f.rating, 10) || 0); }, 0) / reviews.length : 0;
                var places = String(p.destinations || "").toLowerCase();
                var nearEvents = events.filter(function (e) { return e.location && (e.endDate || e.eventDate) >= todayIso() && places.indexOf(e.location.split(/[ ,]/)[0].toLowerCase()) > -1; });
                box.innerHTML =
                    '<section class="hero cp-hero" style="--cp-img:url(\'' + esc(img(p, 0)) + '\')"><span class="eyebrow">' + esc(p.category || "TOUR") + (p.seasonal ? " · SEASONAL" : "") + "</span><h2>" + esc(p.packageName) + "</h2><p>" + esc(p.destinations || "") + "</p>" +
                    '<div class="hero-actions"><a class="btn btn-gold" href="/ui/customer-booking?packageId=' + p.packageId + '">Book this package</a>' + (reviews.length ? '<span class="cp-hero-rating">' + stars(avg) + " " + avg.toFixed(1) + " (" + reviews.length + ")</span>" : "") + "</div></section>" +
                    '<div class="grid grid-4 cp-facts">' +
                    [["Duration", p.durationDays + " days"], ["Price per person", money(p.price)], ["Group size", p.maxTravelers ? "Up to " + p.maxTravelers + " / date" : "Any size"], ["Plan", p.customizable ? "Customizable" : "Fixed itinerary"]]
                        .map(function (f) { return '<div class="card stat"><div><p>' + f[0] + "</p><h3>" + esc(f[1]) + "</h3></div></div>"; }).join("") + "</div>" +
                    '<div class="cp-two"><div>' +
                    '<div class="card"><h3 class="cp-h">About this tour</h3><p class="cp-text">' + esc(p.description || "A memorable Sri Lankan journey.") + "</p></div>" +
                    '<div class="card"><h3 class="cp-h">Day-by-day itinerary</h3>' + (plan.length ? '<ol class="cp-days">' + plan.map(function (d, i) { return "<li><b>Day " + (i + 1) + "</b><span>" + esc(d.replace(/^day\s*\d+\s*[:.\-–]\s*/i, "")) + "</span></li>"; }).join("") + "</ol>" : '<p class="cp-muted">The detailed plan is shared after booking.</p>') +
                    (p.customizable ? '<p class="cp-note">🧩 This plan is customizable – tell us what to change when you book.</p>' : "") + "</div>" +
                    (inc.length ? '<div class="card"><h3 class="cp-h">What\'s included</h3><ul class="cp-incl">' + inc.map(function (x) { return "<li>✓ " + esc(x) + "</li>"; }).join("") + "</ul></div>" : "") +
                    '<div class="card"><h3 class="cp-h">Traveler reviews</h3>' + (reviews.length ? reviews.slice(0, 6).map(function (f) { return '<div class="cp-review"><div><b>' + esc(f.customerName) + '</b><span class="cp-stars">' + stars(f.rating) + "</span><small>" + fmtDate(f.feedbackDate) + "</small></div><p>" + esc(f.comment) + "</p></div>"; }).join("") : '<p class="cp-muted">No reviews yet – be the first after your trip.</p>') + "</div>" +
                    "</div><aside>" +
                    '<div class="card cp-avail"><h3 class="cp-h">Check availability</h3>' +
                    (p.seasonal ? '<p class="cp-note">🗓 Seasonal: ' + fmtDate(p.validFrom) + " – " + fmtDate(p.validTo) + "</p>" : "") +
                    '<div class="field"><label for="avDate">Travel date</label>' + (dep.length ? '<select id="avDate">' + dep.map(function (d) { return '<option value="' + d + '">' + fmtDate(d) + "</option>"; }).join("") + "</select>"
                        : '<input type="date" id="avDate" min="' + addDays(todayIso(), 1) + '"' + (p.seasonal && p.validFrom ? ' value="' + (p.validFrom > todayIso() ? p.validFrom : addDays(todayIso(), 1)) + '"' : "") + ">") + "</div>" +
                    '<div class="field"><label for="avPeople">Travelers</label><input type="number" id="avPeople" min="1" max="50" value="2"></div>' +
                    '<button class="btn btn-soft" type="button" id="avCheck">Check</button><div id="avOut" class="cp-av-out"></div>' +
                    '<div class="cp-total"><small>Estimated total</small><b class="price" id="avTotal">' + money(p.price * 2) + '</b></div><a class="btn btn-primary cp-wide" id="avBook" href="/ui/customer-booking?packageId=' + p.packageId + '">Continue to booking</a></div>' +
                    (dep.length ? '<div class="card"><h3 class="cp-h">Scheduled departures</h3><div class="cp-chips">' + dep.map(function (d) { return "<span>" + fmtDate(d) + "</span>"; }).join("") + "</div></div>" : "") +
                    (promos.length ? '<div class="card"><h3 class="cp-h">Offers for this tour</h3>' + promos.map(function (o) { return '<div class="cp-offer-mini"><b>' + esc(o.discountPercentage) + "% OFF</b> " + esc(o.title) + (o.couponCode ? ' · code <code class="cp-code">' + esc(o.couponCode) + "</code>" : "") + "</div>"; }).join("") + "</div>" : "") +
                    (nearEvents.length ? '<div class="card"><h3 class="cp-h">Events on this route</h3>' + nearEvents.slice(0, 3).map(function (e) { return '<a class="cp-event-mini" href="/ui/customer-event-details?id=' + e.eventId + '"><b>' + esc(e.eventName) + "</b><small>" + fmtDate(e.eventDate) + " · " + esc(e.location) + "</small></a>"; }).join("") + "</div>" : "") +
                    "</aside></div>";

                function check() {
                    var date = $("#avDate").value, ppl = parseInt($("#avPeople").value, 10) || 1, out = $("#avOut");
                    $("#avTotal").textContent = money(p.price * ppl);
                    $("#avBook").href = "/ui/customer-booking?packageId=" + p.packageId + (date ? "&date=" + date : "") + "&people=" + ppl;
                    if (!date) { out.innerHTML = ""; return; }
                    out.innerHTML = '<span class="cp-muted">Checking…</span>';
                    api("GET", "/api/packages/" + p.packageId + "/availability?date=" + date + "&people=" + ppl).then(function (a) {
                        out.innerHTML = '<span class="' + (a.available ? "cp-ok" : "cp-bad") + '">' + (a.available ? "✓ " : "✕ ") + esc(a.message) + "</span>";
                    }).catch(function (e) { out.innerHTML = '<span class="cp-bad">' + esc(e.message) + "</span>"; });
                }
                $("#avCheck").onclick = check;
                $("#avDate").addEventListener("change", check);
                $("#avPeople").addEventListener("change", check);
                if ($("#avDate").value) check();
            }).catch(function (e) { box.innerHTML = empty("Package not found", e.message, ["Browse packages", "/ui/customer-tour-packages"]); });
    }

    // =====================================================
    // BOOK A TOUR (UC-06)
    // =====================================================
    function pageBooking() {
        var form = $("#bookingForm"); if (!form) return;
        var pkgSel = $("#packageId"), dateWrap = $("#dateWrap"), peopleIn = $("#numberOfPeople"), alertEl = $("#bookingAlert"), submit = $("#bookingSubmit");
        var packages = [], coupon = null, avail = null, resources = [];

        function selected() { return packages.filter(function (p) { return String(p.packageId) === pkgSel.value; })[0]; }
        function dateVal() { var el = $("#travelDate"); return el ? el.value : ""; }
        function people() { return parseInt(peopleIn.value, 10) || 0; }

        function renderDate() {
            var p = selected(), prev = dateVal() || qs("date") || "";
            var dep = p ? departures(p) : [];
            dateWrap.innerHTML = '<label for="travelDate">Travel date *</label>' + (dep.length
                ? '<select id="travelDate" required><option value="">Choose a departure</option>' + dep.map(function (d) { return '<option value="' + d + '"' + (d === prev ? " selected" : "") + ">" + fmtDate(d) + "</option>"; }).join("") + '</select><span class="hint">This tour runs on fixed dates</span>'
                : '<input type="date" id="travelDate" required min="' + addDays(todayIso(), 1) + '" value="' + esc(prev) + '"><span class="hint">' + (p && p.seasonal ? "Season: " + fmtDate(p.validFrom) + " – " + fmtDate(p.validTo) : "Any future date") + "</span>");
            $("#travelDate").addEventListener("change", function () { coupon = null; renderCoupon(); checkAvail(); summary(); });
            $("#customWrap").hidden = !(p && p.customizable);
        }

        function renderTravelers() {
            var n = Math.max(0, Math.min(50, people())), box = $("#travelerRows");
            var old = $$(".cp-trav", box).map(function (r) { return [$(".tn", r).value, $(".ti", r).value, $(".ta", r).value]; });
            var html = "";
            for (var i = 0; i < n; i++) {
                var o = old[i] || ["", "", ""];
                html += '<div class="cp-trav"><span>' + (i + 1) + '</span><input class="tn" maxlength="100" placeholder="Full name *" value="' + esc(o[0]) + '"><input class="ti" maxlength="30" placeholder="NIC / Passport" value="' + esc(o[1]) + '"><input class="ta" type="number" min="0" max="120" placeholder="Age" value="' + esc(o[2]) + '"></div>';
            }
            box.innerHTML = html;
        }
        function travelerText() {
            return $$(".cp-trav", $("#travelerRows")).map(function (r) { return [$(".tn", r).value.trim(), $(".ti", r).value.trim(), $(".ta", r).value.trim()].join(" | "); }).join("\n");
        }

        function prefText() {
            var parts = [];
            [["#prefHotel", "Hotel"], ["#prefVehicle", "Vehicle"], ["#prefGuide", "Guide"]].forEach(function (x) { var v = $(x[0]).value; if (v) parts.push(x[1] + ": " + v); });
            return parts.length ? "Preferences – " + parts.join("; ") : "";
        }

        function checkAvail() {
            var p = selected(), d = dateVal(), out = $("#availOut");
            avail = null;
            if (!p || !d || !people()) { out.innerHTML = ""; return; }
            out.innerHTML = '<span class="cp-muted">Checking availability…</span>';
            api("GET", "/api/packages/" + p.packageId + "/availability?date=" + d + "&people=" + people()).then(function (a) {
                avail = a;
                out.innerHTML = '<span class="' + (a.available ? "cp-ok" : "cp-bad") + '">' + (a.available ? "✓ " : "✕ ") + esc(a.message) + "</span>";
            }).catch(function (e) { out.innerHTML = '<span class="cp-bad">' + esc(e.message) + "</span>"; });
        }

        function renderCoupon() {
            var out = $("#couponOut");
            out.innerHTML = coupon ? (coupon.valid ? '<span class="cp-ok">✓ ' + esc(coupon.message) + '</span> <button type="button" class="bk-link" id="couponRemove">Remove</button>' : '<span class="cp-bad">✕ ' + esc(coupon.message) + "</span>") : "";
            var rm = $("#couponRemove"); if (rm) rm.onclick = function () { coupon = null; $("#couponCode").value = ""; renderCoupon(); summary(); };
        }
        function applyCoupon() {
            var c = $("#couponCode").value.trim(), p = selected();
            if (!c) { coupon = null; renderCoupon(); summary(); return; }
            if (!p) { alertBox(alertEl, "Choose a package before applying a coupon."); return; }
            api("GET", "/api/promotions/validate?code=" + encodeURIComponent(c) + "&packageId=" + p.packageId + "&people=" + people() + (dateVal() ? "&travelDate=" + dateVal() : ""))
                .then(function (r) { coupon = r; renderCoupon(); summary(); })
                .catch(function (e) { coupon = {valid: false, message: e.message}; renderCoupon(); summary(); });
        }

        function summary() {
            var p = selected(), n = people(), sub = p ? (p.price || 0) * n : 0;
            var disc = coupon && coupon.valid ? Math.round(sub * coupon.discountPercentage) / 100 : 0;
            $("#sumPackage").textContent = p ? p.packageName : "Select a package";
            $("#sumDesc").textContent = p ? (p.destinations || p.description || "") : "";
            $("#sumImg").style.backgroundImage = p ? "url('" + img(p, 0) + "')" : "";
            $("#sumDuration").textContent = p ? p.durationDays + " days" : "-";
            $("#sumPrice").textContent = p ? money(p.price) : "-";
            $("#sumPeople").textContent = n || "-";
            var d = dateVal();
            $("#sumDates").textContent = d ? fmtDate(d) + (p && p.durationDays > 1 ? " – " + fmtDate(addDays(d, p.durationDays - 1)) : "") : "-";
            $("#sumSubtotal").textContent = money(sub);
            $("#sumDiscountRow").hidden = !disc;
            $("#sumDiscount").textContent = "− " + money(disc);
            $("#sumTotal").textContent = money(sub - disc);
        }

        Promise.all([list("/api/packages"), list("/api/resources/public").catch(function () { return []; })]).then(function (r) {
            packages = r[0].filter(isActivePkg); resources = r[1];
            if (!packages.length) { pkgSel.innerHTML = '<option value="">No packages available</option>'; submit.disabled = true; alertBox(alertEl, "No tour packages are available right now."); return; }
            pkgSel.innerHTML = '<option value="">Choose a package</option>' + packages.map(function (p) { return '<option value="' + p.packageId + '">' + esc(p.packageName) + " — " + money(p.price) + " pp</option>"; }).join("");
            var pre = qs("packageId"); if (pre && packages.some(function (x) { return String(x.packageId) === pre; })) pkgSel.value = pre;
            if (qs("people")) peopleIn.value = qs("people");
            if (qs("coupon")) $("#couponCode").value = qs("coupon");
            // PBI-02: tourist chooses preferred hotel / vehicle / guide
            function fill(sel, types) {
                var opts = resources.filter(function (x) { return types.indexOf(String(x.resourceType || "").toLowerCase()) > -1; });
                $(sel).innerHTML = '<option value="">No preference</option>' + opts.map(function (x) { return '<option value="' + esc(x.resourceName) + '">' + esc(x.resourceName + (x.location ? " – " + x.location : "")) + "</option>"; }).join("");
                var pref = qs("pref"); if (pref && opts.some(function (x) { return x.resourceName === pref; })) $(sel).value = pref;
            }
            fill("#prefHotel", ["hotel", "room"]); fill("#prefVehicle", ["vehicle"]); fill("#prefGuide", ["guide"]);
            renderDate(); renderTravelers(); summary(); checkAvail();
            if ($("#couponCode").value) applyCoupon();
        }).catch(function () { alertBox(alertEl, "Could not load tour packages. Please refresh the page."); });

        pkgSel.addEventListener("change", function () { coupon = null; renderCoupon(); renderDate(); summary(); checkAvail(); });
        peopleIn.addEventListener("input", function () { renderTravelers(); summary(); });
        peopleIn.addEventListener("change", function () { if (coupon) applyCoupon(); checkAvail(); });
        $("#couponApply").addEventListener("click", applyCoupon);

        form.addEventListener("submit", function (e) {
            e.preventDefault(); hideAlert(alertEl);
            var p = selected(), n = people(), d = dateVal(), err = [];
            if (!p) err.push("Please select a tour package.");
            if (!d || d <= todayIso()) err.push("Please choose a future travel date.");
            if (!n || n < 1 || n > 50) err.push("Travelers must be between 1 and 50.");
            var trav = travelerText();
            if (lines(trav).some(function (l) { return l.split("|")[0].trim().length < 2; }) || lines(trav).length !== n) err.push("Enter the full name of every traveler.");
            if (avail && !avail.available) err.push(avail.message);
            if (coupon && !coupon.valid) err.push("Remove the invalid coupon code or fix it.");
            if (err.length) { alertBox(alertEl, err.join(" ")); window.scrollTo({top: 0, behavior: "smooth"}); return; }
            var req = [prefText(), $("#specialRequests").value.trim()].filter(Boolean).join("\n");
            submit.disabled = true; submit.textContent = "Saving booking…";
            api("POST", "/api/bookings/request", {packageId: p.packageId, travelDate: d, numberOfPeople: n, travelerDetails: trav,
                pickupLocation: $("#pickupLocation").value, specialRequests: req, customPlan: p.customizable ? $("#customPlan").value : null,
                couponCode: coupon && coupon.valid ? coupon.couponCode : null})
                .then(function (b) {
                    alertBox(alertEl, "Booking " + code(b.bookingId) + " sent! Our team will confirm it soon. Redirecting…", "ok");
                    setTimeout(function () { location.href = "/ui/customer-booking-details?id=" + b.bookingId; }, 1000);
                })
                .catch(function (er) { alertBox(alertEl, er.message); submit.disabled = false; submit.textContent = "Confirm booking"; window.scrollTo({top: 0, behavior: "smooth"}); });
        });
    }

    // =====================================================
    // MY BOOKINGS
    // =====================================================
    function pageBookings() {
        var body = $("#bookingsBody"), all = [], filter = "ALL";
        function render() {
            var t = todayIso();
            var rows = all.filter(function (b) {
                if (filter === "ALL") return true;
                if (filter === "UPCOMING") return up(b.status) !== "CANCELLED" && b.travelDate >= t;
                return up(b.status) === filter;
            });
            body.innerHTML = rows.length ? rows.map(function (b) {
                return "<tr><td><b>" + code(b.bookingId) + "</b><small>" + fmtDate(b.bookingDate) + "</small></td><td>" + esc(b.tourPackage ? b.tourPackage.packageName : "-") + "</td><td>" + fmtDate(b.travelDate) +
                    "</td><td>" + (b.numberOfPeople || "-") + "</td><td>" + money(b.totalAmount) + (b.couponCode ? "<small>" + esc(b.couponCode) + "</small>" : "") + "</td><td>" + badge(payStatus(b)) + "</td><td>" + badge(b.status) +
                    '</td><td><a class="bk-link" href="/ui/customer-booking-details?id=' + b.bookingId + '">View</a></td></tr>';
            }).join("") : '<tr><td colspan="8"><div class="bk-empty"><h4>' + (all.length ? "No bookings in this filter" : "No bookings yet") + "</h4>" + (all.length ? "" : '<a class="btn btn-primary" href="/ui/customer-tour-packages">Browse packages</a>') + "</div></td></tr>";
        }
        list("/api/bookings/customer/" + userId()).then(function (l) {
            all = l; var t = todayIso(), active = l.filter(function (b) { return up(b.status) !== "CANCELLED"; });
            $("#statTotal").textContent = l.length;
            $("#statUpcoming").textContent = active.filter(function (b) { return b.travelDate >= t; }).length;
            $("#statPending").textContent = l.filter(function (b) { return up(b.status) === "PENDING"; }).length;
            $("#statToPay").textContent = l.filter(function (b) { return up(b.status) === "CONFIRMED" && payStatus(b) === "UNPAID"; }).length;
            render();
        }).catch(function (e) { body.innerHTML = '<tr><td colspan="8"><div class="bk-empty"><h4>Could not load bookings</h4><p>' + esc(e.message) + "</p></div></td></tr>"; });
        $$(".bk-filters button").forEach(function (b) {
            b.addEventListener("click", function () { $$(".bk-filters button").forEach(function (x) { x.classList.remove("active"); }); b.classList.add("active"); filter = b.dataset.filter; render(); });
        });
    }

    // =====================================================
    // BOOKING DETAILS: itinerary, modify, cancel, pay
    // =====================================================
    function itineraryHtml(it) {
        var trav = lines(it.travelerDetails).map(function (l) { var p = l.split("|"); return "<tr><td>" + esc((p[0] || "").trim()) + "</td><td>" + esc((p[1] || "").trim() || "-") + "</td><td>" + esc((p[2] || "").trim() || "-") + "</td></tr>"; }).join("");
        var res = (it.resources || []).map(function (r) { return "<tr><td>" + esc(r.type || "") + "</td><td><b>" + esc(r.name) + "</b><div class=\"muted\">" + esc(r.location || "") + "</div></td><td>" + esc(r.partner || "-") + '<div class="muted">' + esc(r.phone || "") + "</div></td></tr>"; }).join("");
        return '<div class="brand"><div><h1>Explore Lanka</h1><div class="muted">Travel itinerary</div></div><div class="muted">' + code(it.bookingId) + "<br>" + label(it.status) + "</div></div><h2>" + esc(it.packageName) + "</h2><p>" + esc(it.destinations || "") + "</p>" +
            "<table><tr><td><b>Traveler</b></td><td>" + esc(it.customerName) + "</td><td><b>Dates</b></td><td>" + fmtDate(it.travelDate) + " – " + fmtDate(it.endDate) + "</td></tr><tr><td><b>Travelers</b></td><td>" + it.numberOfPeople + "</td><td><b>Pickup</b></td><td>" + esc(it.pickupLocation || "To be confirmed") + "</td></tr></table>" +
            "<h2>Day by day</h2>" + (it.days || []).map(function (d) { return '<div class="day"><b>Day ' + d.day + '<div class="muted">' + fmtDate(d.date) + "</div></b><span>" + esc(d.plan) + "</span></div>"; }).join("") +
            (res ? "<h2>Hotels, transport & guides</h2><table>" + res + "</table>" : "") + (trav ? "<h2>Travelers</h2><table><tr><th>Name</th><th>NIC / Passport</th><th>Age</th></tr>" + trav + "</table>" : "");
    }
    function pageBookingDetails() {
        var box = $("#bookingDetails"), alertEl = $("#detailsAlert"), id = qs("id");
        if (!id || !/^\d+$/.test(id)) { box.innerHTML = empty("Booking not found", "", ["Back to my bookings", "/ui/customer-bookings"]); return; }
        function load() {
            Promise.all([api("GET", "/api/bookings/" + id), api("GET", "/api/bookings/" + id + "/itinerary").catch(function () { return null; })]).then(function (r) { render(r[0], r[1]); })
                .catch(function (e) { box.innerHTML = empty("Booking not found", e.message, ["Back to my bookings", "/ui/customer-bookings"]); });
        }
        function render(b, it) {
            var st = up(b.status), ps = payStatus(b), days = daysUntil(b.travelDate), p = b.tourPackage || {};
            var canChange = (st === "PENDING" || st === "CONFIRMED") && days >= CHANGE_DAYS;
            var canPay = st === "CONFIRMED" && ps === "UNPAID";
            var canReview = (st === "COMPLETED" || (st === "CONFIRMED" && days < 0));
            var trav = lines(b.travelerDetails).map(function (l) { var x = l.split("|"); return {n: (x[0] || "").trim(), i: (x[1] || "").trim(), a: (x[2] || "").trim()}; });
            var steps = [["Requested", true], ["Confirmed", st === "CONFIRMED" || st === "COMPLETED"], ["Paid", ps === "PAID"], ["Trip done", st === "COMPLETED"]];
            box.innerHTML =
                '<div class="card cp-banner" style="--cp-img:url(\'' + esc(img(p, 1)) + '\')"><div><small>' + code(b.bookingId) + " · booked " + fmtDate(b.bookingDate) + "</small><h2>" + esc(p.packageName || "Trip") + "</h2><p>" +
                fmtDate(b.travelDate) + (it ? " – " + fmtDate(it.endDate) : "") + " · " + b.numberOfPeople + " traveler(s)</p><div>" + badge(st) + " " + badge(ps) + "</div></div>" +
                '<div class="cp-actions">' + (canPay ? '<button class="btn btn-gold" data-do="pay">💳 Pay now</button>' : "") + '<button class="btn btn-soft" data-do="print">🖨 Itinerary</button>' +
                (canChange ? '<button class="btn btn-soft" data-do="modify">✎ Modify</button><button class="btn btn-danger" data-do="cancel">Cancel booking</button>' : "") +
                (canReview ? '<a class="btn btn-primary" href="/ui/customer-reviews?bookingId=' + b.bookingId + '">★ Review trip</a>' : "") + "</div></div>" +
                (st === "CANCELLED" ? "" : '<div class="cp-steps">' + steps.map(function (s) { return '<div class="' + (s[1] ? "done" : "") + '"><i>' + (s[1] ? "✓" : "") + "</i>" + s[0] + "</div>"; }).join("") + "</div>") +
                (st === "PENDING" ? '<p class="cp-note">⏳ Waiting for our team to check hotels, transport and guides and confirm your booking. You can pay once it is confirmed.</p>' : "") +
                (canPay ? '<p class="cp-note">✅ Your booking is confirmed! Please complete the payment to secure your hotel, vehicle and guide.</p>' : "") +
                (ps === "REFUND_PENDING" ? '<p class="cp-note">↩ Your refund of ' + money(b.totalAmount) + " is being processed by our finance team.</p>" : "") +
                (!canChange && (st === "PENDING" || st === "CONFIRMED") && days >= 0 ? '<p class="cp-note">Changes and cancellations are possible online up to ' + CHANGE_DAYS + " days before travel. Please contact support.</p>" : "") +
                '<div id="cpPanel"></div>' +
                '<div class="cp-two"><div>' +
                '<div class="card"><h3 class="cp-h">Your itinerary</h3>' + (it ? '<ol class="cp-days">' + it.days.map(function (d) { return "<li><b>Day " + d.day + "<small>" + fmtDate(d.date) + "</small></b><span>" + esc(d.plan) + "</span></li>"; }).join("") + "</ol>" : "<p class=\"cp-muted\">Not available.</p>") + "</div>" +
                '<div class="card"><h3 class="cp-h">Your hotels, transport & guides</h3>' + (it && it.resources.length ? it.resources.map(function (r) { return '<div class="cp-res"><span>' + ({hotel: "🏨", room: "🏨", vehicle: "🚐", guide: "🧭"}[String(r.type || "").toLowerCase()] || "◆") + "</span><div><b>" + esc(r.name) + "</b><small>" + esc(r.type || "") + (r.partner ? " · " + esc(r.partner) : "") + (r.phone ? " · " + esc(r.phone) : "") + "</small></div></div>"; }).join("")
                    : '<p class="cp-muted">' + (st === "CONFIRMED" || st === "PENDING" ? "These are assigned by our tour operations team (automatically after payment)." : "None assigned.") + "</p>") + "</div>" +
                '<div class="card"><h3 class="cp-h">Travelers</h3>' + (trav.length ? '<div class="table-wrap"><table class="cp-table"><thead><tr><th>Name</th><th>NIC / Passport</th><th>Age</th></tr></thead><tbody>' + trav.map(function (t) { return "<tr><td>" + esc(t.n) + "</td><td>" + esc(t.i || "-") + "</td><td>" + esc(t.a || "-") + "</td></tr>"; }).join("") + "</tbody></table></div>" : '<p class="cp-muted">No traveler details.</p>') + "</div>" +
                "</div><aside>" +
                '<div class="card"><h3 class="cp-h">Payment</h3><div class="info-list">' +
                "<p><b>Subtotal</b><span>" + money((b.totalAmount || 0) + (b.discountAmount || 0)) + "</span></p>" +
                (b.discountAmount ? "<p><b>Coupon " + esc(b.couponCode || "") + "</b><span>− " + money(b.discountAmount) + "</span></p>" : "") +
                "<p><b>Total</b><span>" + money(b.totalAmount) + "</span></p><p><b>Status</b><span>" + label(ps) + "</span></p>" +
                (b.paymentReference ? "<p><b>Reference</b><span>" + esc(b.paymentReference) + "</span></p><p><b>Method</b><span>" + esc(b.paymentMethod || "-") + "</span></p><p><b>Paid on</b><span>" + fmtDate(b.paidAt) + "</span></p>" : "") +
                "</div>" + (ps === "PAID" ? '<button class="btn btn-soft cp-wide" data-do="receipt">🧾 Receipt</button>' : "") + "</div>" +
                '<div class="card"><h3 class="cp-h">Trip details</h3><div class="info-list"><p><b>Pickup</b><span>' + esc(b.pickupLocation || "Not specified") + "</span></p><p><b>Special requests</b><span>" + esc(b.specialRequests || "None") + "</span></p>" +
                (b.customPlan ? "<p><b>Customization</b><span>" + esc(b.customPlan) + "</span></p>" : "") + "</div></div>" +
                "</aside></div>";

            $$("[data-do]", box).forEach(function (btn) {
                btn.onclick = function () {
                    var act = btn.dataset.do, panel = $("#cpPanel");
                    hideAlert(alertEl);
                    if (act === "print") { if (it) printDoc("Itinerary " + code(b.bookingId), itineraryHtml(it)); return; }
                    if (act === "receipt") {
                        printDoc("Receipt", '<div class="brand"><div><h1>Explore Lanka</h1><div class="muted">Payment receipt</div></div><div class="muted">' + esc(b.paymentReference || "") + "</div></div><h2>Booking " + code(b.bookingId) + "</h2><table>" +
                            [["Package", p.packageName], ["Travel date", fmtDate(b.travelDate)], ["Travelers", b.numberOfPeople], ["Coupon", b.couponCode || "-"], ["Discount", b.discountAmount ? money(b.discountAmount) : "-"], ["Amount paid", money(b.totalAmount)], ["Method", b.paymentMethod || "-"], ["Paid on", fmtDate(b.paidAt)]]
                                .map(function (x) { return "<tr><td><b>" + esc(x[0]) + "</b></td><td>" + esc(x[1]) + "</td></tr>"; }).join("") + "</table>");
                        return;
                    }
                    if (act === "cancel") {
                        if (!confirm("Cancel booking " + code(b.bookingId) + "?" + (ps === "PAID" ? " Your payment will be refunded." : ""))) return;
                        btn.disabled = true;
                        api("PUT", "/api/bookings/" + b.bookingId + "/cancel").then(function () { alertBox(alertEl, "Booking cancelled." + (ps === "PAID" ? " A refund request was sent to our finance team." : ""), "ok"); load(); })
                            .catch(function (e) { alertBox(alertEl, e.message); btn.disabled = false; });
                        return;
                    }
                    if (act === "pay") {
                        panel.innerHTML = '<div class="card cp-pay"><h3 class="cp-h">Pay ' + money(b.totalAmount) + '</h3><div class="cp-tabs"><label><input type="radio" name="pm" value="CARD" checked> 💳 Card</label><label><input type="radio" name="pm" value="BANK_TRANSFER"> 🏦 Bank transfer</label></div>' +
                            '<div id="cardFields" class="form-grid"><div class="field full"><label for="ccNum">Card number</label><input id="ccNum" inputmode="numeric" maxlength="19" placeholder="4242 4242 4242 4242"></div>' +
                            '<div class="field"><label for="ccExp">Expiry (MM/YY)</label><input id="ccExp" maxlength="5" placeholder="08/28"></div><div class="field"><label for="ccCvc">CVC</label><input id="ccCvc" maxlength="4" inputmode="numeric" placeholder="123"></div>' +
                            '<div class="field full"><label for="ccName">Name on card</label><input id="ccName" maxlength="60"></div></div>' +
                            '<div id="bankFields" hidden><p class="cp-note">Transfer ' + money(b.totalAmount) + " to Explore Lanka (Pvt) Ltd – BOC Colombo 123-456-789 with reference " + code(b.bookingId) + ". Then click Confirm.</p></div>" +
                            '<p class="cp-muted">🔒 Demo payment – card details are not stored (only the last 4 digits).</p><div class="cp-actions"><button class="btn btn-primary" id="payGo">Pay ' + money(b.totalAmount) + '</button><button class="btn btn-soft" id="payClose">Close</button></div></div>';
                        $$('input[name="pm"]', panel).forEach(function (r) { r.onchange = function () { var card = $('input[name="pm"]:checked', panel).value === "CARD"; $("#cardFields").hidden = !card; $("#bankFields").hidden = card; }; });
                        $("#ccNum").addEventListener("input", function (e) { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "); });
                        $("#payClose").onclick = function () { panel.innerHTML = ""; };
                        $("#payGo").onclick = function () {
                            var pm = $('input[name="pm"]:checked', panel).value, body = {paymentMethod: pm};
                            if (pm === "CARD") {
                                var num = $("#ccNum").value.replace(/\s/g, ""), exp = $("#ccExp").value.trim(), cvc = $("#ccCvc").value.trim();
                                var m = /^(\d{2})\/(\d{2})$/.exec(exp), expOk = m && +m[1] >= 1 && +m[1] <= 12 && new Date(2000 + +m[2], +m[1], 0) >= new Date();
                                if (!/^\d{13,16}$/.test(num) || !expOk || !/^\d{3,4}$/.test(cvc) || !$("#ccName").value.trim()) { alertBox(alertEl, "Please enter valid card details (number, expiry, CVC and name)."); window.scrollTo({top: 0, behavior: "smooth"}); return; }
                                body.cardLast4 = num.slice(-4);
                            }
                            this.disabled = true; this.textContent = "Processing…";
                            api("PUT", "/api/bookings/" + b.bookingId + "/pay", body).then(function () { alertBox(alertEl, "Payment successful! Your hotel, vehicle and guide are being reserved.", "ok"); load(); })
                                .catch(function (e) { alertBox(alertEl, e.message + " Please try again or choose another payment method."); load(); });
                        };
                        panel.scrollIntoView({behavior: "smooth"});
                        return;
                    }
                    if (act === "modify") {
                        var limited = st === "CONFIRMED", dep = departures(p);
                        panel.innerHTML = '<div class="card"><h3 class="cp-h">Modify booking</h3>' + (limited ? '<p class="cp-note">This booking is confirmed, so only traveler details and special requests can be changed online.</p>' : "") +
                            '<div class="form-grid">' + (limited ? "" :
                                '<div class="field"><label for="mDate">Travel date</label>' + (dep.length ? '<select id="mDate">' + dep.map(function (d) { return '<option value="' + d + '"' + (d === b.travelDate ? " selected" : "") + ">" + fmtDate(d) + "</option>"; }).join("") + "</select>"
                                    : '<input type="date" id="mDate" min="' + addDays(todayIso(), 1) + '" value="' + esc(b.travelDate) + '">') + "</div>" +
                                '<div class="field"><label for="mPeople">Travelers</label><input type="number" id="mPeople" min="1" max="50" value="' + b.numberOfPeople + '"></div>' +
                                '<div class="field full"><label for="mPickup">Pickup location</label><input id="mPickup" maxlength="150" value="' + esc(b.pickupLocation || "") + '"></div>') +
                            '<div class="field full"><label for="mTrav">Travelers (one per line: Name | NIC / Passport | Age)</label><textarea id="mTrav" rows="4">' + esc(b.travelerDetails || "") + "</textarea></div>" +
                            '<div class="field full"><label for="mReq">Special requests</label><textarea id="mReq" maxlength="1000">' + esc(b.specialRequests || "") + "</textarea></div>" +
                            (!limited && p.customizable ? '<div class="field full"><label for="mPlan">Customization request</label><textarea id="mPlan" maxlength="2000">' + esc(b.customPlan || "") + "</textarea></div>" : "") +
                            '</div><div class="cp-actions"><button class="btn btn-primary" id="mSave">Save changes</button><button class="btn btn-soft" id="mClose">Close</button></div></div>';
                        $("#mClose").onclick = function () { panel.innerHTML = ""; };
                        $("#mSave").onclick = function () {
                            var body = {travelerDetails: $("#mTrav").value, specialRequests: $("#mReq").value};
                            if (!limited) { body.travelDate = $("#mDate").value; body.numberOfPeople = Number($("#mPeople").value); body.pickupLocation = $("#mPickup").value; if ($("#mPlan")) body.customPlan = $("#mPlan").value; }
                            this.disabled = true;
                            var self = this;
                            api("PUT", "/api/bookings/" + b.bookingId + "/details", body).then(function () { alertBox(alertEl, "Booking updated.", "ok"); load(); })
                                .catch(function (e) { alertBox(alertEl, e.message); self.disabled = false; window.scrollTo({top: 0, behavior: "smooth"}); });
                        };
                        panel.scrollIntoView({behavior: "smooth"});
                    }
                };
            });
            if (location.hash === "#pay" && canPay) { history.replaceState(null, "", location.pathname + location.search); var pb = $('[data-do="pay"]', box); if (pb) pb.click(); }
        }
        load();
    }

    // =====================================================
    // EVENTS (filter by region / category, register)
    // =====================================================
    function pageEvents() {
        var grid = $("#evGrid"), all = [], regIds = [];
        function render() {
            var q = ($("#evSearch").value || "").toLowerCase(), reg = $("#evRegion").value, cat = $("#evCategory").value, when = $("#evWhen").value, t = todayIso();
            var rows = all.filter(function (e) {
                var last = e.endDate || e.eventDate;
                return up(e.status) !== "CANCELLED" && (when === "past" ? last < t : last >= t) &&
                    (when !== "month" || e.eventDate.slice(0, 7) === t.slice(0, 7) || (e.eventDate <= t && last >= t)) &&
                    (when !== "30" || e.eventDate <= addDays(t, 30)) &&
                    (!reg || e.region === reg) && (!cat || e.category === cat) &&
                    (!q || [e.eventName, e.location, e.description, e.category, e.region].join(" ").toLowerCase().indexOf(q) > -1);
            }).sort(function (a, b) { return a.eventDate.localeCompare(b.eventDate); });
            $("#evCount").textContent = rows.length + " event" + (rows.length === 1 ? "" : "s");
            if ($("#evByRegion").checked && rows.length) {
                var groups = {};
                rows.forEach(function (e) { var k = e.region || "Other"; (groups[k] = groups[k] || []).push(e); });
                grid.className = "";
                grid.innerHTML = Object.keys(groups).sort().map(function (k) { return '<h3 class="cp-region">' + esc(k) + (k === "Other" ? "" : " Province") + ' <small>' + groups[k].length + '</small></h3><div class="grid grid-3">' + groups[k].map(function (e, i) { return eventCard(e, i, regIds); }).join("") + "</div>"; }).join("");
            } else {
                grid.className = "grid grid-3";
                grid.innerHTML = rows.length ? rows.map(function (e, i) { return eventCard(e, i, regIds); }).join("") : empty("No events found", "Try another region, category or time.");
            }
        }
        Promise.all([list("/api/events"), list("/api/events/my-registrations").catch(function () { return []; })]).then(function (r) {
            all = r[0]; regIds = r[1].map(function (x) { return x.event && x.event.eventId; });
            var regs = Object.keys(all.reduce(function (o, e) { if (e.region) o[e.region] = 1; return o; }, {})).sort();
            var cats = Object.keys(all.reduce(function (o, e) { if (e.category) o[e.category] = 1; return o; }, {})).sort();
            $("#evRegion").innerHTML = '<option value="">All regions</option>' + regs.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("");
            $("#evCategory").innerHTML = '<option value="">All categories</option>' + cats.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("");
            if (qs("region")) $("#evRegion").value = qs("region");
            render();
        }).catch(function (e) { grid.innerHTML = empty("Could not load events", e.message); });
        ["#evSearch", "#evRegion", "#evCategory", "#evWhen", "#evByRegion"].forEach(function (s) { $(s).addEventListener("input", render); $(s).addEventListener("change", render); });
    }

    function pageEventDetails() {
        var box = $("#evDetails"), id = qs("id");
        if (!id) { box.innerHTML = empty("Event not found", "", ["All events", "/ui/customer-events"]); return; }
        function load() {
            Promise.all([api("GET", "/api/events/" + id), list("/api/events/my-registrations").catch(function () { return []; }), list("/api/packages").catch(function () { return []; })]).then(function (r) {
                var e = r[0], mine = r[1].filter(function (x) { return x.event && String(x.event.eventId) === String(e.eventId); })[0], pk = r[2].filter(isActivePkg);
                var t = todayIso(), open = up(e.status) === "UPCOMING" || up(e.status) === "ONGOING";
                var reg = e.registeredCount || 0, left = e.maxParticipants ? Math.max(0, e.maxParticipants - reg) : null;
                var word = String(e.location || "").split(/[ ,]/)[0].toLowerCase();
                var near = word ? pk.filter(function (p) { return String(p.destinations || p.packageName).toLowerCase().indexOf(word) > -1; }) : [];
                box.innerHTML = '<section class="hero cp-hero" style="--cp-img:url(\'' + esc(e.imageUrl || IMAGES[3]) + '\')"><span class="eyebrow">' + esc(e.category || "EVENT") + (e.region ? " · " + esc(e.region).toUpperCase() + " PROVINCE" : "") + "</span><h2>" + esc(e.eventName) + "</h2><p>" +
                    esc(e.location || "") + " · " + fmtDate(e.eventDate) + (e.endDate ? " – " + fmtDate(e.endDate) : "") + (e.startTime ? " · " + esc(e.startTime) : "") + "</p></section>" +
                    '<div class="cp-two"><div><div class="card"><h3 class="cp-h">About this event</h3><p class="cp-text">' + esc(e.description || "Join this Sri Lankan celebration during your trip.") + "</p>" +
                    '<div class="info-list"><p><b>Dates</b><span>' + fmtDate(e.eventDate) + (e.endDate ? " – " + fmtDate(e.endDate) : "") + "</span></p>" + (e.startTime ? "<p><b>Starts</b><span>" + esc(e.startTime) + "</span></p>" : "") +
                    "<p><b>Location</b><span>" + esc(e.location || "-") + "</span></p>" + (e.organizer ? "<p><b>Organizer</b><span>" + esc(e.organizer) + "</span></p>" : "") + (e.dressCode ? "<p><b>Dress code</b><span>" + esc(e.dressCode) + "</span></p>" : "") + "<p><b>Status</b><span>" + label(e.status) + "</span></p></div></div>" +
                    (near.length ? '<div class="card"><h3 class="cp-h">Tour packages that visit ' + esc(e.location) + '</h3><div class="grid grid-2">' + near.slice(0, 2).map(function (p, i) { return packageCard(p, i, []); }).join("") + "</div></div>" : "") +
                    '</div><aside><div class="card cp-avail"><h3 class="cp-h">Register</h3>' +
                    (e.maxParticipants ? "<p>" + reg + " of " + e.maxParticipants + ' places taken</p><div class="kpi-line"><span style="width:' + Math.min(100, Math.round(reg / e.maxParticipants * 100)) + '%"></span></div>' : "<p>" + reg + " people registered · no limit</p>") +
                    (mine ? '<p class="cp-ok" style="margin-top:12px">✓ You are registered (' + mine.people + " people).</p>" + (open ? '<button class="btn btn-soft cp-wide" id="evCancel">Cancel my registration</button>' : "")
                        : open ? (left === 0 ? '<p class="cp-bad" style="margin-top:12px">This event is full.</p>' : '<div class="field" style="margin-top:12px"><label for="evPeople">People</label><input type="number" id="evPeople" min="1" max="' + Math.min(20, left == null ? 20 : left) + '" value="1"></div><button class="btn btn-primary cp-wide" id="evReg">Register for this event</button>')
                            : '<p class="cp-muted" style="margin-top:12px">Registration is closed.</p>') +
                    '<div class="bk-alert" id="evAlert"></div><a class="btn btn-soft cp-wide" href="/ui/customer-events">← All events</a></div></aside></div>';
                var rb = $("#evReg");
                if (rb) rb.onclick = function () {
                    rb.disabled = true;
                    api("POST", "/api/events/" + e.eventId + "/register", {people: Number($("#evPeople").value) || 1}).then(function () { toast("You're registered for " + e.eventName + "!"); load(); })
                        .catch(function (er) { alertBox($("#evAlert"), er.message); rb.disabled = false; });
                };
                var cb = $("#evCancel");
                if (cb) cb.onclick = function () { if (!confirm("Cancel your registration?")) return; api("DELETE", "/api/events/" + e.eventId + "/register").then(function () { toast("Registration cancelled"); load(); }).catch(function (er) { alertBox($("#evAlert"), er.message); }); };
            }).catch(function (er) { box.innerHTML = empty("Event not found", er.message, ["All events", "/ui/customer-events"]); });
        }
        load();
    }

    // =====================================================
    // OFFERS
    // =====================================================
    function offerCard(o) {
        var pkg = o.tourPackage;
        return '<article class="card cp-offer"><div class="cp-offer-top" style="' + (o.imageUrl ? "background-image:url('" + esc(o.imageUrl) + "')" : "") + '"><span class="offer-percent">' + esc(o.discountPercentage) + '%<small>OFF</small></span><span class="badge info">' + label(o.promoType || "OFFER") + "</span></div>" +
            '<div class="cp-offer-body"><h4>' + esc(o.title) + "</h4><p>" + esc(o.description || "") + "</p><div class=\"meta\"><span>" + (pkg ? esc(pkg.packageName) : "All packages") + "</span><span>Until " + fmtDate(o.endDate) + "</span>" +
            (o.minTravelers ? "<span>Min. " + o.minTravelers + " travelers</span>" : "") + (o.minDaysBeforeTravel ? "<span>Book " + o.minDaysBeforeTravel + "+ days ahead</span>" : "") + "</div>" +
            (o.couponCode ? '<div class="cp-coupon"><code class="cp-code">' + esc(o.couponCode) + '</code><button type="button" class="btn btn-soft" data-copy="' + esc(o.couponCode) + '">Copy</button></div>' : "") +
            '<a class="btn btn-primary cp-wide" href="/ui/customer-booking?' + (pkg ? "packageId=" + pkg.packageId + "&" : "") + (o.couponCode ? "coupon=" + encodeURIComponent(o.couponCode) : "") + '">Use this offer</a></div></article>';
    }
    function pageOffers() {
        list("/api/promotions/active").then(function (l) {
            var featured = l.filter(function (o) { return o.featured; }), rest = l.filter(function (o) { return !o.featured; });
            $("#offerFeatured").innerHTML = featured.length ? featured.map(offerCard).join("") : "";
            $("#offerFeaturedHead").hidden = !featured.length;
            $("#offerGrid").innerHTML = rest.length ? rest.map(offerCard).join("") : (featured.length ? "" : empty("No offers right now", "New seasonal and festival offers are added regularly.", ["Browse packages", "/ui/customer-tour-packages"]));
        }).catch(function (e) { $("#offerGrid").innerHTML = empty("Could not load offers", e.message); });
        document.addEventListener("click", function (e) {
            var b = e.target.closest("[data-copy]"); if (!b) return;
            (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.copy) : Promise.reject()).then(function () { toast("Code " + b.dataset.copy + " copied"); }, function () { toast("Code: " + b.dataset.copy); });
        });
    }

    // =====================================================
    // MY TRIPS
    // =====================================================
    function pageMyTrips() {
        list("/api/bookings/customer/" + userId()).then(function (l) {
            var t = todayIso();
            function endOf(b) { return addDays(b.travelDate, Math.max(0, ((b.tourPackage || {}).durationDays || 1) - 1)); }
            var live = l.filter(function (b) { return up(b.status) !== "CANCELLED"; });
            var groups = [["Happening now", live.filter(function (b) { return b.travelDate <= t && endOf(b) >= t; })],
                ["Upcoming", live.filter(function (b) { return b.travelDate > t; }).sort(function (a, b) { return a.travelDate.localeCompare(b.travelDate); })],
                ["Past trips", live.filter(function (b) { return endOf(b) < t; })]];
            $("#tUp").textContent = groups[1][1].length; $("#tNow").textContent = groups[0][1].length; $("#tPast").textContent = groups[2][1].length;
            $("#tCancel").textContent = l.length - live.length;
            $("#tripStack").innerHTML = live.length ? groups.filter(function (g) { return g[1].length; }).map(function (g) {
                return '<h3 class="cp-region">' + g[0] + "</h3>" + g[1].map(function (b, i) {
                    var p = b.tourPackage || {};
                    return '<article class="card trip-card cp-trip"><div class="trip-art" style="background-image:url(\'' + esc(img(p, i)) + '\')"></div><div><div class="cp-trip-head"><h4>' + esc(p.packageName || "Trip") + "</h4>" + badge(b.status) + " " + badge(payStatus(b)) + "</div><p>" +
                        esc(p.destinations || "") + "</p><div class=\"meta\"><span>" + fmtDate(b.travelDate) + " – " + fmtDate(endOf(b)) + "</span><span>" + b.numberOfPeople + " traveler(s)</span><span>" + money(b.totalAmount) + "</span>" +
                        (b.travelDate > t ? "<span>in " + daysUntil(b.travelDate) + " days</span>" : "") + '</div><div class="cp-actions" style="margin-top:10px"><a class="btn btn-primary" href="/ui/customer-booking-details?id=' + b.bookingId + '">Open trip</a>' +
                        (g[0] === "Past trips" ? '<a class="btn btn-soft" href="/ui/customer-reviews?bookingId=' + b.bookingId + '">★ Review</a>' : "") + "</div></div></article>";
                }).join("");
            }).join("") : empty("No trips yet", "Your booked tours will appear here.", ["Browse packages", "/ui/customer-tour-packages"]);
        }).catch(function (e) { $("#tripStack").innerHTML = empty("Could not load trips", e.message); });
    }

    // =====================================================
    // PAYMENTS / HISTORY
    // =====================================================
    function pagePayments() {
        list("/api/bookings/customer/" + userId()).then(function (l) {
            var sum = function (f) { return l.filter(f).reduce(function (s, b) { return s + (b.totalAmount || 0); }, 0); };
            $("#pPaid").textContent = money(sum(function (b) { return payStatus(b) === "PAID"; }));
            $("#pDue").textContent = money(sum(function (b) { return up(b.status) === "CONFIRMED" && payStatus(b) === "UNPAID"; }));
            $("#pRefund").textContent = money(sum(function (b) { return payStatus(b) === "REFUND_PENDING" || payStatus(b) === "REFUNDED"; }));
            $("#pSaved").textContent = money(l.reduce(function (s, b) { return s + (b.discountAmount || 0); }, 0));
            $("#payBody").innerHTML = l.length ? l.map(function (b) {
                var ps = payStatus(b), due = up(b.status) === "CONFIRMED" && ps === "UNPAID";
                return "<tr><td><b>" + esc(b.paymentReference || "—") + "</b><small>" + esc(b.paymentMethod || "") + "</small></td><td>" + code(b.bookingId) + "<small>" + esc(b.tourPackage ? b.tourPackage.packageName : "") + "</small></td><td>" + (b.paidAt ? fmtDate(b.paidAt) : "-") + "</td><td>" + money(b.totalAmount) +
                    (b.discountAmount ? "<small>saved " + money(b.discountAmount) + "</small>" : "") + "</td><td>" + badge(ps) + "</td><td>" + (due ? '<a class="btn btn-gold" href="/ui/customer-booking-details?id=' + b.bookingId + '#pay">Pay now</a>' : up(b.status) === "PENDING" ? "<small>Awaiting confirmation</small>" : '<a class="bk-link" href="/ui/customer-booking-details?id=' + b.bookingId + '">View</a>') + "</td></tr>";
            }).join("") : '<tr><td colspan="6"><div class="bk-empty"><h4>No payments yet</h4></div></td></tr>';
        }).catch(function (e) { $("#payBody").innerHTML = '<tr><td colspan="6">' + esc(e.message) + "</td></tr>"; });
    }

    // =====================================================
    // REFUNDS & CANCELLATIONS
    // =====================================================
    function pageRefunds() {
        function load() {
            list("/api/bookings/customer/" + userId()).then(function (l) {
                var cancellable = l.filter(function (b) { var s = up(b.status); return (s === "PENDING" || s === "CONFIRMED") && daysUntil(b.travelDate) >= CHANGE_DAYS; });
                $("#rfBooking").innerHTML = cancellable.length ? '<option value="">Choose a booking</option>' + cancellable.map(function (b) { return '<option value="' + b.bookingId + '">' + code(b.bookingId) + " – " + esc(b.tourPackage ? b.tourPackage.packageName : "") + " – " + fmtDate(b.travelDate) + (payStatus(b) === "PAID" ? " (paid)" : "") + "</option>"; }).join("")
                    : '<option value="">No bookings can be cancelled online</option>';
                var rf = l.filter(function (b) { return up(b.status) === "CANCELLED"; });
                $("#rfList").innerHTML = rf.length ? rf.map(function (b) {
                    var ps = payStatus(b);
                    return '<div class="card cp-refund"><div><b>' + code(b.bookingId) + " · " + esc(b.tourPackage ? b.tourPackage.packageName : "") + "</b><small>Travel " + fmtDate(b.travelDate) + "</small></div><div>" + money(b.totalAmount) + " " +
                        (ps === "REFUND_PENDING" ? badge("REFUND_PENDING", "Refund in progress") : ps === "REFUNDED" ? badge("REFUNDED", "Refunded") : badge("CANCELLED", "Cancelled – nothing paid")) + "</div></div>";
                }).join("") : '<p class="cp-muted">No cancelled bookings.</p>';
            });
        }
        $("#rfForm").addEventListener("submit", function (e) {
            e.preventDefault();
            var id = $("#rfBooking").value, a = $("#rfAlert");
            if (!id) { alertBox(a, "Choose a booking to cancel."); return; }
            if (!confirm("Cancel booking " + code(id) + "? This cannot be undone.")) return;
            api("PUT", "/api/bookings/" + id + "/cancel").then(function (b) { alertBox(a, "Booking " + code(id) + " cancelled." + (payStatus(b) === "REFUND_PENDING" ? " Your refund is being processed." : ""), "ok"); load(); })
                .catch(function (er) { alertBox(a, er.message); });
        });
        load();
    }

    // =====================================================
    // REVIEWS (feedback after the tour)
    // =====================================================
    function pageReviews() {
        var alertEl = $("#rvAlert"), rating = 0;
        function load() {
            Promise.all([list("/api/bookings/customer/" + userId()), list("/api/feedback/customer/" + userId())]).then(function (r) {
                var reviewed = r[1].map(function (f) { return f.booking && f.booking.bookingId; });
                var eligible = r[0].filter(function (b) { var s = up(b.status); return (s === "COMPLETED" || (s === "CONFIRMED" && b.travelDate <= todayIso())) && reviewed.indexOf(b.bookingId) < 0; });
                $("#rvBooking").innerHTML = eligible.length ? eligible.map(function (b) { return '<option value="' + b.bookingId + '">' + esc(b.tourPackage ? b.tourPackage.packageName : "Trip") + " – " + fmtDate(b.travelDate) + "</option>"; }).join("")
                    : '<option value="">No finished trips to review yet</option>';
                if (qs("bookingId") && eligible.some(function (b) { return String(b.bookingId) === qs("bookingId"); })) $("#rvBooking").value = qs("bookingId");
                $("#rvSubmit").disabled = !eligible.length;
                $("#rvList").innerHTML = r[1].length ? r[1].map(function (f) {
                    return '<div class="card cp-review"><div><b>' + esc(f.booking && f.booking.tourPackage ? f.booking.tourPackage.packageName : "Trip") + '</b><span class="cp-stars">' + stars(f.rating) + "</span><small>" + fmtDate(f.feedbackDate) + "</small></div><p>" + esc(f.comment) + "</p></div>";
                }).join("") : '<p class="cp-muted">You have not written any reviews yet.</p>';
            }).catch(function (e) { alertBox(alertEl, e.message); });
        }
        $$("#rvStars button").forEach(function (b) {
            b.onclick = function () { rating = Number(b.dataset.v); $$("#rvStars button").forEach(function (x) { x.classList.toggle("on", Number(x.dataset.v) <= rating); }); };
        });
        $("#rvForm").addEventListener("submit", function (e) {
            e.preventDefault(); hideAlert(alertEl);
            var c = $("#rvComment").value.trim();
            if (!$("#rvBooking").value) return alertBox(alertEl, "Choose the trip you are reviewing.");
            if (!rating) return alertBox(alertEl, "Please choose a star rating.");
            if (c.length < 5) return alertBox(alertEl, "Please write a short review (at least 5 characters).");
            api("POST", "/api/feedback", {bookingId: Number($("#rvBooking").value), rating: rating, comment: c}).then(function () {
                alertBox(alertEl, "Thank you! Your review was posted.", "ok"); $("#rvComment").value = ""; rating = 0; $$("#rvStars button").forEach(function (x) { x.classList.remove("on"); }); load();
            }).catch(function (er) { alertBox(alertEl, er.message); });
        });
        load();
    }

    // =====================================================
    // PROFILE (Customer Profile Management)
    // =====================================================
    function pageProfile() {
        var a = $("#pfAlert");
        function fill(u) {
            $("#pfName").value = u.name || ""; $("#pfUsername").value = u.username || ""; $("#pfEmail").value = u.email || ""; $("#pfPhone").value = u.phone || ""; $("#pfNic").value = u.nic || ""; $("#pfAddress").value = u.address || "";
            $("#pfDisplay").textContent = u.name || "Traveler"; $("#pfPhoto").textContent = (u.name || "?").trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join("");
            $("#pfSince").textContent = u.createdAt ? "Member since " + fmtDate(u.createdAt) : "Explore Lanka traveler";
        }
        api("GET", "/api/profile").then(fill).catch(function (e) { alertBox(a, e.message); });
        $("#profileForm").addEventListener("submit", function (e) {
            e.preventDefault(); hideAlert(a);
            var body = {name: $("#pfName").value.trim(), username: $("#pfUsername").value.trim(), phone: $("#pfPhone").value.trim(), address: $("#pfAddress").value.trim()};
            if (body.name.length < 2) return alertBox(a, "Please enter your full name.");
            if (body.phone && !/^0\d{9}$/.test(body.phone)) return alertBox(a, "Phone must be 10 digits and start with 0.");
            api("PUT", "/api/profile", body).then(function (u) { fill(u); sessionStorage.setItem("userName", u.name); alertBox(a, "Profile saved.", "ok"); }).catch(function (er) { alertBox(a, er.message); });
        });
        $("#pwForm").addEventListener("submit", function (e) {
            e.preventDefault();
            var pa = $("#pwAlert"), n = $("#pwNew").value;
            if (n !== $("#pwConfirm").value) return alertBox(pa, "The new passwords don't match.");
            if (n.length < 8 || !/[A-Za-z]/.test(n) || !/\d/.test(n)) return alertBox(pa, "New password must be 8+ characters with letters and numbers.");
            api("PUT", "/api/profile/password", {currentPassword: $("#pwCurrent").value, newPassword: n}).then(function () { alertBox(pa, "Password changed.", "ok"); $("#pwForm").reset(); }).catch(function (er) { alertBox(pa, er.message); });
        });
    }

    // =====================================================
    // NOTIFICATIONS (from bookings, payments, events, offers)
    // =====================================================
    function pageNotifications() {
        Promise.all([list("/api/bookings/customer/" + userId()), list("/api/events/my-registrations").catch(function () { return []; }), list("/api/promotions/active").catch(function () { return []; })]).then(function (r) {
            var t = todayIso(), n = [];
            r[0].forEach(function (b) {
                var s = up(b.status), ps = payStatus(b), name = b.tourPackage ? b.tourPackage.packageName : "your trip";
                if (s === "PENDING") n.push(["⏳", "Booking " + code(b.bookingId) + " received", "We are checking availability for " + name + ".", b.bookingDate, b.bookingId]);
                if (s === "CONFIRMED" && ps === "UNPAID") n.push(["✅", "Booking " + code(b.bookingId) + " confirmed – payment due", "Pay " + money(b.totalAmount) + " to secure " + name + ".", b.travelDate, b.bookingId, true]);
                if (ps === "PAID" && b.paidAt) n.push(["💳", "Payment received", money(b.totalAmount) + " for " + name + " (" + (b.paymentReference || "") + ").", b.paidAt, b.bookingId]);
                if (s !== "CANCELLED" && b.travelDate >= t && daysUntil(b.travelDate) <= 7) n.push(["🧳", "Your trip starts in " + daysUntil(b.travelDate) + " day(s)", name + " · check your itinerary.", b.travelDate, b.bookingId, true]);
                if (ps === "REFUND_PENDING") n.push(["↩", "Refund in progress", money(b.totalAmount) + " for " + code(b.bookingId) + ".", b.travelDate, b.bookingId]);
                if (ps === "REFUNDED") n.push(["↩", "Refund completed", money(b.totalAmount) + " returned for " + code(b.bookingId) + ".", b.travelDate, b.bookingId]);
                if (s === "COMPLETED") n.push(["★", "How was " + name + "?", "Share a review to help other travelers.", b.travelDate, null, false, "/ui/customer-reviews?bookingId=" + b.bookingId]);
            });
            r[1].forEach(function (g) { if (g.event && g.event.eventDate >= t) n.push(["🎉", "You're registered: " + g.event.eventName, fmtDate(g.event.eventDate) + " · " + (g.event.location || ""), g.event.eventDate, null, daysUntil(g.event.eventDate) <= 3, "/ui/customer-event-details?id=" + g.event.eventId]); });
            r[2].filter(function (o) { return o.featured; }).forEach(function (o) { n.push(["🎁", "Special deal: " + o.title, o.discountPercentage + "% off" + (o.couponCode ? " with code " + o.couponCode : "") + " until " + fmtDate(o.endDate) + ".", o.startDate, null, false, "/ui/customer-offers"]); });
            n.sort(function (a, b) { return String(b[3]).localeCompare(String(a[3])); });
            $("#ntList").innerHTML = n.length ? n.map(function (x) {
                var link = x[6] || (x[4] ? "/ui/customer-booking-details?id=" + x[4] : null);
                return '<article class="card cp-note-card' + (x[5] ? " hot" : "") + '"><span>' + x[0] + "</span><div><b>" + esc(x[1]) + "</b><p>" + esc(x[2]) + "</p></div>" + (link ? '<a class="bk-link" href="' + link + '">Open</a>' : "") + "</article>";
            }).join("") : empty("You're all caught up", "Booking, payment and event updates will appear here.");
        }).catch(function (e) { $("#ntList").innerHTML = empty("Could not load notifications", e.message); });
    }

    // =====================================================
    // HOTELS / TRANSPORT / TOUR GUIDES (resources customers can prefer)
    // =====================================================
    function pageResources(type) {
        var grid = $("#resGrid"), all = [];
        var icon = {hotel: "🏨", vehicle: "🚐", guide: "🧭"}[type];
        function render() {
            var q = ($("#resSearch").value || "").toLowerCase(), loc = $("#resLocation").value;
            var rows = all.filter(function (r) { return (!loc || r.location === loc) && (!q || [r.resourceName, r.location, r.partnerName].join(" ").toLowerCase().indexOf(q) > -1); });
            grid.innerHTML = rows.length ? rows.map(function (r, i) {
                return '<article class="card place"><div class="place-cover" style="background-image:url(\'' + IMAGES[(i + (type === "vehicle" ? 1 : type === "guide" ? 2 : 3)) % IMAGES.length] + '\')"><span>' + icon + "</span></div><div class=\"place-body\"><h4>" + esc(r.resourceName) + "</h4><p>" + esc(r.partnerName || "") + "</p><div class=\"meta\">" +
                    (r.location ? "<span>📍 " + esc(r.location) + "</span>" : "") + (r.capacity ? "<span>" + r.capacity + " pax</span>" : "") + (r.rating ? "<span>" + stars(r.rating) + "</span>" : "") + (r.cost ? "<span>" + money(r.cost) + " " + esc(r.rateUnit || "") + "</span>" : "") +
                    '</div><a class="btn btn-primary cp-wide" style="margin-top:12px" href="/ui/customer-booking?pref=' + encodeURIComponent(r.resourceName) + '">Prefer this in my booking</a></div></article>';
            }).join("") : empty("Nothing found", "Try another search.");
        }
        list("/api/resources/public?type=" + type).then(function (l) {
            all = l;
            var locs = Object.keys(l.reduce(function (o, r) { if (r.location) o[r.location] = 1; return o; }, {})).sort();
            $("#resLocation").innerHTML = '<option value="">All locations</option>' + locs.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("");
            render();
        }).catch(function (e) { grid.innerHTML = empty("Could not load", e.message); });
        $("#resSearch").addEventListener("input", render); $("#resLocation").addEventListener("change", render);
    }

    // ---------- boot ----------
    var PAGES = {dashboard: pageDashboard, packages: pagePackages, "package-details": pagePackageDetails, booking: pageBooking, bookings: pageBookings,
        "booking-details": pageBookingDetails, events: pageEvents, "event-details": pageEventDetails, offers: pageOffers, "my-trips": pageMyTrips,
        payments: pagePayments, refunds: pageRefunds, reviews: pageReviews, profile: pageProfile, notifications: pageNotifications,
        hotels: function () { pageResources("hotel"); }, transport: function () { pageResources("vehicle"); }, guides: function () { pageResources("guide"); }};
    document.addEventListener("DOMContentLoaded", function () {
        var page = PAGES[document.body.dataset.cpage];
        if (!page) return;
        var ready = window.portalReady && window.portalReady.then ? window.portalReady : Promise.resolve();
        ready.then(function () { if (!userId()) return; page(); });
    });
})();

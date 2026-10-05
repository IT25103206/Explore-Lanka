/* =========================================================
   Explore Lanka - customer pages connected to real data
   Tour Packages, Package Details, My Trips, Profile, Wishlist
   ========================================================= */
(function () {
    "use strict";

    var IMAGES = ["/images/sigiriya-card.png", "/images/ella-card.png", "/images/mirissa-card.png",
        "/images/kandy-card.png", "/images/nuwara-eliya-card.png", "/images/anuradhapura-card.png"];
    var ICONS = ["🏯", "🚂", "🏖", "🛕", "🍃", "🏛"];

    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function userId() { return sessionStorage.getItem("userId"); }
    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c];
        });
    }
    function money(v) { return "LKR " + Number(v || 0).toLocaleString("en-LK", {maximumFractionDigits: 0}); }
    function todayIso() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
    function addDays(iso, n) { var d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
    function fmtDate(iso) {
        if (!iso) return "-";
        var d = new Date(iso + "T00:00:00");
        return isNaN(d) ? iso : d.toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"});
    }
    function toast(msg) { if (window.customerToast) window.customerToast(msg); }
    function getJson(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
    function active(p) { return !p.status || p.status.trim().toUpperCase() !== "INACTIVE"; }
    function empty(host, title, text, link) {
        host.innerHTML = '<div class="card cp-empty"><h4>' + esc(title) + "</h4><p>" + esc(text) + "</p>" +
            (link ? '<a class="btn btn-primary" href="' + link[1] + '">' + esc(link[0]) + "</a>" : "") + "</div>";
    }

    // ---------------- Wishlist store (shared with Save buttons) ----------------
    var Wish = window.ELWishlist = {
        key: function () { return "el-wishlist-" + (userId() || "guest"); },
        all: function () { try { return JSON.parse(localStorage.getItem(this.key()) || "[]"); } catch (e) { return []; } },
        save: function (list) { try { localStorage.setItem(this.key(), JSON.stringify(list)); } catch (e) { /* full */ } },
        has: function (id) { return this.all().some(function (x) { return x.id === id; }); },
        add: function (item) { var l = this.all().filter(function (x) { return x.id !== item.id; }); l.unshift(item); this.save(l); },
        remove: function (id) { this.save(this.all().filter(function (x) { return x.id !== id; })); }
    };

    // ---------------- Tour Packages ----------------
    function initPackages() {
        var grid = $("#packageGrid");
        if (!grid) return;
        var all = [], q = $("#packageSearch"), dur = $("#packageDuration");

        function render() {
            var text = (q.value || "").trim().toLowerCase(), d = dur.value;
            var list = all.filter(function (p) {
                var days = p.durationDays || 0;
                var okText = !text || [p.packageName, p.description, p.category].join(" ").toLowerCase().indexOf(text) > -1;
                var okDur = d === "all" || (d === "short" && days <= 3) || (d === "mid" && days >= 4 && days <= 7) || (d === "long" && days > 7);
                return okText && okDur;
            });
            if (!all.length) { empty(grid, "No tour packages yet", "New packages will appear here as soon as our team publishes them."); return; }
            if (!list.length) { empty(grid, "No packages match", "Try a different search or duration."); return; }
            grid.innerHTML = list.map(function (p) {
                var i = all.indexOf(p) % IMAGES.length;
                return '<article class="card place"><div class="place-cover" style="background-image:url(\'' + esc(p.imageUrl || IMAGES[i]) + '\')"><span>' + ICONS[i] + "</span></div>" +
                    '<div class="place-body"><h4>' + esc(p.packageName) + "</h4><p>" + esc(p.description || "A curated Sri Lankan journey.") + "</p>" +
                    '<div class="meta">' + (p.durationDays ? "<span>" + p.durationDays + " Day" + (p.durationDays > 1 ? "s" : "") + "</span>" : "") +
                    "<span>" + money(p.price) + "</span>" + (p.category ? "<span>" + esc(p.category) + "</span>" : "") + "</div>" +
                    '<div class="card-actions"><a class="btn btn-soft" href="/ui/customer-package-details?id=' + p.packageId + '">Details</a>' +
                    '<a class="btn btn-primary" href="/ui/customer-booking?packageId=' + p.packageId + '">Book now</a></div></div></article>';
            }).join("");
        }

        grid.innerHTML = '<div class="card cp-empty"><p>Loading packages...</p></div>';
        getJson("/api/packages")
            .then(function (list) { all = (list || []).filter(active); render(); })
            .catch(function () { empty(grid, "Could not load packages", "Please refresh the page."); });
        q.addEventListener("input", render);
        dur.addEventListener("change", render);
    }

    // ---------------- Package Details ----------------
    function initPackageDetails() {
        var box = $("#packageDetails");
        if (!box) return;
        var id = new URLSearchParams(location.search).get("id");
        if (!id || !/^\d+$/.test(id)) {
            empty(box, "Choose a package first", "Open a package from the Tour Packages page to see its details.", ["Browse packages", "/ui/customer-tour-packages"]);
            return;
        }
        getJson("/api/packages/" + id).then(function (p) {
            if (!p || !p.packageId || !active(p)) throw new Error();
            var img = p.imageUrl || IMAGES[(p.packageId - 1) % IMAGES.length];
            var wishId = "package-" + p.packageId;
            box.innerHTML =
                '<section class="hero cp-pkg-hero" style="--cp-img:url(\'' + img + '\')"><h2>' + esc(p.packageName) + "</h2><p>" +
                esc(p.description || "A curated Sri Lankan journey.") + '</p><div class="hero-actions">' +
                '<a class="btn btn-gold" href="/ui/customer-booking?packageId=' + p.packageId + '">Book This Package</a>' +
                '<button class="btn btn-soft" type="button" id="pkgWish"></button></div></section>' +
                '<div class="grid grid-3"><div class="card"><p class="cp-label">Duration</p><div class="price">' +
                (p.durationDays ? p.durationDays + " Day" + (p.durationDays > 1 ? "s" : "") : "-") +
                '</div></div><div class="card"><p class="cp-label">Price per person</p><div class="price">' + money(p.price) +
                '</div></div><div class="card"><p class="cp-label">Category</p><div class="price">' + esc(p.category || "Tour") + "</div></div></div>" +
                '<div class="section-head"><div><h3>Good to know</h3><p>Before you book</p></div></div>' +
                '<div class="card timeline">' +
                '<div class="timeline-item"><span class="dot"></span><div><h4>Flexible start date</h4><p>Choose any future travel date when booking.</p></div></div>' +
                '<div class="timeline-item"><span class="dot"></span><div><h4>Pay per person</h4><p>The total is calculated from the number of travelers.</p></div></div>' +
                '<div class="timeline-item"><span class="dot"></span><div><h4>Free cancellation before travel</h4><p>Cancel Pending or Confirmed bookings from Booking Details.</p></div></div></div>';
            document.title = "Explore Lanka | " + p.packageName;
            var btn = $("#pkgWish");
            function label() { btn.textContent = Wish.has(wishId) ? "♥ Saved to Wishlist" : "♡ Save to Wishlist"; }
            label();
            btn.addEventListener("click", function () {
                if (Wish.has(wishId)) { Wish.remove(wishId); toast("Removed from wishlist"); }
                else {
                    Wish.add({id: wishId, title: p.packageName, desc: p.description || "", img: img, type: "Tour package",
                        href: "/ui/customer-package-details?id=" + p.packageId});
                    toast("Saved to wishlist");
                }
                label();
            });
        }).catch(function () {
            empty(box, "Package not found", "This package may no longer be available.", ["Browse packages", "/ui/customer-tour-packages"]);
        });
    }

    // ---------------- My Trips ----------------
    function initMyTrips() {
        var stack = $("#tripStack");
        if (!stack) return;
        if (!userId()) return;
        $("#tripSaved").textContent = Wish.all().length;
        getJson("/api/bookings/customer/" + encodeURIComponent(userId())).then(function (list) {
            list = list || [];
            var today = todayIso(), up = 0, act = 0, done = 0;
            var rows = list.map(function (b, i) {
                var st = (b.status || "PENDING").toUpperCase(), p = b.tourPackage || {};
                var end = b.travelDate ? addDays(b.travelDate, Math.max(1, p.durationDays || 1) - 1) : null;
                var phase = st === "CANCELLED" ? "Cancelled"
                    : st === "COMPLETED" || (end && end < today) ? "Completed"
                    : b.travelDate && b.travelDate <= today ? "Active" : "Upcoming";
                if (phase === "Upcoming") up++; else if (phase === "Active") act++; else if (phase === "Completed") done++;
                var badge = {Upcoming: "success", Active: "warning", Completed: "info", Cancelled: "danger"}[phase];
                return '<article class="card trip-card"><div class="trip-art" style="background-image:url(\'' + esc(p.imageUrl || IMAGES[i % IMAGES.length]) + '\')"></div>' +
                    '<div><span class="badge ' + badge + '">' + phase + "</span><h3>" + esc(p.packageName || "Tour booking") + "</h3>" +
                    "<p>Booking #BK-" + String(b.bookingId).padStart(4, "0") + (p.durationDays ? " · " + p.durationDays + " days" : "") + "</p>" +
                    '<div class="meta"><span>' + fmtDate(b.travelDate) + "</span><span>" + b.numberOfPeople + " traveler" + (b.numberOfPeople > 1 ? "s" : "") +
                    "</span><span>" + money(b.totalAmount) + "</span><span>" + st.charAt(0) + st.slice(1).toLowerCase() + "</span></div></div>" +
                    '<a class="btn ' + (phase === "Upcoming" || phase === "Active" ? "btn-primary" : "btn-soft") +
                    '" href="/ui/customer-booking-details?id=' + b.bookingId + '">View trip</a></article>';
            });
            $("#tripUpcoming").textContent = up;
            $("#tripActive").textContent = act;
            $("#tripCompleted").textContent = done;
            if (!rows.length) empty(stack, "No trips yet", "Book a tour and it will show up here.", ["Book a Tour", "/ui/customer-booking"]);
            else stack.innerHTML = rows.join("");
        }).catch(function () { empty(stack, "Could not load your trips", "Please refresh the page."); });
    }

    // ---------------- Profile ----------------
    function initProfile() {
        var form = $("#profileForm");
        if (!form || !userId()) return;
        var msg = $("#profileMsg"), btn = $("#profileSave"), user = null;
        var f = {name: $("#pfName"), username: $("#pfUsername"), email: $("#pfEmail"), phone: $("#pfPhone"), nic: $("#pfNic"), address: $("#pfAddress")};

        function show(text, ok) { msg.textContent = text; msg.className = "cp-msg show " + (ok ? "ok" : "error"); }
        function initials(n) { return (n || "?").trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join(""); }
        function fill(u) {
            user = u;
            Object.keys(f).forEach(function (k) { f[k].value = u[k] || ""; });
            $("#pfStatus").value = (u.status || "ACTIVE").toUpperCase();
            $("#pfDisplayName").textContent = u.name || "Traveler";
            $("#pfPhoto").textContent = initials(u.name);
            $("#pfSince").textContent = u.createdAt ? "Member since " + new Date(u.createdAt).toLocaleDateString("en-GB", {month: "long", year: "numeric"}) : "Explore Lanka customer";
        }

        getJson("/api/users/" + encodeURIComponent(userId())).then(fill)
            .catch(function () { show("Could not load your profile. Please refresh the page.", false); });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            msg.className = "cp-msg";
            var v = {}; Object.keys(f).forEach(function (k) { v[k] = f[k].value.trim(); f[k].classList.remove("invalid"); });
            var errs = [];
            if (!v.name) { errs.push("Name is required."); f.name.classList.add("invalid"); }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { errs.push("Enter a valid email."); f.email.classList.add("invalid"); }
            if (!/^0\d{9}$/.test(v.phone)) { errs.push("Phone must be 10 digits starting with 0."); f.phone.classList.add("invalid"); }
            if (v.nic && !/^(\d{9}[VvXx]|\d{12})$/.test(v.nic)) { errs.push("NIC must be 9 digits + V/X or 12 digits."); f.nic.classList.add("invalid"); }
            if (errs.length) { show(errs.join(" "), false); return; }
            btn.disabled = true; btn.textContent = "Saving...";
            fetch("/api/users/" + encodeURIComponent(userId()), {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({name: v.name, username: v.username || null, email: v.email, phone: v.phone, nic: v.nic || null, address: v.address || null})
            }).then(function (r) {
                if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
                    throw new Error(j.message || "Could not save. The email, phone, username or NIC may already be used.");
                });
                return r.json();
            }).then(function (u) {
                fill(u);
                sessionStorage.setItem("userName", u.name || v.name);
                $$("[data-user-name]").forEach(function (el) { el.textContent = u.name || v.name; });
                show("Profile updated successfully.", true);
                toast("Profile updated");
            }).catch(function (err) { show(err.message, false); })
                .then(function () { btn.disabled = false; btn.textContent = "Save Changes"; });
        });
        form.addEventListener("input", function (e) { if (e.target.classList) e.target.classList.remove("invalid"); });
    }

    // ---------------- Wishlist page ----------------
    function initWishlist() {
        var grid = $("#wishlistGrid");
        if (!grid) return;
        function render() {
            var list = Wish.all();
            if (!list.length) {
                empty(grid, "Your wishlist is empty", "Tap ♡ Save on destinations, packages, hotels or events to keep them here.", ["Explore destinations", "/ui/customer-destinations"]);
                return;
            }
            grid.innerHTML = list.map(function (x) {
                return '<article class="card place" data-wish="' + esc(x.id) + '"><div class="place-cover" style="background-image:url(\'' + esc(x.img || IMAGES[0]) + '\')">' +
                    (x.icon ? "<span>" + esc(x.icon) + "</span>" : "") + '</div><div class="place-body"><h4>' + esc(x.title) + "</h4><p>" + esc(x.desc) + "</p>" +
                    '<div class="meta"><span>' + esc(x.type || "Saved") + "</span></div>" +
                    '<div class="card-actions"><button class="btn btn-danger" type="button" data-unsave>Remove</button>' +
                    (x.href ? '<a class="btn btn-primary" href="' + esc(x.href) + '">Open</a>' : "") + "</div></div></article>";
            }).join("");
        }
        grid.addEventListener("click", function (e) {
            var b = e.target.closest("[data-unsave]");
            if (!b) return;
            Wish.remove(b.closest("[data-wish]").dataset.wish);
            toast("Removed from wishlist");
            render();
        });
        render();
    }


    // ---------------- Destinations filters ----------------
    function initDestinations() {
        var cards = $$("[data-dest]");
        if (!cards.length) return;
        var q = $("#destSearch"), reg = $("#destRegion"), exp = $("#destExp"), grid = cards[0].parentNode;
        var none = document.createElement("div");
        none.className = "card cp-empty";
        none.innerHTML = "<h4>No destinations match</h4><p>Try another region or experience.</p>";
        none.hidden = true;
        grid.appendChild(none);
        function apply() {
            var t = (q.value || "").trim().toLowerCase(), r = reg.value, e = exp.value, shown = 0;
            cards.forEach(function (c) {
                var ok = (!t || c.textContent.toLowerCase().indexOf(t) > -1) &&
                    (r === "all" || c.dataset.region === r) &&
                    (e === "all" || (" " + c.dataset.exp + " ").indexOf(" " + e + " ") > -1);
                c.style.display = ok ? "" : "none";
                if (ok) shown++;
            });
            none.hidden = shown > 0;
        }
        [q, reg, exp].forEach(function (el) { el.addEventListener(el.tagName === "SELECT" ? "change" : "input", apply); });
    }

    // ---------------- Reviews (saved in the database: /api/feedback) ----------------
    function initReviews() {
        var ta = $("#reviews_yourreview");
        if (!ta || !userId()) return;
        var btn = ta.closest(".card").querySelector("button.btn-primary"), sel = $("#reviews_booking"), rate = $("#reviews_rating");
        var list = $$(".card .timeline")[0];
        btn.removeAttribute("data-toast"); btn.onclick = null; btn.type = "button";
        rate.innerHTML = [[5, "★★★★★ Excellent"], [4, "★★★★☆ Very good"], [3, "★★★☆☆ Good"], [2, "★★☆☆☆ Fair"], [1, "★☆☆☆☆ Poor"]]
            .map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("");
        var reviewed = [];
        function stars(n) { n = parseInt(n, 10) || 0; return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
        function drawList(items) {
            reviewed = items.map(function (f) { return f.booking && f.booking.bookingId; });
            list.innerHTML = items.length ? items.map(function (f) {
                var trip = f.booking && f.booking.tourPackage ? f.booking.tourPackage.packageName : "Trip";
                return '<div class="timeline-item"><span class="dot"></span><div><h4>' + stars(f.rating) + " " + esc(trip) + "</h4><p>" + esc(f.comment || "") + "</p></div></div>";
            }).join("") : '<p class="cp-label">You haven\'t reviewed any trips yet.</p>';
        }
        function loadAll() {
            return Promise.all([getJson("/api/feedback/customer/" + encodeURIComponent(userId())).catch(function () { return []; }),
                getJson("/api/bookings/customer/" + encodeURIComponent(userId())).catch(function () { return []; })])
                .then(function (r) {
                    drawList(r[0] || []);
                    var options = (r[1] || []).filter(function (b) { return (b.status || "").toUpperCase() !== "CANCELLED" && reviewed.indexOf(b.bookingId) < 0; });
                    sel.innerHTML = options.length ? options.map(function (b) {
                        return '<option value="' + b.bookingId + '">' + esc(b.tourPackage ? b.tourPackage.packageName : "Trip") + " · #BK-" + String(b.bookingId).padStart(4, "0") + "</option>";
                    }).join("") : '<option value="">No trips to review yet</option>';
                    btn.disabled = !options.length;
                });
        }
        loadAll();
        btn.addEventListener("click", function () {
            var text = ta.value.trim();
            if (!sel.value) { toast("Book a trip first, then you can review it"); return; }
            if (text.length < 5) { ta.classList.add("invalid"); toast("Please write a short review first"); ta.focus(); return; }
            btn.disabled = true; btn.textContent = "Sending...";
            fetch("/api/feedback", {
                method: "POST", headers: {"Content-Type": "application/json"},
                body: JSON.stringify({customerId: Number(userId()), bookingId: Number(sel.value), rating: Number(rate.value), comment: text})
            }).then(function (r) {
                return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.message || "Could not send your review."); return j; });
            }).then(function () {
                ta.value = "";
                toast("Thank you for your feedback!");
                return loadAll();
            }).catch(function (err) { toast(err.message); })
                .then(function () { btn.textContent = "Submit Review"; if (sel.value) btn.disabled = false; });
        });
        ta.addEventListener("input", function () { ta.classList.remove("invalid"); });
    }

    // ---------------- Messages ----------------
    function initMessages() {
        var msgs = $("#chatMessages"), input = $("#chatInput"), send = $("#chatSend");
        if (!msgs || !input || !send) return;
        var greet = {"Explore Lanka Support": "Hello! How can we help with your Sri Lanka journey?",
            "Tour Coordinator": "Hi! Your itinerary is ready. Ask me anything about your trip plan."};
        var people = $$(".chat-person");
        people.forEach(function (p) {
            p.addEventListener("click", function () {
                people.forEach(function (x) { x.classList.remove("active"); });
                p.classList.add("active");
                var name = p.querySelector("b").textContent.trim();
                msgs.innerHTML = '<div class="bubble incoming"></div>';
                msgs.firstChild.textContent = greet[name] || "Hello!";
                input.focus();
            });
        });
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send.click(); } });
        send.addEventListener("click", function () {
            setTimeout(function () {
                if (!msgs.lastChild || !msgs.lastChild.classList.contains("outgoing")) return;
                var r = document.createElement("div");
                r.className = "bubble incoming";
                r.textContent = "Thanks! Our team will reply shortly.";
                msgs.appendChild(r);
                msgs.scrollTop = msgs.scrollHeight;
            }, 900);
        });
    }

    // ---------------- Checkout -> payment ----------------
    function initCheckout() {
        var form = $('form[data-local-form="checkouts"]');
        if (!form) return;
        // capture phase: runs before the form is reset by customer-extras.js
        document.addEventListener("submit", function (e) {
            if (e.target === form && form.checkValidity()) setTimeout(function () { location.href = "/ui/customer-payment"; }, 900);
        }, true);
    }

    document.addEventListener("DOMContentLoaded", function () {
        initReviews();
        initMessages();
        initCheckout();
        initDestinations();
        initPackages();
        initPackageDetails();
        initMyTrips();
        initProfile();
        initWishlist();
    });
})();

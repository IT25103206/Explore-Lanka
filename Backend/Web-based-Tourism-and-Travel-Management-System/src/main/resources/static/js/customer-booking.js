/* =========================================================
   Explore Lanka - Customer booking pages
   Pages: /ui/customer-booking, /ui/customer-bookings, /ui/customer-booking-details
   ========================================================= */
(function () {
    "use strict";

    var API = "/api/bookings";
    var PACKAGES_API = "/api/packages";
    var PAYMENTS_API = "/api/payments";

    // ---------- helpers ----------
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function userId() { return sessionStorage.getItem("userId"); }
    function money(v) { return "LKR " + Number(v || 0).toLocaleString("en-LK", {maximumFractionDigits: 2}); }
    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c];
        });
    }
    function fmtDate(iso) {
        if (!iso) return "-";
        var d = new Date(iso + "T00:00:00");
        return isNaN(d) ? iso : d.toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"});
    }
    function addDays(iso, days) {
        var d = new Date(iso + "T00:00:00");
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
    }
    function todayIso() {
        var d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10);
    }
    function code(id) { return "#BK-" + String(id).padStart(4, "0"); }
    function statusBadge(s) {
        var st = (s || "PENDING").toUpperCase();
        var cls = {PENDING: "warning", CONFIRMED: "success", COMPLETED: "info", CANCELLED: "danger"}[st] || "info";
        return '<span class="badge ' + cls + '">' + st.charAt(0) + st.slice(1).toLowerCase() + "</span>";
    }
    function paymentBadge(s) {
        var st = (s || "PENDING").toUpperCase();
        var cls = {PAID: "success", PENDING: "warning", REFUNDED: "info", CANCELLED: "danger"}[st] || "warning";
        return '<span class="badge ' + cls + '">' + st.charAt(0) + st.slice(1).toLowerCase() + "</span>";
    }
    function canPay(b, payment) {
        var bookingStatus = (b.status || "").toUpperCase();
        var paymentStatus = payment ? (payment.status || "").toUpperCase() : "PENDING";
        return bookingStatus !== "CANCELLED" && bookingStatus !== "COMPLETED" &&
            b.travelDate && b.travelDate > todayIso() && paymentStatus !== "PAID";
    }
    function openPaymentModal(booking, payment, onSuccess) {
        var old = $("#bookingPaymentModal");
        if (old) old.remove();
        var modal = document.createElement("div");
        modal.id = "bookingPaymentModal";
        modal.className = "bk-pay-modal";
        modal.innerHTML = '<div class="bk-pay-dialog" role="dialog" aria-modal="true" aria-labelledby="payTitle">' +
            '<button class="bk-pay-close" type="button" aria-label="Close">×</button>' +
            '<span class="bk-pay-lock">🔒 Secure payment</span><h2 id="payTitle">Pay for ' + esc(code(booking.bookingId)) + '</h2>' +
            '<p class="bk-pay-sub">' + esc(booking.tourPackage ? booking.tourPackage.packageName : "Tour booking") + '</p>' +
            '<div class="bk-pay-amount"><span>Amount due</span><strong>' + money(booking.totalAmount) + '</strong></div>' +
            '<div class="bk-alert" id="paymentAlert"></div><form id="paymentForm">' +
            '<div class="field"><label for="paymentMethod">Payment method</label><select id="paymentMethod" required>' +
            '<option value="CARD">Credit / debit card</option><option value="BANK_TRANSFER">Bank transfer</option><option value="MOBILE_WALLET">Mobile wallet</option></select></div>' +
            '<div class="field"><label for="paymentHolder">Account holder</label><input id="paymentHolder" maxlength="120" required value="' + esc(sessionStorage.getItem("userName") || "") + '"></div>' +
            '<div id="cardFields"><div class="field"><label for="paymentCard">Card number</label><input id="paymentCard" inputmode="numeric" autocomplete="cc-number" maxlength="23" placeholder="1234 5678 9012 3456"></div>' +
            '<div class="form-grid"><div class="field"><label for="paymentExpiry">Expiry</label><input id="paymentExpiry" maxlength="5" placeholder="MM/YY"></div>' +
            '<div class="field"><label for="paymentCvv">CVV</label><input id="paymentCvv" type="password" inputmode="numeric" maxlength="4" placeholder="123"></div></div></div>' +
            '<p class="bk-pay-privacy">Card number and CVV are validated in your browser and are never stored by Explore Lanka.</p>' +
            '<button class="btn btn-primary bk-pay-submit" type="submit">Pay ' + money(booking.totalAmount) + '</button></form></div>';
        document.body.appendChild(modal);
        document.body.classList.add("bk-modal-open");

        function close() { modal.remove(); document.body.classList.remove("bk-modal-open"); }
        $(".bk-pay-close", modal).onclick = close;
        modal.addEventListener("click", function (event) { if (event.target === modal) close(); });
        var method = $("#paymentMethod", modal);
        var cardFields = $("#cardFields", modal);
        method.onchange = function () { cardFields.hidden = method.value !== "CARD"; };
        $("#paymentCard", modal).addEventListener("input", function () {
            this.value = this.value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
        });
        $("#paymentExpiry", modal).addEventListener("input", function () {
            var digits = this.value.replace(/\D/g, "").slice(0, 4);
            this.value = digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
        });
        $("#paymentForm", modal).onsubmit = function (event) {
            event.preventDefault();
            var alertBox = $("#paymentAlert", modal);
            var holder = $("#paymentHolder", modal).value.trim();
            var masked = method.options[method.selectedIndex].text;
            if (!holder) { showAlert(alertBox, "Enter the account holder name."); return; }
            if (method.value === "CARD") {
                var number = $("#paymentCard", modal).value.replace(/\D/g, "");
                var expiry = $("#paymentExpiry", modal).value;
                var cvv = $("#paymentCvv", modal).value;
                if (!/^\d{12,19}$/.test(number)) { showAlert(alertBox, "Enter a valid card number."); return; }
                if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) { showAlert(alertBox, "Enter expiry as MM/YY."); return; }
                if (!/^\d{3,4}$/.test(cvv)) { showAlert(alertBox, "Enter a valid CVV."); return; }
                masked = "Card ending " + number.slice(-4);
            }
            var submit = $(".bk-pay-submit", modal);
            submit.disabled = true;
            submit.textContent = "Processing securely...";
            fetch(PAYMENTS_API + "/booking/" + booking.bookingId + "/pay", {
                method: "POST", credentials: "same-origin", headers: {"Content-Type": "application/json"},
                body: JSON.stringify({paymentMethod: method.value, accountHolder: holder, maskedAccount: masked})
            }).then(function (res) {
                if (!res.ok) return readError(res).then(function (m) { throw new Error(m); });
                return res.json();
            }).then(function (paid) {
                close();
                if (onSuccess) onSuccess(paid);
            }).catch(function (err) {
                showAlert(alertBox, err.message || "Payment could not be completed.");
                submit.disabled = false;
                submit.textContent = "Pay " + money(booking.totalAmount);
            });
        };
    }
    function canCancel(b) {
        var st = (b.status || "").toUpperCase();
        return (st === "PENDING" || st === "CONFIRMED") && b.travelDate && b.travelDate > todayIso();
    }
    function canEdit(b) {
        var st = (b.status || "").toUpperCase();
        return (st === "PENDING" || st === "CONFIRMED") && b.travelDate && b.travelDate > todayIso();
    }
    function showAlert(el, msg, type) {
        if (!el) return;
        el.textContent = msg;
        el.className = "bk-alert show " + (type || "error");
    }
    function hideAlert(el) { if (el) el.className = "bk-alert"; }
    function readError(res) {
        return res.text().then(function (text) {
            var data = null;
            try { data = text ? JSON.parse(text) : null; } catch (ignored) {}
            if (data && data.message) return data.message;
            if (typeof data === "string" && data.trim()) return data;
            if (text && text.trim() && text.trim().charAt(0) !== "<") return text.trim();
            if (res.status === 401) return "Your login session has expired. Please log in again.";
            if (res.status === 403) return "Your account does not have permission to access this booking.";
            if (res.status >= 500) return "The server could not complete the booking request. Please check the application log and try again.";
            return "The booking request failed (" + res.status + ").";
        });
    }
    function requireLogin() {
        if (!userId()) {
            window.location.replace("/ui/customer-login");
            return false;
        }
        return true;
    }

    // =====================================================
    // 1) BOOK YOUR TOUR
    // =====================================================
    function initBookingForm() {
        var form = $("#bookingForm");
        if (!form || !requireLogin()) return;

        var pkgSel = $("#packageId"), dateIn = $("#travelDate"), peopleIn = $("#numberOfPeople");
        var alertBox = $("#bookingAlert"), submitBtn = $("#bookingSubmit");
        var packages = [];

        dateIn.min = addDays(todayIso(), 1);

        function selected() {
            var id = pkgSel.value;
            return packages.filter(function (p) { return String(p.packageId) === id; })[0];
        }

        function updateSummary() {
            var p = selected();
            var people = parseInt(peopleIn.value, 10) || 0;
            $("#sumPackage").textContent = p ? p.packageName : "Select a package";
            $("#sumDesc").textContent = p && p.description ? p.description : "";
            $("#sumCategory").textContent = p && p.category ? p.category : "-";
            $("#sumDuration").textContent = p && p.durationDays ? p.durationDays + " day" + (p.durationDays > 1 ? "s" : "") : "-";
            $("#sumPrice").textContent = p ? money(p.price) : "-";
            $("#sumPeople").textContent = people > 0 ? people : "-";
            if (dateIn.value) {
                var end = p && p.durationDays ? " – " + fmtDate(addDays(dateIn.value, p.durationDays - 1)) : "";
                $("#sumDates").textContent = fmtDate(dateIn.value) + end;
            } else {
                $("#sumDates").textContent = "-";
            }
            $("#sumTotal").textContent = p && people > 0 ? money((p.price || 0) * people) : "LKR 0";
        }

        fetch(PACKAGES_API)
            .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
            .then(function (list) {
                packages = (list || []).filter(function (p) {
                    return (p.status || "").trim().toUpperCase() === "ACTIVE";
                });
                if (!packages.length) {
                    pkgSel.innerHTML = '<option value="">No packages available</option>';
                    submitBtn.disabled = true;
                    showAlert(alertBox, "No tour packages are available right now. Please check back later.");
                    return;
                }
                pkgSel.innerHTML = '<option value="">Choose a package</option>' + packages.map(function (p) {
                    return '<option value="' + p.packageId + '">' + esc(p.packageName) + " — " + money(p.price) + " pp</option>";
                }).join("");
                var pre = new URLSearchParams(location.search).get("packageId");
                if (pre && packages.some(function (x) { return String(x.packageId) === pre; })) pkgSel.value = pre;
                updateSummary();
            })
            .catch(function () {
                pkgSel.innerHTML = '<option value="">Could not load packages</option>';
                showAlert(alertBox, "Could not load tour packages. Please refresh the page.");
            });

        [pkgSel, dateIn, peopleIn].forEach(function (el) {
            el.addEventListener("input", function () { el.classList.remove("invalid"); if (alertBox.classList.contains("error")) hideAlert(alertBox); updateSummary(); });
            el.addEventListener("change", updateSummary);
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            hideAlert(alertBox);

            var people = parseInt(peopleIn.value, 10);
            var errors = [];
            if (!pkgSel.value) { errors.push("Please select a tour package."); pkgSel.classList.add("invalid"); }
            if (!dateIn.value || dateIn.value <= todayIso()) { errors.push("Please choose a future travel date."); dateIn.classList.add("invalid"); }
            if (!people || people < 1 || people > 50) { errors.push("Travelers must be between 1 and 50."); peopleIn.classList.add("invalid"); }
            if (errors.length) { showAlert(alertBox, errors.join(" ")); return; }

            submitBtn.disabled = true;
            submitBtn.textContent = "Saving booking...";

            fetch(API + "/request", {
                method: "POST",
                credentials: "same-origin",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    customerId: Number(userId()),
                    packageId: Number(pkgSel.value),
                    travelDate: dateIn.value,
                    numberOfPeople: people,
                    pickupLocation: $("#pickupLocation").value,
                    specialRequests: $("#specialRequests").value
                })
            })
                .then(function (res) {
                    if (!res.ok) return readError(res).then(function (m) { throw new Error(m); });
                    return res.json();
                })
                .then(function (b) {
                    showAlert(alertBox, "Booking " + code(b.bookingId) + " created! Redirecting...", "ok");
                    setTimeout(function () {
                        location.href = "/ui/customer-booking-details?id=" + b.bookingId;
                    }, 900);
                })
                .catch(function (err) {
                    showAlert(alertBox, err.message || "Could not save the booking.");
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Confirm Booking";
                });
        });
    }

    // =====================================================
    // 2) MY BOOKINGS
    // =====================================================
    function initBookingsList() {
        var body = $("#bookingsBody");
        if (!body || !requireLogin()) return;
        var all = [], payments = [], paymentsByBooking = {}, filter = "ALL";

        function indexPayments() {
            paymentsByBooking = {};
            payments.forEach(function (payment) {
                var bookingId = payment.booking && payment.booking.bookingId;
                if (bookingId != null && !paymentsByBooking[bookingId]) paymentsByBooking[bookingId] = payment;
            });
        }

        function render() {
            var rows = all.filter(function (b) {
                if (filter === "ALL") return true;
                if (filter === "UPCOMING") {
                    var upcomingStatus = (b.status || "").toUpperCase();
                    return (upcomingStatus === "PENDING" || upcomingStatus === "CONFIRMED") && b.travelDate > todayIso();
                }
                return (b.status || "").toUpperCase() === filter;
            });
            if (!rows.length) {
                body.innerHTML = '<tr><td colspan="8"><div class="bk-empty"><h4>' +
                    (all.length ? "No bookings in this filter" : "No bookings yet") +
                    "</h4><p>" + (all.length ? "Try another filter." : "Start planning your Sri Lankan adventure.") +
                    "</p>" + (all.length ? "" : '<a class="btn btn-primary" href="/ui/customer-booking">Book a Tour</a>') +
                    "</div></td></tr>";
                return;
            }
            body.innerHTML = rows.map(function (b) {
                var pkg = b.tourPackage ? b.tourPackage.packageName : "-";
                var payment = paymentsByBooking[b.bookingId];
                return "<tr><td>" + code(b.bookingId) + "</td><td>" + esc(pkg) + "</td><td>" + fmtDate(b.travelDate) +
                    "</td><td>" + (b.numberOfPeople || "-") + "</td><td>" + money(b.totalAmount) + "</td><td>" +
                    statusBadge(b.status) + "</td><td>" + paymentBadge(payment ? payment.status : "PENDING") +
                    '</td><td><div class="bk-row-actions"><a class="bk-link" href="/ui/customer-booking-details?id=' +
                    b.bookingId + '">View</a>' + (canEdit(b) ? '<a class="bk-link" href="/ui/customer-booking-details?id=' +
                    b.bookingId + '&edit=1">Update</a>' : "") + (canPay(b, payment) ? '<button class="bk-pay-link" data-pay-booking="' +
                    b.bookingId + '">Pay now</button>' : "") + "</div></td></tr>";
            }).join("");
        }

        function stats() {
            var today = todayIso();
            $("#statTotal").textContent = all.length;
            $("#statUpcoming").textContent = all.filter(function (b) {
                var st = (b.status || "").toUpperCase();
                return (st === "PENDING" || st === "CONFIRMED") && b.travelDate > today;
            }).length;
            $("#statPending").textContent = all.filter(function (b) { return (b.status || "").toUpperCase() === "PENDING"; }).length;
            $("#statSpent").textContent = money(payments.filter(function (p) { return (p.status || "").toUpperCase() === "PAID"; })
                .reduce(function (s, p) { return s + (p.amount || 0); }, 0));
        }

        function renderPaymentHistory() {
            var historyBody = $("#paymentHistoryBody");
            if (!historyBody) return;
            if (!payments.length) {
                historyBody.innerHTML = '<tr><td colspan="7"><div class="bk-empty"><h4>No payment records yet</h4><p>A pending payment is created automatically with each booking.</p></div></td></tr>';
                return;
            }
            historyBody.innerHTML = payments.map(function (payment) {
                var booking = payment.booking || {};
                var date = payment.paidAt || payment.refundedAt || payment.createdAt || "";
                return '<tr><td>' + esc(payment.transactionReference || "PAY-" + String(payment.paymentId).padStart(5, "0")) +
                    '</td><td>' + (booking.bookingId ? code(booking.bookingId) : "-") + '</td><td>' +
                    esc(date ? date.replace("T", " ").slice(0, 16) : "-") + '</td><td>' +
                    esc((payment.paymentMethod || "Not selected").replace(/_/g, " ")) + '</td><td>' + money(payment.amount) +
                    '</td><td>' + paymentBadge(payment.status) + '</td><td>' +
                    (booking.bookingId ? '<a class="bk-link" href="/ui/customer-booking-details?id=' + booking.bookingId + '#payments">View receipt</a>' : "-") +
                    '</td></tr>';
            }).join("");
        }

        $$(".bk-filters button").forEach(function (btn) {
            btn.addEventListener("click", function () {
                $$(".bk-filters button").forEach(function (x) { x.classList.remove("active"); });
                btn.classList.add("active");
                filter = btn.dataset.filter;
                render();
            });
        });

        body.addEventListener("click", function (event) {
            var payButton = event.target.closest("[data-pay-booking]");
            if (!payButton) return;
            var booking = all.filter(function (b) { return String(b.bookingId) === payButton.dataset.payBooking; })[0];
            if (!booking) return;
            openPaymentModal(booking, paymentsByBooking[booking.bookingId], function (paid) {
                booking.status = "CONFIRMED";
                payments = payments.filter(function (existing) { return existing.paymentId !== paid.paymentId; });
                payments.unshift(paid); indexPayments(); stats(); render(); renderPaymentHistory();
            });
        });

        Promise.all([
            fetch(API + "/customer/" + encodeURIComponent(userId()), {credentials: "same-origin"}),
            fetch(PAYMENTS_API + "/mine", {credentials: "same-origin"})
        ]).then(function (responses) {
            return Promise.all(responses.map(function (r) {
                if (!r.ok) return readError(r).then(function (m) { throw new Error(m); });
                return r.json();
            }));
        }).then(function (data) {
            all = data[0] || []; payments = data[1] || []; indexPayments(); stats(); render(); renderPaymentHistory();
        })
            .catch(function (err) {
                body.innerHTML = '<tr><td colspan="8"><div class="bk-empty"><h4>Could not load bookings</h4><p>' +
                    esc(err.message || "Please refresh the page.") + '</p><button class="btn btn-primary" id="retryBookings">Try Again</button></div></td></tr>';
                var retry = $("#retryBookings");
                if (retry) retry.onclick = function () { location.reload(); };
            });
    }

    // =====================================================
    // 3) BOOKING DETAILS
    // =====================================================
    function initBookingDetails() {
        var box = $("#bookingDetails");
        if (!box || !requireLogin()) return;
        var alertBox = $("#detailsAlert");
        var params = new URLSearchParams(location.search);
        var id = params.get("id");
        var openEditor = params.get("edit") === "1";

        function fail(msg) {
            box.innerHTML = '<div class="card bk-empty"><h4>' + esc(msg) +
                '</h4><a class="btn btn-primary" href="/ui/customer-bookings">Back to My Bookings</a></div>';
        }

        if (!id || !/^\d+$/.test(id)) { fail("Booking not found"); return; }

        function load() {
            Promise.all([
                fetch(API + "/" + id, {credentials: "same-origin"}),
                fetch(PAYMENTS_API + "/booking/" + id, {credentials: "same-origin"})
            ]).then(function (responses) {
                return Promise.all(responses.map(function (r) {
                    if (!r.ok) return readError(r).then(function (m) { throw new Error(m); });
                    return r.json();
                }));
            }).then(function (data) {
                    var b = data[0], paymentList = data[1] || [];
                    if (!b.customer || String(b.customer.userId) !== String(userId())) {
                        fail("You don't have access to this booking");
                        return;
                    }
                    render(b, paymentList);
                })
                .catch(function (err) { fail(err.message || "Booking not found"); });
        }

        function render(b, paymentList) {
            var p = b.tourPackage || {};
            var payment = paymentList && paymentList.length ? paymentList[0] : null;
            var end = p.durationDays && b.travelDate ? " – " + fmtDate(addDays(b.travelDate, p.durationDays - 1)) : "";
            var editable = canEdit(b);
            box.innerHTML =
                '<div class="detail-banner"><div>' + statusBadge(b.status) +
                "<h2>" + esc(p.packageName || "Tour booking") + "</h2><p>Booking " + code(b.bookingId) + " · " +
                fmtDate(b.travelDate) + end + " · " + b.numberOfPeople + " traveler" + (b.numberOfPeople > 1 ? "s" : "") +
                '</p></div><div class="detail-actions"><button class="btn btn-soft" id="printBtn">Print</button>' +
                (editable ? '<button class="btn btn-primary" id="editBtn">Update Booking</button>' : "") +
                (canPay(b, payment) ? '<button class="btn btn-gold" id="payBtn">Pay Now</button>' : "") +
                (canCancel(b) ? '<button class="btn btn-danger" id="cancelBtn">Cancel Booking</button>' : "") +
                '</div></div><div class="grid grid-2"><section class="card"><div class="section-head" style="margin-top:0"><div><h3>Trip details</h3><p>Your selected package</p></div></div>' +
                '<div class="info-list"><p><b>Package</b><span>' + esc(p.packageName || "-") + "</span></p><p><b>Category</b><span>" +
                esc(p.category || "-") + "</span></p><p><b>Duration</b><span>" + (p.durationDays ? p.durationDays + " days" : "-") +
                "</span></p><p><b>Travel date</b><span>" + fmtDate(b.travelDate) + end + "</span></p><p><b>Pickup</b><span>" +
                esc(b.pickupLocation || "Not specified") + "</span></p><p><b>Special requests</b><span>" +
                esc(b.specialRequests || "None") + "</span></p></div>" +
                (p.description ? '<p class="bk-note">' + esc(p.description) + "</p>" : "") +
                '</section><section class="card"><div class="section-head" style="margin-top:0"><div><h3>Booking summary</h3><p>Price breakdown</p></div></div>' +
                '<div class="info-list"><p><b>Booking ID</b><span>' + code(b.bookingId) + "</span></p><p><b>Booked on</b><span>" +
                fmtDate(b.bookingDate) + "</span></p><p><b>Status</b><span>" + statusBadge(b.status) +
                "</span></p><p><b>Price per person</b><span>" + money(p.price) + "</span></p><p><b>Travelers</b><span>" +
                b.numberOfPeople + '</span></p></div><div class="bk-total"><small>Total</small><span class="price">' +
                money(b.totalAmount) + "</span></div>" +
                ((b.status || "").toUpperCase() === "PENDING"
                    ? '<p class="bk-note">Your booking is pending. Our team will confirm it shortly.</p>' : "") +
                "</section></div>" +
                '<section class="card bk-payment-card" id="payments"><div class="section-head"><div><h3>Payment & receipt</h3><p>Automatically linked to this booking</p></div>' + paymentBadge(payment ? payment.status : "PENDING") + '</div>' +
                '<div class="info-list"><p><b>Amount</b><span>' + money(payment ? payment.amount : b.totalAmount) + '</span></p>' +
                '<p><b>Method</b><span>' + esc(payment && payment.paymentMethod ? payment.paymentMethod.replace(/_/g, " ") : "Not paid") + '</span></p>' +
                '<p><b>Reference</b><span>' + esc(payment && payment.transactionReference ? payment.transactionReference : "Created after payment") + '</span></p>' +
                '<p><b>Paid at</b><span>' + esc(payment && payment.paidAt ? payment.paidAt.replace("T", " ").slice(0, 16) : "-") + '</span></p></div>' +
                (payment && (payment.status || "").toUpperCase() === "PAID" ? '<button class="btn btn-soft" id="receiptBtn">Print Receipt</button>' :
                    (canPay(b, payment) ? '<button class="btn btn-primary" id="paymentCardPayBtn">Complete Payment</button>' : "")) + '</section>' +
                (editable ? '<section class="card bk-edit-panel" id="bookingEditPanel" hidden>' +
                    '<div class="section-head"><div><h3>Update booking</h3><p>Change your upcoming trip details</p></div></div>' +
                    '<form id="bookingEditForm"><div class="form-grid">' +
                    '<div class="field"><label for="editTravelDate">Travel date *</label><input type="date" id="editTravelDate" value="' + esc(b.travelDate) + '" required></div>' +
                    '<div class="field"><label for="editPeople">Travelers *</label><input type="number" id="editPeople" min="1" max="50" value="' + esc(b.numberOfPeople) + '" required></div>' +
                    '<div class="field full"><label for="editPickup">Pickup location</label><input type="text" id="editPickup" maxlength="255" value="' + esc(b.pickupLocation || "") + '" placeholder="Hotel, airport, or preferred meeting point"></div>' +
                    '<div class="field full"><label for="editRequests">Special requests</label><textarea id="editRequests" rows="4" maxlength="1000" placeholder="Dietary, accessibility, or other requests">' + esc(b.specialRequests || "") + '</textarea></div>' +
                    '</div><div class="bk-edit-total"><span>Updated total</span><strong id="editTotal">' + money(b.totalAmount) + '</strong></div>' +
                    ((b.status || "").toUpperCase() === "CONFIRMED" ? '<p class="bk-edit-warning">Changing a confirmed booking will return it to Pending so management can review the new details.</p>' : "") +
                    '<div class="bk-edit-actions"><button class="btn btn-primary" id="saveBookingChanges" type="submit">Save Changes</button><button class="btn btn-soft" id="closeEditor" type="button">Keep Current Details</button></div>' +
                    '</form></section>' : "");

            $("#printBtn").onclick = function () { window.print(); };
            var pay = function () { openPaymentModal(b, payment, function () { showAlert(alertBox, "Payment completed successfully.", "ok"); load(); }); };
            var payBtn = $("#payBtn"), paymentCardPayBtn = $("#paymentCardPayBtn"), receiptBtn = $("#receiptBtn");
            if (payBtn) payBtn.onclick = pay;
            if (paymentCardPayBtn) paymentCardPayBtn.onclick = pay;
            if (receiptBtn) receiptBtn.onclick = function () { window.print(); };
            var editBtn = $("#editBtn");
            var editPanel = $("#bookingEditPanel");
            if (editBtn && editPanel) {
                var editDate = $("#editTravelDate");
                var editPeople = $("#editPeople");
                var editForm = $("#bookingEditForm");
                var closeEditor = $("#closeEditor");
                var price = Number(p.price || 0);

                editDate.min = addDays(todayIso(), 1);
                function updateEditTotal() {
                    var people = parseInt(editPeople.value, 10) || 0;
                    $("#editTotal").textContent = money(price * people);
                }
                editPeople.addEventListener("input", updateEditTotal);
                editBtn.onclick = function () {
                    hideAlert(alertBox);
                    editPanel.hidden = false;
                    editBtn.disabled = true;
                    editPanel.scrollIntoView({behavior: "smooth", block: "start"});
                };
                closeEditor.onclick = function () {
                    editPanel.hidden = true;
                    editBtn.disabled = false;
                    editBtn.scrollIntoView({behavior: "smooth", block: "center"});
                };
                editForm.addEventListener("submit", function (event) {
                    event.preventDefault();
                    hideAlert(alertBox);
                    var people = parseInt(editPeople.value, 10);
                    if (!editDate.value || editDate.value <= todayIso()) {
                        showAlert(alertBox, "Please choose a future travel date.");
                        editDate.focus();
                        return;
                    }
                    if (!people || people < 1 || people > 50) {
                        showAlert(alertBox, "Travelers must be between 1 and 50.");
                        editPeople.focus();
                        return;
                    }

                    var saveBtn = $("#saveBookingChanges");
                    saveBtn.disabled = true;
                    saveBtn.textContent = "Saving changes...";
                    fetch(API + "/" + b.bookingId + "/customer-update", {
                        method: "PUT",
                        credentials: "same-origin",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({
                            travelDate: editDate.value,
                            numberOfPeople: people,
                            pickupLocation: $("#editPickup").value,
                            specialRequests: $("#editRequests").value
                        })
                    })
                        .then(function (res) {
                            if (!res.ok) return readError(res).then(function (m) { throw new Error(m); });
                            return res.json();
                        })
                        .then(function (updated) {
                            openEditor = false;
                            if (history.replaceState) history.replaceState(null, "", "/ui/customer-booking-details?id=" + updated.bookingId);
                            load();
                            showAlert(alertBox, "Booking updated successfully. Management will review the latest details.", "ok");
                        })
                        .catch(function (err) {
                            showAlert(alertBox, err.message || "Could not update the booking.");
                            saveBtn.disabled = false;
                            saveBtn.textContent = "Save Changes";
                        });
                });
                if (openEditor) {
                    openEditor = false;
                    editBtn.click();
                }
            }
            var cancelBtn = $("#cancelBtn");
            if (cancelBtn) cancelBtn.onclick = function () {
                if (!confirm("Cancel booking " + code(b.bookingId) + "? This cannot be undone.")) return;
                cancelBtn.disabled = true;
                fetch(API + "/" + b.bookingId + "/cancel?customerId=" + encodeURIComponent(userId()), {method: "PUT", credentials: "same-origin"})
                    .then(function (res) {
                        if (!res.ok) return readError(res).then(function (m) { throw new Error(m); });
                        return res.json();
                    })
                    .then(function () { showAlert(alertBox, "Booking cancelled. Its payment was cancelled or refunded automatically.", "ok"); load(); })
                    .catch(function (err) { showAlert(alertBox, err.message); cancelBtn.disabled = false; });
            };
        }

        load();
    }

    document.addEventListener("DOMContentLoaded", function () {
        // A session cookie may still be valid in a new tab even when sessionStorage is empty.
        // Load the server session before any booking request uses the customer ID.
        fetch("/api/auth/session", {credentials: "same-origin"})
            .then(function (response) {
                if (!response.ok) throw new Error("No active customer session");
                return response.json();
            })
            .then(function (session) {
                if ((session.role || "").trim().toUpperCase() !== "CUSTOMER") {
                    window.location.replace("/access-denied");
                    return;
                }

                sessionStorage.setItem("userId", session.userId == null ? "" : String(session.userId));
                sessionStorage.setItem("userName", session.name || "");
                sessionStorage.setItem("userEmail", session.email || "");
                sessionStorage.setItem("userRole", "CUSTOMER");

                if (session.name) {
                    $$("[data-user-initial]").forEach(function (avatar) {
                        avatar.textContent = session.name.trim().charAt(0).toUpperCase();
                    });
                }

                initBookingForm();
                initBookingsList();
                initBookingDetails();
            })
            .catch(function () {
                sessionStorage.clear();
                window.location.replace("/ui/customer-login");
            });
    });
})();

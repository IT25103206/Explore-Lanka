/* =========================================================
   Explore Lanka - Admin pages connected to the real API
   One engine for: packages, events, promotions, partners, resources,
   bookings, users, payments, feedback + dashboard, reports, notifications
   ========================================================= */
(function () {
    "use strict";

    // ---------- helpers ----------
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c];
        });
    }
    function money(v) { return "LKR " + Number(v || 0).toLocaleString("en-LK", {maximumFractionDigits: 0}); }
    function short(v) {
        v = Number(v || 0);
        if (v >= 1e6) return "LKR " + (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
        if (v >= 1e3) return "LKR " + Math.round(v / 1e3) + "K";
        return "LKR " + Math.round(v);
    }
    function todayIso() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
    function addDays(iso, n) { var d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
    function fmtDate(v) {
        if (!v) return "-";
        var d = new Date(String(v).length === 10 ? v + "T00:00:00" : v);
        return isNaN(d) ? String(v) : d.toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"});
    }
    function monthKey(v) { return v ? String(v).slice(0, 7) : ""; }
    function up(v) { return String(v || "").trim().toUpperCase(); }
    function code(prefix, id) { return "#" + prefix + "-" + String(id).padStart(4, "0"); }
    function stars(n) { n = Math.max(0, Math.min(5, parseInt(n, 10) || 0)); return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }

    function toast(msg, bad) {
        var t = document.createElement("div");
        t.className = "ad-toast" + (bad ? " bad" : "");
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function () { t.classList.add("out"); }, 2400);
        setTimeout(function () { t.remove(); }, 2800);
    }

    function api(method, url, body) {
        return fetch(url, {
            method: method,
            headers: body ? {"Content-Type": "application/json"} : {},
            body: body ? JSON.stringify(body) : undefined
        }).then(function (res) {
            return res.text().then(function (txt) {
                var data = null;
                try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
                if (!res.ok) {
                    var msg = data && data.message ? data.message : "";
                    if (!msg && (res.status === 500 || res.status === 409)) msg = "The server refused this change. The record may be used by another record (for example a booking).";
                    throw new Error(msg || "Request failed (" + res.status + ").");
                }
                return data;
            });
        });
    }
    function getList(url) { return api("GET", url).then(function (d) { return Array.isArray(d) ? d : (d && (d.data || d.content)) || []; }); }

    var BADGE = {
        success: ["ACTIVE", "AVAILABLE", "CONFIRMED", "PUBLISHED", "PAID", "ONGOING"],
        info: ["COMPLETED", "UPCOMING", "SCHEDULED"],
        warning: ["PENDING", "DRAFT", "BOOKED", "AWAITING"],
        danger: ["INACTIVE", "CANCELLED", "EXPIRED", "UNAVAILABLE", "MAINTENANCE", "REFUNDED", "VOID"]
    };
    function badge(s) {
        var v = up(s) || "—", cls = "info";
        Object.keys(BADGE).forEach(function (k) { if (BADGE[k].indexOf(v) > -1) cls = k; });
        return '<span class="badge ' + cls + '">' + esc(v) + "</span>";
    }

    function csv(name, rows) {
        if (!rows.length) { toast("Nothing to export", true); return; }
        var cols = Object.keys(rows[0]);
        var text = [cols.join(",")].concat(rows.map(function (r) {
            return cols.map(function (c) { var v = r[c] == null ? "" : String(r[c]); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(",");
        })).join("\n");
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob(["\ufeff" + text], {type: "text/csv;charset=utf-8"}));
        a.download = name + "-" + todayIso() + ".csv";
        document.body.appendChild(a); a.click(); a.remove();
        toast("Exported " + rows.length + " rows");
    }

    // ---------- modal ----------
    var modal;
    function openModal(title, bodyHtml, foot) {
        if (!modal) {
            modal = document.createElement("div");
            modal.className = "ad-modal";
            modal.innerHTML = '<div class="ad-modal-bg"></div><div class="ad-modal-box" role="dialog" aria-modal="true"><div class="ad-modal-head"><h3></h3><button type="button" class="ad-x" aria-label="Close">×</button></div><div class="ad-modal-body"></div><div class="ad-modal-foot"></div>' +
                '<div class="ad-drop-overlay" aria-hidden="true"><div><i>⇪</i><b>Drop image to upload</b><small>JPG, PNG, WEBP or GIF · max 5 MB</small></div></div></div>';
            document.body.appendChild(modal);
            setupModalDrop(modal);
            $(".ad-modal-bg", modal).onclick = closeModal;
            $(".ad-x", modal).onclick = closeModal;
            document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });
        }
        modal._onFile = null; // set again by forms that have an image field
        $(".ad-modal-box", modal).classList.remove("dropping");
        $(".ad-modal-head h3", modal).textContent = title;
        $(".ad-modal-body", modal).innerHTML = bodyHtml;
        $(".ad-modal-foot", modal).innerHTML = foot || "";
        modal.hidden = false;
        document.body.classList.add("ad-lock");
        var first = $(".ad-modal-body input, .ad-modal-body select, .ad-modal-body textarea", modal);
        if (first) setTimeout(function () { first.focus(); }, 30);
        return modal;
    }
    function closeModal() { if (modal) { modal.hidden = true; modal._onFile = null; document.body.classList.remove("ad-lock"); } }

    // ---------- drag & drop / paste for image fields ----------
    function hasFiles(e) {
        var t = e.dataTransfer && e.dataTransfer.types;
        return !!t && Array.prototype.indexOf.call(t, "Files") > -1;
    }
    function setupModalDrop(m) {
        var box = $(".ad-modal-box", m), depth = 0;
        function off() { depth = 0; box.classList.remove("dropping"); }

        box.addEventListener("dragenter", function (e) {
            if (!m._onFile || !hasFiles(e)) return;
            e.preventDefault(); depth++; box.classList.add("dropping");
        });
        box.addEventListener("dragover", function (e) {
            if (!m._onFile || !hasFiles(e)) return;
            e.preventDefault(); e.dataTransfer.dropEffect = "copy";
        });
        box.addEventListener("dragleave", function (e) {
            if (!m._onFile || !hasFiles(e)) return;
            depth = Math.max(0, depth - 1); if (!depth) off();
        });
        box.addEventListener("drop", function (e) {
            if (!m._onFile || !hasFiles(e)) return;
            e.preventDefault(); off();
            var files = e.dataTransfer.files;
            if (files.length > 1) toast("Only one image allowed - using the first one");
            if (files.length) m._onFile(files[0]);
        });

        // Stop the browser from opening the image in the tab when it is dropped next to the box
        ["dragover", "drop"].forEach(function (t) {
            window.addEventListener(t, function (e) { if (hasFiles(e) && !m.hidden) e.preventDefault(); if (t === "drop") off(); });
        });

        // Ctrl+V a copied image / screenshot
        document.addEventListener("paste", function (e) {
            if (m.hidden || !m._onFile || !e.clipboardData) return;
            var items = Array.prototype.slice.call(e.clipboardData.items || []);
            var img = items.filter(function (i) { return i.kind === "file" && i.type.indexOf("image/") === 0; })[0];
            if (img) { e.preventDefault(); m._onFile(img.getAsFile()); }
        });
    }
    function confirmBox(text, okLabel) {
        return new Promise(function (resolve) {
            var m = openModal("Please confirm", '<p class="ad-confirm">' + esc(text) + "</p>",
                '<button type="button" class="btn btn-soft" data-no>Cancel</button><button type="button" class="btn btn-danger" data-yes>' + esc(okLabel || "Delete") + "</button>");
            $("[data-no]", m).onclick = function () { closeModal(); resolve(false); };
            $("[data-yes]", m).onclick = function () { closeModal(); resolve(true); };
        });
    }

    function thumbCell(url, icon, title, desc) {
        return '<div class="ad-pkg-cell">' + (url ? '<img class="ad-thumb" src="' + esc(url) + '" alt="" loading="lazy">' : '<span class="ad-thumb ad-thumb-empty">' + icon + "</span>") +
            "<div><b>" + esc(title) + "</b><small>" + esc((desc || "").slice(0, 60)) + "</small></div></div>";
    }

    // ---------- module definitions ----------
    var CATS = ["Culture", "Nature", "Adventure", "Beach", "Wildlife", "Heritage", "Wellness"];
    var MODULES = {
        packages: {
            api: "/api/packages", id: "packageId", noun: "package", title: "Tour packages",
            uploadApi: "/api/packages/upload-image",
            statuses: ["ACTIVE", "DRAFT", "INACTIVE"],
            search: function (r) { return [r.packageName, r.category, r.description].join(" "); },
            columns: [
                ["ID", function (r) { return r.packageId; }],
                ["Package", function (r) { return thumbCell(r.imageUrl, "◫", r.packageName, r.description); }],
                ["Category", function (r) { return esc(r.category || "-"); }],
                ["Duration", function (r) { return r.durationDays ? r.durationDays + " days" : "-"; }],
                ["Price / person", function (r) { return money(r.price); }],
                ["Status", function (r) { return badge(r.status); }]
            ],
            fields: [
                {k: "packageName", l: "Package name", req: true, max: 100, full: true},
                {k: "imageUrl", l: "Package image", type: "image", full: true, hint: "JPG, PNG, WEBP or GIF · max 5 MB · landscape works best", what: "package"},
                {k: "category", l: "Category", type: "select", opts: CATS, req: true},
                {k: "status", l: "Status", type: "select", opts: ["ACTIVE", "DRAFT", "INACTIVE"], req: true},
                {k: "durationDays", l: "Duration (days)", type: "number", min: 1, max: 60, req: true},
                {k: "price", l: "Price per person (LKR)", type: "number", min: 1, step: "0.01", req: true},
                {k: "description", l: "Description", type: "textarea", full: true, max: 2000}
            ],
            kpis: function (l) {
                var act = l.filter(function (r) { return up(r.status) === "ACTIVE"; });
                return [["Total packages", l.length, "All records"], ["Active", act.length, "Visible to customers"],
                    ["Draft / inactive", l.length - act.length, "Hidden from customers"],
                    ["Avg. price", short(l.length ? l.reduce(function (s, r) { return s + (r.price || 0); }, 0) / l.length : 0), "Per person"]];
            }
        },
        events: {
            api: "/api/events", id: "eventId", noun: "event", title: "Events",
            uploadApi: "/api/events/upload-image",
            statuses: ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"],
            search: function (r) { return [r.eventName, r.location, r.description].join(" "); },
            columns: [
                ["ID", function (r) { return r.eventId; }],
                ["Event", function (r) { return thumbCell(r.imageUrl, "◇", r.eventName, r.description); }],
                ["Date", function (r) { return fmtDate(r.eventDate); }],
                ["Location", function (r) { return esc(r.location || "-"); }],
                ["Status", function (r) { return badge(r.status); }]
            ],
            fields: [
                {k: "eventName", l: "Event name", req: true, max: 100, full: true},
                {k: "imageUrl", l: "Event image", type: "image", full: true, hint: "JPG, PNG, WEBP or GIF · max 5 MB · landscape works best", what: "event"},
                {k: "eventDate", l: "Event date", type: "date", req: true},
                {k: "status", l: "Status", type: "select", opts: ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"], req: true},
                {k: "location", l: "Location", req: true, max: 255, full: true},
                {k: "description", l: "Description", type: "textarea", full: true, max: 2000}
            ],
            kpis: function (l) {
                var t = todayIso(), m = monthKey(t);
                return [["Total events", l.length, "All records"],
                    ["Upcoming", l.filter(function (r) { return r.eventDate >= t && up(r.status) !== "CANCELLED"; }).length, "From today"],
                    ["This month", l.filter(function (r) { return monthKey(r.eventDate) === m; }).length, "Scheduled"],
                    ["Cancelled", l.filter(function (r) { return up(r.status) === "CANCELLED"; }).length, "Not running"]];
            }
        },
        promotions: {
            api: "/api/promotions", id: "promotionId", noun: "promotion", title: "Promotions",
            statuses: ["ACTIVE", "SCHEDULED", "EXPIRED", "INACTIVE"],
            search: function (r) { return [r.title, r.description].join(" "); },
            columns: [
                ["ID", function (r) { return r.promotionId; }],
                ["Promotion", function (r) { return "<b>" + esc(r.title) + "</b><small>" + esc((r.description || "").slice(0, 60)) + "</small>"; }],
                ["Discount", function (r) { return (r.discountPercentage || 0) + "%"; }],
                ["Valid", function (r) { return fmtDate(r.startDate) + " – " + fmtDate(r.endDate); }],
                ["Status", function (r) { return badge(r.status); }]
            ],
            fields: [
                {k: "title", l: "Title", req: true, max: 100, full: true},
                {k: "discountPercentage", l: "Discount (%)", type: "number", min: 1, max: 100, step: "0.01", req: true},
                {k: "status", l: "Status", type: "select", opts: ["ACTIVE", "SCHEDULED", "EXPIRED", "INACTIVE"], req: true},
                {k: "startDate", l: "Start date", type: "date", req: true},
                {k: "endDate", l: "End date", type: "date", req: true},
                {k: "description", l: "Description", type: "textarea", full: true, max: 2000}
            ],
            validate: function (v) { if (v.startDate && v.endDate && v.endDate < v.startDate) return ["endDate", "End date must be on or after the start date."]; },
            kpis: function (l) {
                var t = todayIso();
                var live = l.filter(function (r) { return up(r.status) === "ACTIVE" && r.startDate <= t && r.endDate >= t; });
                return [["Total promotions", l.length, "All records"], ["Running now", live.length, "Active today"],
                    ["Ending in 7 days", live.filter(function (r) { return r.endDate <= addDays(t, 7); }).length, "Needs attention"],
                    ["Avg. discount", (l.length ? Math.round(l.reduce(function (s, r) { return s + (r.discountPercentage || 0); }, 0) / l.length) : 0) + "%", "Across offers"]];
            }
        },
        partners: {
            api: "/api/partners", id: "partnerId", noun: "partner", title: "Partners",
            statuses: ["ACTIVE", "PENDING", "INACTIVE"],
            search: function (r) { return [r.partnerName, r.partnerType, r.contactPerson, r.email, r.phone, r.address, r.contractReference].join(" "); },
            columns: [
                ["ID", function (r) { return r.partnerId; }],
                ["Partner", function (r) { return "<b>" + esc(r.partnerName) + "</b><small>" + esc(r.address || "") + "</small>"; }],
                ["Type", function (r) { return esc(r.partnerType || "-"); }],
                ["Contact", function (r) { return "<b>" + esc(r.contactPerson || "-") + "</b><small>" + esc(r.email || "-") + " · " + esc(r.phone || "") + "</small>"; }],
                ["Service rate", function (r) { return r.serviceRate == null ? "-" : money(r.serviceRate); }],
                ["Performance", function (r) { return r.performanceRating == null ? "Not rated" : '<span class="ad-stars">★ ' + Number(r.performanceRating).toFixed(1) + " / 5</span>"; }],
                ["Contract", function (r) { return "<b>" + esc(r.contractReference || "No reference") + "</b><small>" + (r.contractEndDate ? "Ends " + fmtDate(r.contractEndDate) : "No expiry date") + "</small>"; }],
                ["Status", function (r) { return badge(r.status); }]
            ],
            fields: [
                {k: "partnerName", l: "Partner name", req: true, max: 100, full: true},
                {k: "partnerType", l: "Type", type: "select", opts: ["Hotel", "Transport", "Guide", "Restaurant", "Activity", "Other"], req: true},
                {k: "status", l: "Status", type: "select", opts: ["ACTIVE", "PENDING", "INACTIVE"], req: true},
                {k: "contactPerson", l: "Contact person", max: 255, full: true},
                {k: "email", l: "Email", type: "email", req: true, max: 255},
                {k: "phone", l: "Phone", req: true, max: 20, pattern: "^\\+?[0-9 ]{9,20}$", hint: "e.g. 0771234567"},
                {k: "address", l: "Address", type: "textarea", full: true, max: 500},
                {k: "contractReference", l: "Contract reference", max: 100},
                {k: "serviceRate", l: "Service rate (LKR)", type: "number", min: 0, step: "0.01"},
                {k: "contractStartDate", l: "Contract start date", type: "date"},
                {k: "contractEndDate", l: "Contract end date", type: "date"},
                {k: "performanceRating", l: "Performance rating (0-5)", type: "number", min: 0, max: 5, step: "0.1", hint: "Based on service quality and reliability"},
                {k: "notes", l: "Contract and performance notes", type: "textarea", full: true, max: 2000}
            ],
            validate: function (v) {
                if (v.contractStartDate && v.contractEndDate && v.contractEndDate < v.contractStartDate) {
                    return ["contractEndDate", "Contract end date must be on or after the start date."];
                }
            },
            kpis: function (l) {
                var c = function (s) { return l.filter(function (r) { return up(r.status) === s; }).length; };
                var limit = addDays(todayIso(), 30);
                return [["Total partners", l.length, "All records"], ["Active", c("ACTIVE"), "Working with us"],
                    ["Pending", c("PENDING"), "Waiting for approval"],
                    ["Contracts ending", l.filter(function (r) { return r.contractEndDate && r.contractEndDate >= todayIso() && r.contractEndDate <= limit; }).length, "Within 30 days"]];
            },
            exportRows: function (l) { return l.map(function (r) { return {id:r.partnerId, name:r.partnerName, type:r.partnerType, contact_person:r.contactPerson, email:r.email, phone:r.phone, address:r.address, contract_reference:r.contractReference, contract_start:r.contractStartDate, contract_end:r.contractEndDate, service_rate:r.serviceRate, performance_rating:r.performanceRating, status:r.status, updated:r.updatedAt}; }); }
        },
        resources: {
            api: "/api/resources", id: "resourceId", noun: "resource", title: "Resources",
            statuses: ["AVAILABLE", "BOOKED", "MAINTENANCE", "UNAVAILABLE"], statusKey: "availabilityStatus",
            needs: {partners: "/api/partners", bookings: "/api/bookings", events: "/api/events"},
            search: function (r) { return [r.resourceName, r.resourceType, r.registrationNumber, r.location, r.partner && r.partner.partnerName, r.assignedBooking && code("BK", r.assignedBooking.bookingId), r.assignedEvent && r.assignedEvent.eventName].join(" "); },
            columns: [
                ["ID", function (r) { return r.resourceId; }],
                ["Resource", function (r) { return "<b>" + esc(r.resourceName) + "</b><small>" + esc(r.registrationNumber || r.location || "") + "</small>"; }],
                ["Type", function (r) { return esc(r.resourceType || "-"); }],
                ["Partner", function (r) { return esc(r.partner ? r.partner.partnerName : "-"); }],
                ["Capacity / cost", function (r) { return "<b>" + esc(r.capacity || "-") + "</b><small>" + money(r.cost) + "</small>"; }],
                ["Available", function (r) { return (r.availableFrom || r.availableUntil) ? fmtDate(r.availableFrom) + " – " + fmtDate(r.availableUntil) : "Any date"; }],
                ["Current allocation", function (r) { return r.assignedBooking ? "<b>" + code("BK", r.assignedBooking.bookingId) + "</b><small>" + fmtDate(r.allocationStartDate) + " – " + fmtDate(r.allocationEndDate) + "</small>" : r.assignedEvent ? "<b>" + esc(r.assignedEvent.eventName) + "</b><small>" + fmtDate(r.allocationStartDate) + " – " + fmtDate(r.allocationEndDate) + "</small>" : "Not assigned"; }],
                ["Availability", function (r) { return badge(r.availabilityStatus); }]
            ],
            fields: [
                {k: "resourceName", l: "Resource name", req: true, max: 100, full: true},
                {k: "resourceType", l: "Type", type: "select", opts: ["Vehicle", "Room", "Guide", "Equipment", "Venue", "Other"], req: true},
                {k: "registrationNumber", l: "Registration / reference number", max: 100},
                {k: "availabilityStatus", l: "Availability", type: "select", opts: ["AVAILABLE", "BOOKED", "MAINTENANCE", "UNAVAILABLE"], req: true, hint: "BOOKED is set automatically when an assignment is selected"},
                {k: "partnerId", l: "Active partner", type: "select", from: "partners", fromFilter: function (p) { return up(p.status) === "ACTIVE"; }, option: function (p) { return [p.partnerId, p.partnerName + " · " + (p.partnerType || "Partner")]; }, req: true, full: true},
                {k: "location", l: "Location / base", max: 255},
                {k: "capacity", l: "Capacity", type: "number", min: 1},
                {k: "cost", l: "Cost (LKR)", type: "number", min: 0, step: "0.01", req: true},
                {k: "description", l: "Resource details", type: "textarea", full: true, max: 2000},
                {k: "availableFrom", l: "Available from", type: "date"},
                {k: "availableUntil", l: "Available until", type: "date"},
                {k: "assignedBookingId", l: "Assign to booking", type: "select", from: "bookings", fromFilter: function (b) { return up(b.status) !== "CANCELLED" && up(b.status) !== "COMPLETED"; }, option: function (b) { return [b.bookingId, code("BK", b.bookingId) + " · " + (b.customer ? b.customer.name : "Customer") + " · " + (b.tourPackage ? b.tourPackage.packageName : "Package")]; }},
                {k: "assignedEventId", l: "Or assign to event", type: "select", from: "events", fromFilter: function (e) { return up(e.status) !== "CANCELLED" && up(e.status) !== "COMPLETED"; }, option: function (e) { return [e.eventId, e.eventName + " · " + fmtDate(e.eventDate)]; }},
                {k: "allocationStartDate", l: "Allocation start", type: "date"},
                {k: "allocationEndDate", l: "Allocation end", type: "date"},
                {k: "allocationNotes", l: "Allocation notes", type: "textarea", full: true, max: 2000}
            ],
            toForm: function (r) { var o = Object.assign({}, r); o.partnerId = r.partner ? r.partner.partnerId : ""; o.assignedBookingId = r.assignedBooking ? r.assignedBooking.bookingId : ""; o.assignedEventId = r.assignedEvent ? r.assignedEvent.eventId : ""; return o; },
            toPayload: function (v) { var o = Object.assign({}, v); o.partner = {partnerId: Number(v.partnerId)}; o.assignedBooking = v.assignedBookingId ? {bookingId: Number(v.assignedBookingId)} : null; o.assignedEvent = v.assignedEventId ? {eventId: Number(v.assignedEventId)} : null; delete o.partnerId; delete o.assignedBookingId; delete o.assignedEventId; return o; },
            validate: function (v) {
                if (v.availableFrom && v.availableUntil && v.availableUntil < v.availableFrom) return ["availableUntil", "Available-until date must be on or after available-from."];
                if (v.assignedBookingId && v.assignedEventId) return ["assignedEventId", "Choose either a booking or an event, not both."];
                if ((v.assignedBookingId || v.assignedEventId) && (!v.allocationStartDate || !v.allocationEndDate)) return ["allocationStartDate", "Allocation start and end dates are required."];
                if (v.allocationStartDate && v.allocationEndDate && v.allocationEndDate < v.allocationStartDate) return ["allocationEndDate", "Allocation end date must be on or after its start date."];
                if (v.availableFrom && v.allocationStartDate && v.allocationStartDate < v.availableFrom) return ["allocationStartDate", "Allocation starts before the resource becomes available."];
                if (v.availableUntil && v.allocationEndDate && v.allocationEndDate > v.availableUntil) return ["allocationEndDate", "Allocation ends after the resource availability period."];
                if (up(v.availabilityStatus) === "BOOKED" && !v.assignedBookingId && !v.assignedEventId) return ["availabilityStatus", "Choose a booking or event before selecting BOOKED."];
            },
            kpis: function (l) {
                var c = function (s) { return l.filter(function (r) { return up(r.availabilityStatus) === s; }).length; };
                return [["Total resources", l.length, "All records"], ["Available", c("AVAILABLE"), "Ready to assign"],
                    ["Allocated", l.filter(function (r) { return r.assignedBooking || r.assignedEvent; }).length, "Bookings and events"], ["Unavailable", c("MAINTENANCE") + c("UNAVAILABLE"), "Maintenance or blocked"]];
            },
            exportRows: function (l) { return l.map(function (r) { return {id:r.resourceId, name:r.resourceName, type:r.resourceType, reference:r.registrationNumber, partner:r.partner && r.partner.partnerName, location:r.location, capacity:r.capacity, cost:r.cost, available_from:r.availableFrom, available_until:r.availableUntil, booking:r.assignedBooking && code("BK", r.assignedBooking.bookingId), event:r.assignedEvent && r.assignedEvent.eventName, allocation_start:r.allocationStartDate, allocation_end:r.allocationEndDate, status:r.availabilityStatus}; }); }
        },
        bookings: {
            api: "/api/bookings", id: "bookingId", noun: "booking", title: "Bookings", readOnly: true, canDelete: true,
            statuses: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
            sort: function (a, b) { return b.bookingId - a.bookingId; },
            search: function (r) { return [code("BK", r.bookingId), r.customer && r.customer.name, r.customer && r.customer.email, r.tourPackage && r.tourPackage.packageName].join(" "); },
            columns: [
                ["Booking", function (r) { return "<b>" + code("BK", r.bookingId) + "</b><small>Booked " + fmtDate(r.bookingDate) + "</small>"; }],
                ["Customer", function (r) { return esc(r.customer ? r.customer.name : "-") + "<small>" + esc(r.customer ? r.customer.email : "") + "</small>"; }],
                ["Package", function (r) { return esc(r.tourPackage ? r.tourPackage.packageName : "-"); }],
                ["Travel date", function (r) { return fmtDate(r.travelDate); }],
                ["People", function (r) { return r.numberOfPeople || "-"; }],
                ["Total", function (r) { return money(r.totalAmount); }],
                ["Status", function (r) { return badge(r.status); }]
            ],
            view: function (r) {
                return dl([["Booking", code("BK", r.bookingId)], ["Customer", r.customer ? r.customer.name : "-"], ["Email", r.customer ? r.customer.email : "-"],
                    ["Phone", r.customer ? r.customer.phone : "-"], ["Package", r.tourPackage ? r.tourPackage.packageName : "-"],
                    ["Travel date", fmtDate(r.travelDate)], ["Travelers", r.numberOfPeople], ["Total", money(r.totalAmount)],
                    ["Pickup", r.pickupLocation || "Not specified"], ["Special requests", r.specialRequests || "None"], ["Booked on", fmtDate(r.bookingDate)]]) +
                    '<div class="field"><label for="adStatus">Change status</label><select id="adStatus">' +
                    ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(function (s) { return "<option" + (up(r.status) === s ? " selected" : "") + ">" + s + "</option>"; }).join("") + "</select></div>";
            },
            onView: function (r, done) {
                return {label: "Save status", run: function () {
                    var s = $("#adStatus").value;
                    if (s === up(r.status)) { closeModal(); return Promise.resolve(); }
                    return api("PUT", "/api/bookings/" + r.bookingId + "/status", {status: s}).then(function () { toast("Booking " + code("BK", r.bookingId) + " is now " + s.toLowerCase()); done(); });
                }};
            },
            kpis: function (l) {
                var c = function (s) { return l.filter(function (r) { return up(r.status) === s; }).length; };
                return [["Total bookings", l.length, "All time"], ["Pending", c("PENDING"), "Waiting for confirmation"],
                    ["Confirmed", c("CONFIRMED"), "Ready to travel"],
                    ["Upcoming 7 days", l.filter(function (r) { var t = todayIso(); return up(r.status) !== "CANCELLED" && r.travelDate >= t && r.travelDate <= addDays(t, 7); }).length, "Prepare transport & guides"]];
            },
            exportRows: function (l) { return l.map(function (r) { return {booking: code("BK", r.bookingId), customer: r.customer && r.customer.name, email: r.customer && r.customer.email, package: r.tourPackage && r.tourPackage.packageName, travel_date: r.travelDate, people: r.numberOfPeople, total: r.totalAmount, status: r.status}; }); }
        },
        users: {
            api: "/api/users", id: "userId", noun: "customer", title: "Customers", readOnly: true, canDelete: true,
            filterList: function (l) { return l.filter(function (u) { return up(u.role) === "CUSTOMER"; }); },
            statuses: ["ACTIVE", "INACTIVE"],
            sort: function (a, b) { return b.userId - a.userId; },
            search: function (r) { return [r.name, r.username, r.email, r.phone, r.nic].join(" "); },
            columns: [
                ["ID", function (r) { return r.userId; }],
                ["Name", function (r) { return "<b>" + esc(r.name) + "</b><small>" + esc(r.username || "") + "</small>"; }],
                ["Email", function (r) { return esc(r.email); }],
                ["Phone", function (r) { return esc(r.phone || "-"); }],
                ["Joined", function (r) { return fmtDate(r.createdAt); }],
                ["Status", function (r) { return badge(r.status); }]
            ],
            extraAction: function (r) { return '<button class="table-action" data-act="toggle">' + (up(r.status) === "ACTIVE" ? "Deactivate" : "Activate") + "</button>"; },
            onExtra: function (r, done) {
                var next = up(r.status) === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                var go = function () { return api("PUT", "/api/users/" + r.userId + "/status", {status: next}).then(function () { toast(r.name + " is now " + next.toLowerCase()); done(); }); };
                if (next === "INACTIVE") return confirmBox("Deactivate " + r.name + "? They won't be able to log in.", "Deactivate").then(function (ok) { if (ok) return go(); });
                return go();
            },
            view: function (r) {
                return dl([["Name", r.name], ["Username", r.username || "-"], ["Email", r.email], ["Phone", r.phone || "-"], ["NIC", r.nic || "-"],
                    ["Address", r.address || "-"], ["Status", up(r.status)], ["Joined", fmtDate(r.createdAt)]]);
            },
            kpis: function (l) {
                var m = monthKey(todayIso());
                return [["Customers", l.length, "Registered"], ["Active", l.filter(function (r) { return up(r.status) === "ACTIVE"; }).length, "Can log in"],
                    ["Inactive", l.filter(function (r) { return up(r.status) !== "ACTIVE"; }).length, "Login blocked"],
                    ["Joined this month", l.filter(function (r) { return monthKey(r.createdAt) === m; }).length, "New accounts"]];
            },
            exportRows: function (l) { return l.map(function (r) { return {id: r.userId, name: r.name, username: r.username, email: r.email, phone: r.phone, status: r.status, joined: r.createdAt}; }); }
        },
        payments: {
            api: "/api/payments", id: "paymentId", noun: "payment", title: "Payments", readOnly: true,
            statuses: ["PAID", "PENDING", "REFUNDED", "CANCELLED"], statusKey: "status",
            sort: function (a, b) { return b.paymentId - a.paymentId; },
            search: function (r) { var b = r.booking || {}; return [r.transactionReference, code("BK", b.bookingId), b.customer && b.customer.name, b.tourPackage && b.tourPackage.packageName].join(" "); },
            columns: [
                ["Payment", function (r) { return "<b>" + esc(r.transactionReference || code("PAY", r.paymentId)) + "</b>"; }],
                ["Booking", function (r) { return r.booking ? code("BK", r.booking.bookingId) : "-"; }],
                ["Customer", function (r) { return esc(r.booking && r.booking.customer ? r.booking.customer.name : "-"); }],
                ["Package", function (r) { return esc(r.booking && r.booking.tourPackage ? r.booking.tourPackage.packageName : "-"); }],
                ["Amount", function (r) { return money(r.amount); }],
                ["Method", function (r) { return esc((r.paymentMethod || "-").replace(/_/g, " ")); }],
                ["Status", function (r) { return badge(r.status); }]
            ],
            view: function (r) {
                var b = r.booking || {};
                return dl([["Payment", r.transactionReference || code("PAY", r.paymentId)], ["Booking", b.bookingId ? code("BK", b.bookingId) : "-"],
                    ["Customer", b.customer ? b.customer.name : "-"], ["Package", b.tourPackage ? b.tourPackage.packageName : "-"],
                    ["Amount", money(r.amount)], ["Payment status", up(r.status)], ["Method", (r.paymentMethod || "-").replace(/_/g, " ")],
                    ["Account", r.maskedAccount || "-"], ["Paid at", r.paidAt ? r.paidAt.replace("T", " ").slice(0, 16) : "-"],
                    ["Refunded at", r.refundedAt ? r.refundedAt.replace("T", " ").slice(0, 16) : "-"], ["Note", r.statusNote || "-"]]);
            },
            kpis: function (l) {
                var sum = function (s) { return l.filter(function (r) { return up(r.status) === s; }).reduce(function (a, r) { return a + (r.amount || 0); }, 0); };
                var m = monthKey(todayIso());
                return [["Received", short(sum("PAID")), "Completed transactions"], ["Awaiting", short(sum("PENDING")), "Payment due"],
                    ["Refunded", short(sum("REFUNDED")), "Automatic refunds"],
                    ["This month", short(l.filter(function (r) { return up(r.status) === "PAID" && monthKey(r.paidAt) === m; }).reduce(function (a, r) { return a + (r.amount || 0); }, 0)), "Received"]];
            },
            exportRows: function (l) { return l.map(function (r) { var b = r.booking || {}; return {payment:r.transactionReference || code("PAY",r.paymentId), booking:b.bookingId && code("BK",b.bookingId), customer:b.customer && b.customer.name, package:b.tourPackage && b.tourPackage.packageName, amount:r.amount, method:r.paymentMethod, paid_at:r.paidAt, refunded_at:r.refundedAt, status:r.status}; }); }
        },
        feedback: {
            api: "/api/feedback", id: "feedbackId", noun: "review", title: "Reviews", readOnly: true, canDelete: true,
            statuses: ["5", "4", "3", "2", "1"], statusKey: "rating", statusLabel: function (s) { return s + " stars"; },
            search: function (r) { return [r.customer && r.customer.name, r.comment, r.booking && r.booking.tourPackage && r.booking.tourPackage.packageName].join(" "); },
            columns: [
                ["Customer", function (r) { return "<b>" + esc(r.customer ? r.customer.name : "-") + "</b><small>" + esc(r.customer ? r.customer.email : "") + "</small>"; }],
                ["Trip", function (r) { return esc(r.booking && r.booking.tourPackage ? r.booking.tourPackage.packageName : "-") + "<small>" + (r.booking ? code("BK", r.booking.bookingId) : "") + "</small>"; }],
                ["Rating", function (r) { return '<span class="ad-stars">' + stars(r.rating) + "</span>"; }],
                ["Review", function (r) { return '<span class="ad-clip">' + esc(r.comment || "") + "</span>"; }],
                ["Date", function (r) { return fmtDate(r.feedbackDate); }]
            ],
            view: function (r) {
                return dl([["Customer", r.customer ? r.customer.name : "-"], ["Email", r.customer ? r.customer.email : "-"],
                    ["Trip", r.booking && r.booking.tourPackage ? r.booking.tourPackage.packageName : "-"], ["Booking", r.booking ? code("BK", r.booking.bookingId) : "-"],
                    ["Rating", stars(r.rating)], ["Date", fmtDate(r.feedbackDate)]]) + '<div class="ad-quote">' + esc(r.comment || "") + "</div>";
            },
            kpis: function (l) {
                var avg = l.length ? (l.reduce(function (s, r) { return s + (parseInt(r.rating, 10) || 0); }, 0) / l.length).toFixed(1) : "0.0";
                var m = monthKey(todayIso());
                return [["Reviews", l.length, "All time"], ["Average rating", avg + " / 5", "Customer satisfaction"],
                    ["5-star reviews", l.filter(function (r) { return String(r.rating) === "5"; }).length, "Happy travelers"],
                    ["Low ratings (1-2)", l.filter(function (r) { return parseInt(r.rating, 10) <= 2; }).length, "Follow up"]];
            },
            exportRows: function (l) { return l.map(function (r) { return {customer: r.customer && r.customer.name, email: r.customer && r.customer.email, trip: r.booking && r.booking.tourPackage && r.booking.tourPackage.packageName, rating: r.rating, review: r.comment, date: r.feedbackDate}; }); }
        }
    };

    function dl(pairs) {
        return '<div class="ad-dl">' + pairs.map(function (p) { return "<div><span>" + esc(p[0]) + "</span><b>" + esc(p[1] == null ? "-" : p[1]) + "</b></div>"; }).join("") + "</div>";
    }

    // ---------- image upload field ----------
    var IMG_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"], IMG_MAX = 5 * 1024 * 1024;

    function uploadImage(url, file) {
        var fd = new FormData();
        fd.append("file", file);
        return fetch(url, {method: "POST", body: fd}).then(function (res) {
            return res.text().then(function (txt) {
                var d = null;
                try { d = txt ? JSON.parse(txt) : null; } catch (e) { d = null; }
                if (!res.ok || !d || !d.url) {
                    var msg = d && d.message ? d.message : "";
                    if (!msg && res.status === 413) msg = "Image is too large (max 5 MB).";
                    if (!msg && (res.status === 401 || res.status === 403)) msg = "Your session has expired. Please log in again.";
                    throw new Error(msg || "Image upload failed (" + res.status + ").");
                }
                return d.url;
            });
        });
    }

    function bindImageField(box, uploadUrl, err, save) {
        var hidden = $("#f_" + box.dataset.img), file = $("#f_" + box.dataset.img + "_file");
        var drop = $(".ad-img-drop", box), prev = $(".ad-img-preview", box);
        var saveLabel = save.textContent;

        function show(src) {
            if (src) { prev.src = src; box.classList.add("has-img"); }
            else { prev.removeAttribute("src"); box.classList.remove("has-img"); }
        }
        function fail(msg) { err.textContent = msg; err.hidden = false; box.classList.add("invalid-img"); }

        function handle(f) {
            if (!f) return;
            err.hidden = true; box.classList.remove("invalid-img");
            if (IMG_TYPES.indexOf(f.type) < 0) return fail("Only JPG, PNG, WEBP or GIF images are allowed.");
            if (f.size > IMG_MAX) return fail("Image must be 5 MB or smaller.");
            var before = hidden.value, local = URL.createObjectURL(f);
            show(local);
            box.classList.add("busy");
            save.disabled = true; save.textContent = "Uploading image...";
            uploadImage(uploadUrl, f).then(function (url) {
                hidden.value = url;
                show(url);
            }).catch(function (e) {
                hidden.value = before;
                show(before);
                fail(e.message);
            }).then(function () {
                URL.revokeObjectURL(local);
                box.classList.remove("busy");
                save.disabled = false; save.textContent = saveLabel;
                file.value = "";
            });
        }

        file.addEventListener("change", function () { handle(file.files[0]); });
        $("[data-img-change]", box).onclick = function () { file.click(); };
        $("[data-img-remove]", box).onclick = function () { hidden.value = ""; show(""); file.value = ""; };
        drop.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); file.click(); } });
        modal._onFile = handle; // drop anywhere on the modal, or paste with Ctrl+V
    }

    // ---------- generic module page ----------
    function runModule(host, key) {
        var M = MODULES[key], all = [], lookups = {}, page = 1, PER = 10;
        var sKey = M.statusKey || "status";
        var canAdd = !M.readOnly;

        host.innerHTML =
            '<div class="grid grid-4 admin-kpis" data-kpis></div>' +
            '<div class="section-head"><div><h3>' + esc(M.title) + '</h3><p data-count>Loading...</p></div><div class="ad-head-actions">' +
            (M.exportRows ? '<button class="btn btn-soft" type="button" data-export>⤓ Export CSV</button>' : "") +
            (canAdd ? '<button class="btn btn-primary" type="button" data-add>＋ Add ' + esc(M.noun) + "</button>" : "") + "</div></div>" +
            '<div class="admin-toolbar"><div class="search"><input data-q aria-label="Search ' + esc(M.title) + '" placeholder="Search ' + esc(M.title.toLowerCase()) + '...">' +
            '<select data-st aria-label="Filter by status"><option value="">All ' + (M.statusKey === "rating" ? "ratings" : "statuses") + "</option>" +
            M.statuses.map(function (s) { return '<option value="' + s + '">' + esc(M.statusLabel ? M.statusLabel(s) : s.charAt(0) + s.slice(1).toLowerCase()) + "</option>"; }).join("") +
            '</select></div><button class="btn btn-soft" type="button" data-refresh>↻ Refresh</button></div>' +
            '<div class="table-wrap admin-table"><table><thead><tr>' + M.columns.map(function (c) { return "<th>" + c[0] + "</th>"; }).join("") +
            '<th>Actions</th></tr></thead><tbody data-body><tr><td colspan="' + (M.columns.length + 1) + '" class="ad-empty">Loading...</td></tr></tbody></table></div>' +
            '<div class="table-footer"><span data-range></span><div data-pager></div></div>';

        var body = $("[data-body]", host), q = $("[data-q]", host), st = $("[data-st]", host);

        function filtered() {
            var t = q.value.trim().toLowerCase(), s = st.value;
            return all.filter(function (r) {
                return (!t || M.search(r).toLowerCase().indexOf(t) > -1) && (!s || up(r[sKey]) === s);
            });
        }

        function render() {
            var kp = M.kpis(all);
            $("[data-kpis]", host).innerHTML = kp.map(function (k, i) {
                return '<div class="card stat admin-stat"><div><p>' + esc(k[0]) + "</p><h3>" + esc(k[1]) + '</h3><span class="stat-delta">' + esc(k[2]) + '</span></div><div class="stat-icon">' + ["▦", "✓", "…", "↗"][i] + "</div></div>";
            }).join("");
            var list = filtered(), pages = Math.max(1, Math.ceil(list.length / PER));
            page = Math.min(page, pages);
            var rows = list.slice((page - 1) * PER, page * PER);
            $("[data-count]", host).textContent = all.length + " " + M.noun + (all.length === 1 ? "" : "s") + " in the system";
            if (!rows.length) {
                body.innerHTML = '<tr><td colspan="' + (M.columns.length + 1) + '" class="ad-empty">' +
                    (all.length ? "No " + M.noun + "s match your search." : "No " + M.noun + "s yet." + (canAdd ? " Click “Add " + esc(M.noun) + "” to create the first one." : "")) + "</td></tr>";
            } else {
                body.innerHTML = rows.map(function (r) {
                    return '<tr data-id="' + esc(r[M.id]) + '">' + M.columns.map(function (c) { return "<td>" + c[1](r) + "</td>"; }).join("") +
                        '<td><div class="ad-actions">' +
                        (M.view || canAdd ? '<button class="table-action" data-act="' + (canAdd ? "edit" : "view") + '">' + (canAdd ? "Edit" : "View") + "</button>" : "") +
                        (M.extraAction ? M.extraAction(r) : "") +
                        (canAdd || M.canDelete ? '<button class="table-action danger" data-act="delete">Delete</button>' : "") +
                        "</div></td></tr>";
                }).join("");
            }
            $("[data-range]", host).textContent = list.length ? "Showing " + ((page - 1) * PER + 1) + "–" + Math.min(page * PER, list.length) + " of " + list.length : "";
            var pg = "";
            if (pages > 1) {
                pg += '<button class="pager" data-pg="' + (page - 1) + '"' + (page === 1 ? " disabled" : "") + ">‹</button>";
                for (var i = 1; i <= pages; i++) pg += '<button class="pager' + (i === page ? " active" : "") + '" data-pg="' + i + '">' + i + "</button>";
                pg += '<button class="pager" data-pg="' + (page + 1) + '"' + (page === pages ? " disabled" : "") + ">›</button>";
            }
            $("[data-pager]", host).innerHTML = pg;
        }

        function load() {
            body.innerHTML = '<tr><td colspan="' + (M.columns.length + 1) + '" class="ad-empty">Loading...</td></tr>';
            var needs = M.needs || {};
            var jobs = [getList(M.api)].concat(Object.keys(needs).map(function (k) { return getList(needs[k]).then(function (l) { lookups[k] = l; }); }));
            return Promise.all(jobs).then(function (res) {
                var l = res[0];
                if (M.filterList) l = M.filterList(l);
                if (M.prepare) l = M.prepare(l);
                else l = l.slice().sort(M.sort || function (a, b) { return (b[M.id] || 0) - (a[M.id] || 0); });
                all = l;
                render();
            }).catch(function (e) {
                body.innerHTML = '<tr><td colspan="' + (M.columns.length + 1) + '" class="ad-empty bad">Could not load ' + esc(M.title.toLowerCase()) + ": " + esc(e.message) + "</td></tr>";
                $("[data-count]", host).textContent = "Connection problem";
            });
        }

        function fieldHtml(f, val) {
            var id = "f_" + f.k, v = val == null ? "" : val;
            var attrs = ' id="' + id + '" name="' + f.k + '"' + (f.req ? " required" : "") + (f.max ? ' maxlength="' + f.max + '"' : "");
            var input;
            if (f.type === "select") {
                var source = f.from ? (lookups[f.from] || []).filter(f.fromFilter || function () { return true; }) : [];
                var opts = f.from ? source.map(f.option || function (p) { return [p.partnerId, p.partnerName + (up(p.status) !== "ACTIVE" ? " (" + up(p.status).toLowerCase() + ")" : "")]; })
                    : f.opts.map(function (o) { return [o, o]; });
                input = "<select" + attrs + '><option value="">Select...</option>' + opts.map(function (o) {
                    return '<option value="' + esc(o[0]) + '"' + (String(o[0]).toUpperCase() === String(v).toUpperCase() ? " selected" : "") + ">" + esc(o[1]) + "</option>";
                }).join("") + "</select>";
                if (f.from && !opts.length) input += '<span class="hint bad">Add a partner first (Partners page).</span>';
            } else if (f.type === "image") {
                input = '<input type="hidden" id="' + id + '" name="' + f.k + '" value="' + esc(v) + '">' +
                    '<div class="ad-img' + (v ? " has-img" : "") + '" data-img="' + f.k + '">' +
                    '<label class="ad-img-drop" for="' + id + '_file" tabindex="0">' +
                    '<img class="ad-img-preview" alt="Package image preview"' + (v ? ' src="' + esc(v) + '"' : "") + '>' +
                    '<span class="ad-img-empty"><i>⇪</i><b>Drag & drop an image here</b><small>or <u>browse your computer</u> · you can also paste with Ctrl+V</small><small>The image customers see on the ' + esc(f.what || "item") + ' card</small></span>' +
                    '<span class="ad-img-busy">Uploading...</span></label>' +
                    '<input type="file" id="' + id + '_file" accept="image/jpeg,image/png,image/webp,image/gif" hidden>' +
                    '<div class="ad-img-actions"><button type="button" class="btn btn-soft" data-img-change>Change image</button>' +
                    '<button type="button" class="btn btn-soft ad-img-remove" data-img-remove>Remove</button></div></div>';
            } else if (f.type === "textarea") {
                input = "<textarea" + attrs + ">" + esc(v) + "</textarea>";
            } else {
                input = '<input type="' + (f.type || "text") + '"' + attrs + ' value="' + esc(v) + '"' +
                    (f.min != null ? ' min="' + f.min + '"' : "") + (f.max && f.type === "number" ? ' max="' + f.max + '"' : "") + (f.step ? ' step="' + f.step + '"' : "") + ">";
            }
            return '<div class="field' + (f.full ? " full" : "") + '"><label for="' + id + '">' + esc(f.l) + (f.req ? " *" : "") + "</label>" + input +
                (f.hint ? '<span class="hint">' + esc(f.hint) + "</span>" : "") + "</div>";
        }

        function openForm(rec) {
            var data = rec ? (M.toForm ? M.toForm(rec) : rec) : {};
            var m = openModal((rec ? "Edit " : "Add ") + M.noun,
                '<form class="form-grid ad-form" novalidate><div class="ad-err field full" hidden></div>' + M.fields.map(function (f) { return fieldHtml(f, data[f.k]); }).join("") + "</form>",
                '<button type="button" class="btn btn-soft" data-cancel>Cancel</button><button type="button" class="btn btn-primary" data-save>' + (rec ? "Save changes" : "Create " + M.noun) + "</button>");
            var form = $("form", m), err = $(".ad-err", m), save = $("[data-save]", m);
            $("[data-cancel]", m).onclick = closeModal;
            $$("[data-img]", form).forEach(function (box) { bindImageField(box, M.uploadApi, err, save); });
            form.addEventListener("input", function (e) { e.target.classList.remove("invalid"); err.hidden = true; });
            form.addEventListener("submit", function (e) { e.preventDefault(); save.click(); });
            save.onclick = function () {
                if (form.querySelector(".ad-img.busy")) { err.textContent = "Please wait until the image finishes uploading."; err.hidden = false; return; }
                var v = {}, bad = [];
                M.fields.forEach(function (f) {
                    var el = $("#f_" + f.k, form), raw = el.value.trim();
                    el.classList.remove("invalid");
                    if (f.req && !raw) { bad.push(f.l + " is required."); el.classList.add("invalid"); return; }
                    if (f.type === "number" && raw) {
                        var n = Number(raw);
                        if (isNaN(n) || (f.min != null && n < f.min) || (f.max != null && n > f.max)) { bad.push(f.l + " must be " + (f.max != null ? "between " + f.min + " and " + f.max : "at least " + f.min) + "."); el.classList.add("invalid"); return; }
                        v[f.k] = n; return;
                    }
                    if (f.type === "email" && raw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) { bad.push("Enter a valid email."); el.classList.add("invalid"); return; }
                    if (f.pattern && raw && !new RegExp(f.pattern).test(raw)) { bad.push(f.l + " is not valid."); el.classList.add("invalid"); return; }
                    v[f.k] = raw || null;
                });
                if (!bad.length && M.validate) { var x = M.validate(v); if (x) { bad.push(x[1]); $("#f_" + x[0], form).classList.add("invalid"); } }
                if (bad.length) { err.textContent = bad.join(" "); err.hidden = false; return; }
                var payload = M.toPayload ? M.toPayload(v) : v;
                save.disabled = true; save.textContent = "Saving...";
                api(rec ? "PUT" : "POST", M.api + (rec ? "/" + rec[M.id] : ""), payload).then(function () {
                    closeModal();
                    toast(rec ? "Changes saved" : "New " + M.noun + " created");
                    load();
                }).catch(function (e) {
                    err.textContent = e.message; err.hidden = false;
                    save.disabled = false; save.textContent = rec ? "Save changes" : "Create " + M.noun;
                });
            };
        }

        function openView(rec) {
            var act = M.onView ? M.onView(rec, function () { closeModal(); load(); }) : null;
            var m = openModal(M.noun.charAt(0).toUpperCase() + M.noun.slice(1) + " details", M.view(rec),
                '<button type="button" class="btn btn-soft" data-cancel>Close</button>' + (act ? '<button type="button" class="btn btn-primary" data-go>' + esc(act.label) + "</button>" : ""));
            $("[data-cancel]", m).onclick = closeModal;
            if (act) $("[data-go]", m).onclick = function () {
                var b = this; b.disabled = true;
                act.run().catch(function (e) { toast(e.message, true); b.disabled = false; });
            };
        }

        host.addEventListener("click", function (e) {
            var b = e.target.closest("button");
            if (!b) return;
            if (b.hasAttribute("data-add")) return openForm(null);
            if (b.hasAttribute("data-refresh")) { load().then(function () { toast("List refreshed"); }); return; }
            if (b.hasAttribute("data-export")) return csv(key, M.exportRows(filtered()));
            if (b.dataset.pg) { page = Number(b.dataset.pg); render(); return; }
            var tr = b.closest("tr[data-id]");
            if (!tr) return;
            var rec = all.filter(function (r) { return String(r[M.id]) === tr.dataset.id; })[0];
            if (!rec) return;
            var act = b.dataset.act;
            if (act === "edit") openForm(rec);
            else if (act === "view") openView(rec);
            else if (act === "toggle" && M.onExtra) { b.disabled = true; Promise.resolve(M.onExtra(rec, load)).catch(function (er) { toast(er.message, true); }).then(function () { b.disabled = false; }); }
            else if (act === "delete") {
                var label = rec.packageName || rec.eventName || rec.title || rec.partnerName || rec.resourceName || rec.name || code("BK", rec[M.id]);
                confirmBox("Delete " + M.noun + " “" + label + "”? This cannot be undone.").then(function (ok) {
                    if (!ok) return;
                    api("DELETE", M.api + "/" + rec[M.id]).then(function () { toast(M.noun.charAt(0).toUpperCase() + M.noun.slice(1) + " deleted"); load(); })
                        .catch(function (er) { toast(er.message, true); });
                });
            }
        });
        q.addEventListener("input", function () { page = 1; render(); });
        st.addEventListener("change", function () { page = 1; render(); });
        load();
    }

    // ---------- dashboard ----------
    function runDashboard(host) {
        Promise.all([getList("/api/bookings"), getList("/api/users"), getList("/api/packages"), getList("/api/resources").catch(function () { return []; }), getList("/api/feedback").catch(function () { return []; })])
            .then(function (r) {
                var bk = r[0], users = r[1].filter(function (u) { return up(u.role) === "CUSTOMER"; }), pk = r[2], res = r[3], fb = r[4];
                var m = monthKey(todayIso()), paid = function (b) { var s = up(b.status); return s === "CONFIRMED" || s === "COMPLETED"; };
                var rev = bk.filter(function (b) { return paid(b) && monthKey(b.bookingDate) === m; }).reduce(function (s, b) { return s + (b.totalAmount || 0); }, 0);
                setKpis(host, [["Total bookings", bk.length, bk.filter(function (b) { return monthKey(b.bookingDate) === m; }).length + " this month"],
                    ["Customers", users.length, users.filter(function (u) { return monthKey(u.createdAt) === m; }).length + " joined this month"],
                    ["Revenue this month", short(rev), "Confirmed & completed"],
                    ["Active packages", pk.filter(function (p) { return up(p.status) === "ACTIVE"; }).length, pk.length + " total"]]);
                var tb = $("[data-recent]", host);
                var recent = bk.slice().sort(function (a, b) { return b.bookingId - a.bookingId; }).slice(0, 5);
                tb.innerHTML = recent.length ? recent.map(function (b) {
                    return "<tr><td><b>" + code("BK", b.bookingId) + "</b></td><td>" + esc(b.customer ? b.customer.name : "-") + "</td><td>" + esc(b.tourPackage ? b.tourPackage.packageName : "-") +
                        "</td><td>" + money(b.totalAmount) + "</td><td>" + badge(b.status) + "</td></tr>";
                }).join("") : '<tr><td colspan="5" class="ad-empty">No bookings yet.</td></tr>';
                var nonCancel = bk.filter(function (b) { return up(b.status) !== "CANCELLED"; });
                var conf = nonCancel.length ? Math.round(nonCancel.filter(paid).length / nonCancel.length * 100) : 0;
                var util = res.length ? Math.round(res.filter(function (x) { return up(x.availabilityStatus) === "BOOKED"; }).length / res.length * 100) : 0;
                var sat = fb.length ? Math.round(fb.reduce(function (s, f) { return s + (parseInt(f.rating, 10) || 0); }, 0) / fb.length / 5 * 100) : 0;
                setProgress(host, [conf, util, sat], [nonCancel.length ? "of active bookings confirmed" : "No bookings yet",
                    res.length ? "of resources currently booked" : "No resources yet", fb.length ? "from " + fb.length + " review" + (fb.length > 1 ? "s" : "") : "No reviews yet"]);
            }).catch(function (e) { toast("Could not load dashboard data: " + e.message, true); });
    }
    function setKpis(host, kp) {
        $$(".admin-kpis .admin-stat", host).forEach(function (card, i) {
            if (!kp[i]) return;
            $("p", card).textContent = kp[i][0];
            $("h3", card).textContent = kp[i][1];
            var d = $(".stat-delta", card); if (d) d.textContent = kp[i][2];
        });
    }
    function setProgress(host, vals, notes) {
        $$(".admin-progress", host).forEach(function (p, i) {
            if (vals[i] == null) return;
            var span = $("div:first-child span", p), bar = $(".kpi-line span", p), note = $("small, p", p);
            if (span) span.textContent = vals[i] + "%";
            if (bar) bar.style.width = vals[i] + "%";
            if (note && notes[i]) note.textContent = notes[i];
        });
    }

    // ---------- reports ----------
    function runReports(host) {
        var data = null, range = "month";
        function compute() {
            var bk = data.bk, t = todayIso(), from = range === "month" ? t.slice(0, 7) + "-01" : range === "quarter" ? addDays(t, -90) : range === "year" ? addDays(t, -365) : "0000";
            var inRange = bk.filter(function (b) { return (b.bookingDate || "") >= from; });
            var paid = function (b) { var s = up(b.status); return s === "CONFIRMED" || s === "COMPLETED"; };
            var rev = inRange.filter(paid).reduce(function (s, b) { return s + (b.totalAmount || 0); }, 0);
            var avg = inRange.length ? inRange.reduce(function (s, b) { return s + (b.totalAmount || 0); }, 0) / inRange.length : 0;
            var fb = data.fb, rating = fb.length ? (fb.reduce(function (s, f) { return s + (parseInt(f.rating, 10) || 0); }, 0) / fb.length).toFixed(1) + " / 5" : "No reviews";
            var label = {month: "This month", quarter: "Last 90 days", year: "Last 12 months", all: "All time"}[range];
            setKpis(host, [["Revenue", short(rev), label], ["Bookings", inRange.length, label], ["Avg. booking", short(avg), label], ["Customer rating", rating, fb.length + " reviews"]]);

            // revenue trend: last 6 months
            var months = [];
            for (var i = 5; i >= 0; i--) { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); months.push(d.toISOString().slice(0, 7)); }
            var vals = months.map(function (mk) { return bk.filter(function (b) { return paid(b) && monthKey(b.bookingDate) === mk; }).reduce(function (s, b) { return s + (b.totalAmount || 0); }, 0); });
            var max = Math.max.apply(null, vals.concat([1]));
            var bars = $(".bars", host);
            if (bars) bars.innerHTML = months.map(function (mk, i) {
                var n = new Date(mk + "-01T00:00:00").toLocaleDateString("en-GB", {month: "short"});
                return '<div style="--h:' + Math.max(3, Math.round(vals[i] / max * 100)) + '%" title="' + n + ": " + money(vals[i]) + '"><span>' + n + "</span></div>";
            }).join("");

            // status donut
            var st = ["CONFIRMED", "PENDING", "COMPLETED", "CANCELLED"], cnt = st.map(function (s) { return inRange.filter(function (b) { return up(b.status) === s; }).length; });
            var total = inRange.length, colors = ["#2e7032", "#c4a56a", "#4f7cac", "#c0473c"], acc = 0;
            var donut = $(".donut", host);
            if (donut) {
                donut.style.background = total ? "conic-gradient(" + cnt.map(function (c, i) { var a = acc; acc += c / total * 360; return colors[i] + " " + a + "deg " + acc + "deg"; }).join(",") + ")" : "#eee3d3";
                donut.innerHTML = "<span>" + total + "<small>Bookings</small></span>";
            }
            var legend = $(".legend", host);
            if (legend) legend.innerHTML = st.map(function (s, i) {
                return '<p><i class="lg" style="background:' + colors[i] + '"></i>' + s.charAt(0) + s.slice(1).toLowerCase() + "<b>" + (total ? Math.round(cnt[i] / total * 100) : 0) + "%</b></p>";
            }).join("");

            // top packages
            var tb = $("[data-top]", host);
            if (tb) {
                var by = {};
                inRange.forEach(function (b) {
                    var n = b.tourPackage ? b.tourPackage.packageName : "Unknown";
                    by[n] = by[n] || {n: n, c: 0, r: 0};
                    by[n].c++; if (paid(b)) by[n].r += b.totalAmount || 0;
                });
                var top = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.r - a.r || b.c - a.c; }).slice(0, 6);
                tb.innerHTML = top.length ? top.map(function (x) { return "<tr><td><b>" + esc(x.n) + "</b></td><td>" + x.c + "</td><td>" + money(x.r) + "</td></tr>"; }).join("")
                    : '<tr><td colspan="3" class="ad-empty">No bookings in this period.</td></tr>';
            }
            data.inRange = inRange;
        }
        Promise.all([getList("/api/bookings"), getList("/api/feedback").catch(function () { return []; })]).then(function (r) {
            data = {bk: r[0], fb: r[1]};
            compute();
        }).catch(function (e) { toast("Could not load report data: " + e.message, true); });
        var sel = $("[data-range]", host);
        if (sel) sel.addEventListener("change", function () { range = sel.value; if (data) compute(); });
        var ex = $("[data-export-report]", host);
        if (ex) ex.addEventListener("click", function () {
            if (!data) return;
            csv("report-" + range, data.inRange.map(function (b) { return {booking: code("BK", b.bookingId), booked: b.bookingDate, travel: b.travelDate, customer: b.customer && b.customer.name, package: b.tourPackage && b.tourPackage.packageName, people: b.numberOfPeople, total: b.totalAmount, status: b.status}; }));
        });
    }

    // ---------- notifications (live alerts from data) ----------
    function runNotifications(host) {
        var list = $("[data-alerts]", host);
        var readKey = "el-admin-read";
        function read() { try { return JSON.parse(localStorage.getItem(readKey) || "[]"); } catch (e) { return []; } }
        Promise.all([getList("/api/bookings"), getList("/api/promotions").catch(function () { return []; }), getList("/api/users"),
            getList("/api/packages"), getList("/api/feedback").catch(function () { return []; }), getList("/api/events").catch(function () { return []; })])
            .then(function (r) {
                var bk = r[0], pr = r[1], us = r[2], pk = r[3], fb = r[4], ev = r[5], t = todayIso(), alerts = [];
                bk.filter(function (b) { return up(b.status) === "PENDING"; }).forEach(function (b) {
                    alerts.push({id: "pend-" + b.bookingId, icon: "!", tag: ["warning", "Bookings"], title: "Booking " + code("BK", b.bookingId) + " waiting for confirmation",
                        text: (b.customer ? b.customer.name : "A customer") + " booked " + (b.tourPackage ? b.tourPackage.packageName : "a package") + " for " + fmtDate(b.travelDate) + ".", link: "/ui/admin-bookings", when: b.bookingDate});
                });
                bk.filter(function (b) { return up(b.status) === "CONFIRMED" && b.travelDate >= t && b.travelDate <= addDays(t, 3); }).forEach(function (b) {
                    alerts.push({id: "soon-" + b.bookingId, icon: "◷", tag: ["info", "Trips"], title: "Trip starts " + fmtDate(b.travelDate),
                        text: code("BK", b.bookingId) + " · " + (b.customer ? b.customer.name : "") + " · " + b.numberOfPeople + " traveler(s). Check transport and guide.", link: "/ui/admin-bookings", when: b.travelDate});
                });
                pr.filter(function (p) { return up(p.status) === "ACTIVE" && p.endDate >= t && p.endDate <= addDays(t, 7); }).forEach(function (p) {
                    alerts.push({id: "promo-" + p.promotionId + p.endDate, icon: "%", tag: ["warning", "Promotions"], title: "“" + p.title + "” ends " + fmtDate(p.endDate), text: "Extend it or prepare the next offer.", link: "/ui/admin-promotions", when: p.endDate});
                });
                pr.filter(function (p) { return up(p.status) === "ACTIVE" && p.endDate && p.endDate < t; }).forEach(function (p) {
                    alerts.push({id: "expired-" + p.promotionId, icon: "%", tag: ["danger", "Promotions"], title: "“" + p.title + "” has ended but is still Active", text: "Set its status to Expired.", link: "/ui/admin-promotions", when: p.endDate});
                });
                fb.filter(function (f) { return parseInt(f.rating, 10) <= 2; }).forEach(function (f) {
                    alerts.push({id: "low-" + f.feedbackId, icon: "★", tag: ["danger", "Reviews"], title: "Low rating from " + (f.customer ? f.customer.name : "a customer"), text: "“" + (f.comment || "").slice(0, 90) + "”", link: "/ui/admin-feedback", when: f.feedbackDate});
                });
                us.filter(function (u) { return up(u.role) === "CUSTOMER" && u.createdAt && u.createdAt.slice(0, 10) >= addDays(t, -7); }).forEach(function (u) {
                    alerts.push({id: "user-" + u.userId, icon: "◉", tag: ["success", "Customers"], title: "New customer: " + u.name, text: u.email, link: "/ui/admin-users", when: u.createdAt});
                });
                ev.filter(function (e) { return e.eventDate >= t && e.eventDate <= addDays(t, 7) && up(e.status) !== "CANCELLED"; }).forEach(function (e) {
                    alerts.push({id: "ev-" + e.eventId, icon: "◇", tag: ["info", "Events"], title: e.eventName + " on " + fmtDate(e.eventDate), text: e.location || "", link: "/ui/admin-events", when: e.eventDate});
                });
                if (!pk.some(function (p) { return up(p.status) === "ACTIVE"; })) alerts.push({id: "nopkg", icon: "◫", tag: ["danger", "Packages"], title: "No active packages", text: "Customers can't book anything until a package is Active.", link: "/ui/admin-packages", when: t});

                alerts.sort(function (a, b) { return String(b.when || "").localeCompare(String(a.when || "")); });
                var seen = read();
                function draw() {
                    seen = read();
                    var unread = alerts.filter(function (a) { return seen.indexOf(a.id) < 0; });
                    setKpis(host, [["Unread alerts", unread.length, alerts.length + " total"],
                        ["Pending bookings", bk.filter(function (b) { return up(b.status) === "PENDING"; }).length, "Need confirmation"],
                        ["Trips in 3 days", bk.filter(function (b) { return up(b.status) === "CONFIRMED" && b.travelDate >= t && b.travelDate <= addDays(t, 3); }).length, "Prepare operations"],
                        ["Low ratings", fb.filter(function (f) { return parseInt(f.rating, 10) <= 2; }).length, "Follow up"]]);
                    list.innerHTML = alerts.length ? alerts.map(function (a) {
                        return '<article class="notice' + (seen.indexOf(a.id) < 0 ? " unread" : "") + '" data-id="' + esc(a.id) + '"><div class="notice-icon">' + esc(a.icon) +
                            '</div><div><div class="notice-head"><strong>' + esc(a.title) + "</strong><span>" + esc(fmtDate(a.when)) + "</span></div><p>" + esc(a.text) +
                            '</p><div class="notice-tags"><span class="badge ' + a.tag[0] + '">' + esc(a.tag[1]) + '</span><a class="text-link" href="' + a.link + '">Open →</a></div></div></article>';
                    }).join("") : '<div class="card ad-empty">All clear — nothing needs your attention right now.</div>';
                }
                draw();
                list.addEventListener("click", function (e) {
                    var n = e.target.closest(".notice");
                    if (!n) return;
                    var s = read(); if (s.indexOf(n.dataset.id) < 0) { s.push(n.dataset.id); localStorage.setItem(readKey, JSON.stringify(s)); }
                    n.classList.remove("unread"); draw();
                });
                var mark = $("[data-mark-all]", host);
                if (mark) mark.onclick = function () { localStorage.setItem(readKey, JSON.stringify(alerts.map(function (a) { return a.id; }))); draw(); toast("All alerts marked as read"); };
            }).catch(function (e) { list.innerHTML = '<div class="card ad-empty bad">Could not load alerts: ' + esc(e.message) + "</div>"; });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var host = $("[data-admin-module]");
        if (host) runModule(host, host.dataset.adminModule);
        var page = document.body.dataset.adminPage;
        var root = $(".admin-content");
        if (page === "dashboard") runDashboard(root);
        if (page === "reports") runReports(root);
        if (page === "notifications") runNotifications(root);
    });
})();

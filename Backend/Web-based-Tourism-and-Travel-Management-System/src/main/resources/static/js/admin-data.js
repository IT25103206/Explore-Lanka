/* =========================================================
   Explore Lanka - Admin pages connected to the real API
   Modules follow the project proposal (PDF): packages, bookings,
   resources, events, promotions, partners + payments, users,
   feedback, reports and role-based access.
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
    /** Same as getList but returns [] when the user's role can't read that data. */
    function tryList(url) { return getList(url).catch(function () { return []; }); }

    var BADGE = {
        success: ["ACTIVE", "AVAILABLE", "CONFIRMED", "PUBLISHED", "PAID", "ONGOING", "VALID"],
        info: ["COMPLETED", "UPCOMING", "SCHEDULED", "REFUNDED", "FLEXIBLE"],
        warning: ["PENDING", "DRAFT", "BOOKED", "AWAITING", "UNPAID", "REFUND_PENDING", "EXPIRING"],
        danger: ["INACTIVE", "CANCELLED", "EXPIRED", "UNAVAILABLE", "MAINTENANCE", "VOID"]
    };
    function label(s) { s = up(s); return s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ") : "—"; }
    function badge(s, text) {
        var v = up(s) || "—", cls = "info";
        Object.keys(BADGE).forEach(function (k) { if (BADGE[k].indexOf(v) > -1) cls = k; });
        return '<span class="badge ' + cls + '">' + esc(text || v.replace(/_/g, " ")) + "</span>";
    }
    /** Payment status of a booking; older bookings without one follow the booking status. */
    function payStatus(b) {
        if (b.paymentStatus) return up(b.paymentStatus);
        var s = up(b.status);
        return s === "CONFIRMED" || s === "COMPLETED" ? "PAID" : s === "CANCELLED" ? "REFUNDED" : "UNPAID";
    }
    function lines(text) { return String(text || "").split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
    function travelersOf(b) {
        return lines(b.travelerDetails).map(function (l) { var p = l.split("|"); return {name: (p[0] || "").trim(), id: (p[1] || "").trim(), age: (p[2] || "").trim()}; });
    }
    function role() { return up(sessionStorage.getItem("userRole")); }
    function can(page) {
        try { var p = JSON.parse(sessionStorage.getItem("adminPages") || "null"); return !p || p.indexOf(page) > -1; } catch (e) { return true; }
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

    // ---------- module definitions ----------
    var CATS = ["Culture", "Nature", "Adventure", "Beach", "Wildlife", "Heritage", "Wellness", "Honeymoon", "Family"];
    var REGIONS = ["Western", "Central", "Southern", "Northern", "Eastern", "North Western", "North Central", "Uva", "Sabaragamuwa"];
    var EVENT_CATS = ["Cultural Festival", "Religious", "Music / Concert", "Exhibition", "Food Festival", "Entertainment", "Sports", "Other"];
    var PROMO_TYPES = ["GENERAL", "EARLY_BIRD", "HONEYMOON", "FAMILY", "SEASONAL", "GROUP", "FESTIVAL"];
    var RES_TYPES = ["Hotel", "Room", "Vehicle", "Guide", "Equipment", "Venue", "Other"];
    var IMG_HINT = "JPG, PNG, WEBP or GIF · max 5 MB · landscape works best";

    function contractState(p) {
        if (!p.contractEnd) return "NONE";
        var t = todayIso();
        if (p.contractEnd < t) return "EXPIRED";
        if (p.contractEnd <= addDays(t, 30)) return "EXPIRING";
        return "VALID";
    }
    function scheduleText(p) {
        var dates = String(p.departureDates || "").split(",").filter(Boolean);
        var parts = [];
        if (p.seasonal) parts.push("Seasonal " + fmtDate(p.validFrom) + " – " + fmtDate(p.validTo));
        parts.push(dates.length ? dates.length + " departure" + (dates.length > 1 ? "s" : "") : "Flexible dates");
        if (p.maxTravelers) parts.push(p.maxTravelers + " seats / date");
        return parts.join(" · ");
    }

    var MODULES = {
        // ===== 1. Tour Package & Experience Management =====
        packages: {
            api: "/api/packages", id: "packageId", noun: "package", title: "Tour packages",
            uploadApi: "/api/packages/upload-image",
            statuses: ["ACTIVE", "DRAFT", "INACTIVE"],
            search: function (r) { return [r.packageName, r.category, r.description, r.destinations].join(" "); },
            columns: [
                ["Package", function (r) { return thumbCell(r.imageUrl, "◫", r.packageName, r.destinations || r.description); }],
                ["Category", function (r) { return esc(r.category || "-") + (r.customizable ? "<small>Customizable</small>" : ""); }],
                ["Duration", function (r) { return r.durationDays ? r.durationDays + " days" : "-"; }],
                ["Price / person", function (r) { return money(r.price); }],
                ["Schedule", function (r) { return '<span class="ad-clip">' + esc(scheduleText(r)) + "</span>"; }],
                ["Status", function (r) { return badge(r.status); }]
            ],
            fields: [
                {section: "Package details"},
                {k: "packageName", l: "Package name", req: true, max: 100, full: true},
                {k: "imageUrl", l: "Package image", type: "image", full: true, hint: IMG_HINT, what: "package"},
                {k: "category", l: "Category", type: "select", opts: CATS, req: true},
                {k: "status", l: "Status", type: "select", opts: ["ACTIVE", "DRAFT", "INACTIVE"], req: true},
                {k: "destinations", l: "Destinations", max: 255, full: true, hint: "e.g. Kandy • Nuwara Eliya • Ella"},
                {section: "Pricing"},
                {k: "durationDays", l: "Duration (days)", type: "number", min: 1, max: 60, req: true},
                {k: "price", l: "Price per person (LKR)", type: "number", min: 1, step: "0.01", req: true},
                {section: "Schedule & season"},
                {k: "departureDates", l: "Departure dates (schedule)", type: "dates", full: true, hint: "Leave empty for flexible dates (customer picks any future date)."},
                {k: "maxTravelers", l: "Max travelers per date", type: "number", min: 1, max: 500, hint: "Empty = no limit"},
                {k: "seasonal", l: "Seasonal package", type: "checkbox", text: "Only bookable during a season"},
                {k: "validFrom", l: "Season from", type: "date", showIf: function (v) { return v.seasonal; }, req: true},
                {k: "validTo", l: "Season to", type: "date", showIf: function (v) { return v.seasonal; }, req: true},
                {section: "Tour plan"},
                {k: "description", l: "Description", type: "textarea", full: true, max: 2000},
                {k: "itinerary", l: "Day-by-day itinerary", type: "textarea", full: true, max: 4000, rows: 5, hint: "One line per day, e.g. \"Arrive in Kandy – Temple of the Tooth\"."},
                {k: "inclusions", l: "What's included", type: "textarea", full: true, max: 2000, hint: "One item per line (hotel, transport, guide, meals...)."},
                {k: "customizable", l: "Customizable tour plan", type: "checkbox", text: "Customers can request changes to the plan", full: true}
            ],
            validate: function (v) {
                if (v.seasonal && v.validFrom && v.validTo && v.validTo < v.validFrom) return ["validTo", "Season end must be on or after the season start."];
                var days = lines(v.itinerary).length;
                if (days && v.durationDays && days > v.durationDays) return ["itinerary", "The itinerary has " + days + " lines but the tour is " + v.durationDays + " days."];
            },
            headActions: [{label: "🗑 Delete inactive", cls: "btn-soft", run: function (reload) {
                return confirmBox("Delete all INACTIVE packages that have no bookings? Packages with bookings are kept.", "Delete inactive").then(function (ok) {
                    if (!ok) return;
                    return api("DELETE", "/api/packages/inactive").then(function (r) { toast(r.message || "Done"); reload(); });
                });
            }}],
            kpis: function (l) {
                var act = l.filter(function (r) { return up(r.status) === "ACTIVE"; });
                return [["Total packages", l.length, "All records"], ["Active", act.length, "Visible to customers"],
                    ["Seasonal", l.filter(function (r) { return r.seasonal; }).length, "Limited-time packages"],
                    ["Avg. price", short(l.length ? l.reduce(function (s, r) { return s + (r.price || 0); }, 0) / l.length : 0), "Per person"]];
            }
        },

        // ===== 4. Event & Festival Information Management =====
        events: {
            api: "/api/events", id: "eventId", noun: "event", title: "Events & festivals",
            uploadApi: "/api/events/upload-image",
            statuses: ["DRAFT", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"],
            sort: function (a, b) { return String(a.eventDate || "").localeCompare(String(b.eventDate || "")); },
            search: function (r) { return [r.eventName, r.location, r.region, r.category, r.organizer, r.description].join(" "); },
            columns: [
                ["Event", function (r) { return thumbCell(r.imageUrl, "◇", r.eventName, r.organizer ? "By " + r.organizer : r.description); }],
                ["Category", function (r) { return esc(r.category || "-"); }],
                ["Dates", function (r) { return fmtDate(r.eventDate) + (r.endDate ? "<small>to " + fmtDate(r.endDate) + "</small>" : "") + (r.startTime ? "<small>" + esc(r.startTime) + "</small>" : ""); }],
                ["Where", function (r) { return esc(r.location || "-") + "<small>" + esc(r.region ? r.region + " Province" : "") + "</small>"; }],
                ["Registered", function (r) { return (r.registeredCount || 0) + (r.maxParticipants ? " / " + r.maxParticipants : "") + (r.maxParticipants && (r.registeredCount || 0) >= r.maxParticipants ? "<small>Full</small>" : ""); }],
                ["Status", function (r) { return badge(r.status, up(r.status) === "DRAFT" ? "Draft" : null); }]
            ],
            fields: [
                {k: "eventName", l: "Event name", req: true, max: 100, full: true},
                {k: "imageUrl", l: "Event image", type: "image", full: true, hint: IMG_HINT, what: "event"},
                {k: "category", l: "Category", type: "select", opts: EVENT_CATS, req: true},
                {k: "status", l: "Publish", type: "select", opts: ["UPCOMING", "DRAFT", "CANCELLED"], optLabel: function (x) { return {UPCOMING: "Published", DRAFT: "Draft (hidden from customers)", CANCELLED: "Cancelled"}[x]; }, req: true, hint: "Published events go Ongoing / Completed automatically"},
                {k: "eventDate", l: "Start date", type: "date", req: true},
                {k: "endDate", l: "End date", type: "date", hint: "Multi-day festivals only"},
                {k: "startTime", l: "Start time", type: "time"},
                {k: "region", l: "Region (province)", type: "select", opts: REGIONS, req: true},
                {k: "location", l: "Location", req: true, max: 255},
                {k: "organizer", l: "Organizer", max: 255},
                {k: "maxParticipants", l: "Max participants", type: "number", min: 1, hint: "Empty = no limit"},
                {k: "dressCode", l: "Dress code", max: 255, hint: "e.g. White clothes, modest dress for temples"},
                {k: "description", l: "Description", type: "textarea", full: true, max: 2000}
            ],
            toForm: function (r) { var o = Object.assign({}, r); var s = up(r.status); o.status = s === "DRAFT" || s === "CANCELLED" ? s : "UPCOMING"; return o; },
            rowActions: [
                {act: "publish", label: "Publish", show: function (r) { return up(r.status) === "DRAFT"; }, run: function (r, reload) {
                    return api("PUT", "/api/events/" + r.eventId, Object.assign({}, r, {status: "UPCOMING"})).then(function () { toast("“" + r.eventName + "” is now published"); reload(); });
                }},
                {act: "regs", label: "Registrations", show: function (r) { return up(r.status) !== "DRAFT"; }, run: function (r) { return openRegistrations(r); }}
            ],
            validate: function (v) { if (v.endDate && v.eventDate && v.endDate < v.eventDate) return ["endDate", "End date must be on or after the start date."]; },
            headActions: [{label: "🧹 Remove expired", cls: "btn-soft", run: function (reload) {
                return confirmBox("Remove all events that finished before today?", "Remove expired").then(function (ok) {
                    if (!ok) return;
                    return api("DELETE", "/api/events/expired").then(function (r) { toast(r.message || "Done"); reload(); });
                });
            }}],
            kpis: function (l) {
                var t = todayIso(), m = monthKey(t);
                return [["Total events", l.length, l.filter(function (r) { return up(r.status) === "DRAFT"; }).length + " drafts"],
                    ["Upcoming", l.filter(function (r) { return up(r.status) === "UPCOMING"; }).length, "From today"],
                    ["This month", l.filter(function (r) { return monthKey(r.eventDate) === m; }).length, "Scheduled"],
                    ["Regions", Object.keys(l.reduce(function (o, r) { if (r.region) o[r.region] = 1; return o; }, {})).length, "Provinces covered"]];
            }
        },

        // ===== 5. Promotion & Offer Management =====
        promotions: {
            api: "/api/promotions", id: "promotionId", noun: "promotion", title: "Promotions & offers",
            uploadApi: "/api/promotions/upload-image",
            needs: {packages: "/api/packages"},
            statuses: ["ACTIVE", "SCHEDULED", "EXPIRED", "INACTIVE"],
            search: function (r) { return [r.title, r.couponCode, r.promoType, r.description, r.tourPackage && r.tourPackage.packageName].join(" "); },
            columns: [
                ["Promotion", function (r) { return thumbCell(r.imageUrl, "%", r.title + (r.featured ? " ★" : ""), label(r.promoType) + (r.tourPackage ? " · " + r.tourPackage.packageName : " · All packages")); }],
                ["Coupon", function (r) { return r.couponCode ? '<code class="ad-code">' + esc(r.couponCode) + "</code>" : '<small>No code</small>'; }],
                ["Discount", function (r) { return (r.discountPercentage || 0) + "%"; }],
                ["Valid", function (r) { return fmtDate(r.startDate) + "<small>to " + fmtDate(r.endDate) + "</small>"; }],
                ["Used", function (r) { return (r.usedCount || 0) + (r.usageLimit ? " / " + r.usageLimit : ""); }],
                ["Status", function (r) { return badge(r.status); }]
            ],
            fields: [
                {section: "Campaign"},
                {k: "title", l: "Title", req: true, max: 100, full: true},
                {k: "imageUrl", l: "Promotion image", type: "image", full: true, hint: IMG_HINT, what: "offer"},
                {k: "promoType", l: "Offer type", type: "select", opts: PROMO_TYPES, req: true, optLabel: label},
                {k: "status", l: "Status", type: "select", opts: ["ACTIVE", "INACTIVE"], req: true, hint: "Scheduled / Expired is set from the dates"},
                {k: "discountPercentage", l: "Discount (%)", type: "number", min: 1, max: 100, step: "0.01", req: true},
                {k: "couponCode", l: "Coupon code", max: 30, pattern: "^[A-Za-z0-9-]{3,30}$", hint: "e.g. SUMMER20 · empty = no code", upper: true},
                {k: "startDate", l: "Start date", type: "date", req: true},
                {k: "endDate", l: "End date", type: "date", req: true},
                {section: "Rules"},
                {k: "packageId", l: "Applies to", type: "select", from: "packages", optValue: "packageId", optLabel: function (p) { return p.packageName; }, empty: "All packages", full: true},
                {k: "minTravelers", l: "Min. travelers", type: "number", min: 1, max: 50, hint: "Group / family offers"},
                {k: "minDaysBeforeTravel", l: "Book at least (days before)", type: "number", min: 0, max: 365, hint: "Early-bird offers"},
                {k: "usageLimit", l: "Usage limit", type: "number", min: 1, hint: "Empty = unlimited"},
                {k: "featured", l: "Special deal", type: "checkbox", text: "Feature at the top of the customer Offers page"},
                {k: "description", l: "Promotional content", type: "textarea", full: true, max: 2000}
            ],
            validate: function (v) { if (v.startDate && v.endDate && v.endDate < v.startDate) return ["endDate", "End date must be on or after the start date."]; },
            toForm: function (r) { var o = Object.assign({}, r); o.packageId = r.tourPackage ? r.tourPackage.packageId : ""; o.status = up(r.status) === "INACTIVE" ? "INACTIVE" : "ACTIVE"; return o; },
            toPayload: function (v) { var o = Object.assign({}, v); o.tourPackage = v.packageId ? {packageId: Number(v.packageId)} : null; delete o.packageId; if (o.couponCode) o.couponCode = o.couponCode.toUpperCase(); return o; },
            rowActions: [{act: "toggle", label: function (r) { return up(r.status) === "INACTIVE" ? "Activate" : "Deactivate"; }, run: function (r, reload) {
                var o = Object.assign({}, r, {status: up(r.status) === "INACTIVE" ? "ACTIVE" : "INACTIVE"});
                return api("PUT", "/api/promotions/" + r.promotionId, o).then(function () { toast("“" + r.title + "” " + (o.status === "ACTIVE" ? "activated" : "deactivated")); reload(); });
            }}],
            kpis: function (l) {
                var live = l.filter(function (r) { return up(r.status) === "ACTIVE"; });
                return [["Total promotions", l.length, "All records"], ["Running now", live.length, "Customers can use"],
                    ["Coupon uses", l.reduce(function (s, r) { return s + (r.usedCount || 0); }, 0), "Bookings with a code"],
                    ["Avg. discount", (l.length ? Math.round(l.reduce(function (s, r) { return s + (r.discountPercentage || 0); }, 0) / l.length) : 0) + "%", "Across offers"]];
            }
        },

        // ===== 6. Partner & Supplier Management =====
        partners: {
            api: "/api/partners", id: "partnerId", noun: "partner", title: "Partners & suppliers",
            needs: {resources: "/api/resources"},
            statuses: ["ACTIVE", "PENDING", "INACTIVE"],
            search: function (r) { return [r.partnerName, r.partnerType, r.contactPerson, r.email, r.phone, r.address].join(" "); },
            columns: [
                ["Partner", function (r) { return "<b>" + esc(r.partnerName) + "</b><small>" + esc(r.partnerType || "") + (r.contactPerson ? " · " + esc(r.contactPerson) : "") + "</small>"; }],
                ["Contact", function (r) { return esc(r.email || "-") + "<small>" + esc(r.phone || "") + "</small>"; }],
                ["Contract", function (r) { var s = contractState(r); return (s === "NONE" ? "<small>No contract</small>" : badge(s, s === "VALID" ? "Valid" : label(s))) + (r.contractEnd ? "<small>until " + fmtDate(r.contractEnd) + "</small>" : ""); }],
                ["Rate", function (r) {
                    return (r.serviceRate != null ? money(r.serviceRate) + "<small>" + esc(r.rateUnit || "") + (r.rateVersion ? " · v" + r.rateVersion : "") + "</small>" : "-") +
                        (r.pendingRate != null ? '<small class="ad-pending">⏳ ' + money(r.pendingRate) + " awaiting approval</small>" : "");
                }],
                ["Performance", function (r, lk) {
                    var n = (lk.resources || []).filter(function (x) { return x.partner && x.partner.partnerId === r.partnerId; }).length;
                    return (r.rating ? '<span class="ad-stars">' + stars(Math.round(r.rating)) + "</span>" : "<small>Not rated</small>") + "<small>" + n + " resource" + (n === 1 ? "" : "s") + "</small>";
                }],
                ["Status", function (r) { return badge(r.status); }]
            ],
            fields: [
                {section: "Supplier record"},
                {k: "partnerName", l: "Partner name", req: true, max: 100, full: true},
                {k: "partnerType", l: "Type", type: "select", opts: ["Hotel", "Transport", "Guide", "Restaurant", "Activity", "Event Organizer", "Other"], req: true},
                {k: "status", l: "Status", type: "select", opts: ["ACTIVE", "PENDING", "INACTIVE"], req: true},
                {k: "contactPerson", l: "Contact person", max: 100},
                {k: "email", l: "Email", type: "email", req: true, max: 255},
                {k: "phone", l: "Phone", req: true, max: 20, pattern: "^\\+?[0-9 ]{9,20}$", hint: "e.g. 0771234567"},
                {k: "address", l: "Address", type: "textarea", full: true, max: 500},
                {section: "Contract & service rates"},
                {k: "contractStart", l: "Contract start", type: "date"},
                {k: "contractEnd", l: "Contract end", type: "date"},
                {k: "serviceRate", l: "Service rate (LKR)", type: "number", min: 0, step: "0.01", hint: "A change of more than 20% needs System Administrator approval"},
                {k: "rateUnit", l: "Rate unit", type: "select", opts: ["per night", "per day", "per trip", "per person", "per km"]},
                {section: "Performance"},
                {k: "rating", l: "Performance rating", type: "select", opts: ["5", "4", "3", "2", "1"], optLabel: function (x) { return stars(x) + "  (" + x + ")"; }, empty: "Not rated"},
                {k: "notes", l: "Notes", type: "textarea", full: true, max: 2000, hint: "Service quality, complaints, special terms..."}
            ],
            validate: function (v) { if (v.contractStart && v.contractEnd && v.contractEnd < v.contractStart) return ["contractEnd", "Contract end must be on or after the start."]; },
            toForm: function (r) { var o = Object.assign({}, r); o.rating = r.rating ? String(Math.round(r.rating)) : ""; return o; },
            toPayload: function (v) { var o = Object.assign({}, v); o.rating = v.rating ? Number(v.rating) : null; return o; },
            afterSave: function (saved, before) {
                if (saved && saved.pendingRate != null && (!before || before.pendingRate !== saved.pendingRate)) {
                    toast("Rate change of more than 20% sent to the System Administrator for approval");
                }
            },
            rowActions: [{act: "history", label: "History", run: function (r) { return openPartnerHistory(r); }}],
            kpis: function (l) {
                var c = function (s) { return l.filter(function (r) { return up(r.status) === s; }).length; };
                var rated = l.filter(function (r) { return r.rating; });
                return [["Total partners", l.length, "All records"], ["Active", c("ACTIVE"), "Working with us"],
                    ["Contracts expiring", l.filter(function (r) { return contractState(r) === "EXPIRING"; }).length, l.filter(function (r) { return r.pendingRate != null; }).length + " rate change(s) awaiting approval"],
                    ["Avg. rating", rated.length ? (rated.reduce(function (s, r) { return s + r.rating; }, 0) / rated.length).toFixed(1) + " / 5" : "-", "Supplier performance"]];
            }
        },

        // ===== 3. Resource Availability & Allocation Management =====
        resources: {
            api: "/api/resources", id: "resourceId", noun: "resource", title: "Resources",
            statuses: ["AVAILABLE", "BOOKED", "MAINTENANCE", "UNAVAILABLE"], statusKey: "availabilityStatus",
            needs: {partners: "/api/partners"},
            search: function (r) { return [r.resourceName, r.resourceType, r.location, r.notes, r.partner && r.partner.partnerName].join(" "); },
            columns: [
                ["Resource", function (r) { return "<b>" + esc(r.resourceName) + "</b><small>" + esc(r.location || "") + "</small>"; }],
                ["Type", function (r) { return esc(r.resourceType || "-") + (r.capacity ? "<small>" + r.capacity + " pax</small>" : ""); }],
                ["Partner", function (r) { return esc(r.partner ? r.partner.partnerName : "-"); }],
                ["Cost", function (r) { return money(r.cost); }],
                ["Availability", function (r) { return badge(r.availabilityStatus); }]
            ],
            fields: [
                {k: "resourceName", l: "Resource name", req: true, max: 100, full: true, hint: "e.g. Kandy Heritage Hotel – Deluxe room, Toyota KDH van (WP-1234), Guide Kasun"},
                {k: "resourceType", l: "Type", type: "select", opts: RES_TYPES, req: true},
                {k: "availabilityStatus", l: "Availability", type: "select", opts: ["AVAILABLE", "BOOKED", "MAINTENANCE", "UNAVAILABLE"], req: true},
                {k: "partnerId", l: "Partner / supplier", type: "select", from: "partners", optValue: "partnerId",
                    optLabel: function (p) { return p.partnerName + (up(p.status) !== "ACTIVE" ? " (" + up(p.status).toLowerCase() + ")" : ""); }, req: true, full: true, emptyHint: "Add a partner first (Partners page)."},
                {k: "location", l: "Location", max: 100},
                {k: "capacity", l: "Capacity (people)", type: "number", min: 1, max: 1000},
                {k: "cost", l: "Cost (LKR)", type: "number", min: 0, step: "0.01", req: true},
                {k: "notes", l: "Notes", type: "textarea", full: true, max: 1000, hint: "Languages, vehicle number, room type..."}
            ],
            toForm: function (r) { var o = Object.assign({}, r); o.partnerId = r.partner ? r.partner.partnerId : ""; return o; },
            toPayload: function (v) { var o = Object.assign({}, v); o.partner = v.partnerId ? {partnerId: Number(v.partnerId)} : null; delete o.partnerId; return o; },
            rowActions: [{act: "schedule", label: "Schedule", run: function (r) { return openSchedule(r); }}],
            headActions: [{label: "🔎 Check availability", cls: "btn-soft", run: function () { openAvailability(); return Promise.resolve(); }}],
            kpis: function (l) {
                var c = function (s) { return l.filter(function (r) { return up(r.availabilityStatus) === s; }).length; };
                return [["Total resources", l.length, "Hotels, vehicles, guides"], ["Available", c("AVAILABLE"), "Ready to assign"],
                    ["Booked", c("BOOKED"), "In use"], ["Maintenance", c("MAINTENANCE") + c("UNAVAILABLE"), "Not usable"]];
            }
        },

        // ===== 2. Smart Booking & Reservation Management =====
        bookings: {
            api: "/api/bookings", id: "bookingId", noun: "booking", title: "Bookings", readOnly: true, canDelete: true, viewLabel: "Manage",
            statuses: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"],
            sort: function (a, b) { return b.bookingId - a.bookingId; },
            search: function (r) { return [code("BK", r.bookingId), r.customer && r.customer.name, r.customer && r.customer.email, r.tourPackage && r.tourPackage.packageName, r.couponCode, r.travelerDetails].join(" "); },
            columns: [
                ["Booking", function (r) { return "<b>" + code("BK", r.bookingId) + "</b><small>Booked " + fmtDate(r.bookingDate) + "</small>"; }],
                ["Customer", function (r) { return esc(r.customer ? r.customer.name : "-") + "<small>" + esc(r.customer ? r.customer.email : "") + "</small>"; }],
                ["Package", function (r) { return esc(r.tourPackage ? r.tourPackage.packageName : "-"); }],
                ["Travel date", function (r) { return fmtDate(r.travelDate) + "<small>" + (r.numberOfPeople || "-") + " traveler" + (r.numberOfPeople === 1 ? "" : "s") + "</small>"; }],
                ["Total", function (r) { return money(r.totalAmount) + (r.couponCode ? "<small>" + esc(r.couponCode) + "</small>" : ""); }],
                ["Payment", function (r) { return badge(payStatus(r)); }],
                ["Status", function (r) { return badge(r.status); }]
            ],
            customView: function (r, reload) { return openBooking(r, reload); },
            kpis: function (l) {
                var c = function (s) { return l.filter(function (r) { return up(r.status) === s; }).length; };
                return [["Total bookings", l.length, "All time"], ["Pending", c("PENDING"), "Waiting for confirmation"],
                    ["Confirmed", c("CONFIRMED"), "Ready to travel"],
                    ["Upcoming 7 days", l.filter(function (r) { var t = todayIso(); return up(r.status) !== "CANCELLED" && r.travelDate >= t && r.travelDate <= addDays(t, 7); }).length, "Prepare transport & guides"]];
            },
            exportRows: function (l) { return l.map(function (r) { return {booking: code("BK", r.bookingId), customer: r.customer && r.customer.name, email: r.customer && r.customer.email, package: r.tourPackage && r.tourPackage.packageName, travel_date: r.travelDate, people: r.numberOfPeople, coupon: r.couponCode || "", discount: r.discountAmount || 0, total: r.totalAmount, payment: payStatus(r), status: r.status}; }); }
        },

        // ===== Supporting: Customer Profile / User Management =====
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
            rowActions: [{act: "toggle", label: function (r) { return up(r.status) === "ACTIVE" ? "Deactivate" : "Activate"; }, run: function (r, done) {
                var next = up(r.status) === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                var go = function () { return api("PUT", "/api/users/" + r.userId + "/status", {status: next}).then(function () { toast(r.name + " is now " + next.toLowerCase()); done(); }); };
                if (next === "INACTIVE") return confirmBox("Deactivate " + r.name + "? They won't be able to log in.", "Deactivate").then(function (ok) { if (ok) return go(); });
                return go();
            }}],
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

        // ===== Supporting: Payment Management =====
        payments: {
            api: "/api/bookings", id: "bookingId", noun: "payment", title: "Payments & refunds", readOnly: true, viewLabel: "Manage",
            statuses: ["PAID", "UNPAID", "REFUND_PENDING", "REFUNDED"], statusKey: "payStatus", statusLabel: label,
            prepare: function (l) {
                return l.map(function (b) { return Object.assign({}, b, {payStatus: payStatus(b)}); }).sort(function (a, b) { return b.bookingId - a.bookingId; });
            },
            search: function (r) { return [r.paymentReference, code("BK", r.bookingId), r.customer && r.customer.name, r.tourPackage && r.tourPackage.packageName, r.paymentMethod].join(" "); },
            columns: [
                ["Payment", function (r) { return "<b>" + esc(r.paymentReference || code("PAY", r.bookingId)) + "</b><small>" + esc(r.paymentMethod || "") + "</small>"; }],
                ["Booking", function (r) { return code("BK", r.bookingId) + "<small>" + label(r.status) + "</small>"; }],
                ["Customer", function (r) { return esc(r.customer ? r.customer.name : "-"); }],
                ["Amount", function (r) { return money(r.totalAmount) + (r.discountAmount ? "<small>−" + money(r.discountAmount) + " coupon</small>" : ""); }],
                ["Paid on", function (r) { return r.paidAt ? fmtDate(r.paidAt) : "-"; }],
                ["Status", function (r) { return badge(r.payStatus); }]
            ],
            customView: function (r, reload) { return openPayment(r, reload); },
            kpis: function (l) {
                var sum = function (s) { return l.filter(function (r) { return r.payStatus === s; }).reduce(function (a, r) { return a + (r.totalAmount || 0); }, 0); };
                return [["Received", short(sum("PAID")), "Paid bookings"], ["Awaiting", short(l.filter(function (r) { return r.payStatus === "UNPAID" && up(r.status) !== "CANCELLED"; }).reduce(function (a, r) { return a + (r.totalAmount || 0); }, 0)), "Unpaid active bookings"],
                    ["Refunds to process", l.filter(function (r) { return r.payStatus === "REFUND_PENDING"; }).length, short(sum("REFUND_PENDING"))],
                    ["Refunded", short(sum("REFUNDED")), "Returned to customers"]];
            },
            exportRows: function (l) { return l.map(function (r) { return {reference: r.paymentReference || "", booking: code("BK", r.bookingId), customer: r.customer && r.customer.name, package: r.tourPackage && r.tourPackage.packageName, amount: r.totalAmount, method: r.paymentMethod || "", paid_at: r.paidAt || "", status: r.payStatus}; }); }
        },

        // ===== Supporting: Feedback Collection =====
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
                return [["Reviews", l.length, "All time"], ["Average rating", avg + " / 5", "Customer satisfaction"],
                    ["5-star reviews", l.filter(function (r) { return String(r.rating) === "5"; }).length, "Happy travelers"],
                    ["Low ratings (1-2)", l.filter(function (r) { return parseInt(r.rating, 10) <= 2; }).length, "Follow up"]];
            },
            exportRows: function (l) { return l.map(function (r) { return {customer: r.customer && r.customer.name, email: r.customer && r.customer.email, trip: r.booking && r.booking.tourPackage && r.booking.tourPackage.packageName, rating: r.rating, review: r.comment, date: r.feedbackDate}; }); }
        }
    };

    // ---------- printable documents (itinerary / receipt) ----------
    function printDoc(title, html) {
        var w = window.open("", "_blank");
        if (!w) { toast("Allow pop-ups to print", true); return; }
        w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + "</title><style>" +
            "body{font-family:Segoe UI,Arial,sans-serif;color:#2b2b2b;max-width:760px;margin:30px auto;padding:0 20px}h1{font-family:Georgia,serif;color:#6b4429;margin:0}" +
            "h2{font-family:Georgia,serif;color:#2e7032;font-size:17px;margin:26px 0 8px;border-bottom:1px solid #e6dccf;padding-bottom:6px}" +
            "table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:7px 8px;border-bottom:1px solid #eee;text-align:left;vertical-align:top}" +
            ".muted{color:#777;font-size:12px}.day{display:grid;grid-template-columns:110px 1fr;gap:10px;padding:8px 0;border-bottom:1px dashed #e6dccf;font-size:13px}" +
            ".brand{display:flex;justify-content:space-between;align-items:end;border-bottom:3px solid #2e7032;padding-bottom:10px}" +
            "@media print{button{display:none}}</style></head><body>" + html +
            '<p style="margin-top:30px"><button onclick="window.print()">Print</button></p></body></html>');
        w.document.close();
        setTimeout(function () { try { w.print(); } catch (e) { /* ignore */ } }, 400);
    }

    function itineraryHtml(it) {
        var trav = lines(it.travelerDetails).map(function (l) { var p = l.split("|"); return "<tr><td>" + esc((p[0] || "").trim()) + "</td><td>" + esc((p[1] || "").trim() || "-") + "</td><td>" + esc((p[2] || "").trim() || "-") + "</td></tr>"; }).join("");
        var res = (it.resources || []).map(function (r) {
            return "<tr><td>" + esc(r.type || "") + "</td><td><b>" + esc(r.name) + "</b>" + (r.location ? '<div class="muted">' + esc(r.location) + "</div>" : "") + "</td><td>" + esc(r.partner || "-") + (r.phone ? '<div class="muted">' + esc(r.phone) + "</div>" : "") + "</td><td>" + esc(r.note || "") + "</td></tr>";
        }).join("");
        return '<div class="brand"><div><h1>Explore Lanka</h1><div class="muted">Travel itinerary</div></div><div class="muted">' + code("BK", it.bookingId) + "<br>" + esc(label(it.status)) + "</div></div>" +
            "<h2>" + esc(it.packageName || "Tour") + "</h2><p>" + esc(it.destinations || "") + "</p>" +
            "<table><tr><td><b>Traveler</b></td><td>" + esc(it.customerName || "-") + "</td><td><b>Dates</b></td><td>" + fmtDate(it.travelDate) + " – " + fmtDate(it.endDate) + "</td></tr>" +
            "<tr><td><b>Travelers</b></td><td>" + esc(it.numberOfPeople) + "</td><td><b>Pickup</b></td><td>" + esc(it.pickupLocation || "To be confirmed") + "</td></tr></table>" +
            "<h2>Day by day</h2>" + (it.days || []).map(function (d) { return '<div class="day"><b>Day ' + d.day + '<div class="muted">' + fmtDate(d.date) + "</div></b><span>" + esc(d.plan) + "</span></div>"; }).join("") +
            (res ? "<h2>Your hotels, transport & guides</h2><table><tr><th>Type</th><th>Resource</th><th>Provider</th><th>Note</th></tr>" + res + "</table>" : "") +
            (trav ? "<h2>Travelers</h2><table><tr><th>Name</th><th>NIC / Passport</th><th>Age</th></tr>" + trav + "</table>" : "") +
            (it.inclusions ? "<h2>Included</h2><ul>" + lines(it.inclusions).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
            (it.customPlan ? "<h2>Your customization request</h2><p>" + esc(it.customPlan) + "</p>" : "") +
            (it.specialRequests ? "<h2>Special requests</h2><p>" + esc(it.specialRequests) + "</p>" : "");
    }
    function printItinerary(bookingId) {
        return api("GET", "/api/bookings/" + bookingId + "/itinerary").then(function (it) { printDoc("Itinerary " + code("BK", bookingId), itineraryHtml(it)); })
            .catch(function (e) { toast(e.message, true); });
    }
    function printReceipt(b) {
        printDoc("Receipt " + (b.paymentReference || ""), '<div class="brand"><div><h1>Explore Lanka</h1><div class="muted">Payment receipt</div></div><div class="muted">' + esc(b.paymentReference || code("PAY", b.bookingId)) + "</div></div>" +
            "<h2>Booking " + code("BK", b.bookingId) + "</h2><table>" +
            [["Customer", b.customer ? b.customer.name : "-"], ["Package", b.tourPackage ? b.tourPackage.packageName : "-"], ["Travel date", fmtDate(b.travelDate)],
                ["Travelers", b.numberOfPeople], ["Coupon", b.couponCode || "-"], ["Discount", b.discountAmount ? money(b.discountAmount) : "-"],
                ["Amount paid", money(b.totalAmount)], ["Method", b.paymentMethod || "-"], ["Paid on", b.paidAt ? fmtDate(b.paidAt) : "-"], ["Status", label(payStatus(b))]]
                .map(function (p) { return "<tr><td><b>" + esc(p[0]) + "</b></td><td>" + esc(p[1]) + "</td></tr>"; }).join("") + "</table>");
    }

    // ---------- booking management modal (confirm, modify, travelers, resources, itinerary) ----------
    function openBooking(rec, reload) {
        var b = rec;
        function refresh() {
            return api("GET", "/api/bookings/" + b.bookingId).then(function (fresh) { b = fresh; reload(); return render(); });
        }
        function render() {
            var canAssign = can("resources");
            var end = b.travelDate && b.tourPackage && b.tourPackage.durationDays ? addDays(b.travelDate, b.tourPackage.durationDays - 1) : b.travelDate;
            var jobs = [tryList("/api/bookings/" + b.bookingId + "/resources")];
            if (canAssign && b.travelDate && ["PENDING", "CONFIRMED"].indexOf(up(b.status)) > -1) jobs.push(tryList("/api/resources/available?from=" + b.travelDate + "&to=" + end));
            return Promise.all(jobs).then(function (r) {
                var assigned = r[0], free = r[1] || null, st = up(b.status), open = st === "PENDING" || st === "CONFIRMED";
                var trav = travelersOf(b);
                var sub = (b.totalAmount || 0) + (b.discountAmount || 0);
                var html = dl([["Booking", code("BK", b.bookingId)], ["Booked on", fmtDate(b.bookingDate)],
                        ["Customer", b.customer ? b.customer.name : "-"], ["Email / phone", (b.customer ? b.customer.email : "-") + (b.customer && b.customer.phone ? " · " + b.customer.phone : "")],
                        ["Package", b.tourPackage ? b.tourPackage.packageName : "-"], ["Trip dates", fmtDate(b.travelDate) + (end && end !== b.travelDate ? " – " + fmtDate(end) : "")],
                        ["Subtotal", money(sub)], ["Coupon", b.couponCode ? b.couponCode + " (−" + money(b.discountAmount) + ")" : "None"],
                        ["Total", money(b.totalAmount)], ["Payment", label(payStatus(b)) + (b.paymentReference ? " · " + b.paymentReference : "")],
                        ["Pickup", b.pickupLocation || "Not specified"], ["Special requests", b.specialRequests || "None"]]) +
                    (b.customPlan ? '<div class="ad-subhead">Customization request</div><div class="ad-quote">' + esc(b.customPlan) + "</div>" : "") +
                    '<div class="ad-subhead">Travelers (' + (b.numberOfPeople || 0) + ")</div>" +
                    (trav.length ? '<div class="table-wrap ad-mini"><table><thead><tr><th>Name</th><th>NIC / Passport</th><th>Age</th></tr></thead><tbody>' +
                        trav.map(function (t) { return "<tr><td>" + esc(t.name) + "</td><td>" + esc(t.id || "-") + "</td><td>" + esc(t.age || "-") + "</td></tr>"; }).join("") + "</tbody></table></div>"
                        : '<p class="ad-note">No traveler details recorded.</p>') +
                    '<div class="ad-subhead">Status</div><div class="ad-inline"><select id="bkStatus">' +
                    ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(function (s) { return '<option value="' + s + '"' + (st === s ? " selected" : "") + ">" + label(s) + "</option>"; }).join("") +
                    '</select><button type="button" class="btn btn-primary" data-bk="status"' + (st === "CANCELLED" ? " disabled" : "") + '>Save status</button></div>' +
                    (st === "CANCELLED" ? '<p class="ad-note">Cancelled bookings can\'t be reopened.</p>' : "") +
                    '<div class="ad-subhead">Assigned hotels, vehicles & guides</div>' +
                    (assigned.length ? '<div class="ad-assign-list">' + assigned.map(function (a) {
                        return '<div class="ad-assign"><div><b>' + esc(a.resource.resourceName) + "</b><small>" + esc(a.resource.resourceType || "") + (a.resource.partner ? " · " + esc(a.resource.partner.partnerName) : "") +
                            " · " + fmtDate(a.startDate) + " – " + fmtDate(a.endDate) + (a.note ? " · " + esc(a.note) : "") + "</small></div>" +
                            (canAssign && open ? '<button type="button" class="table-action danger" data-unassign="' + a.assignmentId + '">Remove</button>' : "") + "</div>";
                    }).join("") + "</div>" : '<p class="ad-note">Nothing assigned yet.</p>') +
                    (free ? '<div class="ad-inline ad-assign-form"><select id="bkRes"><option value="">Choose a free resource for these dates…</option>' +
                        RES_TYPES.map(function (t) {
                            var g = free.filter(function (x) { return (x.resourceType || "Other") === t; });
                            return g.length ? '<optgroup label="' + esc(t) + '">' + g.map(function (x) { return '<option value="' + x.resourceId + '">' + esc(x.resourceName + (x.location ? " – " + x.location : "") + (x.capacity ? " (" + x.capacity + " pax)" : "")) + "</option>"; }).join("") + "</optgroup>" : "";
                        }).join("") + '</select><input id="bkResNote" maxlength="200" placeholder="Note (optional)"><button type="button" class="btn btn-soft" data-bk="assign">Assign</button></div>' +
                        (free.length ? "" : '<p class="ad-note">No free resources for these dates.</p>') : "") +
                    (open ? '<details class="ad-edit"><summary>✎ Modify trip details</summary><div class="form-grid">' +
                        '<div class="field"><label for="bkDate">Travel date</label><input type="date" id="bkDate" value="' + esc(b.travelDate || "") + '"></div>' +
                        '<div class="field"><label for="bkPeople">Travelers</label><input type="number" id="bkPeople" min="1" max="50" value="' + esc(b.numberOfPeople || 1) + '"></div>' +
                        '<div class="field full"><label for="bkTrav">Travelers (one per line: Name | NIC / Passport | Age)</label><textarea id="bkTrav" rows="3">' + esc(b.travelerDetails || "") + "</textarea></div>" +
                        '<div class="field full"><label for="bkPickup">Pickup location</label><input id="bkPickup" maxlength="150" value="' + esc(b.pickupLocation || "") + '"></div>' +
                        '<div class="field full"><label for="bkReq">Special requests</label><textarea id="bkReq" maxlength="1000">' + esc(b.specialRequests || "") + "</textarea></div>" +
                        '<div class="field full"><button type="button" class="btn btn-primary" data-bk="save">Save changes</button></div></div></details>' : "");

                var m = openModal("Booking " + code("BK", b.bookingId), '<div class="ad-err field full" hidden></div>' + html,
                    '<button type="button" class="btn btn-soft" data-cancel>Close</button><button type="button" class="btn btn-gold" data-bk="print">🖨 Itinerary</button>');
                var err = $(".ad-err", m);
                function fail(e) { err.textContent = e.message; err.hidden = false; m.querySelector(".ad-modal-body").scrollTop = 0; }
                function busy(btn, p) { btn.disabled = true; return p.catch(fail).then(function () { btn.disabled = false; }); }
                $("[data-cancel]", m).onclick = closeModal;
                $$("[data-unassign]", m).forEach(function (btn) {
                    btn.onclick = function () { busy(btn, api("DELETE", "/api/bookings/" + b.bookingId + "/resources/" + btn.dataset.unassign).then(function () { toast("Resource removed"); return refresh(); })); };
                });
                $$("[data-bk]", m).forEach(function (btn) {
                    btn.onclick = function () {
                        var act = btn.dataset.bk;
                        if (act === "print") return printItinerary(b.bookingId);
                        if (act === "status") {
                            var s = $("#bkStatus", m).value;
                            if (s === st) return;
                            var go = function () { return busy(btn, api("PUT", "/api/bookings/" + b.bookingId + "/status", {status: s}).then(function () { toast(code("BK", b.bookingId) + " is now " + s.toLowerCase()); return refresh(); })); };
                            if (s === "CANCELLED") return confirmBox("Cancel booking " + code("BK", b.bookingId) + "? Assigned resources will be released" + (payStatus(b) === "PAID" ? " and a refund will be marked as pending." : "."), "Cancel booking").then(function (ok) { if (ok) go(); else render(); });
                            return go();
                        }
                        if (act === "assign") {
                            var rid = $("#bkRes", m).value;
                            if (!rid) { fail(new Error("Choose a resource to assign.")); return; }
                            return busy(btn, api("POST", "/api/bookings/" + b.bookingId + "/resources", {resourceId: Number(rid), note: $("#bkResNote", m).value}).then(function () { toast("Resource assigned"); return refresh(); }));
                        }
                        if (act === "save") {
                            var body = {travelDate: $("#bkDate", m).value || null, numberOfPeople: Number($("#bkPeople", m).value) || null,
                                travelerDetails: $("#bkTrav", m).value, pickupLocation: $("#bkPickup", m).value, specialRequests: $("#bkReq", m).value};
                            return busy(btn, api("PUT", "/api/bookings/" + b.bookingId + "/details", body).then(function () { toast("Booking updated"); return refresh(); }));
                        }
                    };
                });
            });
        }
        return render();
    }

    // ---------- payment modal ----------
    function openPayment(rec, reload) {
        var b = rec, ps = payStatus(b);
        var acts = [];
        if (ps === "UNPAID" && up(b.status) !== "CANCELLED") acts.push(["PAID", "Mark as paid (cash / office)"]);
        if (ps === "PAID" && up(b.status) === "CANCELLED") acts.push(["REFUND_PENDING", "Mark refund pending"]);
        if (ps === "REFUND_PENDING") acts.push(["REFUNDED", "Mark as refunded"]);
        var m = openModal("Payment " + (b.paymentReference || code("PAY", b.bookingId)),
            '<div class="ad-err field full" hidden></div>' +
            dl([["Booking", code("BK", b.bookingId) + " · " + label(b.status)], ["Customer", b.customer ? b.customer.name : "-"],
                ["Package", b.tourPackage ? b.tourPackage.packageName : "-"], ["Travel date", fmtDate(b.travelDate)],
                ["Subtotal", money((b.totalAmount || 0) + (b.discountAmount || 0))], ["Discount", b.discountAmount ? money(b.discountAmount) + " (" + (b.couponCode || "") + ")" : "-"],
                ["Amount", money(b.totalAmount)], ["Status", label(ps)], ["Method", b.paymentMethod || "-"], ["Paid on", b.paidAt ? fmtDate(b.paidAt) : "-"]]) +
            '<p class="ad-note">Customers pay online after a booking is confirmed. Cancelling a paid booking marks the refund as pending.</p>',
            '<button type="button" class="btn btn-soft" data-cancel>Close</button>' +
            (ps === "PAID" || ps === "REFUNDED" ? '<button type="button" class="btn btn-soft" data-receipt>🧾 Receipt</button>' : "") +
            acts.map(function (a) { return '<button type="button" class="btn btn-primary" data-pay="' + a[0] + '">' + esc(a[1]) + "</button>"; }).join(""));
        $("[data-cancel]", m).onclick = closeModal;
        var rc = $("[data-receipt]", m); if (rc) rc.onclick = function () { printReceipt(b); };
        $$("[data-pay]", m).forEach(function (btn) {
            btn.onclick = function () {
                btn.disabled = true;
                api("PUT", "/api/bookings/" + b.bookingId + "/payment-status", {paymentStatus: btn.dataset.pay}).then(function () {
                    closeModal(); toast("Payment updated: " + label(btn.dataset.pay)); reload();
                }).catch(function (e) { var er = $(".ad-err", m); er.textContent = e.message; er.hidden = false; btn.disabled = false; });
            };
        });
        return Promise.resolve();
    }

    // ---------- resource schedule & availability ----------
    function openSchedule(r) {
        return getList("/api/resources/" + r.resourceId + "/schedule").then(function (list) {
            var t = todayIso();
            var m = openModal("Schedule – " + r.resourceName,
                dl([["Type", r.resourceType || "-"], ["Partner", r.partner ? r.partner.partnerName : "-"], ["Location", r.location || "-"], ["Status", label(r.availabilityStatus)]]) +
                (list.length ? '<div class="table-wrap ad-mini"><table><thead><tr><th>Dates</th><th>Booking</th><th>Customer</th><th></th></tr></thead><tbody>' +
                    list.map(function (a) {
                        var past = a.endDate < t;
                        return "<tr" + (past ? ' class="ad-past"' : "") + "><td>" + fmtDate(a.startDate) + " – " + fmtDate(a.endDate) + "</td><td>" + code("BK", a.booking.bookingId) +
                            "<small>" + esc(a.booking.tourPackage ? a.booking.tourPackage.packageName : "") + "</small></td><td>" + esc(a.booking.customer ? a.booking.customer.name : "-") + "</td><td>" + (past ? "<small>Past</small>" : badge("BOOKED", "Booked")) + "</td></tr>";
                    }).join("") + "</tbody></table></div>" : '<p class="ad-note">Not assigned to any booking yet - free on all dates.</p>'),
                '<button type="button" class="btn btn-soft" data-cancel>Close</button>');
            $("[data-cancel]", m).onclick = closeModal;
        });
    }
    function openAvailability() {
        var t = addDays(todayIso(), 1);
        var m = openModal("Check resource availability",
            '<div class="form-grid"><div class="field"><label for="avFrom">From</label><input type="date" id="avFrom" value="' + t + '"></div>' +
            '<div class="field"><label for="avTo">To</label><input type="date" id="avTo" value="' + addDays(t, 2) + '"></div>' +
            '<div class="field full"><label for="avType">Type</label><select id="avType"><option value="">All types</option>' + RES_TYPES.map(function (x) { return "<option>" + x + "</option>"; }).join("") + "</select></div></div>" +
            '<div id="avOut" class="ad-av-out"></div>',
            '<button type="button" class="btn btn-soft" data-cancel>Close</button><button type="button" class="btn btn-primary" data-go>Check</button>');
        $("[data-cancel]", m).onclick = closeModal;
        $("[data-go]", m).onclick = function () {
            var out = $("#avOut", m), f = $("#avFrom", m).value, to = $("#avTo", m).value;
            if (!f || !to || to < f) { out.innerHTML = '<p class="ad-err">Choose a valid date range.</p>'; return; }
            out.innerHTML = '<p class="ad-note">Checking…</p>';
            getList("/api/resources/available?from=" + f + "&to=" + to + "&type=" + encodeURIComponent($("#avType", m).value)).then(function (list) {
                out.innerHTML = '<p class="ad-note"><b>' + list.length + "</b> free resource" + (list.length === 1 ? "" : "s") + " from " + fmtDate(f) + " to " + fmtDate(to) + "</p>" +
                    (list.length ? '<div class="table-wrap ad-mini"><table><tbody>' + list.map(function (x) { return "<tr><td><b>" + esc(x.resourceName) + "</b><small>" + esc(x.location || "") + "</small></td><td>" + esc(x.resourceType || "") + "</td><td>" + esc(x.partner ? x.partner.partnerName : "") + "</td><td>" + money(x.cost) + "</td></tr>"; }).join("") + "</tbody></table></div>" : "");
            }).catch(function (e) { out.innerHTML = '<p class="ad-err">' + esc(e.message) + "</p>"; });
        };
    }

    // ---------- event registrations (monitor registrations) ----------
    function openRegistrations(ev) {
        return getList("/api/events/" + ev.eventId + "/registrations").then(function (list) {
            var total = list.reduce(function (s, r) { return s + (r.people || 0); }, 0);
            var m = openModal("Registrations – " + ev.eventName,
                dl([["Date", fmtDate(ev.eventDate) + (ev.endDate ? " – " + fmtDate(ev.endDate) : "")], ["Location", ev.location || "-"],
                    ["Registered", total + (ev.maxParticipants ? " of " + ev.maxParticipants + " places" : " people (no limit)")]]) +
                (ev.maxParticipants ? '<div class="kpi-line ad-cap"><span style="width:' + Math.min(100, Math.round(total / ev.maxParticipants * 100)) + '%"></span></div>' : "") +
                (list.length ? '<div class="table-wrap ad-mini"><table><thead><tr><th>Customer</th><th>Contact</th><th>People</th><th>Registered</th></tr></thead><tbody>' +
                    list.map(function (r) { return "<tr><td><b>" + esc(r.customer ? r.customer.name : "-") + "</b></td><td>" + esc(r.customer ? r.customer.email : "") + "<small>" + esc(r.customer && r.customer.phone || "") + "</small></td><td>" + (r.people || 1) + "</td><td>" + fmtDate(r.createdAt) + "</td></tr>"; }).join("") +
                    "</tbody></table></div>" : '<p class="ad-note">No registrations yet.</p>'),
                '<button type="button" class="btn btn-soft" data-cancel>Close</button>' + (list.length ? '<button type="button" class="btn btn-soft" data-csv>⤓ Export CSV</button>' : ""));
            $("[data-cancel]", m).onclick = closeModal;
            var x = $("[data-csv]", m);
            if (x) x.onclick = function () { csv("registrations-" + ev.eventId, list.map(function (r) { return {customer: r.customer && r.customer.name, email: r.customer && r.customer.email, phone: r.customer && r.customer.phone, people: r.people, registered: r.createdAt}; })); };
        });
    }

    // ---------- partner rate & contract history (versions) ----------
    function changeRow(c) {
        var rate = c.changeType === "CONTRACT" ? "-" : (c.oldRate != null ? money(c.oldRate) + " → " : "") + money(c.newRate) + (c.changePercent != null ? "<small>" + (c.changePercent > 0 ? "+" : "") + c.changePercent + "%</small>" : "");
        return "<tr><td>" + (c.version ? "v" + c.version : "-") + "</td><td>" + label(c.changeType) + "</td><td>" + rate + "</td><td>" +
            (c.contractStart || c.contractEnd ? fmtDate(c.contractStart) + " – " + fmtDate(c.contractEnd) : "-") + "</td><td>" + badge(c.status === "APPLIED" ? "ACTIVE" : c.status === "APPROVED" ? "CONFIRMED" : c.status === "REJECTED" ? "CANCELLED" : "PENDING", label(c.status)) +
            "<small>" + esc(c.requestedBy || "") + (c.decidedBy ? " · by " + esc(c.decidedBy) : "") + "</small>" + (c.note ? "<small>" + esc(c.note) + "</small>" : "") + "</td><td>" + fmtDate(c.createdAt) + "</td></tr>";
    }
    function openPartnerHistory(p) {
        return getList("/api/partners/" + p.partnerId + "/history").then(function (list) {
            var m = openModal("Rate & contract history – " + p.partnerName,
                dl([["Current rate", p.serviceRate != null ? money(p.serviceRate) + " " + (p.rateUnit || "") : "-"], ["Version", p.rateVersion ? "v" + p.rateVersion : "-"],
                    ["Contract", p.contractEnd ? fmtDate(p.contractStart) + " – " + fmtDate(p.contractEnd) : "No contract dates"],
                    ["Awaiting approval", p.pendingRate != null ? money(p.pendingRate) : "None"]]) +
                (list.length ? '<div class="table-wrap ad-mini"><table><thead><tr><th>Ver.</th><th>Change</th><th>Rate</th><th>Contract</th><th>Status</th><th>Date</th></tr></thead><tbody>' + list.map(changeRow).join("") + "</tbody></table></div>"
                    : '<p class="ad-note">No changes recorded yet.</p>') +
                '<p class="ad-note">Rate changes of more than 20% wait for System Administrator approval before they become active.</p>',
                '<button type="button" class="btn btn-soft" data-cancel>Close</button>');
            $("[data-cancel]", m).onclick = closeModal;
        });
    }

    // ---------- generic module page ----------
    function runModule(host, key) {
        var M = MODULES[key], all = [], lookups = {}, page = 1, PER = 10;
        if (!M) return;
        var sKey = M.statusKey || "status";
        var canAdd = !M.readOnly;

        host.innerHTML =
            '<div class="grid grid-4 admin-kpis" data-kpis></div>' +
            '<div class="section-head"><div><h3>' + esc(M.title) + '</h3><p data-count>Loading...</p></div><div class="ad-head-actions">' +
            (M.headActions || []).map(function (a, i) { return '<button class="btn ' + (a.cls || "btn-soft") + '" type="button" data-head="' + i + '">' + esc(a.label) + "</button>"; }).join("") +
            (M.exportRows ? '<button class="btn btn-soft" type="button" data-export>⤓ Export CSV</button>' : "") +
            (canAdd ? '<button class="btn btn-primary" type="button" data-add>＋ Add ' + esc(M.noun) + "</button>" : "") + "</div></div>" +
            '<div class="admin-toolbar"><div class="search"><input data-q aria-label="Search ' + esc(M.title) + '" placeholder="Search ' + esc(M.title.toLowerCase()) + '...">' +
            '<select data-st aria-label="Filter by status"><option value="">All ' + (M.statusKey === "rating" ? "ratings" : "statuses") + "</option>" +
            M.statuses.map(function (s) { return '<option value="' + s + '">' + esc(M.statusLabel ? M.statusLabel(s) : label(s)) + "</option>"; }).join("") +
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
                    var hasView = M.view || M.customView;
                    return '<tr data-id="' + esc(r[M.id]) + '">' + M.columns.map(function (c) { return "<td>" + c[1](r, lookups) + "</td>"; }).join("") +
                        '<td><div class="ad-actions">' +
                        (canAdd ? '<button class="table-action" data-act="edit">Edit</button>' : "") +
                        (hasView ? '<button class="table-action" data-act="view">' + esc(M.viewLabel || "View") + "</button>" : "") +
                        (M.rowActions || []).map(function (a) {
                            if (a.show && !a.show(r)) return "";
                            return '<button class="table-action" data-act="' + a.act + '">' + esc(typeof a.label === "function" ? a.label(r) : a.label) + "</button>";
                        }).join("") +
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
            var jobs = [getList(M.api)].concat(Object.keys(needs).map(function (k) { return tryList(needs[k]).then(function (l) { lookups[k] = l; }); }));
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

        // ----- form fields -----
        function fieldHtml(f, val) {
            if (f.section) return '<div class="ad-section full">' + esc(f.section) + "</div>";
            var id = "f_" + f.k, v = val == null ? "" : val;
            var attrs = ' id="' + id + '" name="' + f.k + '"' + (f.req ? " required" : "") + (f.max && f.type !== "number" ? ' maxlength="' + f.max + '"' : "");
            var input;
            if (f.type === "select") {
                var opts = f.from ? (lookups[f.from] || []).map(function (p) { return [p[f.optValue], f.optLabel(p)]; })
                    : f.opts.map(function (o) { return [o, f.optLabel ? f.optLabel(o) : o]; });
                input = "<select" + attrs + '><option value="">' + esc(f.empty || "Select...") + "</option>" + opts.map(function (o) {
                    return '<option value="' + esc(o[0]) + '"' + (String(o[0]).toUpperCase() === String(v).toUpperCase() ? " selected" : "") + ">" + esc(o[1]) + "</option>";
                }).join("") + "</select>";
                if (f.from && !opts.length && f.emptyHint) input += '<span class="hint bad">' + esc(f.emptyHint) + "</span>";
            } else if (f.type === "textarea") {
                input = "<textarea" + attrs + (f.rows ? ' rows="' + f.rows + '"' : "") + ">" + esc(v) + "</textarea>";
            } else if (f.type === "checkbox") {
                input = '<label class="ad-check"><input type="checkbox" id="' + id + '" name="' + f.k + '"' + (v === true || v === "true" ? " checked" : "") + "><span>" + esc(f.text || f.l) + "</span></label>";
            } else if (f.type === "dates") {
                var ds = String(v || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean);
                input = '<input type="hidden" id="' + id + '" name="' + f.k + '" value="' + esc(ds.join(",")) + '">' +
                    '<div class="ad-dates" data-dates="' + f.k + '"><div class="ad-chips"></div><div class="ad-inline"><input type="date" class="ad-date-in" min="' + addDays(todayIso(), 1) + '"><button type="button" class="btn btn-soft" data-add-date>＋ Add date</button></div></div>';
            } else if (f.type === "image") {
                input = '<input type="hidden" id="' + id + '" name="' + f.k + '" value="' + esc(v) + '">' +
                    '<div class="ad-img' + (v ? " has-img" : "") + '" data-img="' + f.k + '">' +
                    '<label class="ad-img-drop" for="' + id + '_file" tabindex="0">' +
                    '<img class="ad-img-preview" alt="Image preview"' + (v ? ' src="' + esc(v) + '"' : "") + ">" +
                    '<span class="ad-img-empty"><i>⇪</i><b>Drag & drop an image here</b><small>or <u>browse your computer</u> · you can also paste with Ctrl+V</small><small>The image customers see on the ' + esc(f.what || "item") + " card</small></span>" +
                    '<span class="ad-img-busy">Uploading...</span></label>' +
                    '<input type="file" id="' + id + '_file" accept="image/jpeg,image/png,image/webp,image/gif" hidden>' +
                    '<div class="ad-img-actions"><button type="button" class="btn btn-soft" data-img-change>Change image</button>' +
                    '<button type="button" class="btn btn-soft ad-img-remove" data-img-remove>Remove</button></div></div>';
            } else {
                input = '<input type="' + (f.type || "text") + '"' + attrs + ' value="' + esc(v) + '"' +
                    (f.min != null ? ' min="' + f.min + '"' : "") + (f.max && f.type === "number" ? ' max="' + f.max + '"' : "") + (f.step ? ' step="' + f.step + '"' : "") + ">";
            }
            return '<div class="field' + (f.full ? " full" : "") + '" data-field="' + f.k + '"><label for="' + id + '">' + esc(f.l) + (f.req ? " *" : "") + "</label>" + input +
                (f.hint ? '<span class="hint">' + esc(f.hint) + "</span>" : "") + "</div>";
        }

        function bindDates(box) {
            var hidden = $("#f_" + box.dataset.dates), chips = $(".ad-chips", box), inp = $(".ad-date-in", box);
            function list() { return hidden.value ? hidden.value.split(",").filter(Boolean) : []; }
            function draw() {
                var l = list();
                chips.innerHTML = l.length ? l.map(function (d) { return '<span class="ad-chip">' + fmtDate(d) + '<button type="button" data-rm="' + d + '" aria-label="Remove">×</button></span>'; }).join("")
                    : '<span class="ad-note">No fixed dates - flexible package</span>';
            }
            $("[data-add-date]", box).onclick = function () {
                if (!inp.value) return;
                var l = list(); if (l.indexOf(inp.value) < 0) l.push(inp.value);
                l.sort(); hidden.value = l.join(","); inp.value = ""; draw();
            };
            chips.addEventListener("click", function (e) {
                var b = e.target.closest("[data-rm]"); if (!b) return;
                hidden.value = list().filter(function (d) { return d !== b.dataset.rm; }).join(","); draw();
            });
            draw();
        }

        function currentValues(form) {
            var v = {};
            M.fields.forEach(function (f) {
                if (f.section) return;
                var el = $("#f_" + f.k, form); if (!el) return;
                v[f.k] = f.type === "checkbox" ? el.checked : el.value;
            });
            return v;
        }
        function applyShowIf(form) {
            var v = currentValues(form);
            M.fields.forEach(function (f) {
                if (!f.showIf) return;
                var wrap = $('[data-field="' + f.k + '"]', form);
                if (wrap) wrap.hidden = !f.showIf(v);
            });
        }

        function openForm(rec) {
            var data = rec ? (M.toForm ? M.toForm(rec) : rec) : {};
            var m = openModal((rec ? "Edit " : "Add ") + M.noun,
                '<form class="form-grid ad-form" novalidate><div class="ad-err field full" hidden></div>' + M.fields.map(function (f) { return fieldHtml(f, f.section ? null : data[f.k]); }).join("") + "</form>",
                '<button type="button" class="btn btn-soft" data-cancel>Cancel</button><button type="button" class="btn btn-primary" data-save>' + (rec ? "Save changes" : "Create " + M.noun) + "</button>");
            var form = $("form", m), err = $(".ad-err", m), save = $("[data-save]", m);
            $("[data-cancel]", m).onclick = closeModal;
            $$("[data-img]", form).forEach(function (box) { bindImageField(box, M.uploadApi, err, save); });
            $$("[data-dates]", form).forEach(bindDates);
            applyShowIf(form);
            form.addEventListener("input", function (e) { e.target.classList.remove("invalid"); err.hidden = true; });
            form.addEventListener("change", function () { applyShowIf(form); });
            form.addEventListener("submit", function (e) { e.preventDefault(); save.click(); });
            save.onclick = function () {
                if (form.querySelector(".ad-img.busy")) { err.textContent = "Please wait until the image finishes uploading."; err.hidden = false; return; }
                var v = {}, bad = [], cur = currentValues(form);
                M.fields.forEach(function (f) {
                    if (f.section) return;
                    var el = $("#f_" + f.k, form);
                    if (f.showIf && !f.showIf(cur)) { v[f.k] = null; return; }
                    if (f.type === "checkbox") { v[f.k] = el.checked; return; }
                    var raw = el.value.trim();
                    if (f.upper) raw = raw.toUpperCase();
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
                if (!bad.length && M.validate) { var x = M.validate(v); if (x) { bad.push(x[1]); var bx = $("#f_" + x[0], form); if (bx) bx.classList.add("invalid"); } }
                if (bad.length) { err.textContent = bad.join(" "); err.hidden = false; m.querySelector(".ad-modal-body").scrollTop = 0; return; }
                var payload = M.toPayload ? M.toPayload(v) : v;
                save.disabled = true; save.textContent = "Saving...";
                api(rec ? "PUT" : "POST", M.api + (rec ? "/" + rec[M.id] : ""), payload).then(function (saved) {
                    closeModal();
                    toast(rec ? "Changes saved" : "New " + M.noun + " created");
                    if (M.afterSave) setTimeout(function () { M.afterSave(saved, rec); }, 400);
                    load();
                }).catch(function (e) {
                    err.textContent = e.message; err.hidden = false; m.querySelector(".ad-modal-body").scrollTop = 0;
                    save.disabled = false; save.textContent = rec ? "Save changes" : "Create " + M.noun;
                });
            };
        }

        function openView(rec) {
            var m = openModal(M.noun.charAt(0).toUpperCase() + M.noun.slice(1) + " details", M.view(rec), '<button type="button" class="btn btn-soft" data-cancel>Close</button>');
            $("[data-cancel]", m).onclick = closeModal;
        }

        host.addEventListener("click", function (e) {
            var b = e.target.closest("button");
            if (!b || !host.contains(b)) return;
            if (b.hasAttribute("data-add")) return openForm(null);
            if (b.hasAttribute("data-refresh")) { load().then(function () { toast("List refreshed"); }); return; }
            if (b.hasAttribute("data-export")) return csv(key, M.exportRows(filtered()));
            if (b.dataset.head != null) {
                var ha = M.headActions[Number(b.dataset.head)]; b.disabled = true;
                Promise.resolve(ha.run(load)).catch(function (er) { toast(er.message, true); }).then(function () { b.disabled = false; });
                return;
            }
            if (b.dataset.pg) { page = Number(b.dataset.pg); render(); return; }
            var tr = b.closest("tr[data-id]");
            if (!tr) return;
            var rec = all.filter(function (r) { return String(r[M.id]) === tr.dataset.id; })[0];
            if (!rec) return;
            var act = b.dataset.act;
            if (act === "edit") return openForm(rec);
            if (act === "view") {
                if (M.customView) { b.disabled = true; Promise.resolve(M.customView(rec, load)).catch(function (er) { toast(er.message, true); }).then(function () { b.disabled = false; }); return; }
                return openView(rec);
            }
            var ra = (M.rowActions || []).filter(function (a) { return a.act === act; })[0];
            if (ra) { b.disabled = true; Promise.resolve(ra.run(rec, load)).catch(function (er) { toast(er.message, true); }).then(function () { b.disabled = false; }); return; }
            if (act === "delete") {
                var lbl = rec.packageName || rec.eventName || rec.title || rec.partnerName || rec.resourceName || rec.name || code("BK", rec[M.id]);
                confirmBox("Delete " + M.noun + " “" + lbl + "”? This cannot be undone.").then(function (ok) {
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

    // ---------- dashboard (adapts to the logged-in role) ----------
    function runDashboard(host) {
        var paid = function (b) { return payStatus(b) === "PAID"; };
        Promise.all([
            can("bookings") || can("payments") ? tryList("/api/bookings") : Promise.resolve(null),
            can("users") ? tryList("/api/users") : Promise.resolve(null),
            tryList("/api/packages"),
            can("resources") ? tryList("/api/resources") : Promise.resolve(null),
            can("feedback") ? tryList("/api/feedback") : Promise.resolve(null),
            tryList("/api/events"),
            can("promotions") ? tryList("/api/promotions") : Promise.resolve(null),
            can("partners") ? tryList("/api/partners") : Promise.resolve(null)
        ]).then(function (r) {
            var bk = r[0], users = r[1] ? r[1].filter(function (u) { return up(u.role) === "CUSTOMER"; }) : null, pk = r[2], res = r[3], fb = r[4], ev = r[5], pr = r[6], pa = r[7];
            var t = todayIso(), m = monthKey(t);
            var kp = [];
            if (bk) {
                kp.push(["Total bookings", bk.length, bk.filter(function (b) { return monthKey(b.bookingDate) === m; }).length + " this month"]);
                kp.push(["Pending confirmation", bk.filter(function (b) { return up(b.status) === "PENDING"; }).length, "Waiting for staff"]);
                kp.push(["Revenue this month", short(bk.filter(function (b) { return paid(b) && monthKey(b.paidAt || b.bookingDate) === m; }).reduce(function (s, b) { return s + (b.totalAmount || 0); }, 0)), "Paid bookings"]);
            }
            if (users) kp.push(["Customers", users.length, users.filter(function (u) { return monthKey(u.createdAt) === m; }).length + " joined this month"]);
            if (pr) kp.push(["Running offers", pr.filter(function (p) { return up(p.status) === "ACTIVE"; }).length, pr.reduce(function (s, p) { return s + (p.usedCount || 0); }, 0) + " coupon uses"]);
            kp.push(["Upcoming events", ev.filter(function (e) { return up(e.status) === "UPCOMING" || up(e.status) === "ONGOING"; }).length, "Festivals & cultural events"]);
            if (fb) kp.push(["Avg. rating", fb.length ? (fb.reduce(function (s, f) { return s + (parseInt(f.rating, 10) || 0); }, 0) / fb.length).toFixed(1) + " / 5" : "-", fb.length + " reviews"]);
            if (pa) kp.push(["Contracts expiring", pa.filter(function (p) { return contractState(p) === "EXPIRING"; }).length, "Within 30 days"]);
            kp.push(["Active packages", pk.filter(function (p) { return up(p.status) === "ACTIVE"; }).length, pk.length + " total"]);
            setKpis(host, kp.slice(0, 4));

            var tb = $("[data-recent]", host);
            if (tb) {
                if (bk) {
                    var recent = bk.slice().sort(function (a, b) { return b.bookingId - a.bookingId; }).slice(0, 6);
                    tb.innerHTML = recent.length ? recent.map(function (b) {
                        return "<tr><td><b>" + code("BK", b.bookingId) + "</b></td><td>" + esc(b.customer ? b.customer.name : "-") + "</td><td>" + esc(b.tourPackage ? b.tourPackage.packageName : "-") +
                            "</td><td>" + money(b.totalAmount) + "</td><td>" + badge(b.status) + "</td></tr>";
                    }).join("") : '<tr><td colspan="5" class="ad-empty">No bookings yet.</td></tr>';
                } else {
                    var head = $("[data-recent-title]", host); if (head) head.textContent = "Upcoming events";
                    var up7 = ev.filter(function (e) { return (e.eventDate || "") >= t; }).sort(function (a, b) { return a.eventDate.localeCompare(b.eventDate); }).slice(0, 6);
                    tb.closest("table").querySelector("thead").innerHTML = "<tr><th>Event</th><th>Date</th><th>Location</th><th>Category</th><th>Status</th></tr>";
                    tb.innerHTML = up7.length ? up7.map(function (e) { return "<tr><td><b>" + esc(e.eventName) + "</b></td><td>" + fmtDate(e.eventDate) + "</td><td>" + esc(e.location || "-") + "</td><td>" + esc(e.category || "-") + "</td><td>" + badge(e.status) + "</td></tr>"; }).join("")
                        : '<tr><td colspan="5" class="ad-empty">No upcoming events.</td></tr>';
                    var link = $("[data-recent-link]", host); if (link) link.setAttribute("href", "/ui/admin-events");
                }
            }

            var vals = [], notes = [], titles = [];
            if (bk) {
                var nonCancel = bk.filter(function (b) { return up(b.status) !== "CANCELLED"; });
                titles.push("Booking confirmations"); vals.push(nonCancel.length ? Math.round(nonCancel.filter(function (b) { return up(b.status) !== "PENDING"; }).length / nonCancel.length * 100) : 0);
                notes.push(nonCancel.length ? "of active bookings confirmed" : "No bookings yet");
                titles.push("Payments collected"); var conf = nonCancel.filter(function (b) { return up(b.status) !== "PENDING"; });
                vals.push(conf.length ? Math.round(conf.filter(paid).length / conf.length * 100) : 0); notes.push(conf.length ? "of confirmed bookings paid" : "No confirmed bookings yet");
            }
            if (res) { titles.push("Resource utilization"); vals.push(res.length ? Math.round(res.filter(function (x) { return up(x.availabilityStatus) === "BOOKED"; }).length / res.length * 100) : 0); notes.push(res.length ? "of resources marked booked" : "No resources yet"); }
            if (fb) { titles.push("Customer satisfaction"); vals.push(fb.length ? Math.round(fb.reduce(function (s, f) { return s + (parseInt(f.rating, 10) || 0); }, 0) / fb.length / 5 * 100) : 0); notes.push(fb.length ? "from " + fb.length + " review" + (fb.length > 1 ? "s" : "") : "No reviews yet"); }
            if (pr) { titles.push("Offers running"); vals.push(pr.length ? Math.round(pr.filter(function (p) { return up(p.status) === "ACTIVE"; }).length / pr.length * 100) : 0); notes.push(pr.length ? "of promotions are live" : "No promotions yet"); }
            titles.push("Active packages"); vals.push(pk.length ? Math.round(pk.filter(function (p) { return up(p.status) === "ACTIVE"; }).length / pk.length * 100) : 0); notes.push(pk.length ? "of packages visible to customers" : "No packages yet");
            setProgress(host, vals.slice(0, 3), notes.slice(0, 3), titles.slice(0, 3));
        }).catch(function (e) { toast("Could not load dashboard data: " + e.message, true); });
    }
    function setKpis(host, kp) {
        $$(".admin-kpis .admin-stat", host).forEach(function (card, i) {
            if (!kp[i]) { card.hidden = true; return; }
            $("p", card).textContent = kp[i][0];
            $("h3", card).textContent = kp[i][1];
            var d = $(".stat-delta", card); if (d) d.textContent = kp[i][2];
        });
    }
    function setProgress(host, vals, notes, titles) {
        $$(".admin-progress", host).forEach(function (p, i) {
            if (vals[i] == null) { p.hidden = true; return; }
            var t = $("strong", p), span = $("div:first-child span", p), bar = $(".kpi-line span", p), note = $("p", p);
            if (t && titles && titles[i]) t.textContent = titles[i];
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
            var paid = function (b) { return payStatus(b) === "PAID"; };
            var rev = inRange.filter(paid).reduce(function (s, b) { return s + (b.totalAmount || 0); }, 0);
            var avg = inRange.length ? inRange.reduce(function (s, b) { return s + (b.totalAmount || 0); }, 0) / inRange.length : 0;
            var disc = inRange.reduce(function (s, b) { return s + (b.discountAmount || 0); }, 0);
            var label2 = {month: "This month", quarter: "Last 90 days", year: "Last 12 months", all: "All time"}[range];
            setKpis(host, [["Revenue (paid)", short(rev), label2], ["Bookings", inRange.length, label2], ["Avg. booking", short(avg), label2], ["Coupon discounts", short(disc), inRange.filter(function (b) { return b.couponCode; }).length + " bookings used a coupon"]]);

            var months = [];
            for (var i = 5; i >= 0; i--) { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); months.push(d.toISOString().slice(0, 7)); }
            var vals = months.map(function (mk) { return bk.filter(function (b) { return paid(b) && monthKey(b.paidAt || b.bookingDate) === mk; }).reduce(function (s, b) { return s + (b.totalAmount || 0); }, 0); });
            var max = Math.max.apply(null, vals.concat([1]));
            var bars = $(".bars", host);
            if (bars) bars.innerHTML = months.map(function (mk, i) {
                var n = new Date(mk + "-01T00:00:00").toLocaleDateString("en-GB", {month: "short"});
                return '<div style="--h:' + Math.max(3, Math.round(vals[i] / max * 100)) + '%" title="' + n + ": " + money(vals[i]) + '"><span>' + n + "</span></div>";
            }).join("");

            var st = ["CONFIRMED", "PENDING", "COMPLETED", "CANCELLED"], cnt = st.map(function (s) { return inRange.filter(function (b) { return up(b.status) === s; }).length; });
            var total = inRange.length, colors = ["#2e7032", "#c4a56a", "#4f7cac", "#c0473c"], acc = 0;
            var donut = $(".donut", host);
            if (donut) {
                donut.style.background = total ? "conic-gradient(" + cnt.map(function (c, i) { var a = acc; acc += c / total * 360; return colors[i] + " " + a + "deg " + acc + "deg"; }).join(",") + ")" : "#eee3d3";
                donut.innerHTML = "<span>" + total + "<small>Bookings</small></span>";
            }
            var legend = $(".legend", host);
            if (legend) legend.innerHTML = st.map(function (s, i) {
                return '<p><i class="lg" style="background:' + colors[i] + '"></i>' + label(s) + "<b>" + (total ? Math.round(cnt[i] / total * 100) : 0) + "%</b></p>";
            }).join("");

            var tb = $("[data-top]", host);
            if (tb) {
                var by = {};
                inRange.forEach(function (b) {
                    var n = b.tourPackage ? b.tourPackage.packageName : "Unknown";
                    by[n] = by[n] || {n: n, c: 0, r: 0, p: 0};
                    by[n].c++; by[n].p += b.numberOfPeople || 0; if (paid(b)) by[n].r += b.totalAmount || 0;
                });
                var top = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.r - a.r || b.c - a.c; }).slice(0, 6);
                tb.innerHTML = top.length ? top.map(function (x) { return "<tr><td><b>" + esc(x.n) + "</b></td><td>" + x.c + "</td><td>" + x.p + "</td><td>" + money(x.r) + "</td></tr>"; }).join("")
                    : '<tr><td colspan="4" class="ad-empty">No bookings in this period.</td></tr>';
            }
            var pt = $("[data-pay]", host);
            if (pt) {
                var ps = ["PAID", "UNPAID", "REFUND_PENDING", "REFUNDED"];
                pt.innerHTML = ps.map(function (s) {
                    var l = inRange.filter(function (b) { return payStatus(b) === s; });
                    return "<tr><td>" + badge(s) + "</td><td>" + l.length + "</td><td>" + money(l.reduce(function (a, b) { return a + (b.totalAmount || 0); }, 0)) + "</td></tr>";
                }).join("");
            }
            data.inRange = inRange;
        }
        Promise.all([getList("/api/bookings")]).then(function (r) {
            data = {bk: r[0]};
            compute();
        }).catch(function (e) { toast("Could not load report data: " + e.message, true); });
        var sel = $("[data-range]", host);
        if (sel) sel.addEventListener("change", function () { range = sel.value; if (data) compute(); });
        var ex = $("[data-export-report]", host);
        if (ex) ex.addEventListener("click", function () {
            if (!data) return;
            csv("report-" + range, data.inRange.map(function (b) { return {booking: code("BK", b.bookingId), booked: b.bookingDate, travel: b.travelDate, customer: b.customer && b.customer.name, package: b.tourPackage && b.tourPackage.packageName, people: b.numberOfPeople, coupon: b.couponCode || "", discount: b.discountAmount || 0, total: b.totalAmount, payment: payStatus(b), status: b.status}; }));
        });
    }

    // ---------- notifications (live alerts from data, filtered by role) ----------
    function runNotifications(host) {
        var list = $("[data-alerts]", host);
        var readKey = "el-admin-read";
        function read() { try { return JSON.parse(localStorage.getItem(readKey) || "[]"); } catch (e) { return []; } }
        Promise.all([
            can("bookings") || can("payments") ? tryList("/api/bookings") : Promise.resolve([]),
            can("promotions") ? tryList("/api/promotions") : Promise.resolve([]),
            can("users") ? tryList("/api/users") : Promise.resolve([]),
            tryList("/api/packages"),
            can("feedback") ? tryList("/api/feedback") : Promise.resolve([]),
            tryList("/api/events"),
            can("partners") ? tryList("/api/partners") : Promise.resolve([]),
            can("approvals") ? tryList("/api/partners/rate-changes?status=PENDING_APPROVAL") : Promise.resolve([])
        ]).then(function (r) {
            var bk = r[0], pr = r[1], us = r[2], pk = r[3], fb = r[4], ev = r[5], pa = r[6], rc = r[7], t = todayIso(), alerts = [];
            rc.forEach(function (c) {
                alerts.push({id: "rate-" + c.changeId, icon: "⚖", tag: ["warning", "Approvals"], title: "Rate change for " + (c.partner ? c.partner.partnerName : "a partner") + " needs approval",
                    text: money(c.oldRate) + " → " + money(c.newRate) + " (" + (c.changePercent > 0 ? "+" : "") + c.changePercent + "%) · requested by " + (c.requestedBy || "staff"), link: "/ui/admin-approvals", when: c.createdAt});
            });
            bk.filter(function (b) { return up(b.status) === "PENDING"; }).forEach(function (b) {
                alerts.push({id: "pend-" + b.bookingId, icon: "!", tag: ["warning", "Bookings"], title: "Booking " + code("BK", b.bookingId) + " waiting for confirmation",
                    text: (b.customer ? b.customer.name : "A customer") + " booked " + (b.tourPackage ? b.tourPackage.packageName : "a package") + " for " + fmtDate(b.travelDate) + ".", link: "/ui/admin-bookings", when: b.bookingDate});
            });
            bk.filter(function (b) { return up(b.status) === "CONFIRMED" && b.travelDate >= t && b.travelDate <= addDays(t, 3); }).forEach(function (b) {
                alerts.push({id: "soon-" + b.bookingId, icon: "◷", tag: ["info", "Trips"], title: "Trip starts " + fmtDate(b.travelDate),
                    text: code("BK", b.bookingId) + " · " + (b.customer ? b.customer.name : "") + " · " + b.numberOfPeople + " traveler(s). Check hotel, transport and guide.", link: "/ui/admin-bookings", when: b.travelDate});
            });
            bk.filter(function (b) { return payStatus(b) === "REFUND_PENDING"; }).forEach(function (b) {
                alerts.push({id: "refund-" + b.bookingId, icon: "↩", tag: ["warning", "Payments"], title: "Refund to process for " + code("BK", b.bookingId),
                    text: money(b.totalAmount) + " · " + (b.customer ? b.customer.name : ""), link: "/ui/admin-payments", when: b.travelDate});
            });
            pr.filter(function (p) { return up(p.status) === "ACTIVE" && p.endDate >= t && p.endDate <= addDays(t, 7); }).forEach(function (p) {
                alerts.push({id: "promo-" + p.promotionId + p.endDate, icon: "%", tag: ["warning", "Promotions"], title: "“" + p.title + "” ends " + fmtDate(p.endDate), text: "Extend it or prepare the next offer.", link: "/ui/admin-promotions", when: p.endDate});
            });
            pa.filter(function (p) { return contractState(p) === "EXPIRING" || contractState(p) === "EXPIRED" && up(p.status) === "ACTIVE"; }).forEach(function (p) {
                alerts.push({id: "contract-" + p.partnerId + p.contractEnd, icon: "◎", tag: [contractState(p) === "EXPIRED" ? "danger" : "warning", "Partners"], title: p.partnerName + " contract " + (contractState(p) === "EXPIRED" ? "expired" : "ends") + " " + fmtDate(p.contractEnd), text: "Renew the contract or update the supplier status.", link: "/ui/admin-partners", when: p.contractEnd});
            });
            fb.filter(function (f) { return parseInt(f.rating, 10) <= 2; }).forEach(function (f) {
                alerts.push({id: "low-" + f.feedbackId, icon: "★", tag: ["danger", "Reviews"], title: "Low rating from " + (f.customer ? f.customer.name : "a customer"), text: "“" + (f.comment || "").slice(0, 90) + "”", link: "/ui/admin-feedback", when: f.feedbackDate});
            });
            us.filter(function (u) { return up(u.role) === "CUSTOMER" && u.createdAt && u.createdAt.slice(0, 10) >= addDays(t, -7); }).forEach(function (u) {
                alerts.push({id: "user-" + u.userId, icon: "◉", tag: ["success", "Customers"], title: "New customer: " + u.name, text: u.email, link: "/ui/admin-users", when: u.createdAt});
            });
            ev.filter(function (e) { return e.eventDate >= t && e.eventDate <= addDays(t, 7) && up(e.status) !== "CANCELLED"; }).forEach(function (e) {
                alerts.push({id: "ev-" + e.eventId, icon: "◇", tag: ["info", "Events"], title: e.eventName + " on " + fmtDate(e.eventDate), text: (e.location || "") + (e.region ? " · " + e.region : ""), link: "/ui/admin-events", when: e.eventDate});
            });
            if (can("packages") && !pk.some(function (p) { return up(p.status) === "ACTIVE"; })) alerts.push({id: "nopkg", icon: "◫", tag: ["danger", "Packages"], title: "No active packages", text: "Customers can't book anything until a package is Active.", link: "/ui/admin-packages", when: t});

            alerts.sort(function (a, b) { return String(b.when || "").localeCompare(String(a.when || "")); });
            function draw() {
                var seen = read();
                var unread = alerts.filter(function (a) { return seen.indexOf(a.id) < 0; });
                setKpis(host, [["Unread alerts", unread.length, alerts.length + " total"],
                    ["Pending bookings", bk.filter(function (b) { return up(b.status) === "PENDING"; }).length, "Need confirmation"],
                    ["Trips in 3 days", bk.filter(function (b) { return up(b.status) === "CONFIRMED" && b.travelDate >= t && b.travelDate <= addDays(t, 3); }).length, "Prepare operations"],
                    ["Refunds to process", bk.filter(function (b) { return payStatus(b) === "REFUND_PENDING"; }).length, "Payments"]]);
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
                draw();
            });
            var mark = $("[data-mark-all]", host);
            if (mark) mark.onclick = function () { localStorage.setItem(readKey, JSON.stringify(alerts.map(function (a) { return a.id; }))); draw(); toast("All alerts marked as read"); };
        }).catch(function (e) { list.innerHTML = '<div class="card ad-empty bad">Could not load alerts: ' + esc(e.message) + "</div>"; });
    }

    // ---------- rate approvals (System Administrator, UC-02) ----------
    function runApprovals(host) {
        var box = $("[data-approvals]", host), hist = $("[data-decided]", host);
        function load() {
            box.innerHTML = '<div class="card ad-empty">Loading...</div>';
            return getList("/api/partners/rate-changes").then(function (all) {
                var pend = all.filter(function (c) { return c.status === "PENDING_APPROVAL"; });
                var done = all.filter(function (c) { return c.status === "APPROVED" || c.status === "REJECTED"; });
                setKpis(host, [["Waiting for approval", pend.length, "Rate changes over 20%"],
                    ["Approved", done.filter(function (c) { return c.status === "APPROVED"; }).length, "All time"],
                    ["Rejected", done.filter(function (c) { return c.status === "REJECTED"; }).length, "All time"],
                    ["Changes recorded", all.length, "Rate & contract versions"]]);
                box.innerHTML = pend.length ? pend.map(function (c) {
                    return '<article class="card ad-approval" data-id="' + c.changeId + '"><div><h4>' + esc(c.partner ? c.partner.partnerName : "Partner") + "</h4><p>" +
                        money(c.oldRate) + " → <b>" + money(c.newRate) + "</b> " + esc(c.rateUnit || "") + ' <span class="badge ' + (c.changePercent > 0 ? "danger" : "info") + '">' + (c.changePercent > 0 ? "+" : "") + c.changePercent + "%</span></p><small>Requested by " + esc(c.requestedBy || "staff") + " on " + fmtDate(c.createdAt) + "</small></div>" +
                        '<div class="ad-inline"><input data-note maxlength="200" placeholder="Note (optional, for rejection)"><button class="btn btn-soft" data-reject>Reject</button><button class="btn btn-primary" data-approve>Approve</button></div></article>';
                }).join("") : '<div class="card ad-empty">No rate changes are waiting for approval. 👍</div>';
                hist.innerHTML = done.length ? done.slice(0, 15).map(function (c) {
                    return "<tr><td><b>" + esc(c.partner ? c.partner.partnerName : "-") + "</b></td>" + changeRow(c).replace(/^<tr>/, "").replace(/<td>[^<]*<\/td>/, "");
                }).join("") : '<tr><td colspan="6" class="ad-empty">No decisions yet.</td></tr>';
            }).catch(function (er) { box.innerHTML = '<div class="card ad-empty bad">' + esc(er.message) + "</div>"; });
        }
        box.addEventListener("click", function (ev) {
            var b = ev.target.closest("button"); if (!b) return;
            var card = b.closest("[data-id]"), id = card.dataset.id;
            b.disabled = true;
            var p = b.hasAttribute("data-approve") ? api("PUT", "/api/partners/rate-changes/" + id + "/approve")
                : api("PUT", "/api/partners/rate-changes/" + id + "/reject", {note: $("[data-note]", card).value});
            p.then(function () { toast(b.hasAttribute("data-approve") ? "Rate approved and activated" : "Rate change rejected"); load(); })
                .catch(function (er) { toast(er.message, true); b.disabled = false; });
        });
        load();
    }

    function boot() {
        var host = $("[data-admin-module]");
        if (host) runModule(host, host.dataset.adminModule);
        var page = document.body.dataset.adminPage;
        var root = $(".admin-content");
        if (page === "dashboard") runDashboard(root);
        if (page === "reports") runReports(root);
        if (page === "notifications") runNotifications(root);
        if (page === "approvals") runApprovals(root);
    }
    // wait for portal.js to load the role / permissions so role-aware pages are correct
    document.addEventListener("DOMContentLoaded", function () {
        if (window.portalReady && typeof window.portalReady.then === "function") window.portalReady.then(boot, boot);
        else boot();
    });
})();

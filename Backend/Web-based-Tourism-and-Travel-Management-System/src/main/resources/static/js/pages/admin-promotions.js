/*
 * Promotion & Offer Management (IT25102633 Mandakini N.N.K.M) - UC-05 Edit Promotional Campaigns.
 * Includes "Apply discount" (4/4a) and "Define target audience" (5/6a), date range check (7a),
 * publish / deactivate (PBI-15) and promotion performance (PBI-16).
 */
(async function () {
    const { $, $$, esc, fmt, icon, api, badge, ROLE } = EL;
    await EL.portal({ kind: "admin", active: "promotions", title: "Promotions & Offers", roles: [ROLE.MKT, ROLE.ADMIN] });
    const page = $("#page");
    const AUDIENCES = ["ALL_CUSTOMERS", "NEW_CUSTOMERS", "RETURNING_CUSTOMERS", "LOCAL_RESIDENTS", "INTERNATIONAL", "FAMILIES", "GROUPS"];
    const OFFER_TYPES = ["EARLY_BIRD", "HONEYMOON", "FAMILY", "SUMMER", "GROUP", "FESTIVAL_SEASON", "GENERAL"];
    page.innerHTML = '<div class="page-intro"><p>Campaigns, special offers and coupon codes. Only published, running offers are shown to customers; expired offers are deactivated automatically every night.</p><button class="btn" id="add">' + icon("plus", 16) + " Create campaign</button></div>" +
        '<div class="tabs" id="tabs"><button class="active" data-t="list">Campaigns</button><button data-t="perf">Performance</button></div><div id="body"></div>';
    let all = [], packages = [];
    let tab = "list";
    $$("#tabs button").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.t; $$("#tabs button").forEach((x) => x.classList.toggle("active", x === b)); show(); }));
    $("#add").addEventListener("click", () => edit(null));

    async function show() { if (tab === "list") await list(); else await perf(); }

    async function list() {
        [all, packages] = await Promise.all([api("/api/admin/promotions"), packages.length ? packages : api("/api/admin/packages/options")]);
        $("#body").innerHTML = '<div class="card toolbar" style="margin:14px 0"><input class="search grow" id="q" placeholder="Search title or code"><select id="fs"><option value="">All statuses</option><option>ACTIVE</option><option>DRAFT</option><option>INACTIVE</option><option>EXPIRED</option></select></div><div id="list"></div>';
        const render = () => {
            const q = $("#q").value.trim().toLowerCase();
            const rows = all.filter((p) => (!q || (p.title + p.couponCode).toLowerCase().includes(q)) && (!$("#fs").value || p.status === $("#fs").value));
            EL.table($("#list"), [
                { label: "Campaign", render: (p) => "<b>" + esc(p.title) + '</b><div class="small muted">' + esc(EL.titleCase(p.offerType)) + " · " + (p.packageNames.length ? esc(p.packageNames.length + " package(s)") : "All packages") + "</div>" },
                { label: "Code", render: (p) => '<code style="font-weight:600">' + esc(p.couponCode) + "</code>" },
                { label: "Discount", render: (p) => p.discountType === "PERCENTAGE" ? Number(p.discountValue) + "%" + (p.maxDiscount ? '<div class="small muted">max ' + fmt.money(p.maxDiscount) + "</div>" : "") : fmt.money(p.discountValue) },
                { label: "Valid", render: (p) => '<span class="nowrap small">' + fmt.short(p.startDate) + " - " + fmt.date(p.endDate) + "</span>" },
                { label: "Audience", render: (p) => '<span class="small">' + esc(p.audiences.map(EL.titleCase).join(", ")) + "</span>" },
                { label: "Used", cls: "right", render: (p) => p.usedCount + (p.usageLimit ? " / " + p.usageLimit : "") },
                { label: "Status", render: (p) => badge(p.status) + (p.running ? ' <span class="badge blue">Running</span>' : "") },
                { label: "", cls: "right", render: (p) => '<div class="actions">' + EL.act("edit", "edit", "Edit campaign") + (p.status === "ACTIVE" ? EL.act("deact", "eye", "Deactivate") : p.status !== "EXPIRED" ? EL.act("pub", "check", "Publish") : "") + EL.act("del", "trash", "Delete", "danger") + "</div>" }
            ], rows, {
                empty: "No campaigns yet", emptyIcon: "tag", onRow: edit,
                actions: {
                    edit,
                    pub: async (p) => { try { await api("/api/admin/promotions/" + p.id + "/publish", { method: "POST" }); EL.toast("Published - customers who opted in were notified", "success"); list(); } catch (e) { EL.toastError(e); } },
                    deact: async (p) => { if (!(await EL.confirm("Deactivate " + p.title + "? Customers will no longer see or use code " + p.couponCode + ".", { ok: "Deactivate", danger: true }))) return; await api("/api/admin/promotions/" + p.id + "/deactivate", { method: "POST" }); EL.toast("Promotion deactivated"); list(); },
                    del: async (p) => { if (!(await EL.confirm("Delete " + p.title + "?", { danger: true, ok: "Delete" }))) return; try { await api("/api/admin/promotions/" + p.id, { method: "DELETE" }); EL.toast("Deleted"); list(); } catch (e) { EL.toastError(e); } }
                }
            });
        };
        $("#q").addEventListener("input", render);
        $("#fs").addEventListener("input", render);
        render();
    }

    function edit(p) {
        const running = p && p.running;
        const form = document.createElement("form");
        form.innerHTML = (running ? '<div class="alert info small" style="margin-bottom:12px">This campaign is running - its discount cannot be changed (deactivate it first). Dates, audience, content and packages can still be updated.</div>' : "") +
            '<div class="form-grid">' +
            EL.field({ name: "title", label: "Campaign title", required: true, full: true, attrs: { minlength: 3, maxlength: 120 } }) +
            EL.field({ name: "offerType", label: "Offer type", type: "select", required: true, options: OFFER_TYPES }) +
            EL.field({ name: "couponCode", label: "Coupon code", placeholder: "Leave empty to generate", attrs: { pattern: EL.PATTERNS.code, "data-msg": "3-30 letters, digits or hyphens", maxlength: 30 } }) +
            EL.field({ name: "description", label: "Promotional content", type: "textarea", full: true, attrs: { maxlength: 1000 } }) +
            '<div class="full panel"><h4>Apply discount</h4><div class="form-grid cols-3">' +
            EL.field({ name: "discountType", label: "Discount type", type: "select", required: true, options: [{ value: "PERCENTAGE", label: "Percentage (%)" }, { value: "FIXED_AMOUNT", label: "Fixed amount (LKR)" }] }) +
            EL.field({ name: "discountValue", label: "Discount value", type: "number", required: true, attrs: { min: 0.01, step: "0.01" }, hint: "1-90% or LKR 100-1,000,000" }) +
            EL.field({ name: "maxDiscount", label: "Max discount (LKR)", type: "number", attrs: { min: 0, step: "0.01" }, hint: "Optional cap for % offers" }) +
            EL.field({ name: "minSpend", label: "Minimum spend (LKR)", type: "number", attrs: { min: 0, step: "0.01" } }) +
            EL.field({ name: "usageLimit", label: "Usage limit", type: "number", attrs: { min: 1 }, hint: "Empty = unlimited" }) + "</div></div>" +
            EL.field({ name: "startDate", label: "Start date", type: "date", required: true }) +
            EL.field({ name: "endDate", label: "End date", type: "date", required: true, attrs: { "data-after": "startDate" } }) +
            '<div class="full panel"><h4>Define target audience</h4><p class="small muted" style="margin-top:-4px">Select at least one group - if none is selected the offer is open to all customers.</p><div class="row">' +
            AUDIENCES.map((a) => '<label class="check"><input type="checkbox" name="audiences" data-multi value="' + a + '"> ' + EL.titleCase(a) + "</label>").join("") + "</div></div>" +
            '<div class="field full"><label>Applicable packages (none selected = all packages)</label><div class="panel" style="max-height:150px;overflow:auto;display:grid;gap:4px">' +
            packages.map((x) => '<label class="check"><input type="checkbox" name="packageIds" data-multi data-type="number" value="' + x.id + '"> ' + esc(x.name) + "</label>").join("") + "</div></div>" +
            EL.imageField({ name: "imageUrl", label: "Banner image" }) + "</div>";
        EL.fill(form, p || { discountType: "PERCENTAGE", offerType: "GENERAL", startDate: EL.iso(new Date()), endDate: EL.iso(EL.addDays(new Date(), 30)), audiences: ["ALL_CUSTOMERS"] });
        EL.bindImageFields(form);
        if (running) ["discountType", "discountValue", "maxDiscount"].forEach((n) => { form[n].readOnly = true; form[n].style.background = "var(--surface-2)"; if (form[n].tagName === "SELECT") form[n].addEventListener("mousedown", (e) => e.preventDefault()); });
        const syncType = () => { form.maxDiscount.closest(".field").style.opacity = form.discountType.value === "PERCENTAGE" ? 1 : .5; };
        form.discountType.addEventListener("change", syncType);
        syncType();
        const save = (publish) => async () => {
            if (!EL.validate(form)) return false;
            const d = EL.formData(form);
            const v = Number(d.discountValue);
            if (d.discountType === "PERCENTAGE" && (v < 1 || v > 90)) { EL.handleFormError(form, { message: "Please enter a valid discount", errors: { discountValue: "A percentage discount must be between 1 and 90" } }); return false; }
            if (d.discountType === "FIXED_AMOUNT" && (v < 100 || v > 1000000)) { EL.handleFormError(form, { message: "Please enter a valid discount", errors: { discountValue: "A fixed discount must be LKR 100 - 1,000,000" } }); return false; }
            if (!d.audiences.length) d.audiences = ["ALL_CUSTOMERS"];
            d.publish = publish;
            await api("/api/admin/promotions" + (p ? "/" + p.id : ""), { method: p ? "PUT" : "POST", body: d });
            EL.toast(p ? "Campaign updated" : publish ? "Campaign published" : "Campaign saved as draft", "success");
            list();
        };
        const isPublished = p && p.status === "ACTIVE";
        EL.modal({
            title: p ? "Edit campaign" : "Create campaign", body: form, size: "lg", sticky: true,
            actions: [{ label: "Cancel", kind: "ghost" }].concat(isPublished ? [{ label: "Save changes", kind: "green", onClick: save(true) }]
                : [{ label: "Save as draft", kind: "outline", onClick: save(false) }, { label: icon("check", 16) + " Save & publish", kind: "green", onClick: save(true) }])
        });
    }

    async function perf() {
        const rows = await api("/api/admin/promotions/performance");
        $("#body").innerHTML = '<div class="grid grid-2" style="margin-top:14px"><section class="card"><h3>Bookings per promotion</h3><div id="c1"></div></section><section class="card"><h3>Revenue per promotion</h3><div id="c2"></div></section></div>' +
            '<section class="card" style="margin-top:18px"><div class="card-head"><h3>Performance details</h3><button class="btn sm ghost" id="csv">' + icon("download", 14) + ' Export CSV</button></div><div id="pt"></div></section>';
        const top = rows.filter((r) => r.bookings || r.timesApplied).slice(0, 8);
        EL.barChart($("#c1"), top.map((r) => ({ label: r.couponCode, value: r.bookings })), { color: "#244F3E", title: "Bookings per promotion" });
        EL.barChart($("#c2"), top.map((r) => ({ label: r.couponCode, value: Number(r.revenue) })), { format: fmt.money, axis: (v) => (v / 1000).toFixed(0) + "k", title: "Revenue per promotion" });
        EL.table($("#pt"), [
            { label: "Promotion", render: (r) => "<b>" + esc(r.title) + '</b><div class="small muted">' + esc(r.couponCode) + "</div>" },
            { label: "Status", render: (r) => badge(r.status) },
            { label: "Code applied", cls: "right", key: "timesApplied" },
            { label: "Bookings", cls: "right", key: "bookings" },
            { label: "Conversion", cls: "right", render: (r) => r.conversionRate + "%" },
            { label: "Discount given", cls: "right", render: (r) => fmt.money(r.discountGiven) },
            { label: "Revenue", cls: "right", render: (r) => fmt.money(r.revenue) }
        ], rows, { empty: "No promotions yet" });
        $("#csv").addEventListener("click", () => EL.downloadCsv("promotion-performance.csv", [
            { label: "Title", key: "title" }, { label: "Code", key: "couponCode" }, { label: "Status", key: "status" }, { label: "Applied", key: "timesApplied" },
            { label: "Bookings", key: "bookings" }, { label: "Conversion %", key: "conversionRate" }, { label: "Discount", key: "discountGiven" }, { label: "Revenue", key: "revenue" }], rows));
    }

    show().catch(EL.toastError);
})();

/* Payments & refunds (Finance & Booking Coordinator): history, bank-transfer verification, refund processing. */
(async function () {
    const { $, $$, esc, fmt, icon, api, badge, ROLE } = EL;
    await EL.portal({ kind: "admin", active: "payments", title: "Payments & Refunds", roles: [ROLE.FIN, ROLE.ADMIN] });
    const page = $("#page");
    page.innerHTML = '<div class="tabs" id="tabs"><button data-t="verify">Bank transfers to verify</button><button data-t="refunds">Refund requests</button><button data-t="all">All payments</button></div><div id="body" style="margin-top:14px"></div>';
    let tab = location.hash === "#refunds" ? "refunds" : location.hash === "#all" ? "all" : "verify";
    $$("#tabs button").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.t; history.replaceState(null, "", "#" + tab); show(); }));

    async function show() {
        $$("#tabs button").forEach((b) => b.classList.toggle("active", b.dataset.t === tab));
        $("#body").innerHTML = EL.skeleton(3);
        const [payments, refunds] = await Promise.all([api("/api/admin/payments"), api("/api/admin/refunds")]);
        const pendingTransfers = payments.filter((p) => p.status === "PENDING");
        $$("#tabs button")[0].innerHTML = "Bank transfers to verify <span class=\"count\">" + pendingTransfers.length + "</span>";
        $$("#tabs button")[1].innerHTML = "Refund requests <span class=\"count\">" + refunds.filter((r) => r.status === "PENDING").length + "</span>";
        if (tab === "verify") {
            EL.table($("#body"), [
                { label: "Received", render: (p) => fmt.dateTime(p.createdAt) },
                { label: "Booking", render: (p) => '<a href="/admin/bookings.html?open=' + p.bookingId + '">' + esc(p.bookingReference) + "</a>" },
                { label: "Customer", key: "customerName" },
                { label: "Transfer details", render: (p) => esc(p.maskedDetails) },
                { label: "Amount", cls: "right", render: (p) => "<b>" + fmt.money(p.amount) + "</b>" },
                { label: "", cls: "right", render: () => '<div class="actions"><button class="btn sm green" data-act="ok">' + icon("check", 14) + ' Verify</button><button class="btn sm danger outline" data-act="no">Reject</button></div>' }
            ], pendingTransfers, {
                empty: "No bank transfers are waiting for verification", emptyIcon: "check",
                actions: {
                    ok: async (p) => {
                        if (!(await EL.confirm("Confirm that " + fmt.money(p.amount) + " (" + p.maskedDetails + ") was received? The booking will be confirmed and resources allocated.", { ok: "Verify & confirm" }))) return;
                        try { const r = await api("/api/admin/payments/" + p.id + "/verify", { method: "POST", body: { approve: true } }); EL.toast(r.message, "success"); show(); } catch (e) { EL.toastError(e); }
                    },
                    no: async (p) => {
                        const note = await EL.prompt({ title: "Reject transfer", label: "Reason (sent to the customer)", required: true, danger: true, ok: "Reject", max: 255 });
                        if (!note) return;
                        try { await api("/api/admin/payments/" + p.id + "/verify", { method: "POST", body: { approve: false, note } }); EL.toast("Transfer rejected - the customer can pay again"); show(); } catch (e) { EL.toastError(e); }
                    }
                }
            });
        } else if (tab === "refunds") {
            EL.table($("#body"), [
                { label: "Requested", render: (r) => fmt.dateTime(r.createdAt) },
                { label: "Booking", render: (r) => '<a href="/admin/bookings.html?open=' + r.bookingId + '">' + esc(r.bookingReference) + '</a><div class="small muted">' + esc(r.customerName) + "</div>" },
                { label: "Reason", render: (r) => '<span class="small">' + esc(r.reason) + "</span>" },
                { label: "Original payment", render: (r) => '<span class="small">' + EL.titleCase(r.method) + "<br>" + esc(r.paymentRef) + "</span>" },
                { label: "Amount", cls: "right", render: (r) => "<b>" + fmt.money(r.amount) + "</b>" },
                { label: "Status", render: (r) => badge(r.status) + (r.processedBy ? '<div class="small muted">' + esc(r.processedBy) + "<br>" + fmt.date(r.processedAt) + "</div>" : "") },
                { label: "", cls: "right", render: (r) => r.status === "PENDING" ? '<div class="actions"><button class="btn sm green" data-act="ok">Approve</button><button class="btn sm danger outline" data-act="no">Reject</button></div>' : "" }
            ], refunds, {
                empty: "No refund requests", emptyIcon: "money",
                actions: {
                    ok: async (r) => {
                        if (!(await EL.confirm("Approve a refund of " + fmt.money(r.amount) + " to " + r.customerName + "?", { ok: "Approve refund" }))) return;
                        try { await api("/api/admin/refunds/" + r.id, { method: "POST", body: { approve: true, note: "Refunded to original payment method" } }); EL.toast("Refund approved", "success"); show(); } catch (e) { EL.toastError(e); }
                    },
                    no: async (r) => {
                        const note = await EL.prompt({ title: "Reject refund", label: "Reason (sent to the customer)", required: true, danger: true, ok: "Reject", max: 300 });
                        if (!note) return;
                        try { await api("/api/admin/refunds/" + r.id, { method: "POST", body: { approve: false, note } }); EL.toast("Refund rejected"); show(); } catch (e) { EL.toastError(e); }
                    }
                }
            });
        } else {
            $("#body").innerHTML = '<div class="card toolbar" style="margin-bottom:14px"><input class="search grow" id="q" placeholder="Search booking, customer or transaction"><select id="fs"><option value="">All statuses</option><option>SUCCESS</option><option>PENDING</option><option>FAILED</option><option>REFUNDED</option></select><button class="btn ghost" id="csv">' + icon("download", 16) + ' CSV</button></div><div id="pl"></div>';
            const render = () => {
                const q = $("#q").value.trim().toLowerCase();
                const rows = payments.filter((p) => (!q || (p.bookingReference + p.customerName + p.transactionRef).toLowerCase().includes(q)) && (!$("#fs").value || p.status === $("#fs").value));
                EL.table($("#pl"), [
                    { label: "Date", render: (p) => fmt.dateTime(p.createdAt) },
                    { label: "Booking", render: (p) => '<a href="/admin/bookings.html?open=' + p.bookingId + '">' + esc(p.bookingReference) + "</a>" },
                    { label: "Customer", key: "customerName" },
                    { label: "Method", render: (p) => EL.titleCase(p.method) + '<div class="small muted">' + esc(p.maskedDetails || "") + "</div>" },
                    { label: "Transaction", render: (p) => '<span class="small">' + esc(p.transactionRef) + "</span>" },
                    { label: "Amount", cls: "right", render: (p) => fmt.money(p.amount) },
                    { label: "Status", render: (p) => badge(p.status) + (p.failureReason ? '<div class="small muted">' + esc(p.failureReason) + "</div>" : "") }
                ], rows, { empty: "No payments", emptyIcon: "card" });
                $("#csv").onclick = () => EL.downloadCsv("payments.csv", [{ label: "Date", key: "createdAt" }, { label: "Booking", key: "bookingReference" }, { label: "Customer", key: "customerName" },
                    { label: "Method", key: "method" }, { label: "Transaction", key: "transactionRef" }, { label: "Amount", key: "amount" }, { label: "Status", key: "status" }], rows);
            };
            $("#q").addEventListener("input", render);
            $("#fs").addEventListener("input", render);
            render();
        }
    }
    show().catch(EL.toastError);
})();

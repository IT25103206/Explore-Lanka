/* Widgets shared by the operations resource page and the partner schedule page. */
(function () {
    const { esc, fmt, icon, api } = EL;

    /** Month-style grid of nightly capacity / booked / free rooms. */
    function calendarHtml(days) {
        if (!days.length) return "";
        const first = new Date(days[0].date + "T00:00:00");
        const pad = (first.getDay() + 6) % 7;   // Monday first
        return '<div class="cal">' + ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => '<div class="head">' + d + "</div>").join("") +
            "<div></div>".repeat(pad) + days.map((d) => {
                const cls = d.free === 0 ? "full" : d.free <= Math.max(1, Math.round(d.capacity * 0.2)) ? "low" : "ok";
                return '<div class="d ' + cls + '" title="' + esc(d.bookingRefs.join(", ") || "No bookings") + '"><b>' + fmt.short(d.date) + "</b>" + d.free + "/" + d.capacity + " free" +
                    (d.booked ? '<div class="muted">' + d.booked + " booked</div>" : "") + "</div>";
            }).join("") + "</div>" +
            '<div class="legend" style="margin-top:8px"><span><i style="background:#F6FBF6;border:1px solid var(--line)"></i>Available</span><span><i style="background:var(--warning-50)"></i>Almost full</span><span><i style="background:var(--danger-50)"></i>Full</span></div>';
    }

    /** List + add/remove unavailable days for a vehicle or guide. base = "/api/admin/resources" or "/api/partner". */
    async function blockedDatesModal(base, type, id, name) {
        const box = document.createElement("div");
        const today = EL.iso(new Date());
        box.innerHTML = '<form id="blk" class="form-grid" style="align-items:end">' +
            EL.field({ name: "startDate", label: "From", type: "date", required: true, attrs: { min: today } }) +
            EL.field({ name: "endDate", label: "To", type: "date", required: true, attrs: { min: today, "data-after": "startDate" } }) +
            EL.field({ name: "reason", label: "Reason", full: true, placeholder: "Maintenance, leave, private hire...", attrs: { maxlength: 200 } }) +
            '<div class="full right"><button class="btn" type="submit">' + icon("plus", 16) + ' Mark unavailable</button></div></form><hr class="divider"><h4>Upcoming unavailable days</h4><div id="blkList"></div>';
        const m = EL.modal({ title: "Unavailable days · " + name, body: box, size: "lg" });
        const list = box.querySelector("#blkList");
        async function load() {
            const rows = await api(base + "/" + type + "/" + id + "/blocked-dates");
            EL.table(list, [
                { label: "Date", render: (r) => fmt.date(r.date) },
                { label: "Reason", render: (r) => esc(r.reason || "-") },
                { label: "", cls: "right", render: () => EL.act("rm", "trash", "Make available", "danger") }
            ], rows, {
                empty: "No unavailable days", emptyIcon: "calendar",
                actions: { rm: async (r) => { await api(base + "/" + type + "/" + id + "/blocked-dates/" + r.id, { method: "DELETE" }); load(); } }
            });
        }
        EL.bindForm(box.querySelector("#blk"), async (d, f) => {
            await api(base + "/" + type + "/" + id + "/blocked-dates", { method: "POST", body: d });
            EL.toast("Saved", "success");
            f.reset();
            load();
        });
        load();
        return m;
    }

    window.ResourceWidgets = { calendarHtml, blockedDatesModal };
})();

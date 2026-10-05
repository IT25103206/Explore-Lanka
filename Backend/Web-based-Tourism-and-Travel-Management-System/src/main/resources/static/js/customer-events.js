(() => {
    const API = "/api/events";
    let events = [];

    const grid = document.getElementById("event-grid");
    const message = document.getElementById("eventMessage");
    const search = document.getElementById("eventSearch");
    const statusFilter = document.getElementById("eventStatusFilter");
    const refresh = document.getElementById("refreshEvents");
    const modal = document.getElementById("eventModal");

    const safe = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    function parseDate(value) {
        if (!value) return null;
        const d = new Date(`${value}T00:00:00`);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    function formatDate(value) {
        const d = parseDate(value);
        if (!d) return "Date to be announced";
        return new Intl.DateTimeFormat("en-LK", { day: "2-digit", month: "short", year: "numeric" }).format(d);
    }

    function dateParts(value) {
        const d = parseDate(value);
        if (!d) return { day: "--", month: "TBA" };
        return {
            day: new Intl.DateTimeFormat("en-LK", { day: "2-digit" }).format(d),
            month: new Intl.DateTimeFormat("en-LK", { month: "short" }).format(d).toUpperCase()
        };
    }

    function statusClass(status) {
        const s = String(status || "").toUpperCase();
        if (["ACTIVE", "OPEN", "AVAILABLE"].includes(s)) return "success";
        if (["PENDING", "UPCOMING", "SCHEDULED"].includes(s)) return "warning";
        if (["CANCELLED", "INACTIVE", "CLOSED"].includes(s)) return "danger";
        return "info";
    }

    function eventSymbol(location) {
        const text = String(location || "").toLowerCase();
        if (text.includes("beach") || text.includes("mirissa") || text.includes("galle")) return "🌊";
        if (text.includes("kandy")) return "🪘";
        if (text.includes("ella") || text.includes("nuwara")) return "⛰️";
        if (text.includes("colombo")) return "🌆";
        return "🎉";
    }

    function updateSummary(list) {
        document.getElementById("eventCount").textContent = list.length;
        const today = new Date(); today.setHours(0,0,0,0);
        document.getElementById("upcomingCount").textContent = list.filter(e => {
            const d = parseDate(e.eventDate); return d && d >= today;
        }).length;
        document.getElementById("locationCount").textContent = new Set(list.map(e => (e.location || "").trim().toLowerCase()).filter(Boolean)).size;
    }

    function render(list) {
        if (!list.length) {
            grid.innerHTML = `<div class="event-empty"><b>No events found</b><p>Try a different search or status filter.</p></div>`;
            return;
        }

        grid.innerHTML = list.map(event => {
            const parts = dateParts(event.eventDate);
            const status = event.status || "Scheduled";
            return `
                <article class="card customer-event-card">
                    <div class="customer-event-cover"${event.imageUrl ? ` style="background-image:linear-gradient(rgba(20,30,20,.10),rgba(20,30,20,.45)),url('${safe(event.imageUrl)}');background-size:cover;background-position:center"` : ""}>
                        <div class="customer-event-date"><strong>${safe(parts.day)}</strong><span>${safe(parts.month)}</span></div>
                        <div class="customer-event-symbol">${eventSymbol(event.location)}</div>
                    </div>
                    <div class="customer-event-body">
                        <h4>${safe(event.eventName || "Untitled Event")}</h4>
                        <p>${safe(event.description || "Discover a special Explore Lanka event experience.")}</p>
                        <div class="customer-event-meta">
                            <span>📍 ${safe(event.location || "Location to be announced")}</span>
                            <span>📅 ${safe(formatDate(event.eventDate))}</span>
                        </div>
                        <div class="customer-event-footer">
                            <span class="badge ${statusClass(status)}">${safe(status)}</span>
                            <button class="btn btn-primary event-details-btn" type="button" data-event-id="${safe(event.eventId)}">View Details</button>
                        </div>
                    </div>
                </article>`;
        }).join("");
    }

    function applyFilters() {
        const q = (search.value || "").trim().toLowerCase();
        const status = statusFilter.value;
        const filtered = events.filter(event => {
            const haystack = `${event.eventName || ""} ${event.location || ""} ${event.description || ""}`.toLowerCase();
            const matchesSearch = !q || haystack.includes(q);
            const matchesStatus = status === "ALL" || String(event.status || "").toUpperCase() === status;
            return matchesSearch && matchesStatus;
        });
        render(filtered);
    }

    async function loadEvents() {
        message.textContent = "Loading events...";
        grid.innerHTML = "";
        try {
            const response = await fetch(API, { headers: { "Accept": "application/json" } });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            events = Array.isArray(data) ? data : [];
            events.sort((a,b) => String(a.eventDate || "9999-12-31").localeCompare(String(b.eventDate || "9999-12-31")));
            message.textContent = "";
            updateSummary(events);
            applyFilters();
        } catch (error) {
            console.error("Unable to load events", error);
            events = [];
            updateSummary(events);
            message.textContent = "Could not load events from the server. Please try Refresh after the backend is running.";
            render([]);
        }
    }

    function openModal(id) {
        const event = events.find(e => String(e.eventId) === String(id));
        if (!event) return;
        document.getElementById("eventModalTitle").textContent = event.eventName || "Event Details";
        document.getElementById("eventModalDescription").textContent = event.description || "No description is available for this event.";
        document.getElementById("eventModalLocation").textContent = event.location || "To be announced";
        document.getElementById("eventModalDate").textContent = formatDate(event.eventDate);
        const statusEl = document.getElementById("eventModalStatus");
        statusEl.textContent = event.status || "Scheduled";
        statusEl.className = `badge ${statusClass(event.status)}`;
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    search.addEventListener("input", applyFilters);
    statusFilter.addEventListener("change", applyFilters);
    refresh.addEventListener("click", loadEvents);
    grid.addEventListener("click", e => {
        const btn = e.target.closest("[data-event-id]");
        if (btn) openModal(btn.dataset.eventId);
    });
    document.querySelectorAll("[data-close-event-modal]").forEach(el => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

    loadEvents();
})();

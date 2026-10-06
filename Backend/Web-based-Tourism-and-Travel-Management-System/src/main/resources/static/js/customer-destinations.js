(function () {
    "use strict";

    const cards = Array.from(document.querySelectorAll("[data-destination]"));
    const searchInput = document.getElementById("destinationSearch");
    const regionSelect = document.getElementById("destinationRegion");
    const experienceSelect = document.getElementById("destinationExperience");
    const emptyState = document.getElementById("destinationEmpty");
    const modal = document.getElementById("destinationModal");
    const panel = modal && modal.querySelector(".destination-modal-panel");
    const image = document.getElementById("destinationModalImage");
    const title = document.getElementById("destinationModalTitle");
    const region = document.getElementById("destinationModalRegion");
    const description = document.getElementById("destinationModalDescription");
    const highlights = document.getElementById("destinationModalHighlights");
    const packagesLink = document.getElementById("destinationPackagesLink");
    const plannerLink = document.getElementById("destinationPlannerLink");
    let lastFocusedElement = null;

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function applyFilters() {
        const query = normalize(searchInput && searchInput.value);
        const selectedRegion = normalize(regionSelect && regionSelect.value) || "all";
        const selectedExperience = normalize(experienceSelect && experienceSelect.value) || "all";
        let visibleCount = 0;

        cards.forEach(function (card) {
            const searchableText = normalize([
                card.dataset.name,
                card.dataset.region,
                card.dataset.experience,
                card.dataset.description,
                card.textContent
            ].join(" "));
            const regionMatches = selectedRegion === "all" || normalize(card.dataset.region) === selectedRegion;
            const experienceMatches = selectedExperience === "all"
                || normalize(card.dataset.experience).split(/\s+/).includes(selectedExperience);
            const queryMatches = !query || searchableText.includes(query);
            const visible = queryMatches && regionMatches && experienceMatches;

            card.hidden = !visible;
            card.style.display = visible ? "" : "none";
            if (visible) visibleCount += 1;
        });

        if (emptyState) emptyState.hidden = visibleCount !== 0;
    }

    function openDestination(card) {
        if (!modal || !card) return;

        lastFocusedElement = document.activeElement;
        const destinationName = card.dataset.name || "Destination";
        const encodedName = encodeURIComponent(destinationName);
        const items = String(card.dataset.highlights || "")
            .split("|")
            .map(function (item) { return item.trim(); })
            .filter(Boolean);

        if (title) title.textContent = destinationName;
        if (region) region.textContent = (card.dataset.region || "Sri Lanka").replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
        if (description) description.textContent = card.dataset.description || "Discover this beautiful Sri Lankan destination.";
        if (image) {
            image.style.backgroundImage = "linear-gradient(to top, rgba(18,35,22,.58), rgba(18,35,22,.06)), url('"
                + String(card.dataset.image || "") + "')";
        }
        if (highlights) {
            highlights.replaceChildren();
            items.forEach(function (item) {
                const listItem = document.createElement("li");
                listItem.textContent = item;
                highlights.appendChild(listItem);
            });
        }
        if (packagesLink) packagesLink.href = "/ui/customer-tour-packages?destination=" + encodedName;
        if (plannerLink) plannerLink.href = "/ui/customer-travel-planner?destination=" + encodedName;

        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("destination-modal-open");
        requestAnimationFrame(function () {
            modal.classList.add("is-open");
            if (panel) panel.focus();
        });
    }

    function closeDestination() {
        if (!modal || modal.hidden) return;

        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("destination-modal-open");

        window.setTimeout(function () {
            modal.hidden = true;
            if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
                lastFocusedElement.focus();
            }
        }, 220);
    }

    cards.forEach(function (card) {
        card.addEventListener("click", function () {
            openDestination(card);
        });

        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openDestination(card);
            }
        });
    });

    document.querySelectorAll("[data-destination-close]").forEach(function (button) {
        button.addEventListener("click", closeDestination);
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && modal && !modal.hidden) closeDestination();
    });

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (regionSelect) regionSelect.addEventListener("change", applyFilters);
    if (experienceSelect) experienceSelect.addEventListener("change", applyFilters);

    // Optional deep link: /ui/customer-destinations?destination=Ella
    const requestedDestination = new URLSearchParams(window.location.search).get("destination");
    if (requestedDestination) {
        const match = cards.find(function (card) {
            return normalize(card.dataset.name) === normalize(requestedDestination);
        });
        if (match) openDestination(match);
    }
})();

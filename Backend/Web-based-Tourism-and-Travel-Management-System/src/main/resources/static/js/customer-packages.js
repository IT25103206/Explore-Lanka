(function () {
    "use strict";

    const API_URL = "/api/packages";
    const grid = document.getElementById("customerPackageGrid");
    const search = document.getElementById("customerPackageSearch");
    const durationFilter = document.getElementById("customerPackageDuration");
    let packages = [];

    if (!grid || !search || !durationFilter) return;

    search.addEventListener("input", render);
    durationFilter.addEventListener("change", render);
    load();

    async function load() {
        try {
            const response = await fetch(API_URL, {credentials: "same-origin"});
            if (!response.ok) throw new Error("Could not load tour packages.");
            const data = await response.json();
            packages = (Array.isArray(data) ? data : []).filter(function (pkg) {
                return String(pkg.status || "").toUpperCase() === "ACTIVE";
            });
            render();
        } catch (error) {
            grid.innerHTML = '<div class="card customer-package-state is-error">' + escapeHtml(error.message) + '</div>';
        }
    }

    function render() {
        const query = search.value.trim().toLowerCase();
        const duration = durationFilter.value;
        const visible = packages.filter(function (pkg) {
            const matchesText = [pkg.packageName, pkg.category, pkg.description]
                .join(" ").toLowerCase().includes(query);
            return matchesText && matchesDuration(Number(pkg.durationDays || 0), duration);
        });

        if (!visible.length) {
            grid.innerHTML = '<div class="card customer-package-state">No tour packages match your search.</div>';
            return;
        }

        grid.innerHTML = visible.map(function (pkg) {
            const image = safeImageUrl(pkg.imageUrl) || "/images/Explore-lanka.jpg";
            return '<article class="card place customer-api-package">' +
                '<div class="place-cover" style="background-image:linear-gradient(to top,rgba(17,31,19,.62),rgba(17,31,19,.06)),url(\'' + escapeAttribute(image) + '\')">' +
                '<span>' + categoryIcon(pkg.category) + '</span></div>' +
                '<div class="place-body"><div class="customer-package-heading"><h4>' + escapeHtml(pkg.packageName) + '</h4>' +
                '<span class="customer-package-category">' + escapeHtml(pkg.category || "Tour") + '</span></div>' +
                '<p>' + escapeHtml(pkg.description || "Discover a memorable Explore Lanka experience.") + '</p>' +
                '<div class="meta"><span>' + escapeHtml(pkg.durationDays || "—") + ' Days</span>' +
                '<span>' + formatMoney(pkg.price) + '</span><span>Available</span></div>' +
                '<div class="customer-package-actions"><a class="btn btn-soft" href="/ui/customer-wishlist">♡ Save</a>' +
                '<a class="btn btn-primary" href="/ui/customer-package-details?id=' + encodeURIComponent(pkg.packageId) + '">View package</a></div>' +
                '</div></article>';
        }).join("");
    }

    function matchesDuration(days, value) {
        if (value === "SHORT") return days >= 1 && days <= 3;
        if (value === "MEDIUM") return days >= 4 && days <= 7;
        if (value === "LONG") return days >= 8;
        return true;
    }

    function categoryIcon(category) {
        const icons = {
            CULTURE: "🏯", NATURE: "🌿", ADVENTURE: "🥾", BEACH: "🏖",
            WILDLIFE: "🐘", HERITAGE: "🛕", WELLNESS: "🧘"
        };
        return icons[String(category || "").toUpperCase()] || "🌴";
    }

    function safeImageUrl(value) {
        const url = String(value || "").trim();
        return /^\/uploads\/packages\/[a-f0-9]+\.(jpg|png|webp|gif)$/i.test(url) ||
        /^\/images\/[a-z0-9._\/-]+$/i.test(url) ? url : "";
    }

    function formatMoney(value) {
        return "LKR " + Number(value || 0).toLocaleString("en-LK", {maximumFractionDigits: 0});
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
            return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[character];
        });
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, "&#96;");
    }
}());

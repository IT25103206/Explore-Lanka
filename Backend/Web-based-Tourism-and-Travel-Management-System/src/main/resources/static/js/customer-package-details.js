(function () {
    "use strict";

    const id = new URLSearchParams(window.location.search).get("id");
    const error = document.getElementById("packageDetailError");
    if (!id || !/^\d+$/.test(id)) {
        showError("Choose a tour package from the packages page.");
        return;
    }

    fetch("/api/packages/" + encodeURIComponent(id), {credentials: "same-origin"})
        .then(function (response) {
            if (!response.ok) throw new Error("This package could not be found.");
            return response.json();
        })
        .then(function (pkg) {
            document.getElementById("packageDetailName").textContent = pkg.packageName || "Tour Package";
            document.getElementById("packageDetailDescription").textContent = pkg.description || "A memorable Sri Lankan journey prepared by Explore Lanka.";
            document.getElementById("packageDetailDuration").textContent = (pkg.durationDays || "—") + " Days";
            document.getElementById("packageDetailPrice").textContent = "LKR " + Number(pkg.price || 0).toLocaleString("en-LK", {maximumFractionDigits: 0});
            document.getElementById("packageDetailCategory").textContent = pkg.category || "Tour";
            document.getElementById("packageBookLink").href = "/ui/customer-booking?packageId=" + encodeURIComponent(pkg.packageId);

            const image = safeImageUrl(pkg.imageUrl);
            if (image) {
                document.getElementById("packageDetailHero").style.backgroundImage =
                    "linear-gradient(105deg,rgba(19,61,29,.86),rgba(70,49,32,.50)),url('" + image + "')";
            }
        })
        .catch(function (requestError) {
            showError(requestError.message || "Could not load this package.");
        });

    function showError(message) {
        error.textContent = message;
        document.getElementById("packageDetailName").textContent = "Package unavailable";
        document.getElementById("packageDetailDescription").textContent = "Return to Tour Packages and choose another journey.";
    }

    function safeImageUrl(value) {
        const url = String(value || "").trim();
        return /^\/uploads\/packages\/[a-f0-9]+\.(jpg|png|webp|gif)$/i.test(url) ||
        /^\/images\/[a-z0-9._\/-]+$/i.test(url) ? url : "";
    }
}());

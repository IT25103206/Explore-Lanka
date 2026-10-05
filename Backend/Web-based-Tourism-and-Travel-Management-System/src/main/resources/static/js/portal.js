document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.querySelector(".sidebar");

    document.querySelectorAll("[data-menu]").forEach(function (button) {
        button.addEventListener("click", function () {
            if (sidebar) sidebar.classList.toggle("open");
        });
    });

    const storedName = sessionStorage.getItem("userName");
    document.querySelectorAll("[data-user-name]").forEach(function (element) {
        if (storedName) element.textContent = storedName;
    });

    document.querySelectorAll("[data-search]").forEach(function (input) {
        input.addEventListener("input", function (event) {
            const query = event.target.value.toLowerCase();
            document.querySelectorAll("[data-filter-item]").forEach(function (item) {
                item.style.display = item.innerText.toLowerCase().includes(query) ? "" : "none";
            });
        });
    });

    document.querySelectorAll("[data-toast]").forEach(function (button) {
        button.addEventListener("click", function () {
            const toast = document.createElement("div");
            toast.textContent = button.dataset.toast || "Saved successfully";
            Object.assign(toast.style, {
                position: "fixed",
                right: "24px",
                bottom: "24px",
                background: "#2e7032",
                color: "white",
                padding: "12px 16px",
                borderRadius: "12px",
                fontSize: "11px",
                zIndex: 9999,
                boxShadow: "0 12px 28px rgba(0,0,0,.18)"
            });
            document.body.appendChild(toast);
            setTimeout(function () { toast.remove(); }, 1800);
        });
    });

    document.querySelectorAll("[data-logout]").forEach(function (button) {
        button.addEventListener("click", async function () {
            const managementPage = window.location.pathname.startsWith("/ui/admin-");
            try {
                await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "same-origin"
                });
            } finally {
                sessionStorage.clear();
                window.location.href = managementPage ? "/admin/login" : "/ui/customer-login";
            }
        });
    });

    document.querySelectorAll(".pager:not([disabled])").forEach(function (button) {
        button.addEventListener("click", function () {
            if (!button.classList.contains("active")) {
                document.querySelectorAll(".pager").forEach(function (item) {
                    item.classList.remove("active");
                });
                if (/^\d+$/.test(button.textContent.trim())) button.classList.add("active");
            }
        });
    });

    document.querySelectorAll(".admin-stat h3").forEach(function (element) {
        element.style.opacity = "0";
        element.style.transform = "translateY(5px)";
        requestAnimationFrame(function () {
            element.style.transition = "opacity .45s ease, transform .45s ease";
            element.style.opacity = "1";
            element.style.transform = "translateY(0)";
        });
    });
});

// The server rejects cross-role page requests. This check synchronizes the UI
// with the authenticated server session instead of trusting sessionStorage.
// Admin pages: loads the role's allowed pages and hides sidebar links / quick actions it can't use.
var STAFF_ROLES = ["OWNER", "MANAGEMENT_SERVICE", "TOUR_OPERATIONS", "FINANCE", "MARKETING", "SYSTEM_ADMIN"];
window.portalReady = (async function synchronizePortalSession() {
    const path = window.location.pathname;
    const isAdminPath = path.startsWith("/ui/admin-") && path !== "/ui/admin-login";
    const isCustomerPath = path.startsWith("/ui/customer-") && path !== "/ui/customer-login";

    if (!isAdminPath && !isCustomerPath) return null;

    try {
        const response = await fetch("/api/auth/session", {credentials: "same-origin"});
        if (!response.ok) {
            sessionStorage.clear();
            window.location.replace(isAdminPath ? "/admin/login" : "/ui/customer-login");
            return null;
        }

        const data = await response.json();
        const role = (data.role || "").trim().toUpperCase();
        const staff = STAFF_ROLES.indexOf(role) > -1;

        if ((isAdminPath && !staff) || (isCustomerPath && role !== "CUSTOMER")) {
            sessionStorage.clear();
            window.location.replace("/access-denied");
            return null;
        }

        sessionStorage.setItem("userId", data.userId == null ? "" : String(data.userId));
        sessionStorage.setItem("userName", data.name || "");
        sessionStorage.setItem("userEmail", data.email || "");
        sessionStorage.setItem("userRole", role);

        const initial = (data.name || "?").trim().charAt(0).toUpperCase();
        document.querySelectorAll("[data-user-name]").forEach(function (el) { if (data.name) el.textContent = data.name; });
        document.querySelectorAll("[data-user-initial], .topbar .avatar").forEach(function (el) { el.textContent = initial; });

        if (isAdminPath) {
            const permRes = await fetch("/api/auth/permissions", {credentials: "same-origin"});
            if (permRes.ok) {
                const perm = await permRes.json();
                const pages = perm.pages || [];
                sessionStorage.setItem("adminPages", JSON.stringify(pages));
                sessionStorage.setItem("roleLabel", perm.roleLabel || role);
                document.querySelectorAll("[data-role-label]").forEach(function (el) { el.textContent = perm.roleLabel || role; });
                document.querySelectorAll("[data-page]").forEach(function (el) {
                    if (pages.indexOf(el.dataset.page) < 0) el.hidden = true;
                });
            }
        }
        return data;
    } catch (error) {
        console.error("Unable to verify the active session", error);
        return null;
    }
})();

(function () {
    "use strict";

    const form = document.getElementById("adminLoginForm");
    const usernameInput = document.getElementById("adminUsername");
    const passwordInput = document.getElementById("adminPassword");
    const messageBox = document.getElementById("messageBox");
    const toggleButton = document.getElementById("toggleAdminPassword");

    function showMessage(message, type) {
        if (!messageBox) return;
        messageBox.style.display = "block";
        messageBox.textContent = message;
        messageBox.className = "message-box " + (type === "success" ? "message-success" : "message-error");
    }

    if (toggleButton && passwordInput) {
        toggleButton.addEventListener("click", function () {
            const hidden = passwordInput.type === "password";
            passwordInput.type = hidden ? "text" : "password";
            toggleButton.textContent = hidden ? "🙈" : "👁";
        });
    }

    if (!form) return;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (messageBox) messageBox.style.display = "none";

        const loginData = {
            usernameOrEmail: usernameInput.value.trim(),
            password: passwordInput.value
        };

        try {
            const response = await fetch("/api/auth/admin-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify(loginData)
            });

            let data = {};
            try {
                data = await response.json();
            } catch (_) {
                data = {};
            }

            if (response.ok && data.success) {
                const role = (data.role || "").trim().toUpperCase();

                // Defense in depth: never treat CUSTOMER as a management account.
                if (role !== "OWNER" && role !== "MANAGEMENT_SERVICE") {
                    sessionStorage.clear();
                    showMessage("Access denied. Management staff or owner only.", "error");
                    return;
                }

                sessionStorage.setItem("userId", data.userId ?? "");
                sessionStorage.setItem("userName", data.name ?? "");
                sessionStorage.setItem("userEmail", data.email ?? "");
                sessionStorage.setItem("userRole", role);

                showMessage("Management login successful!", "success");
                window.location.href = "/ui/admin-dashboard";
                return;
            }

            // Important: customer credentials entered here stay on the admin login page.
            sessionStorage.clear();
            showMessage(data.message || "Invalid management login details.", "error");
        } catch (error) {
            console.error(error);
            showMessage("Unable to connect to the server.", "error");
        }
    });
})();

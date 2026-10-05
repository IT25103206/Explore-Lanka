// ===============================
// LOGIN / REGISTER FORM SWITCHING
// ===============================

function showLogin() {
    const loginSection = document.getElementById("loginSection");
    const registerSection = document.getElementById("registerSection");

    if (loginSection) loginSection.style.display = "block";
    if (registerSection) registerSection.style.display = "none";

    clearMessage();
}

function showRegister() {
    const loginSection = document.getElementById("loginSection");
    const registerSection = document.getElementById("registerSection");

    if (loginSection) loginSection.style.display = "none";
    if (registerSection) registerSection.style.display = "block";

    clearMessage();
}



// ===============================
// PASSWORD VISIBILITY
// ===============================

function togglePassword(inputId, button) {

    const input = document.getElementById(inputId);


    if (input.type === "password") {

        input.type = "text";

        button.textContent = "🙈";

    } else {

        input.type = "password";

        button.textContent = "👁";

    }

}



// ===============================
// MESSAGE
// ===============================

function showMessage(message, type) {

    const messageBox =
        document.getElementById("messageBox");


    messageBox.style.display = "block";

    messageBox.textContent = message;


    messageBox.className = "message-box";


    if (type === "success") {

        messageBox.classList.add(
            "message-success"
        );

    } else {

        messageBox.classList.add(
            "message-error"
        );

    }

}


function clearMessage() {

    const messageBox =
        document.getElementById("messageBox");


    messageBox.style.display = "none";

    messageBox.textContent = "";

}



// ===============================
// CUSTOMER LOGIN
// ===============================

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            clearMessage();


            const usernameOrEmail =
                document
                    .getElementById("loginUsername")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("loginPassword")
                    .value;


            const loginData = {

                usernameOrEmail:
                    usernameOrEmail,

                password:
                    password
            };


            try {

                const response =
                    await fetch(
                        "/api/auth/login",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "same-origin",

                            body:
                                JSON.stringify(
                                    loginData
                                )
                        }
                    );


                const data =
                    await response.json();


                if (response.ok &&
                    data.success) {

                    showMessage(
                        "Login successful!",
                        "success"
                    );


                    // Save basic logged-in user
                    sessionStorage.setItem(
                        "userId",
                        data.userId
                    );

                    sessionStorage.setItem(
                        "userName",
                        data.name
                    );

                    sessionStorage.setItem(
                        "userEmail",
                        data.email
                    );

                    sessionStorage.setItem(
                        "userRole",
                        data.role
                    );


                    setTimeout(
                        function () {

                            // This form uses /api/auth/login, which accepts CUSTOMER accounts only.
                            // Never route a management role from the customer login page.
                            if (data.role && data.role.trim().toUpperCase() === "CUSTOMER") {
                                window.location.href = "/ui/customer-dashboard";
                            } else {
                                sessionStorage.clear();
                                showMessage("Access denied. Please use the correct login portal.", "error");
                            }

                        },
                        700
                    );

                } else {

                    showMessage(
                        data.message ||
                        "Invalid login details.",
                        "error"
                    );

                }

            } catch (error) {

                console.error(error);


                showMessage(
                    "Unable to connect to the server.",
                    "error"
                );

            }

        }
    );



// ===============================
// CUSTOMER REGISTER
// ===============================

document
    .getElementById("registerForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            clearMessage();


            const name =
                document
                    .getElementById("name")
                    .value
                    .trim();


            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const nic =
                document
                    .getElementById("nic")
                    .value
                    .trim();


            const phone =
                document
                    .getElementById("phone")
                    .value
                    .trim();


            const address =
                document
                    .getElementById("address")
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "registerPassword"
                    )
                    .value;


            const confirmPassword =
                document
                    .getElementById(
                        "confirmPassword"
                    )
                    .value;



            // Check passwords

            if (
                password !==
                confirmPassword
            ) {

                showMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;

            }



            const registerData = {

                name: name,

                username: username,

                email: email,

                nic: nic,

                password: password,

                phone: phone,

                address: address
            };


            try {

                const response =
                    await fetch(
                        "/api/auth/register",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"
                            },

                            credentials:
                                "same-origin",

                            body:
                                JSON.stringify(
                                    registerData
                                )
                        }
                    );


                const data =
                    await response.json();


                if (response.ok &&
                    data.success) {

                    showMessage(
                        "Registration successful! You can now login.",
                        "success"
                    );


                    document
                        .getElementById(
                            "registerForm"
                        )
                        .reset();


                    setTimeout(
                        function () {

                            showLogin();

                        },
                        1200
                    );

                } else {

                    showMessage(
                        data.message ||
                        "Registration failed.",
                        "error"
                    );

                }

            } catch (error) {

                console.error(error);


                showMessage(
                    "Unable to connect to the server.",
                    "error"
                );

            }

        }
    );

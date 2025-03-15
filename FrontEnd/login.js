document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector("#login-form");
    const apiUrl = "http://localhost:5678/api/users/login";

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        const email = document.querySelector("#email").value;
        const password = document.querySelector("#password").value;
        
        const loginData = {
            email: email,
            password: password
        };
        
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error("Identifiants incorrects. Veuillez réessayer.");
            }
            
            localStorage.setItem("token", result.token);
            alert("Connecté");
            window.location.href = "index.html";
        } catch (error) {
            displayErrorMessage(error.message);
        }
    });

    function displayErrorMessage(message) {
        let errorElement = document.querySelector(".error-message");
        if (!errorElement) {
            errorElement = document.createElement("p");
            errorElement.classList.add("error-message");
            errorElement.style.color = "red";
            errorElement.style.marginTop = "10px";
            loginForm.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }
});

document.addEventListener("DOMContentLoaded", () => { 
    const gallery = document.querySelector(".gallery");
    const filtersContainer = document.querySelector(".filters");
    const portfolioSection = document.querySelector("#portfolio");
    const apiUrl = "http://localhost:5678/api/works";
    const categoriesUrl = "http://localhost:5678/api/categories";
    const navBar = document.querySelector("nav ul");
    let allProjects = [];

    function isAdmin() {
        return localStorage.getItem("token") !== null;
    }

    function setupPortfolioView() {
        const loginTitle = document.querySelector("#titres-login");
        const portfolioTitle = document.querySelector("#portfolio h2");
        const modeEditionBar = document.getElementById("mode-edition-bar");
        const body = document.body;
    
        if (isAdmin()) {
            filtersContainer.style.display = "none";
            addAdminEditButton();
            updateNavBar("logout");
    
            if (loginTitle) loginTitle.style.display = "flex";
            if (portfolioTitle) portfolioTitle.style.marginLeft = "100px";
            if (modeEditionBar) modeEditionBar.style.display = "block";
            if (body) body.style.paddingTop = "10px"; // 👈 ajoute le padding
        } else {
            fetchCategories();
            updateNavBar("login");
    
            if (loginTitle) loginTitle.style.display = "initial";
            if (portfolioTitle) portfolioTitle.style.marginLeft = "initial";
            if (modeEditionBar) modeEditionBar.style.display = "none";
            if (body) body.style.paddingTop = "initial"; // 👈 retire le padding
        }
    }    

    function ensureProjectsAreVisible() {
        if (gallery.innerHTML.trim() === "") {
            fetchProjects();
        }
    }

    function addAdminEditButton() { 
        const editButton = document.createElement("button");
        editButton.innerHTML = '<i class="fa fa-edit"></i> modifier';
        editButton.classList.add("edit-btn");
        editButton.addEventListener("click", openModal);
    
        if (!document.querySelector(".edit-btn")) {
            const title = document.querySelector("#portfolio h2");
            title.insertAdjacentElement("afterend", editButton);
        }        
    }
        
    function updateNavBar(type) {
        const existingAuthItem = document.querySelector("#auth-item");
        if (existingAuthItem) {
            existingAuthItem.remove();
        }
        
        const authItem = document.createElement("li");
        authItem.id = "auth-item";
        const authLink = document.createElement("a");

        if (type === "logout") {
            authLink.textContent = "logout";
            authLink.href = "#";
            authLink.addEventListener("click", () => {
                localStorage.removeItem("token");
                window.location.reload();
            });
        } else {
            authLink.textContent = "login";
            authLink.href = "login.html";
        }

        authItem.appendChild(authLink);
        const loginItem = document.querySelector("nav ul li:nth-child(3)");
        if (loginItem) {
            navBar.replaceChild(authItem, loginItem);
        } else {
            navBar.appendChild(authItem);
        }
    }

    async function isServerOnline() {
        try {
            const response = await fetch("http://localhost:5678/api/categories", { method: "GET" });
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    function openModal() {
        const modal = document.createElement("div");
        modal.classList.add("modal-overlay");
        modal.innerHTML = `
            <div class="modal-container">
                <span class="close-modal">&times;</span>
                <h2 id="G-PH">Galerie photo</h2>
                <div class="modal-gallery"></div>
                <hr>
                <button class="add-photo">Ajouter une photo</button>
            </div>
        `;
        document.body.appendChild(modal);
    
        // Ajout de l'événement pour ouvrir la modale d'ajout de photo
        document.querySelector(".add-photo").addEventListener("click", async () => {
            const isOnline = await isServerOnline();
        
            if (isOnline) {
                openAddPhotoModal();
            } else {
                const modalContainer = document.querySelector(".modal-container");
                const existingError = document.querySelector(".photo-modal-error");
        
                if (!existingError && modalContainer) {
                    const errorMsg = document.createElement("p");
                    errorMsg.textContent = "Impossible d’ouvrir la modale d’ajout : le serveur est inaccessible.";
                    errorMsg.classList.add("photo-modal-error");
                    errorMsg.style.color = "red";
                    errorMsg.style.marginTop = "10px";
                    modalContainer.appendChild(errorMsg);
                }
        
                showToast("Erreur réseau : serveur inaccessible", "error");
            }
        });        
    
        document.querySelector(".close-modal").addEventListener("click", () => {
            modal.remove();
        });
    
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    
        displayProjectsInModal(allProjects);
    }    
    
    function openAddPhotoModal() {
        const modal = document.querySelector(".modal-container");
        modal.innerHTML = `
            <span class="close-modal">&times;</span>
            <span class="back-modal">&larr;</span>
            <h2 id="APT">Ajout photo</h2>
            <form id="photoForm">
                <div class="upload-section">
                    <label for="fileInput" class="upload-label">
                        <i class="fa-regular fa-image fa-5x"></i>
                        <span class="upload-text">
                            <p>+ Ajouter photo</p>
                        </span>
                        <input type="file" id="fileInput" accept="image/png, image/jpeg" hidden>
                        <p id="taille-p">jpg, png : 4mo max</p>
                    </label>
                    <img id="previewImage" class="hidden" />
                </div>
                <label for="title" id="titre-AP">Titre</label>
                <input type="text" id="title" required>
                <label for="category" id="cath-AP">Catégorie</label>
                <select id="category" required></select>
                <hr id="hr-AP">
                <button type="submit" class="validate-btn">Valider</button>
                <p class="form-error hidden">Veuillez remplir tous les champs et ajouter une photo.</p>
            </form>
        `;

        document.getElementById("previewImage").addEventListener("click", () => {
            document.getElementById("fileInput").click();
        });        
    
        // Retour à la modale précédente
        document.querySelector(".back-modal").addEventListener("click", () => {
            closeAllModals();  // Supprime la modale en cours
            openModal();       // Réouvre celle de la galerie
        });        
    
        // Fermeture de la modale
        document.querySelector(".close-modal").addEventListener("click", () => {
            document.querySelector(".modal-overlay").remove();
        });
    
        // Charger les catégories
        fetchCategoriesForSelect();
    
        // Activation du bouton seulement si tout est rempli
        // document.getElementById("photoForm").addEventListener("input", validateForm);
    
        // Gestion de l'affichage de l'image sélectionnée
        document.getElementById("fileInput").addEventListener("change", previewSelectedImage);
    
        // Ajout de l'événement pour soumettre le formulaire
        const photoForm = document.getElementById("photoForm");
        photoForm.addEventListener("submit", (e) => submitPhoto(e));
    }
    
/**
 * 
 */
    async function fetchProjects() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des projets");
            }
            allProjects = await response.json();
            displayProjects(allProjects);
            if (document.querySelector(".modal-gallery")) {
                displayProjectsInModal(allProjects);
            }

        } catch (error) {
            console.error("Erreur :", error);
        }
    }

    async function fetchCategories() {
        try {
            const response = await fetch(categoriesUrl);
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des catégories");
            }
            const categories = await response.json();
            createFilterButtons(categories);
        } catch (error) {
            console.error("Erreur :", error);
        }
    }

    /**
     * 
     * @param {*} categories 
     */
    function createFilterButtons(categories) {
        filtersContainer.innerHTML = '';
        const allBtn = document.createElement("button");
        allBtn.classList.add("filter-btn", "active");
        allBtn.dataset.category = "all";
        allBtn.textContent = "Tous";
        filtersContainer.appendChild(allBtn);
        categories.forEach(category => {
            const btn = document.createElement("button");
            btn.classList.add("filter-btn");
            btn.dataset.category = category.id;
            btn.textContent = category.name;
            filtersContainer.appendChild(btn);
        });
        addFilterEventListeners();
    }

    function addFilterEventListeners() {
        const buttons = document.querySelectorAll(".filter-btn");
        buttons.forEach(button => {
            button.addEventListener("click", () => {
                buttons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");
                const categoryId = button.dataset.category;
                filterProjects(categoryId);
            });
        });
    }

    function filterProjects(categoryId) {
        if (categoryId === "all") {
            displayProjects(allProjects);
        } else {
            const filteredProjects = allProjects.filter(project => project.categoryId == categoryId);
            displayProjects(filteredProjects);
        }
    }

    function displayProjects(projects) {
        gallery.innerHTML = "";
        projects.forEach(project => {
            const figure = document.createElement("figure");
            const img = document.createElement("img");
            img.src = project.imageUrl;
            img.alt = project.title;
            const figcaption = document.createElement("figcaption");
            figcaption.textContent = project.title;
            figure.appendChild(img);
            figure.appendChild(figcaption);
            gallery.appendChild(figure);
        });
    }

    function displayProjectsInModal(projects) {
        const modalGallery = document.querySelector(".modal-gallery");
        if (!modalGallery) return; // Vérifie que l'élément existe
    
        modalGallery.innerHTML = ""; // Vide la galerie avant d'ajouter les éléments
    
        projects.forEach(project => {
            const figure = document.createElement("figure");
            figure.classList.add("modal-item");
    
            const img = document.createElement("img");
            img.src = project.imageUrl;
            img.alt = project.title;
    
            const deleteIcon = document.createElement("span");
            deleteIcon.classList.add("delete-icon");
            deleteIcon.innerHTML = "🗑";
            deleteIcon.addEventListener("click", () => deleteProject(project.id));
    
            figure.appendChild(img);
            figure.appendChild(deleteIcon);
            modalGallery.appendChild(figure);
        });
    }    
    
    async function deleteProject(projectId) {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
    
            const response = await fetch(`${apiUrl}/${projectId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
    
            if (!response.ok) {
                throw new Error("Erreur lors de la suppression du projet");
            }
    
            showToast("Projet supprimé avec succès", "success");
    
            await fetchProjects(); // Recharge les projets dans la galerie
        } catch (error) {
            console.error("Erreur :", error);
            showToast("Erreur lors de la suppression", "error");
        }
    }    

    async function fetchCategoriesForSelect() {
        try {
            const response = await fetch("http://localhost:5678/api/categories");
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des catégories");
            }
            const categories = await response.json();
            console.log("📌 Catégories chargées :", categories);
    
            const select = document.getElementById("category");
            select.innerHTML = "";
    
            categories.forEach(category => {
                const option = document.createElement("option");
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
    
        } catch (error) {
            console.error("🚨 Erreur fetch catégories :", error);
    
            // 🔻 Création d’un message d’erreur dans la modale
            const form = document.getElementById("photoForm");
            const existingError = document.querySelector(".category-fetch-error");
            if (!existingError && form) {
                const errorMsg = document.createElement("p");
                errorMsg.textContent = "Impossible de charger les catégories. Le serveur ne répond pas.";
                errorMsg.classList.add("category-fetch-error");
                errorMsg.style.color = "red";
                errorMsg.style.marginTop = "10px";
                form.appendChild(errorMsg);
            }
    
            // Bonus UX : petit toast
            showToast("Erreur réseau : impossible de charger les catégories", "error");
        }
    }     

    function previewSelectedImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.getElementById("previewImage");
                preview.src = e.target.result;
                preview.classList.remove("hidden");
    
                // 👇 Cacher le label
                const uploadLabel = document.querySelector(".upload-label");
                if (uploadLabel) uploadLabel.style.display = "none";
    
                // 👇 Supprimer le padding de la section
                const uploadSection = document.querySelector(".upload-section");
                if (uploadSection) uploadSection.style.padding = "0";
            };
            reader.readAsDataURL(file);
        }
    }     

    function validateForm() {
        const file = document.getElementById("fileInput").files.length > 0;
        const title = document.getElementById("title").value.trim() !== "";
        const category = document.getElementById("category").value !== "";
    
        document.querySelector(".validate-btn").disabled = !(file && title && category);
    }

    function closeAllModals() {
        const modalOverlay = document.querySelector(".modal-overlay");
        if (modalOverlay) {
            modalOverlay.remove();
        }
    }
    
    function showToast(message, type = "info") {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }    
    
    async function submitPhoto(event) {
        console.log("🟢 submitPhoto appelé !");
        event.preventDefault();
    
        const imageInput = document.getElementById("fileInput");
        const titleInput = document.getElementById("title");
        const categorySelect = document.getElementById("category");
        const errorText = document.querySelector(".form-error");
        console.log("🔍 form-error trouvé :", errorText);
    
        const imageFile = imageInput.files[0];
        const titleValue = titleInput.value.trim();
        const categoryValue = categorySelect.value;
    
        // Reset du message
        // errorText.classList.add("hidden");
        console.log("🟠 SUBMIT bouton cliqué !");
        console.log("📷 Image ? ", imageInput.files.length > 0);
        console.log("📝 Titre ? ", titleValue);
        console.log("📂 Catégorie ? ", categoryValue);
        console.log("🔁 validateForm appelée");
    
        if (!imageFile || !titleValue || !categoryValue || isNaN(parseInt(categoryValue))) {
            errorText.textContent = "Veuillez remplir tous les champs et ajouter une photo.";
            errorText.classList.remove("hidden");
            return;
        }
    
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("title", titleValue);
        formData.append("category", categoryValue);
    
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                errorText.textContent = "Vous devez être connecté.";
                errorText.classList.remove("hidden");
                return;
            }
    
            const response = await fetch("http://localhost:5678/api/works", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData
            });
    
            const result = await response.json();
    
            if (!response.ok) {
                throw new Error(`Erreur ${response.status} : ${JSON.stringify(result)}`);
            }
    
            showToast("Photo ajoutée avec succès !", "success");
            await fetchProjects();
            closeAllModals();
        } catch (error) {
            console.error("🚨 Erreur lors de l'envoi :", error);
        
            if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
                errorText.textContent = "Impossible de se connecter au serveur. Veuillez réessayer plus tard.";
            } else {
                errorText.textContent = "L'envoi a échoué : " + error.message;
            }
        
            errorText.classList.remove("hidden");
        }        
    }  
    
    setupPortfolioView();
    ensureProjectsAreVisible();
    fetchProjects();
});
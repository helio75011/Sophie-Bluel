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
        if (isAdmin()) {
            filtersContainer.style.display = "none"; // Cache les filtres pour l’admin
            addAdminEditButton();
            updateNavBar("logout");
        } else {
            fetchCategories();
            updateNavBar("login");
        }
    }

    function ensureProjectsAreVisible() {
        if (gallery.innerHTML.trim() === "") {
            fetchProjects();
        }
    }

    function addAdminEditButton() {
        const editButton = document.createElement("button");
        editButton.textContent = "Modifier";
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

    function openModal() {
        const modal = document.createElement("div");
        modal.classList.add("modal-overlay");
        modal.innerHTML = `
            <div class="modal-container">
                <span class="close-modal">&times;</span>
                <h2>Galerie photo</h2>
                <div class="modal-gallery"></div>
                <button class="add-photo">Ajouter une photo</button>
            </div>
        `;
        document.body.appendChild(modal);
    
        // Vérifie que les projets sont chargés dans la modale
        displayProjectsInModal(allProjects);
    
        document.querySelector(".close-modal").addEventListener("click", () => {
            modal.remove();
        });
    
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    

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
    
            // Mettre à jour les projets après suppression
            fetchProjects();
        } catch (error) {
            console.error("Erreur :", error);
        }
    }    

    setupPortfolioView();
    ensureProjectsAreVisible();
    fetchProjects();
});
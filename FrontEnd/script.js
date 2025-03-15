document.addEventListener("DOMContentLoaded", () => {
    const gallery = document.querySelector(".gallery");
    const filtersContainer = document.querySelector(".filters");
    
    const apiUrl = "http://localhost:5678/api/works";
    const categoriesUrl = "http://localhost:5678/api/categories";
    
    let allProjects = [];

    async function fetchProjects() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des projets");
            }
            allProjects = await response.json();
            displayProjects(allProjects);
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

    fetchCategories();
    fetchProjects();
});
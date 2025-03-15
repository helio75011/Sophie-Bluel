document.addEventListener("DOMContentLoaded", () => {
    const gallery = document.querySelector(".gallery");
    
    // URL de l'API
    const apiUrl = "http://localhost:5678/api/works";
    
    // Fonction pour récupérer les données de l'API
    async function fetchProjects() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération des projets");
            }
            const projects = await response.json();
            displayProjects(projects);
        } catch (error) {
            console.error("Erreur :", error);
        }
    }
    
    // Fonction pour afficher les projets dans la galerie
    function displayProjects(projects) {
        gallery.innerHTML = ""; // Vide la galerie avant d'ajouter les éléments
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
    
    // Appel de la fonction pour charger les projets
    fetchProjects();
});
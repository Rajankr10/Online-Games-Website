import { app, db, auth } from "./firebase-config.js";
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Configuration for shows
const showsConfig = [
  {
    name: "Rick and Morty",
    containerId: "rickandmorty-results",
    detailsPage: "rick-and-morty-search.html",
  },
  {
    name: "Pokemon",
    containerId: "pokemon-results",
    detailsPage: "pokemon.html",
  },
  {
    name: "Marvel",
    containerId: "marvel-results",
    detailsPage: "marvel.html",
  },
  {
    name: "Disney",
    containerId: "disney-results",
    detailsPage: "disney.html",
  },
];

// Check if user is authenticated
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showsConfig.forEach((show) => {
        displayFavorites(
          user,
          show.name,
          show.containerId,
          (id, type, showName) => navigateToDetails(id, type, showName, show.detailsPage),
          removeFavorite
        );
      });
    } else {
      alert("You must be logged in to view your favorites.");
      window.location.href = "login.html"; // Redirect to login page if not logged in
    }
  });
});

// Generic function to fetch and display favorite items
async function displayFavorites(user, showName, containerId, detailsFunction, removeFunction) {
  const userId = user.uid;
  const favoritesContainer = document.getElementById(containerId);
  favoritesContainer.innerHTML = '<p>Loading favorites...</p>'; // Loading state

  try {
    const q = query(
      collection(db, "favorites", userId, "items"),
      where("showName", "==", showName),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      favoritesContainer.innerHTML = `<p>No favorite ${showName} items found.</p>`;
      return;
    }

    favoritesContainer.innerHTML = ''; // Clear loading state
    querySnapshot.forEach((doc) => {
      const favorite = doc.data();
      const card = createFavoriteCard(favorite, doc.id, detailsFunction, removeFunction);
      favoritesContainer.appendChild(card);
    });
  } catch (error) {
    console.error(`Error fetching ${showName} favorites:`, error);
    favoritesContainer.innerHTML = `<p>Error loading favorites. Please try again later.</p>`;
  }
}

// Function to create a favorite card
function createFavoriteCard(favorite, docId, detailsFunction, removeFunction) {
  const card = document.createElement("div");
  card.className = "favorite-card";
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View details for ${favorite.name}`);

  card.innerHTML = `
    <img src="${favorite.image || 'placeholder.png'}" alt="${favorite.name}" />
    <h2>${favorite.name}</h2>
    <p>Type: ${favorite.type}</p>
    <button class="remove-favorite" aria-label="Remove ${favorite.name} from favorites">Remove</button>
  `;

  // Add click event for viewing details
  card.addEventListener("click", () => detailsFunction(favorite.id, favorite.type, favorite.showName));

  // Add click event for removing favorite
  const removeButton = card.querySelector(".remove-favorite");
  removeButton.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent card click event from triggering
    removeFunction(event, docId, favorite.showName, card);
  });

  return card;
}

// Function to remove a favorite from Firestore
async function removeFavorite(event, itemId, showName, card) {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to remove favorites.");
    return;
  }

  const userId = user.uid;

  try {
    await deleteDoc(doc(db, "favorites", userId, "items", itemId));
    card.remove(); // Remove the card from the UI
    alert("Favorite removed successfully.");
  } catch (error) {
    console.error(`Error removing ${showName} favorite:`, error);
    alert("Failed to remove favorite.");
  }
}

// Navigation function
function navigateToDetails(id, type, showName, page) {
  localStorage.setItem(
    "selectedItem",
    JSON.stringify({ id, type, showName })
  );
  window.location.href = page;
}

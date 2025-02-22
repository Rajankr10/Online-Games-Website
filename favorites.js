// Ensure Firebase is initialized correctly
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            displayFavoritesRickAndMorty(user);
            displayFavoritesPokemon(user);
            displayFavoritesMarvel(user);
            displayFavoritesDisney(user);
        } else {
            alert("You must be logged in to view your favorites.");
            window.location.href = "login.html"; // Redirect to login page if not logged in
        }
    });
});

// Fetch and display favorite items for Rick and Morty
async function displayFavoritesRickAndMorty(user) {
    const userId = user.uid;
    const favoritesContainer = document.getElementById('rickandmorty-results');
    favoritesContainer.innerHTML = '';

    try {
        const querySnapshot = await db.collection("favorites")
            .doc(userId)
            .collection("items")
            .where("showName", "==", "Rick and Morty")
            .orderBy("timestamp", "desc")
            .get();

        querySnapshot.forEach((doc) => {
            const favorite = doc.data();
            const card = document.createElement('div');
            card.className = 'favorite-card';

            card.innerHTML = `
                <button class="remove-favorite" onclick="removeFavoritesRick_Morty(event, '${doc.id}')">Remove</button>
                <img src="${favorite.image || 'logo.png'}" alt="${favorite.name}">
                <h2>${favorite.name}</h2>
                <p>Type: ${favorite.type}</p>
            `;

            favoritesContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Error fetching Rick and Morty favorites:", error);
        alert("Failed to load Rick and Morty favorites.");
    }
}

// Function to remove a favorite from Firestore for Rick and Morty
async function removeFavoritesRick_Morty(event, itemId) {
    event.stopPropagation(); // Prevent card click event from triggering
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to remove favorites.");
        return;
    }

    const userId = user.uid;

    try {
        await db.collection('favorites')
            .doc(userId)
            .collection('items')
            .doc(itemId)
            .delete();

        alert("Favorite removed successfully.");
        await displayFavoritesRickAndMorty(user); // Refresh the list
    } catch (error) {
        console.error("Error removing Rick and Morty favorite:", error);
        alert("Failed to remove favorite.");
    }
}

// Fetch and display favorite Pokémon items
async function displayFavoritesPokemon(user) {
    const favoritesContainer = document.getElementById('pokemon-results');
    favoritesContainer.innerHTML = '';

    const userId = user.uid;

    try {
        const snapshot = await db.collection('favorites')
            .doc(userId)
            .collection('items')
            .where('showName', '==', 'Pokemon')
            .orderBy("timestamp", "desc")
            .get();

        if (snapshot.empty) {
            favoritesContainer.innerHTML = '<p>No favorite Pokémon found.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const favorite = doc.data();

            const favoriteElement = document.createElement('div');
            favoriteElement.className = 'favorite-item';

            favoriteElement.innerHTML = `
                <div class="favorite-content">
                    <h2>${favorite.name}</h2>
                    <img src="${favorite.image}" alt="${favorite.name}">
                    <button class="remove-favorite-btn" 
                        onclick="removeFavoritesPokemon(event, '${doc.id}', 'Pokemon')">
                        Remove from Favorites
                    </button>
                </div>
            `;

            favoritesContainer.appendChild(favoriteElement);
        });

    } catch (error) {
        console.error('Failed to load Pokémon favorites:', error);
        favoritesContainer.innerHTML = '<p>Error loading favorites. Please try again later.</p>';
    }
}

// Function to remove a favorite Pokémon from Firestore
async function removeFavoritesPokemon(event, favoriteId, showName) {
    event.stopPropagation(); // Prevent card click event from triggering
    const user = auth.currentUser;

    if (!user) {
        alert('Please log in to manage favorites.');
        return;
    }

    const userId = user.uid;

    try {
        await db.collection('favorites')
            .doc(userId)
            .collection('items')
            .doc(favoriteId)
            .delete();

        alert("Favorite removed successfully.");
        await displayFavoritesPokemon(user); // Refresh the list
    } catch (error) {
        console.error("Error removing Pokémon favorite:", error);
        alert("Failed to remove favorite.");
    }
}

async function displayFavoritesMarvel(user) {
    const userId = user.uid;
    const favoritesContainer = document.getElementById('marvel-results');
    favoritesContainer.innerHTML = '';

    try {
        const querySnapshot = await db.collection('favorites')
            .doc(userId)
            .collection('items')
            .where('showName', '==', 'Marvel')
            .orderBy("timestamp", "desc")
            .get();

        querySnapshot.forEach((doc) => {
            const favorite = doc.data();
            const card = document.createElement('div');
            card.className = 'favorite-card';

            card.innerHTML = `
                <button class="remove-favorite" onclick="removeFavoritesMarvel(event, '${doc.id}')">Remove</button>
                <img src="${favorite.image || 'logo.png'}" alt="${favorite.name}">
                <h2>${favorite.name}</h2>
                <p>Type: ${favorite.type}</p>
            `;

            favoritesContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load Marvel favorites:', error);
        favoritesContainer.innerHTML = '<p>Error loading favorites. Please try again later.</p>';
    }
}

// Function to remove a favorite Marvel item
async function removeFavoritesMarvel(event, itemId) {
    event.stopPropagation();
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to remove favorites.");
        return;
    }

    const userId = user.uid;

    try {
        await db.collection('favorites')
            .doc(userId)
            .collection('items')
            .doc(itemId)
            .delete();

        alert("Favorite removed successfully.");
        await displayFavoritesMarvel(user);
    } catch (error) {
        console.error("Error removing Marvel favorite:", error);
        alert("Failed to remove favorite.");
    }
}


async function displayFavoritesDisney(user) {
    const userId = user.uid;
    const favoritesContainer = document.getElementById('disney-results');
    favoritesContainer.innerHTML = '';

    try {
        const querySnapshot = await db.collection('favorites')
            .doc(userId)
            .collection('items')
            .where('showName', '==', 'Disney')
            .orderBy("timestamp", "desc")
            .get();

        querySnapshot.forEach((doc) => {
            const favorite = doc.data();
            const card = document.createElement('div');
            card.className = 'favorite-card';

            card.innerHTML = `
                <button class="remove-favorite" onclick="removeFavoritesDisney(event, '${doc.id}')">Remove</button>
                <img src="${favorite.image || 'logo.png'}" alt="${favorite.name}">
                <h2>${favorite.name}</h2>
                <p>Type: ${favorite.type}</p>
            `;

            favoritesContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load Disney favorites:', error);
        favoritesContainer.innerHTML = '<p>Error loading favorites. Please try again later.</p>';
    }
}

// Function to remove a favorite Disney item
async function removeFavoritesDisney(event, itemId) {
    event.stopPropagation();
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to remove favorites.");
        return;
    }

    const userId = user.uid;

    try {
        await db.collection('favorites')
            .doc(userId)
            .collection('items')
            .doc(itemId)
            .delete();

        alert("Favorite removed successfully.");
        await displayFavoritesDisney(user);
    } catch (error) {
        console.error("Error removing Disney favorite:", error);
        alert("Failed to remove favorite.");
    }
}

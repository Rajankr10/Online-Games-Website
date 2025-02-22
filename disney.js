// Ensure Firebase is initialized correctly
const auth = firebase.auth();
const db = firebase.firestore();
let favoriteIds = new Set();
let currentPage = 1;
const totalPages = 149;
let previousState = null;
let currentSearchQuery = '';

document.addEventListener('DOMContentLoaded', async () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadFavorites();
        }
        fetchCharacters();
    });

    // Hide suggestions when clicking outside the input and suggestions container
    document.addEventListener('click', (event) => {
        const suggestionsContainer = document.getElementById('suggestions-container');
        const nameInput = document.getElementById('character-name');

        if (suggestionsContainer && !suggestionsContainer.contains(event.target) && event.target !== nameInput) {
            suggestionsContainer.innerHTML = '';
        }
    });
});

async function loadFavorites() {
    const user = auth.currentUser;
    favoriteIds.clear(); // Clear previous favorites

    if (!user) return;

    const userId = user.uid;
    try {
        const favoritesSnapshot = await db.collection("favorites")
            .doc(userId)
            .collection("items")
            .where("showName", "==", "Disney")
            .where("type", "==", "character")
            .get();

        favoritesSnapshot.forEach((doc) => {
            const data = doc.data();
            const compositeId = `Disney_${data.id}` 
            favoriteIds.add(compositeId);
        });
        console.log("Favorites loaded:", favoriteIds);
    } catch (error) {
        console.error("Error fetching favorites:", error);
        alert("Failed to load favorites.");
    }
}

async function addToFavorites(id, name, type, image, iconContainer) {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to add favorites.");
        return;
    }

    const userId = user.uid;
    const compositeId = `Disney_${id}`; // Create a unique ID for the favorite
    const favoriteRef = db.collection("favorites").doc(userId).collection("items").doc(compositeId);

    try {
        const doc = await favoriteRef.get();
        if (doc.exists) {
            await favoriteRef.delete();
            iconContainer.classList.remove('favorited');
            favoriteIds.delete(compositeId); // Remove from local set
            alert(`${name} removed from favorites.`);
        } else {
            await favoriteRef.set({
                id,
                name,
                type,
                image,
                userId,
                showName: 'Disney',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            iconContainer.classList.add('favorited');
            favoriteIds.add(compositeId); // Add to local set
            alert(`${name} added to favorites!`);
        }
    } catch (error) {
        console.error("Error adding favorite:", error);
        alert("Failed to add favorite.");
    }
}


async function fetchCharacters(page = 1) {
    const characterInfoContainer = document.getElementById('character-info');
    characterInfoContainer.innerHTML = '';

    try {
        const response = await fetch(`https://api.disneyapi.dev/character?page=${page}`);
        if (!response.ok) throw new Error('Failed to fetch characters');

        const data = await response.json();
        const characters = Array.isArray(data.data) ? data.data : [];

        if (characters.length === 0) {
            characterInfoContainer.innerHTML = '<p>No characters found.</p>';
            return;
        }

        characters.forEach(characterData => {
            if (!characterData.imageUrl) return;
            const characterElement = document.createElement('div');
            characterElement.className = 'character-item';
            characterElement.dataset.characterId = characterData._id; // Add character ID
            const characterDataStr = JSON.stringify(characterData).replace(/'/g, "");
            characterElement.innerHTML = `
                <div class="favorite-icon" onclick="toggleFavorite('${characterData._id}', '${characterData.name}', 'character', '${characterData.imageUrl}', this)">
                    <i class="${favoriteIds.has(`Disney_${characterData._id}`) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </div>
                <div onclick='displayCharacterDetails(${characterDataStr})'>
                    <h2>${characterData.name}</h2>
                    <img src="${characterData.imageUrl}" alt="${characterData.name}">
                </div>
            `;
            characterInfoContainer.appendChild(characterElement);
        });

        updatePageInfo(data.totalPages);
    } catch (error) {
        characterInfoContainer.innerHTML = `<p>${error.message}</p>`;
    }
}

async function toggleFavorite(id, name, type, image, iconContainer) {
    await addToFavorites(id, name, type, image, iconContainer);
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        fetchCharacters(currentPage);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        fetchCharacters(currentPage);
    }
}

function updatePageInfo() {
    const pageInfo = document.getElementById('page-info');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

async function searchCharacter() {
    const characterName = document.getElementById('character-name').value.trim();

    if (!characterName) {
        alert("Please enter a character name!");
        return;
    }

    const characterInfoContainer = document.getElementById('character-info');
    characterInfoContainer.innerHTML = '';

    closeModal();

    try {
        const encodedCharacterName = characterName.replace(/ /g, '%20');
        const response = await fetch(`https://api.disneyapi.dev/character?name=${encodedCharacterName}`);
        if (!response.ok) throw new Error('Character not found');

        const data = await response.json();

        if (Array.isArray(data.data)) {
            const characters = data.data;

            if (characters.length === 0) throw new Error('Character not found');

            characters.forEach(characterData => {
                const characterElement = document.createElement('div');
                characterElement.className = 'character-item';
                characterElement.dataset.characterId = characterData._id; // Add character ID
                const characterDataStr = JSON.stringify(characterData).replace(/'/g, "");
                characterElement.innerHTML = `
                    <div class="favorite-icon" onclick="toggleFavorite('${characterData._id}', '${characterData.name}', 'character', '${characterData.imageUrl}', this)">
                        <i class="${favoriteIds.has(`Disney_${characterData._id}`) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>

                    </div>
                    <div onclick='displayCharacterDetails(${characterDataStr})'>
                        <h2>${characterData.name}</h2>
                        <img src="${characterData.imageUrl}" alt="${characterData.name}">
                    </div>
                `;
                characterInfoContainer.appendChild(characterElement);
            });
        } else {
            const characterData = data.data;

            if (!characterData) throw new Error('Character not found');

            const characterElement = document.createElement('div');
            characterElement.className = 'character-item';
            characterElement.dataset.characterId = characterData._id; // Add character ID
            const characterDataStr = JSON.stringify(characterData).replace(/'/g, "");
            characterElement.innerHTML = `
                <div class="favorite-icon" onclick="toggleFavorite('${characterData._id}', '${characterData.name}', 'character', '${characterData.imageUrl}', this)">
                    <i class="${favoriteIds.has(characterData._id) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </div>
                <div onclick='displayCharacterDetails(${characterDataStr})'>
                    <h2>${characterData.name}</h2>
                    <img src="${characterData.imageUrl}" alt="${characterData.name}">
                </div>
            `;
            characterInfoContainer.appendChild(characterElement);
        }
    } catch (error) {
        characterInfoContainer.innerHTML = `<p>${error.message}</p>`;
    }
}

// Other functions (showSuggestions, openModal, closeModal, displayCharacterDetails, goBack) remain unchanged

async function showSuggestions() {
    const input = document.getElementById('character-name').value.trim().toLowerCase();
    const suggestionsContainer = document.getElementById('suggestions-container');
    suggestionsContainer.innerHTML = '';

    if (input.length < 2) return;

    try {
        const response = await fetch(`https://api.disneyapi.dev/character?name=${encodeURIComponent(input)}`);
        if (!response.ok) throw new Error('Failed to fetch suggestions');

        const data = await response.json();
        const characters = Array.isArray(data.data) ? data.data : [];

        characters.forEach(character => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = character.name;
            suggestionItem.onclick = () => {
                document.getElementById('character-name').value = character.name;
                suggestionsContainer.innerHTML = '';
                searchCharacter();
            };
            suggestionsContainer.appendChild(suggestionItem);
        });
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

async function openModal(characterId) {
    try {
        const response = await fetch(`https://api.disneyapi.dev/character/${characterId}`);
        if (!response.ok) throw new Error('Character not found');

        const data = await response.json();
        const characterData = data.data || {};

        const modal = document.getElementById('character-modal');
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
        <div class="favorite-icon" onclick="toggleFavorite('${characterData._id}', '${characterData.name}', 'character', '${characterData.imageUrl}', this)">
                    <i class="${favoriteIds.has(characterData._id) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </div>
            <h2>${characterData.name}</h2>
            <img src="${characterData.imageUrl}" alt="${characterData.name}">
            <p><strong>Films:</strong> ${characterData.films?.join(', ') || 'N/A'}</p>
            <p><strong>Short Films:</strong> ${characterData.shortFilms?.join(', ') || 'N/A'}</p>
            <p><strong>TV Shows:</strong> ${characterData.tvShows?.join(', ') || 'N/A'}</p>
            <p><strong>Video Games:</strong> ${characterData.videoGames?.join(', ') || 'N/A'}</p>
            <p><strong>Park Attractions:</strong> ${characterData.parkAttractions?.join(', ') || 'N/A'}</p>
            <p><strong>Allies:</strong> ${characterData.allies?.join(', ') || 'N/A'}</p>
            <p><strong>Enemies:</strong> ${characterData.enemies?.join(', ') || 'N/A'}</p>
        `;
        modal.style.display = "block";
    } catch (error) {
        console.error(error);
        alert('Failed to load character details.');
    }
}

function closeModal() {
    const modal = document.getElementById('character-modal');
    if (modal) {
        modal.style.display = "none";
        const modalBody = document.getElementById('modal-body');
        if (modalBody) {
            modalBody.innerHTML = '';
        }
    }
}

function displayCharacterDetails(characterData) {
    const characterInfoContainer = document.getElementById('character-info');

    // Check if the same character card is clicked again
    if (previousState && previousState.characterId === characterData._id) {
        goBack();
        return;
    }

    // Save the current state before displaying character details
    previousState = {
        innerHTML: characterInfoContainer.innerHTML,
        currentPage: currentPage,
        currentSearchQuery: currentSearchQuery,
        characterId: characterData._id
    };

    characterInfoContainer.innerHTML = `
    <div class="favorite-icon" onclick="toggleFavorite('${characterData._id}', '${characterData.name}', 'character', '${characterData.imageUrl}', this)">
                    <i class="${favoriteIds.has(characterData._id) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </div>
        <div class="character-card" onclick="goBack()">
            <img src="${characterData.imageUrl}" alt="${characterData.name}" class="character-card-image">
            <div class="character-card-details">
                <h2>${characterData.name}</h2>
                <p><strong>Films:</strong> ${characterData.films?.join(', ') || 'N/A'}</p>
                <p><strong>Short Films:</strong> ${characterData.shortFilms?.join(', ') || 'N/A'}</p>
                <p><strong>TV Shows:</strong> ${characterData.tvShows?.join(', ') || 'N/A'}</p>
                <p><strong>Video Games:</strong> ${characterData.videoGames?.join(', ') || 'N/A'}</p>
                <p><strong>Park Attractions:</strong> ${characterData.parkAttractions?.join(', ') || 'N/A'}</p>
                <p><strong>Allies:</strong> ${characterData.allies?.join(', ') || 'N/A'}</p>
                <p><strong>Enemies:</strong> ${characterData.enemies?.join(', ') || 'N/A'}</p>
            </div>
        </div>
    `;
}

function goBack() {
    if (previousState) {
        const characterInfoContainer = document.getElementById('character-info');
        characterInfoContainer.innerHTML = previousState.innerHTML;
        currentPage = previousState.currentPage;
        currentSearchQuery = previousState.currentSearchQuery;
        previousState = null;
    }
}

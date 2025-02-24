// Initialize Firestore and Authentication
// const db = firebase.firestore();
// const auth = firebase.auth();
import { app, db, auth } from "./firebase-config.js";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
let favoriteIds = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    const selectedItem=JSON.parse(localStorage.getItem('selectedItem'));
    if(selectedItem){
        const { id, type, showName } = selectedItem;
        document.getElementById('search-type').value = type;
        await loadFavorites(type,showName);
        fetchAndDisplayItemDetails(id, type);
        localStorage.removeItem('selectedItem');
    } else{
    updateFilters();
    document.getElementById('name').addEventListener('input', fetchSuggestions);
    document.getElementById('search-type').addEventListener('change', async() => {
        const searchType = document.getElementById('search-type').value;
        const showName = 'Rick and Morty';
        updateFilters();
        fetchSuggestions();
        await loadFavorites(searchType,showName);
        fetchAllData();
    
    });
}
    
    // Listen for authentication state changes
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const searchType = document.getElementById('search-type').value;
            const showName = 'Rick and Morty';
            await loadFavorites(searchType,showName);
            fetchAllData(); 
        }
    });

    // Hide suggestions when clicking outside the input and suggestions container
    document.addEventListener('click', (event) => {
        const suggestionsContainer = document.getElementById('suggestions-container');
        const nameInput = document.getElementById('name');
        if (!suggestionsContainer.contains(event.target) && event.target !== nameInput) {
            suggestionsContainer.innerHTML = '';
        }
    });
});


async function fetchAndDisplayItemDetails(id, type) {
    console.log('Fetching item details:', id, type);
    try {
        const response = await fetch(`https://rickandmortyapi.com/api/${type}/${id}`);
        const result = await response.json();
        
        // Display the item details (reuse the existing `displayResults` function)
        displayResults([result], type);
    } catch (error) {
        console.error('Error fetching item details:', error);
    }
}

async function loadFavorites(searchType, showName) {
    const user = auth.currentUser;
    favoriteIds.clear(); // Clear previous favorites

    if (!user) return;

    const userId = user.uid;
    try {
        const favoritesRef = collection(db, "favorites", userId, "items"); // Fix collection reference
        const q = query(
            favoritesRef,
            where("type", "==", searchType),
            where("showName", "==", showName)
        );

        const favoritesSnapshot = await getDocs(q);

        favoritesSnapshot.forEach((doc) => {
            const data = doc.data();
            const compositeId = `RickAndMorty_${data.id}`;
            favoriteIds.add(compositeId);
        });

        console.log("Loaded favorites for type", searchType, ":", favoriteIds);
    } catch (error) {
        console.error("Error loading favorites:", error);
    }
}


async function addToFavorites(id, name, type, image, iconContainer) {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to add favorites.");
        return;
    }

    const userId = user.uid;
    const compositeId = `RickAndMorty_${id}`;
    const favoriteRef = doc(db, "favorites", userId, "items", compositeId);

    try {
        const docSnap = await getDoc(favoriteRef);
        if (docSnap.exists()) {
            await deleteDoc(favoriteRef);
            iconContainer.classList.remove("favorited");
            favoriteIds.delete(compositeId);
            alert(`${name} removed from favorites.`);
        } else {
            await setDoc(favoriteRef, {
                id,
                name,
                type,
                image,
                userId,
                showName: "Rick and Morty",
                timestamp: new Date()
            });
            iconContainer.classList.add("favorited");
            favoriteIds.add(compositeId);
            alert(`${name} added to favorites!`);
        }
    } catch (error) {
        console.error("Error adding favorite:", error);
        alert("Failed to add favorite.");
    }
}

let currentPage = 1;
let totalPages = 1;

function updateFilters() {
    const searchType = document.getElementById('search-type').value;
    const additionalFiltersContainer = document.getElementById('additional-filters-container');
    additionalFiltersContainer.innerHTML = '';

    if (searchType === 'character') {
        additionalFiltersContainer.innerHTML = `
            <label for="status">Status:</label>
            <select class="select__css" id="status">
                <option value="">Any</option>
                <option value="alive">Alive</option>
                <option value="dead">Dead</option>
                <option value="unknown">Unknown</option>
            </select>
            <label for="species">Species:</label>
            <input class="text__input" type="text" id="species" placeholder="Species">
            <label for="type">Type:</label>
            <input class="text__input" type="text" id="type" placeholder="Type">
            <label for="gender">Gender:</label>
            <select class="select__css" id="gender">
                <option value="">Any</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="genderless">Genderless</option>
                <option value="unknown">Unknown</option>
            </select>
        `;
    } else if (searchType === 'location') {
        additionalFiltersContainer.innerHTML = `
            <label for="type">Type:</label>
            <select class="select__css" id="type">
                <option value="">Any</option>
                <option value="Planet">Planet</option>
                <option value="Cluster">Cluster</option>
                <option value="Space station">Space station</option>
                <option value="Microverse">Microverse</option>
                <option value="TV">TV</option>
                <option value="Resort">Resort</option>
                <option value="Fantasy town">Fantasy town</option>
                <option value="Dream">Dream</option>
                <option value="Dimension">Dimension</option>
                <option value="unknown">Unknown</option>
            </select>
            <label for="dimension">Dimension:</label>
            <input class="text__input" type="text" id="dimension" placeholder="Dimension">
        `;
    } else if (searchType === 'episode') {
        additionalFiltersContainer.innerHTML = `
            <label for="episode">Episode:</label>
            <input class="text__input" type="text" id="episode" placeholder="Episode">
        `;
    }
}

function toggleAdditionalFilters() {
    const additionalFiltersContainer = document.getElementById('additional-filters-container');
    if (additionalFiltersContainer.style.display === 'none') {
        additionalFiltersContainer.style.display = 'flex';
    } else {
        additionalFiltersContainer.style.display = 'none';
    }
}

async function fetchSuggestions() {
    const searchType = document.getElementById('search-type').value;
    const query = document.getElementById('name').value;

    const response = await fetch(`https://rickandmortyapi.com/api/${searchType}/?name=${query}`);
    const data = await response.json();
    displaySuggestions(data.results);
}

function displaySuggestions(results) {
    const suggestionsContainer = document.getElementById('suggestions-container');
    suggestionsContainer.innerHTML = '';

    results.forEach(result => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.textContent = result.name;
        suggestionItem.addEventListener('click', () => {
            document.getElementById('name').value = result.name;
            suggestionsContainer.innerHTML = '';
        });
        suggestionsContainer.appendChild(suggestionItem);
    });
}

async function fetchAllData(page = 1) {
    const searchType = document.getElementById('search-type').value;
    const response = await fetch(`https://rickandmortyapi.com/api/${searchType}/?page=${page}`);
    const data = await response.json();
    totalPages = data.info.pages;
    displayResults(data.results, searchType);
    updatePageInfo();
}

function updatePageInfo() {
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        fetchAllData(currentPage);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        fetchAllData(currentPage);
    }
}

async function searchRickAndMorty() {
    const searchType = document.getElementById('search-type').value;
    let query = `name=${document.getElementById('name').value}`;

    if (searchType === 'character') {
        const status = document.getElementById('status').value;
        const species = document.getElementById('species').value;
        const type = document.getElementById('type').value;
        const gender = document.getElementById('gender').value;
        query += `&status=${status}&species=${species}&type=${type}&gender=${gender}`;
    } else if (searchType === 'location') {
        const type = document.getElementById('type').value;
        const dimension = document.getElementById('dimension').value;
        query += `&type=${type}&dimension=${dimension}`;
    } else if (searchType === 'episode') {
        const episode = document.getElementById('episode').value;
        query += `&episode=${episode}`;
    }

    const response = await fetch(`https://rickandmortyapi.com/api/${searchType}/?${query}`);
    const data = await response.json();
    displayResults(data.results, searchType);
}

async function displayResults(results, searchType) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';

    for (const result of results) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        const compositeId = `RickAndMorty_${result.id}`;
        const isFavorited = favoriteIds.has(compositeId);

        const defaultLocationImage = 'rick-and-morty-logo.png'; // Replace with your actual default image path
        const defaultEpisodeImage = 'rick-and-morty-logo.png'; // Replace with your actual default image path

        resultItem.innerHTML = `    
        <div class="favorite-icon ${isFavorited ? 'favorited' : ''}"onclick="addToFavorites('${result.id}', '${result.name}', '${searchType}', '${result.image}',this)" >
            <i class="fa-regular fa-heart"></i>
        </div>
            ${searchType === 'character' ? `
                <img src="${result.image || ''}" alt="${result.name}">
                <h2>${result.name}</h2>
                <div class="result-details">
                    <p>Status: ${result.status}</p>
                    <p>Species: ${result.species}</p>
                    <p>Type: ${result.type || 'N/A'}</p>
                    <p>Gender: ${result.gender}</p>
                    <p>Origin: ${result.origin.name}</p>
                    <p>Location: ${result.location.name}</p>
                    <p>Episodes: ${result.episode.length}</p>
                    <p>Created: ${new Date(result.created).toLocaleDateString()}</p>
                </div>
            ` : searchType === 'location' ? `
                <img src= "${defaultLocationImage}" alt="Location">
                <h2>${result.name}</h2>
                <div class="result-details">
                    <p>Dimension: ${result.dimension}</p>
                    <p>Type: ${result.type}</p>
                    <p>Created: ${new Date(result.created).toLocaleDateString()}</p>
                </div>
            ` : searchType === 'episode' ? `\
                <img src= "${defaultLocationImage}" alt="Location">
                <h2>${result.name}</h2>
                <div class="result-details">
                    <p>Episode: ${result.episode}</p>
                    <p>Air Date: ${result.air_date}</p>
                    <p>Created: ${new Date(result.created).toLocaleDateString()}</p>
                </div>
            ` : ''}
        `;
        resultsContainer.appendChild(resultItem);
    }
}

window.addToFavorites = addToFavorites;
window.searchRickAndMorty = searchRickAndMorty;
window.updateFilters = updateFilters;
window.toggleAdditionalFilters = toggleAdditionalFilters;
window.fetchSuggestions = fetchSuggestions;
window.displaySuggestions = displaySuggestions;
window.fetchAllData = fetchAllData;
window.updatePageInfo = updatePageInfo;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.displayResults = displayResults;

// Marvel API credentials
const publicKey = 'ef481826d9ef42d2b03911c6ffef2b05';
const privateKey = 'af7efdf5c43317e68f28fdd8b33a198967a8f4bd';
const ts = 1; // Timestamp (can be any number or Date.now())
const hash = CryptoJS.MD5(ts + privateKey + publicKey).toString();
const baseUrl = 'https://gateway.marvel.com/v1/public';

// Elements
const contentDiv = document.getElementById('content');
const suggestionsContainer = document.getElementById('suggestions-container');
const paginationContainer = document.getElementById('pagination');
import { app, db, auth } from "./firebase-config.js";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";


// Initialize Firestore and Authentication
// const db = firebase.firestore();
// const auth = firebase.auth();

let favoriteIds = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    auth.onAuthStateChanged(async (user) => {
        if(user) {
            await loadFavorites('characters');
            fetchMarvelDataWithReset('characters');
        } else{
            favoriteIds.clear();
            fetchMarvelDataWithReset('characters');
        }
    });

    // Hide suggestions when clicking outside the input and suggestions container
    document.addEventListener('click', (event) => {
        const suggestionsContainer = document.getElementById('suggestions-container');
        const searchInput = document.getElementById('search-input');
        if (suggestionsContainer && !suggestionsContainer.contains(event.target) && event.target !== searchInput) {
            suggestionsContainer.innerHTML = '';
        }
    });
});


async function loadFavorites(searchType) {
    const user = auth.currentUser;
    favoriteIds.clear();

    if (!user) return;

    const userId = user.uid;
    const favoritesRef = collection(db, "favorites", userId, "items");

    try {
        const q = query(favoritesRef, where("type", "==", searchType), where("showName", "==", "Marvel"));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const compositeId = `Marvel_${data.id}`;
            favoriteIds.add(compositeId);
        });

        console.log("Loaded favorites for type", searchType, ":", favoriteIds);
    } catch (error) {
        console.error("Error loading favorites:", error);
    }
}

// ✅ Add or Remove from Favorites
async function addToFavorites(event, type, id, name, image, iconContainer) {
    event.stopPropagation();
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to add favorites.");
        return;
    }

    const userId = user.uid;
    const compositeId = `Marvel_${id}`;
    const favoriteRef = doc(db, "favorites", userId, "items", compositeId);

    try {
        const docSnap = await getDoc(favoriteRef);
        if (docSnap.exists()) {
            await deleteDoc(favoriteRef);
            iconContainer.classList.remove('favorited');
            favoriteIds.delete(compositeId);
            alert(`${name} removed from favorites.`);
        } else {
            await setDoc(favoriteRef, {
                id,
                name,
                type,
                image,
                userId,
                showName: 'Marvel',
                timestamp: new Date(),
            });
            iconContainer.classList.add('favorited');
            favoriteIds.add(compositeId);
            alert(`${name} added to favorites!`);
        }
    } catch (error) {
        console.error("Error adding favorite:", error);
        alert("Failed to add favorite.");
    }
}

// Pagination variables
let currentPage = 1;
const limit = 20;
let currentCategory = 'characters';
let currentSearchQuery = '';

// 🕵️‍♂️ Fetch Data for Any Category
async function fetchMarvelData(category = 'characters', searchQuery = '', page = 1) {
    contentDiv.innerHTML = `<p>Loading ${category}...</p>`;
    const offset = (page - 1) * limit;
    const searchParam = searchQuery ? `&nameStartsWith=${searchQuery}` : '';
    const url = `${baseUrl}/${category}?ts=${ts}&apikey=${publicKey}&hash=${hash}&offset=${offset}&limit=${limit}${searchParam}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch Marvel data');
        const data = await response.json();
        displayData(category, data.data.results, data.data.total);
    } catch (error) {
        contentDiv.innerHTML = `<p>Error: ${error.message}</p>`;
        console.error(error);
    }
}

// 🎨 Display Data for All Categories
function displayData(category, items, totalCount) {
    contentDiv.innerHTML = '';

    if (items.length === 0) {
        contentDiv.innerHTML = `<p>No ${category} found.</p>`;
        return;
    }

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'marvel-item';
        itemDiv.onclick = () => toggleDetails(itemDiv);

        const isFavorited = favoriteIds.has(`Marvel_${item.id}`);
        const thumbnail = item.thumbnail || {}; // Default to an empty object if thumbnail is null
        const imageUrl = (thumbnail.path && thumbnail.extension) 
            ? `${thumbnail.path}.${thumbnail.extension}` 
            : 'Marvel-logo.png'; // Fallback image


        // const imageUrl = `${item.thumbnail.path}.${item.thumbnail.extension}`;

        let itemContent = `
        <div class="icon-merge" id="icon-merge">
            <h2>${item.title || item.name || item.fullName}</h2>
            <div class="favorite-icon "
        onclick="addToFavorites(event, '${currentCategory}', '${item.id}','${item.name || item.title}','${imageUrl}',this)" >
                    <i class="${isFavorited ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </div>
        </div>
            <img src="${imageUrl}" alt="${item.title || item.name || item.fullName}">

            <div class="marvel-item-details" id="marvel-item-details" style="display: none;">
        `;

        switch (category) {
            case 'characters':
                itemContent += `
                <div class="marvel-details">
                <div class="marvel-details-info">
                    <p><strong>Description:</strong> ${item.description || 'No description available.'}</p>
                    <p><strong>Comics:</strong> ${item.comics.items.map(comic => comic.name).join(', ') || 'N/A'}</p>
                    <p><strong>Series:</strong> ${item.series.items.map(series => series.name).join(', ') || 'N/A'}</p>
                    <p><strong>Stories:</strong> ${item.stories.items.map(story => story.name).join(', ') || 'N/A'}</p>
                    <p><strong>Events:</strong> ${item.events.items.map(event => event.name).join(', ') || 'N/A'}</p>
                </div>
                </div>
                `;
                break;
            case 'comics':
                itemContent += `
                <div class="marvel-details">
                <div class="marvel-details-info">
                    <p><strong>Issue Number:</strong> ${item.issueNumber}</p>
                    <p><strong>Description:</strong> ${item.description || 'No description available.'}</p>
                    <p><strong>Page Count:</strong> ${item.pageCount}</p>
                    <p><strong>Series:</strong> ${item.series.name}</p>
                    <p><strong>Creators:</strong> ${item.creators.items.map(creator => creator.name).join(', ') || 'N/A'}</p>
                    <p><strong>Characters:</strong> ${item.characters.items.map(character => character.name).join(', ') || 'N/A'}</p>
                    <p><strong>Stories:</strong> ${item.stories.items.map(story => story.name).join(', ') || 'N/A'}</p>
                    <p><strong>Events:</strong> ${item.events.items.map(event => event.name).join(', ') || 'N/A'}</p>
                </div>
                </div>
                `;
                break;
            case 'series':
                itemContent += `
                <div class="marvel-details">
                <div class="marvel-details-info">
                    <p><strong>Description:</strong> ${item.description || 'No description available.'}</p>
                    <p><strong>Start Year:</strong> ${item.startYear}</p>
                    <p><strong>End Year:</strong> ${item.endYear}</p>
                    <p><strong>Rating:</strong> ${item.rating}</p>
                    <p><strong>Creators:</strong> ${item.creators.items.map(creator => creator.name).join(', ') || 'N/A'}</p>
                    <p><strong>Characters:</strong> ${item.characters.items.map(character => character.name).join(', ') || 'N/A'}</p>
                    <p><strong>Stories:</strong> ${item.stories.items.map(story => story.name).join(', ') || 'N/A'}</p>
                    <p><strong>Events:</strong> ${item.events.items.map(event => event.name).join(', ') || 'N/A'}</p>
                </div>
                </div>
                `;
                break;
            case 'stories':
                itemContent += `
                <div class="marvel-details">
                <div class="marvel-details-info">
                    <p><strong>Description:</strong> ${item.description || 'No description available.'}</p>
                    <p><strong>Type:</strong> ${item.type}</p>
                    <p><strong>Comics:</strong> ${item.comics.items.map(comic => comic.name).join(', ') || 'N/A'}</p>
                    <p><strong>Series:</strong> ${item.series.items.map(series => series.name).join(', ') || 'N/A'}</p>
                    <p><strong>Characters:</strong> ${item.characters.items.map(character => character.name).join(', ') || 'N/A'}</p>
                    <p><strong>Creators:</strong> ${item.creators.items.map(creator => creator.name).join(', ') || 'N/A'}</p>
                    <p><strong>Events:</strong> ${item.events.items.map(event => event.name).join(', ') || 'N/A'}</p>
                </div>
                </div>
                `;
                break;
            case 'events':
                itemContent += `
                <div class="marvel-details">
                <div class="marvel-details-info">
                    <p><strong>Description:</strong> ${item.description || 'No description available.'}</p>
                    <p><strong>Start:</strong> ${item.start}</p>
                    <p><strong>End:</strong> ${item.end}</p>
                    <p><strong>Comics:</strong> ${item.comics.items.map(comic => comic.name).join(', ') || 'N/A'}</p>
                    <p><strong>Series:</strong> ${item.series.items.map(series => series.name).join(', ') || 'N/A'}</p>
                    <p><strong>Stories:</strong> ${item.stories.items.map(story => story.name).join(', ') || 'N/A'}</p>
                    <p><strong>Characters:</strong> ${item.characters.items.map(character => character.name).join(', ') || 'N/A'}</p>
                    <p><strong>Creators:</strong> ${item.creators.items.map(creator => creator.name).join(', ') || 'N/A'}</p>
                </div>
                </div>
                `;
                break;
            case 'creators':
                itemContent += `
                <div class="marvel-details">
                <div class="marvel-details-info">
                    <p><strong>Comics:</strong> ${item.comics.items.map(comic => comic.name).join(', ') || 'N/A'}</p>
                    <p><strong>Series:</strong> ${item.series.items.map(series => series.name).join(', ') || 'N/A'}</p>
                    <p><strong>Stories:</strong> ${item.stories.items.map(story => story.name).join(', ') || 'N/A'}</p>
                    <p><strong>Events:</strong> ${item.events.items.map(event => event.name).join(', ') || 'N/A'}</p>
                </div>
                </div>
                `;
                break;
            default:
                itemContent = '<p>Unknown category</p>';
        }

        itemContent += `</div>`; // Close the details div
        itemDiv.innerHTML = itemContent;
        contentDiv.appendChild(itemDiv);
    });

    updatePagination(totalCount);
}

// 🔄 Update Pagination
function updatePagination(totalCount) {
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(totalCount / limit);

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            fetchMarvelData(currentCategory, currentSearchQuery, currentPage);
        }
    };
    paginationContainer.appendChild(prevButton);

    const pageInfo = document.createElement('span');
    pageInfo.id = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageInfo);

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchMarvelData(currentCategory, currentSearchQuery, currentPage);
        }
    };
    paginationContainer.appendChild(nextButton);
}

// 🔍 Search Functionality
async function searchMarvelData() {
    const searchInput = document.getElementById('search-input').value.trim();
    if (!searchInput) return;
    currentSearchQuery = searchInput; // Retain search query
    currentPage = 1; // Reset to first page when searching
    await fetchMarvelData(currentCategory, currentSearchQuery, currentPage);
}

// 💡 Show Search Suggestions
async function showSuggestions() {
    const input = document.getElementById('search-input').value.toLowerCase();
    suggestionsContainer.innerHTML = '';

    if (input.length < 2) return;

    try {
        const url = `${baseUrl}/characters?nameStartsWith=${input}&ts=${ts}&apikey=${publicKey}&hash=${hash}`;
        const response = await fetch(url);
        const data = await response.json();
        const suggestions = data.data.results;

        suggestions.forEach(character => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = character.name;
            suggestionItem.onclick = () => {
                document.getElementById('search-input').value = character.name;
                suggestionsContainer.innerHTML = '';
                searchMarvelData();
            };
            suggestionsContainer.appendChild(suggestionItem);
        });
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

// Fetch Data for Any Category with Reset
function fetchMarvelDataWithReset(category) {
    currentPage = 1; // Reset to first page when switching categories
    currentSearchQuery = ''; // Clear search query on category change
    currentCategory = category; // Update current category
    document.getElementById('search-input').value = ''; // Clear search input
    updateActiveTab(category); // Highlight the active tab
    fetchMarvelData(currentCategory, '', currentPage);
}

// Highlight Active Tab
function updateActiveTab(category) {
    document.querySelectorAll('.tabs button').forEach(button => {
        button.classList.remove('active');
    });
    const activeButton = document.querySelector(`.tabs button[data-category="${category}"]`);
    if (activeButton) activeButton.classList.add('active');
}


/*-------------*/
// Toggle between small and large container
function toggleDetails(itemDiv) {
    const detailsDiv = itemDiv.querySelector('.marvel-item-details');

    // Close all other open details
    document.querySelectorAll('.marvel-item').forEach(div => {
        if (div !== itemDiv) {
            div.classList.remove('expanded'); // Remove expanded class from other items
            div.querySelector('.marvel-item-details').style.display = 'none';
        }
    });

    // Toggle the clicked item's size and details visibility
    if (detailsDiv.style.display === 'none' || !detailsDiv.style.display) {
        detailsDiv.style.display = 'block';
        itemDiv.classList.add('expanded'); // Add expanded class for styling
    } else {
        detailsDiv.style.display = 'none';
        itemDiv.classList.remove('expanded'); // Remove expanded class
    }
}

window.loadFavorites = loadFavorites;
window.addToFavorites = addToFavorites;
window.fetchMarvelData = fetchMarvelData;
window.displayData = displayData;
window.updatePagination = updatePagination;
window.searchMarvelData = searchMarvelData;
window.showSuggestions = showSuggestions;
window.fetchMarvelDataWithReset = fetchMarvelDataWithReset;
window.updateActiveTab = updateActiveTab;
window.toggleDetails = toggleDetails;

// Initialize Firestore and Authentication
import { app, db, auth } from "./firebase-config.js";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where,serverTimestamp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
let favoriteIds = new Set();
let currentPage = 1;
const limit = 20;

document.addEventListener('DOMContentLoaded', async () => {
    let isRedirectedFromFavorites = false;
    const pokemonId = localStorage.getItem('viewPokemonId');
    if (pokemonId) {
        isRedirectedFromFavorites = true;
        await loadFavorites('Pokemon');
        await fetchAndDisplayPokemonDetails(pokemonId);
        togglePokemonDetails(null, { id: pokemonId });
        localStorage.removeItem('viewPokemonId'); // Clear storage after use
    }
    populateTypeFilter();
    populateSpeciesFilter();

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadFavorites('Pokemon'); // Pass the showName dynamically
            if (!isRedirectedFromFavorites)
                fetchPokemon(currentPage, limit);
        } else {
            favoriteIds.clear();
            if (!isRedirectedFromFavorites)
                fetchPokemon(currentPage, limit);
        }
    });

    // Event delegation for suggestions
    const suggestionsContainer = document.getElementById('suggestions-container');
    suggestionsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('suggestion-item')) {
            const pokemonName = event.target.textContent;
            document.getElementById('pokemon-name').value = pokemonName;
            suggestionsContainer.innerHTML = '';
            searchPokemon();
        }
    });

    // Hide suggestions when clicking outside the input and suggestions container
    document.addEventListener('click', (event) => {
        const nameInput = document.getElementById('pokemon-name');
        if (!suggestionsContainer.contains(event.target)) {
            suggestionsContainer.innerHTML = '';
        }
    });
});

async function fetchAndDisplayPokemonDetails(pokemonId) {
    const pokemonInfoContainer = document.getElementById('pokemon-info');
    pokemonInfoContainer.innerHTML = '';

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (!response.ok) {
            throw new Error('Pokémon not found');
        }
        const pokemonData = await response.json();

        const pokemonElement = document.createElement('div');
        pokemonElement.className = 'pokemon-item';

        pokemonElement.innerHTML = `
            <h2>${pokemonData.name}</h2>
            <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">
        `;
        pokemonInfoContainer.appendChild(pokemonElement);

        // Automatically display the details
        togglePokemonDetails(pokemonElement, pokemonData);
    } catch (error) {
        pokemonInfoContainer.innerHTML = `<p>${error.message}</p>`;
    }
}

async function loadFavorites(showName = 'Pokemon') {
    const user = auth.currentUser;
    favoriteIds.clear();

    if (!user) return;
    const userId = user.uid;

    try {
        const q = query(collection(db, 'favorites', userId, 'items'), where("showName", "==", showName));
        const snapshot = await getDocs(q);

        snapshot.forEach(doc => {
            const data = doc.data();
            const compositeId = `Pokemon_${data.id}`;
            favoriteIds.add(compositeId);
        });
        console.log("Loaded favorites for", showName, ":", favoriteIds);
    } catch (error) {
        console.error('Failed to load favorites:', error);
    }
}

async function addToFavorites(id, name, image, type, iconContainer) {
    const user = auth.currentUser;

    if (!user) {
        alert('Please log in to manage favorites.');
        return;
    }

    const userId = user.uid;
    const compositeId = `Pokemon_${id}`;
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
                showName: 'Pokemon',
                timestamp: serverTimestamp()
            });
            iconContainer.classList.add('favorited');
            favoriteIds.add(compositeId);
            alert(`${name} added to favorites!`);
        }
        // Refresh the UI
        fetchPokemon(currentPage, limit);
    } catch (error) {
        console.error("Error updating favorites:", error);
        alert("Failed to update favorite.");
    }
}

async function fetchPokemon(page = 1, limit = 20) {
    const pokemonInfoContainer = document.getElementById('pokemon-info');
    pokemonInfoContainer.innerHTML = '';

    try {
        const offset = (page - 1) * limit;
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch Pokémon');

        const data = await response.json();
        const pokemonList = data.results;

        // Update pagination
        updatePagination(data.count);

        for (const pokemon of pokemonList) {
            const pokemonResponse = await fetch(pokemon.url);
            const pokemonData = await pokemonResponse.json();

            const pokemonElement = document.createElement('div');
            pokemonElement.className = 'pokemon-item';
            pokemonElement.onclick = (event) => {
                event.stopPropagation();
                togglePokemonDetails(pokemonElement, pokemonData);
            };

            const compositeId = `Pokemon_${pokemonData.id}`;
            const isFavorited = favoriteIds.has(compositeId);

            pokemonElement.innerHTML = `
                <div class="icon-merge" id="icon-merge">
                <h2>${pokemonData.name}</h2>
                <div class="favorite-icon " 
                    onclick="event.stopPropagation(); addToFavorites(
                    '${pokemonData.id}',
                    '${pokemonData.name}',
                    '${pokemonData.sprites.front_default}',
                    'Pokemon', 
                    this)">
                    <i class="${isFavorited ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </div>
                </div>
                <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">
            `;

            pokemonInfoContainer.appendChild(pokemonElement);
        }
    } catch (error) {
        console.error('Failed to fetch Pokémon:', error);
    }
}

function updatePagination(totalCount) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(totalCount / limit);

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            fetchPokemon(currentPage, limit);
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
            fetchPokemon(currentPage, limit);
        }
    };
    paginationContainer.appendChild(nextButton);
}

async function togglePokemonDetails(pokemonElement, pokemonData) {
    if (!pokemonElement) return;

    const existingDetails = pokemonElement.querySelector('.pokemon-details-content');

    if (existingDetails) {
        pokemonElement.classList.remove('show-details');
        existingDetails.remove();
        return;
    }

    document.querySelectorAll('.pokemon-item.show-details').forEach(item => {
        item.classList.remove('show-details');
        const details = item.querySelector('.pokemon-details-content');
        if (details) details.remove();
    });

    const pokemonDetailsContainer = document.createElement('div');
    pokemonDetailsContainer.className = 'pokemon-details-content';

    try {
        const abilities = pokemonData.abilities.map(ability => ability.ability.name).join(', ');
        const types = pokemonData.types.map(type => type.type.name).join(', ');

        const speciesResponse = await fetch(pokemonData.species.url);
        const speciesData = await speciesResponse.json();

        const characteristics = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en').flavor_text;

        const evolutionChainResponse = await fetch(speciesData.evolution_chain.url);
        const evolutionChainData = await evolutionChainResponse.json();
        const evolutionChain = getEvolutionChain(evolutionChainData.chain);

        const moves = pokemonData.moves.map(move => move.move.name).join(', ');

         // Check if the Pokémon is already favorited
         const compositeId = `Pokemon_${pokemonData.id}`;
         const isFavorited = favoriteIds.has(compositeId);

        pokemonDetailsContainer.innerHTML = `
            <div class="pokemon-details">
                
                <div class="pokemon-details-info">
                    <p><strong>Abilities:</strong> ${abilities}</p>
                    <p><strong>Types:</strong> ${types}</p>
                    <p><strong>Height:</strong> ${pokemonData.height}</p>
                    <p><strong>Weight:</strong> ${pokemonData.weight}</p>
                    <p><strong>Base Experience:</strong> ${pokemonData.base_experience}</p>
                    <p><strong>Species:</strong> ${speciesData.name}</p>
                    <p><strong>Characteristics:</strong> ${characteristics}</p>
                    <p><strong>Evolution Chain:</strong> ${evolutionChain}</p> 
                    <p><strong>Moves:</strong> ${moves}</p>
                </div>
            </div>
        `;

        pokemonElement.appendChild(pokemonDetailsContainer);
        pokemonElement.classList.add('show-details');
    } catch (error) {
        pokemonDetailsContainer.innerHTML = `<p>${error.message}</p>`;
    }
}

// Rest of the functions (searchPokemon, getEvolutionChain, populateTypeFilter, populateSpeciesFilter, filterPokemon, showSuggestions) remain the same.


async function searchPokemon() {
    const pokemonName = document.getElementById('pokemon-name').value.toLowerCase();
    const pokemonInfoContainer = document.getElementById('pokemon-info');
    pokemonInfoContainer.innerHTML = '';

    if (!pokemonName) {
        pokemonInfoContainer.innerHTML = '<p>Please enter a Pokémon name.</p>';
        return;
    }

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        if (!response.ok) {
            throw new Error('Pokémon not found');
        }
        const pokemonData = await response.json();

        const pokemonElement = document.createElement('div');
        pokemonElement.className = 'pokemon-item';
        pokemonElement.onclick = (event) => {
            event.stopPropagation();
            togglePokemonDetails(pokemonElement, pokemonData);
        };

        const compositeId = `Pokemon_${pokemonData.id}`;
        const isFavorited = favoriteIds.has(compositeId);

        pokemonElement.innerHTML = `
        <div class="favorite-icon ${isFavorited ? 'favorited' : ''}" 
                    onclick="event.stopPropagation(); addToFavorites(
                    '${pokemonData.id}',
                    '${pokemonData.name}',
                    '${pokemonData.sprites.front_default}',
                    'Pokemon', 
                    this)">
                    <i class="fa-regular fa-heart"></i>
                </div>
            <h2>${pokemonData.name}</h2>
            <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">
        `;
        pokemonInfoContainer.appendChild(pokemonElement);

        togglePokemonDetails(pokemonElement, pokemonData);
    } catch (error) {
        pokemonInfoContainer.innerHTML = `<p>${error.message}</p>`;
    }
}

function getEvolutionChain(chain) {
    let evolutionChain = [];
    let currentChain = chain;

    while (currentChain) {
        evolutionChain.push(currentChain.species.name);
        currentChain = currentChain.evolves_to[0];
    }

    return evolutionChain.join(' -> ');
}

async function populateTypeFilter() {
    const typeFilter = document.getElementById('type-filter');
    const response = await fetch('https://pokeapi.co/api/v2/type');
    const data = await response.json();
    const types = data.results;

    types.forEach(type => {
        const typeOption = document.createElement('option');
        typeOption.value = type.name;
        typeOption.textContent = type.name;
        typeFilter.appendChild(typeOption);
    });
}

async function populateSpeciesFilter() {
    const speciesFilter = document.getElementById('species-filter');
    const response = await fetch('https://pokeapi.co/api/v2/pokemon-species?limit=1000');
    const data = await response.json();
    const species = data.results;

    species.forEach(species => {
        const speciesOption = document.createElement('option');
        speciesOption.value = species.name;
        speciesOption.textContent = species.name;
        speciesFilter.appendChild(speciesOption);
    });
}

async function filterPokemon(page = 1) {
    const type = document.getElementById('type-filter').value;
    const species = document.getElementById('species-filter').value;
    const pokemonInfoContainer = document.getElementById('pokemon-info');
    pokemonInfoContainer.innerHTML = '';

    try {
        let pokemonList = [];

        if (type) {
            const typeResponse = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
            if (!typeResponse.ok) {
                throw new Error('Type not found');
            }
            const typeData = await typeResponse.json();
            pokemonList = typeData.pokemon.map(p => p.pokemon);
        }

        if (species) {
            const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${species}`);
            if (!speciesResponse.ok) {
                throw new Error('Species not found');
            }
            const speciesData = await speciesResponse.json();
            const speciesPokemon = speciesData.varieties.map(v => v.pokemon);

            if (pokemonList.length > 0) {
                pokemonList = pokemonList.filter(p => speciesPokemon.some(sp => sp.name === p.name));
            } else {
                pokemonList = speciesPokemon;
            }
        }

        if (pokemonList.length === 0) {
            pokemonInfoContainer.innerHTML = '<p>No Pokémon found for the selected filters.</p>';
            return;
        }

        const offset = (page - 1) * limit;
        const paginatedPokemonList = pokemonList.slice(offset, offset + limit);

        for (const pokemon of paginatedPokemonList) {
            const pokemonResponse = await fetch(pokemon.url);
            const pokemonData = await pokemonResponse.json();

            const pokemonElement = document.createElement('div');
            pokemonElement.className = 'pokemon-item';
            pokemonElement.onclick = (event) => {
                event.stopPropagation();
                togglePokemonDetails(pokemonElement, pokemonData);
            };

            const compositeId = `Pokemon_${pokemonData.id}`;
            const isFavorited = favoriteIds.has(compositeId);

            pokemonElement.innerHTML = `
            <div class="favorite-icon ${isFavorited ? 'favorited' : ''}" 
                    onclick="event.stopPropagation(); addToFavorites(
                    '${pokemonData.id}',
                    '${pokemonData.name}',
                    '${pokemonData.sprites.front_default}',
                    'Pokemon', 
                    this)">
                    <i class="fa-regular fa-heart"></i>
                </div>
                <h2>${pokemonData.name}</h2>
                <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">
            `;
            pokemonInfoContainer.appendChild(pokemonElement);
        }

        updatePagination(pokemonList.length);
    } catch (error) {
        pokemonInfoContainer.innerHTML = `<p>${error.message}</p>`;
    }
}

async function showSuggestions() {
    const input = document.getElementById('pokemon-name').value.toLowerCase();
    const suggestionsContainer = document.getElementById('suggestions-container');
    suggestionsContainer.innerHTML = '';

    if (input.length < 2) {
        return;
    }

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1000`);
        const data = await response.json();
        const suggestions = data.results.filter(pokemon => pokemon.name.startsWith(input));

        suggestions.forEach(pokemon => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = pokemon.name;
            suggestionItem.onclick = () => {
                document.getElementById('pokemon-name').value = pokemon.name;
                suggestionsContainer.innerHTML = '';
                searchPokemon();
            };
            suggestionsContainer.appendChild(suggestionItem);
        });
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

window.addToFavorites=addToFavorites
window.loadFavorites=loadFavorites
window.fetchPokemon=fetchPokemon
window.updatePagination=updatePagination
window.togglePokemonDetails=togglePokemonDetails
window.searchPokemon=searchPokemon
window.getEvolutionChain=getEvolutionChain
window.populateTypeFilter=populateTypeFilter
window.populateSpeciesFilter=populateSpeciesFilter
window.filterPokemon=filterPokemon
window.showSuggestions=showSuggestions

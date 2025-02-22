// Initialize Firestore and Authentication
const db = firebase.firestore();
const auth = firebase.auth();

let favoriteIds = new Set();

document.addEventListener('DOMContentLoaded', async() => {
    populateTypeFilter();
    populateSpeciesFilter();
    // await loadFavorites();
    // fetchPokemon();

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await loadFavorites(user.uid);
            fetchPokemon();
        } else {
            favoriteIds.clear();
            fetchPokemon();
        }
    });

    // Hide suggestions when clicking outside the input and suggestions container
    document.addEventListener('click', (event) => {
        const suggestionsContainer = document.getElementById('suggestions-container');
        const nameInput = document.getElementById('pokemon-name');
        if (!suggestionsContainer.contains(event.target) && event.target !== nameInput) {
            suggestionsContainer.innerHTML = '';
        }
    });
});

async function loadFavorites(showName = 'Pokemon') {
    const user = auth.currentUser;
    favoriteIds.clear();

    if (!user) return;
    const userId = user.uid;

    try {
        const snapshot = await db.collection('favorites')
            .doc(userId)
            .collection("items")
            .where("showName", "==", 'Pokemon')
            .get();
        
        console.log("Fetched favorites snapshot size:", snapshot.size);

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log("Favorite data:", data);
            const compositeId = `Pokemon_${data.id}`;
            favoriteIds.add(compositeId);
        });
        console.log("Loaded favorites for", showName, ":", favoriteIds);
    } catch (error) {
        console.error('Failed to load favorites:', error);
    }
}

// Add or Remove from Favorites using Composite ID
async function addToFavorites(id, name, image, type, iconContainer) {
    const user = auth.currentUser;

    if (!user) {
        alert('Please log in to manage favorites.');
        return;
    }

    const userId = user.uid;
    const compositeId = `Pokemon_${id}`; // Composite ID for Pokémon favorites
    const favoriteRef = db.collection("favorites").doc(userId).collection("items").doc(compositeId);

    try {
        const doc = await favoriteRef.get();
        if (doc.exists) {
            await favoriteRef.delete();
            iconContainer.classList.remove('favorited');
            favoriteIds.delete(compositeId); // Update the local set
            alert(`${name} removed from favorites.`);
        } else {
            await favoriteRef.set({
                id,
                name,
                type,
                image,
                userId,
                showName: 'Pokemon',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            iconContainer.classList.add('favorited');
            favoriteIds.add(compositeId);
            alert(`${name} added to favorites!`);
        }
    } catch (error) {
        console.error("Error updating favorites:", error);
        alert("Failed to update favorite.");
    }
}


let currentPage = 1;
const limit = 20;

async function fetchPokemon(page = 1) {
    const pokemonInfoContainer = document.getElementById('pokemon-info');
    pokemonInfoContainer.innerHTML = '';

    try {
        const offset = (page - 1) * 20;
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=20`);
        if (!response.ok) throw new Error('Failed to fetch Pokémon');

        const data = await response.json();
        const pokemonList = data.results;

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
            fetchPokemon(currentPage);
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
            fetchPokemon(currentPage);
        }
    };
    paginationContainer.appendChild(nextButton);
}

async function togglePokemonDetails(pokemonElement, pokemonData) {
    const existingDetails = pokemonElement.querySelector('.pokemon-details-content');

    // Close details if already open and prevent reopening immediately
    if (existingDetails) {
        pokemonElement.classList.remove('show-details');
        existingDetails.remove();
        return;
    }

    // Remove existing open details in other cards to ensure only one is open at a time
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

        // Fetch evolution chain
        const evolutionChainResponse = await fetch(speciesData.evolution_chain.url);
        const evolutionChainData = await evolutionChainResponse.json();
        const evolutionChain = getEvolutionChain(evolutionChainData.chain);

        // Fetch moves
        const moves = pokemonData.moves.map(move => move.move.name).join(', ');

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

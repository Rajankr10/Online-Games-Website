document.addEventListener('DOMContentLoaded', () => {
    populateTypeFilter();
    populateSpeciesFilter();
});

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

        pokemonInfoContainer.innerHTML = `
            <h2>${pokemonData.name}</h2>
            <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">
            <p><strong>Abilities:</strong> ${abilities}</p>
            <p><strong>Types:</strong> ${types}</p>
            <p><strong>Height:</strong> ${pokemonData.height}</p>
            <p><strong>Weight:</strong> ${pokemonData.weight}</p>
            <p><strong>Base Experience:</strong> ${pokemonData.base_experience}</p>
            <p><strong>Species:</strong> ${speciesData.name}</p>
            <p><strong>Characteristics:</strong> ${characteristics}</p>
            <p><strong>Evolution Chain:</strong> ${evolutionChain}</p> 
            <p><strong>Moves:</strong> ${moves}</p>
        `;
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

async function filterPokemon() {
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

        for (const pokemon of pokemonList) {
            const pokemonResponse = await fetch(pokemon.url);
            const pokemonData = await pokemonResponse.json();

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

            const pokemonElement = document.createElement('div');
            pokemonElement.className = 'pokemon-item';
            pokemonElement.innerHTML = `
                <h2>${pokemonData.name}</h2>
                <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">
                <p><strong>Abilities:</strong> ${abilities}</p>
                <p><strong>Types:</strong> ${types}</p>
                <p><strong>Height:</strong> ${pokemonData.height}</p>
                <p><strong>Weight:</strong> ${pokemonData.weight}</p>
                <p><strong>Base Experience:</strong> ${pokemonData.base_experience}</p>
                <p><strong>Species:</strong> ${speciesData.name}</p>
                <p><strong>Characteristics:</strong> ${characteristics}</p>
                <p><strong>Evolution Chain:</strong> ${evolutionChain}</p> 
                <p><strong>Moves:</strong> ${moves}</p>
            `;
            pokemonInfoContainer.appendChild(pokemonElement);
        }
    } catch (error) {
        pokemonInfoContainer.innerHTML = `<p>${error.message}</p>`;
    }
}

async function showSuggestions() {
    const input = document.getElementById('pokemon-name').value.toLowerCase();
    const suggestionsContainer = document.getElementById('suggestions');
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

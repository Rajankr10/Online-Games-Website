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

        pokemonInfoContainer.innerHTML = `
            <h2>${pokemonData.name}</h2>
            <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">
            <p><strong>Abilities:</strong> ${abilities}</p>
            <p><strong>Types:</strong> ${types}</p>
            <p><strong>Height:</strong> ${pokemonData.height}</p>
            <p><strong>Weight:</strong> ${pokemonData.weight}</p>
            <p><strong>Base Experience:</strong> ${pokemonData.base_experience}</p>
            <p><strong>Characteristics:</strong> ${characteristics}</p>
        `;
    } catch (error) {
        pokemonInfoContainer.innerHTML = `<p>${error.message}</p>`;
    }
}

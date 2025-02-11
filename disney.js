async function searchCharacter() {
    const characterName = document.getElementById('character-name').value.toLowerCase();
    const characterInfoContainer = document.getElementById('character-info');
    characterInfoContainer.innerHTML = '';

    if (!characterName) {
        characterInfoContainer.innerHTML = '<p>Please enter a character name.</p>';
        return;
    }

    try {
        const response = await fetch(`https://api.disneyapi.dev/character?name=${characterName}`);
        if (!response.ok) {
            throw new Error('Character not found');
        }
        const data = await response.json();
        const characters = data.data;

        if (characters.length === 0) {
            throw new Error('Character not found');
        }

        characters.forEach(characterData => {
            const characterElement = document.createElement('div');
            characterElement.className = 'character-item';
            characterElement.innerHTML = `
                <h2>${characterData.name}</h2>
                <img src="${characterData.imageUrl}" alt="${characterData.name}">
                <p><strong>Films:</strong> ${characterData.films.join(', ')}</p>
                <p><strong>Short Films:</strong> ${characterData.shortFilms.join(', ')}</p>
                <p><strong>TV Shows:</strong> ${characterData.tvShows.join(', ')}</p>
                <p><strong>Video Games:</strong> ${characterData.videoGames.join(', ')}</p>
                <p><strong>Park Attractions:</strong> ${characterData.parkAttractions.join(', ')}</p>
                <p><strong>Allies:</strong> ${characterData.allies.join(', ')}</p>
                <p><strong>Enemies:</strong> ${characterData.enemies.join(', ')}</p>
            `;
            characterInfoContainer.appendChild(characterElement);
        });
    } catch (error) {
        characterInfoContainer.innerHTML = `<p>${error.message}</p>`;
    }
}

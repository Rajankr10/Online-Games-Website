let currentPage = 1;
const totalPages = 149;

document.addEventListener('DOMContentLoaded', () => {
    fetchCharacters();

    // Hide suggestions when clicking outside the input and suggestions container
    document.addEventListener('click', (event) => {
        const suggestionsContainer = document.getElementById('suggestions-container');
        const nameInput = document.getElementById('character-name');

        if (suggestionsContainer && !suggestionsContainer.contains(event.target) && event.target !== nameInput) {
            suggestionsContainer.innerHTML = '';
        }
    });
});

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
            characterElement.innerHTML = `
                <h2>${characterData.name}</h2>
                <img src="${characterData.imageUrl}" alt="${characterData.name}" onclick='openModal("${characterData._id}")'>
            `;
            characterInfoContainer.appendChild(characterElement);
        });

        updatePageInfo(data.totalPages);
    } catch (error) {
        characterInfoContainer.innerHTML = `<p>${error.message}</p>`;
    }
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
            // Handle case where data.data is an array
            const characters = data.data;
        

            if (characters.length === 0) throw new Error('Character not found');

            characters.forEach(characterData => {
                const characterElement = document.createElement('div');
                characterElement.className = 'character-item';
                characterElement.innerHTML = `
                    <h2>${characterData.name}</h2>
                    <img src="${characterData.imageUrl}" alt="${characterData.name}" onclick='openModal("${characterData._id}")'>
                `;
                characterInfoContainer.appendChild(characterElement);
            });
        } else {
            // Handle case where data.data is a single object
            const characterData = data.data;

            if (!characterData) throw new Error('Character not found');

            const characterElement = document.createElement('div');
            characterElement.className = 'character-item';
            characterElement.innerHTML = `
                <h2>${characterData.name}</h2>
                <img src="${characterData.imageUrl}" alt="${characterData.name}" onclick='openModal("${characterData._id}")'>
            `;
            characterInfoContainer.appendChild(characterElement);
        }
    } catch (error) {
        characterInfoContainer.innerHTML = `<p>${error.message}</p>`;
    }
}

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
    document.getElementById('character-modal').style.display = "none";
}

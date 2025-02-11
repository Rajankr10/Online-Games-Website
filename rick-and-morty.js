document.addEventListener('DOMContentLoaded', () => {
    updateFilters();
    document.getElementById('name').addEventListener('input', fetchSuggestions);
    document.getElementById('search-type').addEventListener('change', () => {
        updateFilters();
        fetchSuggestions();
        fetchAllData();
    });
    fetchAllData();
});

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

function displayResults(results, searchType) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';
    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
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
                <h2>${result.name}</h2>
                <div class="result-details">
                    <p>Dimension: ${result.dimension}</p>
                    <p>Type: ${result.type}</p>
                    <p>Created: ${new Date(result.created).toLocaleDateString()}</p>
                </div>
            ` : searchType === 'episode' ? `
                <h2>${result.name}</h2>
                <div class="result-details">
                    <p>Episode: ${result.episode}</p>
                    <p>Air Date: ${result.air_date}</p>
                    <p>Created: ${new Date(result.created).toLocaleDateString()}</p>
                </div>
            ` : ''}
        `;
        resultItem.addEventListener('click', () => {
            const details = resultItem.querySelector('.result-details');
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        });
        resultsContainer.appendChild(resultItem);
    });
}

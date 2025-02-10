document.addEventListener('DOMContentLoaded', () => {
    updateFilters();
});

function updateFilters() {
    const searchType = document.getElementById('search-type').value;
    const additionalFiltersContainer = document.getElementById('additional-filters-container');
    additionalFiltersContainer.innerHTML = '';

    if (searchType === 'character') {
        additionalFiltersContainer.innerHTML = `
            <label for="status">Status:</label>
            <select id="status">
                <option value="">Any</option>
                <option value="alive">Alive</option>
                <option value="dead">Dead</option>
                <option value="unknown">Unknown</option>
            </select>
            <label for="species">Species:</label>
            <input type="text" id="species" placeholder="Species">
            <label for="type">Type:</label>
            <input type="text" id="type" placeholder="Type">
            <label for="gender">Gender:</label>
            <select id="gender">
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
            <select id="type">
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
            <input type="text" id="dimension" placeholder="Dimension">
        `;
    } else if (searchType === 'episode') {
        additionalFiltersContainer.innerHTML = `
            <label for="episode">Episode:</label>
            <input type="text" id="episode" placeholder="Episode">
        `;
    }
}

function toggleAdditionalFilters() {
    const additionalFiltersContainer = document.getElementById('additional-filters-container');
    if (additionalFiltersContainer.style.display === 'none') {
        additionalFiltersContainer.style.display = 'block';
    } else {
        additionalFiltersContainer.style.display = 'none';
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

        if (searchType === 'character') {
            resultItem.innerHTML = `
                <h2>${result.name}</h2>
                <p>Status: ${result.status}</p>
                <p>Species: ${result.species}</p>
                <p>Type: ${result.type || 'N/A'}</p>
                <p>Gender: ${result.gender}</p>
                <p>Origin: ${result.origin.name}</p>
                <p>Location: ${result.location.name}</p>
                <p>Episodes: ${result.episode.length}</p>
                <p>Created: ${new Date(result.created).toLocaleDateString()}</p>
                <img src="${result.image}" alt="${result.name}">
            `;
        } else if (searchType === 'location') {
            resultItem.innerHTML = `
                <h2>${result.name}</h2>
                <p>Type: ${result.type}</p>
                <p>Dimension: ${result.dimension}</p>
                <p>Created: ${new Date(result.created).toLocaleDateString()}</p>
            `;
        } else if (searchType === 'episode') {
            resultItem.innerHTML = `
                <h2>${result.name}</h2>
                <p>Episode: ${result.episode}</p>
                <p>Air Date: ${result.air_date}</p>
                <p>Created: ${new Date(result.created).toLocaleDateString()}</p>
            `;
        }

        resultsContainer.appendChild(resultItem);
    });
}
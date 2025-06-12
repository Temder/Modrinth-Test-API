let rateLimit = document.getElementById('rate-limit-info');
let apiResponse = document.getElementById('api-response');
let searchInput = document.getElementById('search-input');
let typeSelect = document.getElementById('type');
let loaderSelect = document.getElementById('loader');
let categorySelect = document.getElementById('category');
let game_versionSelect = document.getElementById('game_version');
let content = document.getElementById('content');
let tagList = ['category', 'game_version', 'loader'];

function multiSelVal(sel) {
    return [...sel.selectedOptions].map(opt => opt.value)
}

function testApiCall(url) {
    if (!url) {
        console.error('No URL provided for API call');
        return;
    }
    fetch('/api/modrinth/call', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url })
    })
    .then(response => {
        return response.text().then(text => {
            console.log('Raw response:', text); // Log raw response
            try {
                return JSON.parse(text); // Attempt to parse JSON
            } catch (error) {
                throw new Error(`Failed to parse JSON: ${error.message}`);
            }
        });
    })
    .then(data => {
        if (data.error) {
            console.error('Error:', data.error);
            rateLimit.getElementsByTagName('span')[0].textContent = 'Error fetching data from API';
        } else {
            apiResponse.getElementsByTagName('pre')[0].textContent = JSON.stringify(data.data, null, 2);
            rateLimit.getElementsByTagName('span')[0].innerHTML = `Limit: ${data.limit}<br>Remaining: ${data.remaining}<br>Reset: ${data.reset}`;
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        rateLimit.textContent = 'Failed to fetch data from API';
    });
}

function searchProjects() {
    let query = searchInput.value.trim();
    let facets = {
        project_type: multiSelVal(typeSelect),
        categories: multiSelVal(categorySelect), // includes loaders
        versions: multiSelVal(game_versionSelect)
    };
    const requestBody = {
        query: query || '',
        facets
    };
    fetch('/api/modrinth/searchProjects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error:', data.error);
            rateLimit.getElementsByTagName('span')[0].textContent = 'Error fetching data from API';
        } else {
            data.data.hits.forEach(project => {
                content.insertAdjacentHTML('beforeend', /*html*/`
                    <div style="background-image: url('${project.icon_url}');">
                        <h3>${project.title}</h3>
                        <div class="description">${project.description}</div>
                        <div class="author">Author: ${project.author}</div>
                    </div>
                `)
            });
            apiResponse.getElementsByTagName('pre')[0].textContent = JSON.stringify(data.data, null, 2);
            rateLimit.getElementsByTagName('span')[0].innerHTML = `Limit: ${data.limit}<br>Remaining: ${data.remaining}<br>Reset: ${data.reset}`;
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        rateLimit.textContent = 'Failed to fetch data from API';
    });
}

function getTags() {
    fetch('/api/modrinth/getTags')
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error:', data.error);
            rateLimit.getElementsByTagName('span')[0].textContent = 'Error fetching tags from API';
        } else {
            rateLimit.getElementsByTagName('span')[0].innerHTML = 'Tags loaded successfully';
            console.log('Tags loaded successfully');
        }
    })
}

function loadTags(type) {
    if (!tagList.includes(type)) {
        console.error(`Invalid type provided for tags: ${type}.\nExpected "category", "game_version", or "loader"`);
        return;
    }
    fetch('/api/modrinth/loadTags', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: type })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Error:', data.error);
            rateLimit.getElementsByTagName('span')[0].textContent = 'Error fetching tags from API';
        } else {
            document.getElementById(type).innerHTML = data.data.map(tag => {
                let name = type == 'game_version' ? 'version' : 'name';
                return `<option value="${tag[name]}">${tag[name]}</option>`
            }).join('');
            apiResponse.getElementsByTagName('pre')[0].textContent = JSON.stringify(data.data, null, 2);
            rateLimit.getElementsByTagName('span')[0].innerHTML = `Limit: ${data.limit}<br>Remaining: ${data.remaining}<br>Reset: ${data.reset}`;
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        rateLimit.textContent = 'Failed to fetch tags from API';
    });
}
document.addEventListener('DOMContentLoaded', function() {
    tagList.forEach(tag => {
        loadTags(tag);
    })
})
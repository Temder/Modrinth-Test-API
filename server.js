let express = require('express');
let path = require('path');
let livereload = require('livereload');
let connectLivereload = require('connect-livereload');
let axios = require('axios');
let fs = require('fs');

let app = express();
let PORT = 3000;

// Setup livereload server
let liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));

// Use connect-livereload middleware
app.use(connectLivereload());

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Notify livereload server on changes
liveReloadServer.server.once('connection', () => {
    setTimeout(() => {
        liveReloadServer.refresh('/');
    }, 100);
});

async function apiCall(url) {
    console.log(url);
    try {
        let response = await axios.get(url, {
            headers: {
                'User-Agent': 'Temder/Modrinth-API (tom.ender03@gmail.com)'
            }
        });
        return response; // Return the data to the caller
    } catch (error) {
        console.error('Error fetching data from API:', error);
        return 'Failed to fetch data from API';
    }
}

app.post('/api/modrinth/call', async (req, res) => {
    let url = req.body.url;
    let call = await apiCall(url);
    if (call.data && call.headers) {
        res.json({
            data: call.data,
            limit: call.headers['x-ratelimit-limit'],
            remaining: call.headers['x-ratelimit-remaining'],
            reset: call.headers['x-ratelimit-reset']
        });
    } else {
        res.status(500).json({ error: 'Failed to fetch data or headers from API' });
    }
});

app.post('/api/modrinth/searchProjects', async (req, res) => {
    let query = req.body.query ? `&query=${encodeURIComponent(req.body.query)}` : '';
    let facets = Object.entries(req.body.facets).map(([key, value]) => {
        if (value && value[0]) {
			return value.map(v => `["${key}:${v}"]`).join(',');
        }
        return null;
    }).filter(n => n).join(',');
    facets = facets ? `&facets=[${facets}]` : '';
    let url = `https://api.modrinth.com/v2/search?limit=5${query}${facets ? facets : ''}`;
    let call = await apiCall(url);
    if (call.data && call.headers) {
        res.json({
            data: call.data,
            limit: call.headers['x-ratelimit-limit'],
            remaining: call.headers['x-ratelimit-remaining'],
            reset: call.headers['x-ratelimit-reset']
        });
    } else {
        res.status(500).json({ error: 'Failed to fetch data or headers from API' });
    }
});

app.get('/api/modrinth/getTags', async (req, res) => {
    ['category', 'game_version', 'loader'].forEach(async (type) =>  {
        let url = `https://api.modrinth.com/v2/tag/${type}`;
        let call = await apiCall(url);
        if (call.data) {
            const filePath = path.join(__dirname, 'public', 'data', `${type}_tags.json`);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFile(filePath, JSON.stringify(call.data, null, 2), (err) => {
                if (err) {
                    console.error(`Error writing ${type} tags to file:`, err);
                }
            });
        }
    })
    res.status(200).json({ message: 'Tags fetched successfully' });
});

app.post('/api/modrinth/loadTags', async (req, res) => {
    let type = req.body.type;
    if (!['category', 'game_version', 'loader'].includes(type)) {
        return res.status(400).json({ error: `Invalid type provided for tags: ${type}. Expected "category", "game_version", or "loader"` });
    }
    let filePath = path.join(__dirname, 'public', 'data', `${type}_tags.json`);
    if (fs.existsSync(filePath)) {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading ${type} tags file:`, err);
                return res.status(500).json({ error: `Failed to read ${type} tags file` });
            }
            res.json({ data: JSON.parse(data) });
        });
    } else {
        res.status(404).json({ error: `${type} tags file not found` });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
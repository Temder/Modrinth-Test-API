let express = require('express');
let path = require('path');
let livereload = require('livereload');
let connectLivereload = require('connect-livereload');
let axios = require('axios');

let app = express();
let PORT = 3000;

// Setup livereload server
let liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));

// Use connect-livereload middleware
app.use(connectLivereload());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Notify livereload server on changes
liveReloadServer.server.once('connection', () => {
    setTimeout(() => {
        liveReloadServer.refresh('/');
    }, 100);
});

async function apiCall(url) {
    try {
        let response = await axios.get(url);
        return response; // Return the data to the caller
    } catch (error) {
        console.error('Error fetching data from API:', error);
        return 'Failed to fetch data from API';
    }
}

app.get('/api/modrinth/call', async (req, res) => {
    let url = 'https://staging-api.modrinth.com/';
    let call = await apiCall(url);
    //console.log('Data fetched from Modrinth API:', call);
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// api/search.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Allow requests from any origin (simple setup - Vercel handles CORS well usually)
    // You might want to restrict this more in a real production app.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS requests for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 1. Get the search query from the request URL
    const searchQuery = req.query.query;

    // 2. Get Google API Key and Search Engine ID from Environment Variables
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Set in Vercel
    const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID; // Set in Vercel

    if (!searchQuery) {
        return res.status(400).json({ error: 'Missing search query' });
    }

    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
        console.error('Google API Key or Search Engine ID not configured.');
        return res.status(500).json({ error: 'Server configuration error. API Key or Search Engine ID missing.' });
    }

    // 3. Construct the Google Custom Search API URL
    const endpoint = 'https://www.googleapis.com/customsearch/v1';
    const params = new URLSearchParams({
        key: GOOGLE_API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: searchQuery,
        num: '10',       // Number of results
        start: '1',      // Start index
        // safe: 'active' // Uncomment for safesearch
    });
    const GOOGLE_URL = `${endpoint}?${params}`;

    try {
        // 4. Call the Google Custom Search API
        console.log(`Fetching from Google API for query: ${searchQuery}`);
        const googleResponse = await fetch(GOOGLE_URL);
        const responseBody = await googleResponse.text(); // Read body once
        console.log(`Google Status: ${googleResponse.status}`);

        // Try to parse as JSON regardless of status, Google often sends error JSON
        let results;
        try {
            results = JSON.parse(responseBody);
        } catch (e) {
            // If parsing fails, maybe it wasn't JSON
            console.error("Failed to parse Google response as JSON:", responseBody);
            throw new Error(`Google API returned non-JSON response with status ${googleResponse.status}`);
        }


        // Check if the Google API call indicated an error status OR if the JSON contains an error object
        if (!googleResponse.ok || results.error) {
            console.error('Google API Error Response:', results.error || results);
            const message = results?.error?.message || `Google API request failed with status ${googleResponse.status}`;
            // Send Google's error back to the frontend
            return res.status(googleResponse.status).json({ error: message, details: results?.error?.errors });
        }

        // 5. Send the successful results back to your front-end
        return res.status(200).json(results); // Send the whole Google result object

    } catch (error) {
        console.error('Error in backend function:', error);
        return res.status(500).json({ error: 'Failed to fetch search results.', details: error.message });
    }
};
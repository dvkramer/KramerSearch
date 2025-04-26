const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const resultsContainer = document.getElementById('results');
const loadingIndicator = document.getElementById('loading');
const errorDisplay = document.getElementById('error');
// REMOVED: const googleBrandingContainer = document.getElementById('google-branding');

form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent page reload
    const query = input.value.trim();

    if (!query) return; // Don't search if empty

    // Clear previous results and errors, show loading
    resultsContainer.innerHTML = '';
    errorDisplay.textContent = '';
    errorDisplay.style.display = 'none';
    // REMOVED: googleBrandingContainer.style.display = 'none';
    loadingIndicator.style.display = 'block';


    try {
        // Call YOUR backend API endpoint (relative path works on Vercel)
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);

        loadingIndicator.style.display = 'none'; // Hide loading

        if (!response.ok) {
            // Try to get error details from backend response
            let errorMsg = `Request failed with status ${response.status}`;
            try {
                 const errorData = await response.json();
                 errorMsg = errorData.error || errorData.details || errorMsg;
            } catch(e) { /* Ignore if response isn't JSON */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        displayResults(data); // Pass the whole Google data object

    } catch (err) {
        console.error("Search failed:", err);
        loadingIndicator.style.display = 'none'; // Hide loading
        errorDisplay.textContent = `Error: ${err.message}`;
        errorDisplay.style.display = 'block';
        // REMOVED: googleBrandingContainer.style.display = 'none';
    }
});

function displayResults(googleData) {
    resultsContainer.innerHTML = ''; // Clear previous results

    // Check if Google returned items
    if (googleData.items && googleData.items.length > 0) {
        googleData.items.forEach(item => {
            const resultElement = document.createElement('div');
            // Extract data using Google's field names
            const title = item.title;
            const link = item.link;
            const displayLink = item.displayLink; // Google provides this separately
            const snippet = item.htmlSnippet || item.snippet; // Prefer htmlSnippet if available

            resultElement.innerHTML = `
                <h3><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
                <span>${displayLink}</span>
                <p>${snippet}</p> <!-- Use htmlSnippet directly as it contains <b> tags -->
            `;
            resultsContainer.appendChild(resultElement);
        });
        // REMOVED: googleBrandingContainer.style.display = 'block';
    } else if (googleData.error) {
         errorDisplay.textContent = `API Error: ${googleData.error.message}`;
         errorDisplay.style.display = 'block';
         // REMOVED: googleBrandingContainer.style.display = 'none';
    }
     else {
        resultsContainer.innerHTML = '<p>No results found.</p>';
        // REMOVED: googleBrandingContainer.style.display = 'none';
    }
}
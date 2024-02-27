const http = require('http');
const https = require('https');


// Function to send HTTP GET request
function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            let data = '';

            // A chunk of data has been received.
            res.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received.
            res.on('end', () => {
                resolve(data);
                // console.log(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Function to parse HTML and extract latest stories
function parseHTML(html) {
    const latestStories = [];
    const itemReg = /<li class="latest-stories__item">(.*?)<\/li>/gs;
    const titleReg = /<h3 class="latest-stories__item-headline">(.*?)<\/h3>/;
    const linkReg = /<a href="(.*?)">/;

    // Extracting latest stories
    let match;
    while ((match = itemReg.exec(html)) !== null && latestStories.length < 6) {
        const itemHTML = match[1];
        const titleMatch = titleReg.exec(itemHTML);
        const linkMatch = linkReg.exec(itemHTML);
        if (titleMatch && linkMatch) {
            const title = titleMatch[1].trim();
            const link = "https://time.com"+linkMatch[1];
            latestStories.push({ title, link });
        }
    }

    return latestStories;
}

// HTTP server to handle requests
const server = http.createServer(async (req, res) => {
    if (req.url === '/getTimeStories' && req.method === 'GET') {
        try {
            const html = await fetchHTML('https://time.com');
            const stories = parseHTML(html);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(stories));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error:',error);
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Start the server
const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
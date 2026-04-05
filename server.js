const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Default to ironlog.html if root is requested
    let filePath = req.url === '/' ? './ironlog.html' : '.' + req.url;
    
    // Remove query strings or hashes
    filePath = filePath.split('?')[0].split('#')[0];
    
    const extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(path.join(__dirname, filePath), (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 File Not Found');
            } else {
                res.writeHead(500);
                res.end('500 Internal Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`
🚀 IRON LOG Local Development Server Running!
--------------------------------------------
URL: http://localhost:${PORT}
PWA features (Service Worker, Manifest) are now enabled.

Press Ctrl+C to stop the server.
    `);
});

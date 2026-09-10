import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'browser');
const types = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.map': 'application/json'
};

const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const candidate = path.normalize(path.join(root, urlPath === '/' ? '/index.html' : urlPath));
    if (!candidate.startsWith(root)) {
        res.writeHead(403);
        res.end();
        return;
    }
    fs.readFile(candidate, (err, data) => {
        if (err) {
            fs.readFile(path.join(root, 'index.html'), (indexErr, indexData) => {
                if (indexErr) {
                    res.writeHead(404);
                    res.end('missing dist/browser');
                    return;
                }
                res.writeHead(200, { 'content-type': 'text/html' });
                res.end(indexData);
            });
            return;
        }
        res.writeHead(200, { 'content-type': types[path.extname(candidate)] ?? 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(4201, '127.0.0.1', () => {
    process.stdout.write('hierarchy-static-server 127.0.0.1:4201\n');
});

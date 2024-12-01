const express = require('express');
const httpProxy = require('http-proxy');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT; // Default port if not specified
const BASE_PATH = process.env.BASE; // Default base path

const proxy = httpProxy.createProxyServer({});

// Middleware to handle subdomain-based routing
app.use((req, res) => {
    const hostname = req.hostname;
    console.log(hostname);
    const subdomain = hostname.split('.')[0]; // Extract subdomain
    console.log(`Request received for subdomain: ${subdomain}`);

    if (!subdomain || subdomain === 'www') {
        return res.status(400).send('Invalid or missing subdomain');
    }

    // Construct the target URL based on the subdomain
    const targetUrl = `${BASE_PATH}/${subdomain}`;
    console.log(`Proxying request to: ${targetUrl}`);

    proxy.web(req, res, { target: targetUrl, changeOrigin: true }, (err) => {
        console.error(`Proxy error: ${err.message}`);
        res.status(502).send('Error forwarding request');
    });
});

// Handle proxy events
proxy.on('proxyReq', (proxyReq, req) => {
    if (req.url === '/') {
        proxyReq.path += 'index.html';
    }
});

// Log errors on the proxy
proxy.on('error', (err, req, res) => {
    console.error(`Proxy error: ${err.message}`);
    res.status(500).send('Proxy encountered an error');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Reverse Proxy Running on port ${PORT}`);
});

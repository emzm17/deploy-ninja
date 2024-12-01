const express = require('express');
const httpProxy = require('http-proxy');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT;

const BASE_PATH = process.env.BASE;
const proxy = httpProxy.createProxy();
// Middleware to handle subdomain-based routing
app.use(async (req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0] // Extract subdomain and convert to lowercase
    try {
        const resolvesTo = `${BASE_PATH}/${subdomain}`;
        proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
    } catch (error) {
        console.error('Error fetching project:', error.message);
        return res.status(500).send('Error fetching project');
    }
});
proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if (url === '/') {
        proxyReq.path += 'index.html';
    }
});

app.listen(PORT, () => {
  console.log(`Reverse Proxy Running on port ${PORT}`);
});

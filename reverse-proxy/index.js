const express = require('express');
const httpProxy = require('http-proxy');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const PORT = 8000;

const BASE_PATH = `${process.env.BASE}`;

const proxy = httpProxy.createProxy();

// Middleware to handle subdomain-based routing
app.use(async (req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0].toLowerCase().trim(); // Extract subdomain and convert to lowercase

    try {
        const project = await prisma.project.findUnique({
            where: { subDomain: subdomain }
        });
        

        const resolvesTo = `${BASE_PATH}/${project.id}`;
        console.log(resolvesTo);
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

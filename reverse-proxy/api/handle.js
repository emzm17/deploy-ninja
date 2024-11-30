const httpProxy = require('http-proxy');
require('dotenv').config();

const BASE_PATH = process.env.BASE;
const proxy = httpProxy.createProxy();

module.exports = (req, res) => {
  const hostname = req.headers.host;
  const subdomain = hostname.split('.')[0]; // Extract subdomain
  try {
    const resolvesTo = `${BASE_PATH}/${subdomain}`;
    console.log(`Resolves To: ${resolvesTo}`);

    proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
  } catch (error) {
    console.error('Error fetching project:', error.message);
    return res.status(500).send('Error fetching project');
  }
};

proxy.on('proxyReq', (proxyReq, req, res) => {
  const url = req.url;
  if (url === '/') {
    proxyReq.path += 'index.html';
  }
});

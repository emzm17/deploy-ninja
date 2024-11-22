const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
require('dotenv').config();
const { createClient } = require('redis');
const isValidGitHubUrl = require('./utils');

if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.prod' });
  } else {
    dotenv.config({ path: '.env' }); 
  }

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL // Redis connection URL
});

async function sendTaskMessage(githubUrl, projectId) {
    if (!githubUrl || !projectId) {
        console.error('Invalid input: githubUrl and projectId are required');
        return;
    }
    try {
        const message = JSON.stringify({ githubUrl, projectId });
        const queueName = process.env.REDIS_QUEUE;
        await redisClient.rPush(queueName, message);
        console.log(`Task message sent for Project ID: ${projectId}`);
    } catch (error) {
        console.error('Error sending task message:', error);
    }
}

app.post('/deploy', async (req, res) => {
    const {githubUrl} = req.body;
    const myUUID = uuidv4(); // Generate UUID per request

    if (!githubUrl || !isValidGitHubUrl(githubUrl)) {
        return res.status(400).json({ error: 'A valid GitHub URL is required' });
    }

    console.log(`Received GitHub URL: ${githubUrl}`);
    await sendTaskMessage(githubUrl, myUUID);
    res.status(200).json({ message: 'Project data received', githubUrl, myUUID });
});

async function startServer() {
    try {
        if (!process.env.REDIS_URL || !process.env.REDIS_QUEUE) {
            throw new Error('Environment variables REDIS_URL and REDIS_QUEUE are required.');
        }

        await redisClient.connect();
        console.log('Connected to Redis');

        app.listen(PORT, () => {
            console.log(`API Server is running on port ${PORT}`);
        });

        // Graceful shutdown -->signal is sent to a process when you press Ctrl+C in the terminal to terminate it.
        process.on('SIGINT', async () => {
            console.log('Shutting down gracefully...');
            await redisClient.disconnect();
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const { createClient } = require('redis');
const isValidGitHubUrl = require('./utils');
const cors = require('cors');
const {generateSlug} = require('random-word-slugs');
const {newRecord,updateRecord,getRecord}=require("./db");





if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.prod' });
  } else {
    dotenv.config({ path: '.env' }); 
  }

const redisChannel=process.env.channel;  


const app = express();
const PORT = process.env.PORT || 8080;
// Allow all origins
app.use(cors());

// Middleware
app.use(express.json());

// Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL // Redis connection URL
});

const queueClient = createClient({
  url: process.env.REDIS_URL // Redis connection URL
});


app.get('/status', async (req, res) => {
    try {
      const { id, subdomain } = req.query; // Use query parameters for GET requests
      if (!id || !subdomain) {
        return res.status(400).json({ error: 'uuid and subdomain are required.' });
      }
      const record=await getRecord(id);
      if (!record) {
        return res.status(404).json({ error: 'Record not found.' });
      }
      res.status(200).json({
        status: record[0].status,
        subdomain: record[0].subdomain,
      });
    } catch (error) {
      console.error('Error fetching status:', error.message);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
  

async function sendTaskMessage(githubUrl, subdomain, uuid) {
    if (!githubUrl) {
        console.error('Invalid input: githubUrl are required');
        return;
    }
    try {
        const message = JSON.stringify({ githubUrl, subdomain, uuid });
        const queueName = process.env.REDIS_QUEUE;
        await queueClient.rPush(queueName, message);
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
    const subDomain=generateSlug();
    await sendTaskMessage(githubUrl,subDomain,myUUID);
    try{
        const newDeployment=await newRecord(myUUID,subDomain);
      res.status(200).json({ message: 'Project data received',subdomain:subDomain,id:myUUID});
    }
  catch(err){
  console.error( err.message);
  res.status(500).json({ error: 'Internal Server Error' });
  }    
});


// Need to update

async function startSubscriber(channel,message) {
  try {
    await redisClient.subscribe(channel, async (rawMessage) => {
        try {
            // Parse JSON message
            const parsedMessage = JSON.parse(rawMessage);
            // Extract Message
            const new_subdomain = parsedMessage.subDomain;
            const project_ID=parsedMessage.project_id;
            // Update the deployment record in Prisma

            const updatedRecord = await updateRecord(project_ID);
        } catch (err) {
            console.error(`Error processing message on "${channel}":`, err.message);
        }
    });

    console.log(`Subscribed to channel: "${channel}"`);
} catch (err) {
    console.error(`Error subscribing to channel "${channel}":`, err.message);
}

  }
  

async function startServer() {
    try {
        if (!process.env.REDIS_URL || !process.env.REDIS_QUEUE) {
            throw new Error('Environment variables REDIS_URL and REDIS_QUEUE are required.');
        }

        await redisClient.connect();
        await queueClient.connect();
        console.log('Connected to Redis');
        startSubscriber(redisChannel);
        app.listen(PORT, () => {
            console.log(`API Server is running on port ${PORT}`);
        });

        // Graceful shutdown -->signal is sent to a process when you press Ctrl+C in the terminal to terminate it.
        process.on('SIGINT', async () => {
            console.log('Shutting down gracefully...');
            await redisClient.disconnect();
            await queueClient.disconnect();
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();


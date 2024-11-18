const express= require('express');
const app = express();
const PORT=8080;
const {v4:uuidv4} = require('uuid');
require('dotenv').config();
app.use(express.json())
const myUUID = uuidv4();
const { Kafka } = require('kafkajs');
const isValidGitHubUrl=require('./utils');



// Kafka producer setup
const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT,
    brokers: [process.env.KAFKA_BROKERS], 
});

const producer = kafka.producer();

async function sendTaskMessage(githubUrl, projectId) {
    await producer.connect();
    const message = { githubUrl, projectId };
    await producer.send({
        topic: process.env.KAFKA_TOPIC,
        messages: [{ value: JSON.stringify(message) }],
    });
    await producer.disconnect();
    console.log(`Task message sent for Project ID: ${projectId}`);
}

app.post('/deploy',async(req,res)=>{
    const { githubUrl} = req.body;

    if (!githubUrl || !isValidGitHubUrl(githubUrl)) { return res.status(400).json({ error: 'A valid GitHub URL is required' }); }
  
    // Log extracted data
    console.log(`Received GitHub URL: ${githubUrl}`);
    // Send a response back
    await sendTaskMessage(githubUrl,myUUID);
    res.status(200).json({ message: 'Project data received', githubUrl, myUUID });
  });
  


app.listen(PORT,()=>{
     console.log(`API Server is running ...${PORT}`)
})
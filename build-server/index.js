const { exec } = require('child_process');
const dotenv = require('dotenv');
const { createClient } = require('redis');
if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.prod' });
  } else {
    dotenv.config({ path: '.env' }); 
  }
const dockerImage = process.env.DOCKER_IMAGE; // Docker Hub image  
// Initialize Redis client
const redisClient = createClient({
    url: process.env.REDIS_URL, // Redis connection URL
});

// Function to start a Docker container
async function startDockerContainer(githubUrl, subdomain,uuid) {
    const dockerCommand = `docker run --rm -e GIT_REPO_URL=${githubUrl} -e SUBDOMAIN=${subdomain}  -e PROJECT_ID=${uuid}   ${dockerImage}`;
    
    exec(dockerCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error starting Docker container: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Docker error: ${stderr}`);
            return;
        }
        console.log(`Docker container started successfully: ${stdout}`);
    });
}

// Function to process a single task
async function processTask(githubUrl,subdomain,uuid) {
    console.log(`Processing project with GitHub URL: ${githubUrl} and Subdomain: ${subdomain}`);
    await startDockerContainer(githubUrl,subdomain,uuid);
}

// Function to process tasks from the Redis queue
async function processTaskMessages() {
    try {
        await redisClient.connect();
        const queueName = process.env.REDIS_QUEUE;

        console.log(`Listening for tasks on queue: ${queueName}`);

        while (true) {
            try {
                // Wait for a message from the queue
                const result = await redisClient.brPop(queueName, 0); // Blocks indefinitely
                const task = JSON.parse(result.element);
                // Validate task properties
                // Process the task
                await processTask(task.githubUrl, task.subdomain, task.uuid);
            } catch (innerError) {
                console.error('Error processing individual task:', innerError);
            }
        }
    } catch (error) {
        console.error('Error setting up task processor:', error);
    } finally {
        // Disconnect from Redis
        await redisClient.disconnect();
    }
}

// Start processing messages
processTaskMessages();

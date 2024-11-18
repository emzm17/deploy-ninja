const { Kafka } = require('kafkajs');
const {exec}=require('child_process');
require('dotenv').config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT,
  brokers: [process.env.KAFKA_BROKERS], 
});
const consumer = kafka.consumer({ groupId: process.env.KAFKA_CONSUMER_GROUP });



async function startDockerContainer(githubUrl, projectId) {
  const dockerImage = process.env.DOCKER_IMAGE; // Replace with the desired Docker Hub image
  const dockerCommand = `docker run --rm  -e GIT_REPO_URL=${githubUrl} -e PROJECT_ID=${projectId} ${dockerImage}`;
  
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


// Function to start Docker container and handle task processing
async function processTask(githubUrl, projectId) {
  console.log(`Processing project with GitHub URL: ${githubUrl} and Project ID: ${projectId}`);
  // Implement Docker start, build, and upload logic here
  await startDockerContainer(githubUrl, projectId);
}

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: process.env.KAFKA_TOPIC, fromBeginning: true });

  await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
          const task = JSON.parse(message.value.toString());
          const githubUrl = task.githubUrl;
          const projectId = task.projectId;
          
          // Process the task message
          await processTask(githubUrl, projectId);
      },
  });

  console.log('Consumer is listening to deploy-tasks topic');
}





// Start the consumer
startConsumer();
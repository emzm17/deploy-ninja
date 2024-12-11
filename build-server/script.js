const {exec}=require('child_process');
const path=require('path');
const fs= require('fs');
const mime=require('mime-types');
const { createClient } = require('redis');
require('dotenv').config();
const redisClient = createClient({
  url: process.env.REDIS_URL // Redis connection URL
});
const redisChannel=process.env.channel;
const subdomain=process.env.SUBDOMAIN;
const PROJECT_ID=process.env.PROJECT_ID;
const command=process.env.COMMAND
console.log(subdomain);
const { S3Client, PutObjectCommand} = require("@aws-sdk/client-s3");


const REGION = "auto"; // Use "auto" to let Cloudflare choose the best region
const ENDPOINT = process.env.ENDPOINT;

const s3 = new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: process.env.accessKeyId,
        secretAccessKey: process.env.secretAccessKey,
      },
    });


// Now you can use kafka and s3client objects in your application
// const producer = kafka.producer()
async function init(){
      await redisClient.connect();
      console.log('Connected to Redis');
      //   await producer.connect()
        console.log('executing script.js');
      //   await publishlog('Build Started....')
        const outDirPath=path.join(__dirname,'output');

        // validation layer 
        const pro=exec(`cd ${outDirPath} && npm install && ${command}`);
        // it will build a dist/ folder we will upload this in R2

        pro.stdout.on('data',async (data)=>{
              console.log(data.toString());
        })

        pro.stdout.on('error', async (data)=>{
            console.log('Error',data.toString());
         // Publish error message to Redis
            const message = {
            subDomain: subdomain,
            project_id: PROJECT_ID,
            status: "failed",
            message: `${data.toString()}`};
            await publishMessage(redisChannel, message);
      })

      pro.on('close',async(code)=>{
        if (code !== 0) { 
          const message = {
            subDomain: subdomain, 
            project_id: PROJECT_ID, 
            status: "failed", 
            message: `Build process exited with code something wrong` 
          }; 
          await publishMessage(redisChannel, message); 
          return; 
        }
        console.log('Build complete');
        const distFolderPath=path.join(__dirname,'output','dist');
        const distFolderContents= await fs.readdirSync(distFolderPath,{recursive:true});
        // this will give us all the filepath 
        const message={subDomain:subdomain,project_id:PROJECT_ID,status:"success",message:"build complete"}
        publishMessage(redisChannel,message)
        for (const file of distFolderContents) {
            const filepath = path.join(distFolderPath, file);
      
            if (fs.lstatSync(filepath).isDirectory()) continue;
            console.log('uploading', filepath)
            const command = new PutObjectCommand({
                  Bucket: process.env.bucket,
                  Key: `__outputs/${subdomain}/${file}`,
                  Body: fs.createReadStream(filepath),
                  ContentType: mime.lookup(filepath),
            });
            await s3.send(command);
           console.log('uploaded', filepath)   
        }
        console.log('Done..');  
        process.exit(0);

  })


}

init();

async function publishMessage(channel, message) {
  await redisClient.publish(channel, JSON.stringify(message));
  // Disconnect after publishing
  await redisClient.disconnect();
}

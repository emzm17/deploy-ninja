const {exec}=require('child_process');
const path=require('path');
const fs= require('fs');
const {PutObjectCommand } = require("@aws-sdk/client-s3");
const mime=require('mime-types');
const {Kafka} = require('kafkajs');
require('dotenv').config();
const DEPLOYMENT_ID=process.env.DEPLOYMENT_ID;  
const PROJECT_ID=process.env.PROJECT_ID;


const { kafka, s3client } = require('./connection');
// Now you can use kafka and s3client objects in your application
const producer = kafka.producer()
async function init(){
        await producer.connect()
        console.log('executing script.js');
        await publishlog('Build Started....')
        const outDirPath=path.join(__dirname,'output');

        // validation layer 


        const pro=exec(`cd ${outDirPath} && npm install && npm run build`);
        // it will build a dist/ foler we will upload this in S3

        pro.stdout.on('data',async (data)=>{
              console.log(data.toString());
             await publishlog(data.toString)
        })

        pro.stdout.on('error', async (data)=>{
            console.log('Error',data.toString());
            await publishlog(`error:${data.toString}`)
      })
      pro.on('close',async()=>{
        console.log('Build complete');
        const distFolderPath=path.join(__dirname,'output','dist');
        const distFolderContents= await fs.readdirSync(distFolderPath,{recursive:true});
        // this will give us all the filepath 

        for (const file of distFolderContents) {
            const filepath = path.join(distFolderPath, file);
      
            if (fs.lstatSync(filepath).isDirectory()) continue;

            await publishlog(`uploading ${file}`) 
            console.log('uploading', filepath)
            const command = new PutObjectCommand({
                  Bucket: 'my-vercel-output',
                   Key: `__outputs/${PROJECT_ID}/${file}`,
                   Body: fs.createReadStream(filepath),
                   ContentType: mime.lookup(filepath)
            })

            await s3client.send(command);
           await publishlog(`uploaded ${file}`) 
            console.log('uploaded', filepath)
                
        }
        console.log('Done..')
        publishlog(`Done`) 
        process.exit(0);

  })


}

async function publishlog(log){
     await producer.send({
            topic: `container-logs`,messages : [{
                   key: 'log',value: JSON.stringify(
                        {
                              PROJECT_ID,DEPLOYMENT_ID,log
                        }
                   )
            }]
      })
}

init();



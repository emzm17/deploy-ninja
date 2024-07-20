const { S3Client} = require('@aws-sdk/client-s3')
const { Kafka } = require('kafkajs')
require('dotenv').config();


const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env. AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})


const PROJECT_ID = process.env.PROJECT_ID
const DEPLOYEMENT_ID = process.env.DEPLOYEMENT_ID

const kafka = new Kafka({
    clientId: `docker-build-server-${DEPLOYEMENT_ID}`,
    brokers: [process.env.KAFKA_BROKER],

})


module.exports ={
    kafka,s3Client
}
const express= require('express');
const app = express();
const PORT=8080;
const {PrismaClient} = require('@prisma/client')
const {v4:uuidv4} = require('uuid');

app.use(express.json())
const userRouter = require('./routes/userRouter');
const projectRouter = require('./routes/projectRouter');
app.use("/users",userRouter);
app.use('/projects',projectRouter);
const {kafka,client,deploy} = require('./connections');

const consumer = kafka.consumer({
  groupId: 'api-server-logs-consumer'
});

const prisma = new PrismaClient ({});


app.get('/logs/:id',async(req,res)=>{
    const id = req.params.id;
    const logs  = await client.query({
            query: `select event_id,deployment_id,log,timestamp from log_events where deployment_id=
            {deployment_id: String}`
            , query_params: {
                deployment_id: id
            },
            format: 'JSONEachRow'
        })
        const rawLogs= await logs.json();
        return res.json({logs: rawLogs});
})
app.post('/deploy',deploy);



async function initKafkaConsumer(){
 await consumer.connect()
 await consumer.subscribe({ topics: ['container-logs'],fromBeginning: true } )


 await consumer.run({

    eachBatch: async function ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) {

        const messages = batch.messages;
        console.log(`Recv. ${messages.length} messages..`)
        for (const message of messages) {
            if (!message.value) continue;
            const stringMessage = message.value.toString()
            const { PROJECT_ID, DEPLOYMENT_ID, log } = JSON.parse(stringMessage)
            console.log({ log, DEPLOYMENT_ID })
            try {
                const { query_id } = await client.insert({
                    table: 'log_events',
                    values: [{ event_id: uuidv4(), deployment_id: DEPLOYMENT_ID, log }],
                    format: 'JSONEachRow'
                })
                console.log(query_id)
                resolveOffset(message.offset)
                await commitOffsetsIfNecessary(message.offset)
                await heartbeat()
            } catch (err) {
                console.log(err)
            }

        }
    }
})





// If the insertion is successful, the offset of the processed message is committed 
// using commitOffsetsIfNecessary and resolveOffset to keep track of processed messages.
// The heartbeat method is called to ensure the consumer stays active and avoids session timeouts. 

}
initKafkaConsumer()
app.listen(PORT,()=>{
     console.log(`API Server is running ...${PORT}`)
})
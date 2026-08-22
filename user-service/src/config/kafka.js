const {kafka, Kafka, logLevel} = require('kafkajs');
const logger = require('./logger');
const {config} = require('./index');

//kafka instance create
const kafka = new Kafka({
    clientId: config.KAFKA_CLIENT_ID,
    brokers: [config.KAFKA_BROKER || 'localhost:9093'],
    logLevel: logLevel.INFO,
    retry:{
        initialRetryTime: 300,
        retries: 8,
        maxRetryTime: 30000

    }
})

// these producer will generate events and send to the kafka cluster
const producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
    idempotent: true,   // idempotent denotes that the producer will ensure that messages are delveierd only once 
    maxInFlightRequests: 5,
    retry:{
        retries: 5,
    }
});

let isConnected = false;

const connectProducer = async ()=>{
    if(!isConnected){
        await producer.connect();
        isConnected = true;
        logger.info('Kafka producer connected');
    }
}

const disconnectProducer = async ()=>{
    if(isConnected){
        await producer.disconnect();
        isConnected = false;
        logger.info('Kafka producer disconnected');
    }
}

//graceful shutdown of the producer
process.on('SIGTERM',disconnectProducer);
process.on('SIGINT',disconnectProducer);

module.exports = {kafka, producer, connectProducer, disconnectProducer};
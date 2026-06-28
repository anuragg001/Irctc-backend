const Redis = require('ioredis');
const { config } = require('.');
const logger = require('./logger');


// Provide a singleton instance of Redis client
// SIngleton pattern ensures that only one instance of the Redis client is created and shared across the application.
class RedisClient {

    static instance;
    static isConnected = false;

    constructor() {
        //prevent direct instantiation of the class
    }

    static getInstance(){
        if(!RedisClient.instance){
            // then create a new instance of the Redis client
            RedisClient.instance = new Redis(config.REDIS_URL,{
                retryStrategy(times){
                    const delay = Math.min(times * 50, 2000);
                    return delay
                },
                maxRetriesPerRequest: 3, // Limit the number of retries for each request to 3
            })
            RedisClient.setupEventListeners();
        }
        return RedisClient.instance;
    }


    static setupEventListeners(){
        RedisClient.instance.on('connect',()=>{
            RedisClient.isConnected = true;
            logger.info('Redis client connected');
        })

        RedisClient.instance.on('error',(err)=>{
            RedisClient.isConnected = false;
            logger.error('Redis client error', err);
        })

        RedisClient.instance.on('close',()=>{
            RedisClient.isConnected = false;
            logger.warn('Redis client connection closed');
        })

        RedisClient.instance.on('reconnecting',()=>{
            logger.warn('Redis client reconnecting');
        })

        RedisClient.instance.on('ready',()=>{
            logger.warn('Redis client is ready to use');
        })

        RedisClient.instance.on('end',()=>{
            RedisClient.isConnected = false;
            logger.warn('Redis client connection ended');
        })
    }


    static async closeConnection(){
        if(RedisClient.instance){
            try{
                await RedisClient.instance.quit();
                logger.info('Redis client connection closed gracefully');
            }catch(err){
                logger.error('Error closing Redis client connection', err);
            }
        }
    }

    static isReady(){
        return RedisClient.isConnected;
    }

    static async testConnection(){
        try{
            await RedisClient.instance.ping();
            return true;
        }catch(err){
            logger.error('Redis client ping failed', err);
            return false;
        }
    }


};

// export both the singleton instance and the class

module.exports = {
    redis: RedisClient.getInstance(),
    RedisClient
}
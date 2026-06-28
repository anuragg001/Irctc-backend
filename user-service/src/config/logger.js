// formatting of the logs detail for us
const winston = require('winston');
const {config} = require('.');

const logger = winston.createLogger({
    level: config.LOG_LEVEL,
    defaultMeta: { service: config.SERVICE_NAME},
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({level, message, timestamp, service} )=>{
            return `[${timestamp}] [${level.toUpperCase()}] [${service}]  ${message}`;
        })
    ),
    transports: [ new winston.transports.Console()]
})
module.exports = logger;
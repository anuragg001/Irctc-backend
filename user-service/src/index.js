const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { config } = require('./config');
const  logger = require('./config/logger');

const { corsMiddleware } = require('./middlewares/cors.middleware');
const errorhandler = require('./middlewares/error.middleware');
const {reqLogger} = require('./middlewares/req.middleware');

const app = express();

// console.log({ corsMiddleware, errorhandler, reqLogger });
//middlwares
app.use(helmet());
app.use(corsMiddleware);
app.use(reqLogger);
app.use(cookieParser());
app.use(express.json());

app.get('/',(req,res)=>{
    res.send('User Service is running')
})

app.get('/health',(req,res)=>{
    res.status(200).json({
        message:"ok"
    })
})

//custom error handler  we will make
app.use(errorhandler);

const startServer = () =>{
    try{
        const server = app.listen(config.PORT,()=>{
            logger.info(
                `${config.SERVICE_NAME} is running on http://localhost:${config.PORT}`
            );
        })
    }catch(err){
        logger.error("failed to start server", err);
        process.exit(1);
    }
}

startServer();

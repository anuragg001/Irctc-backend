 // this midlware is responsibel to check all the incoming request to our web server 
//  and validate the req and logg all the information 
// All detail logging will be done in this middleware
const logger = require('../config/logger');

const reqLogger = (req,res,next)=>{
    logger.debug( `[${req.method} ${req.originalUrl}] `);
    const start = Date.now();

    res.on('finish',()=>{
        const duration = Date.now() - start;
        logger.info(
            `[ ${req.method}] ${req.originalUrl} - status: ${res.statusCode} - ${duration}ms `
        );
    });
    next();
}
module.exports = { reqLogger };

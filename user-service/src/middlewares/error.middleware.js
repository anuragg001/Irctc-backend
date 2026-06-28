// this file take all the custom error and send the response to the client
// without writing multiple try catch block in the controller we can use this middleware to handle all the errors

const {AppError} = require('../utils/error');

module.exports = (err,req,res,next)=>{
    if( err instanceof AppError){
        return res.status(err.statusCode).json({
            success:false,
            error: err.code,
            message: err.message
        })
    }

    console.error("UNHANDLED ERROR", err);
}
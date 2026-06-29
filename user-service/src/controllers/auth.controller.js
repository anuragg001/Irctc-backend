// Auth controller is just for handling incoming request related to authentication and route it 
// to correct bussiness logic layer and send the response back to the client
const { BadRequestError } = require("../utils/error");
const asyncHandler = require("../utils/asyncHandler");
const {config} = require("../config");
const authService = require("../services/auth.service");

exports.sendOTP = asyncHandler(async(req,res)=>{

    //get the basic details from the request body
    const {firstName,lastName,email,password,confirmPassword } = req.body;

    // check for missing fields
    if(!firstName || !lastName || !email || !password || !confirmPassword){
        res.status(400);
        throw new BadRequestError('Please fill all the fields');
    }

    //check for password match
    if(password !== confirmPassword){
        res.status(400);
        throw new BadRequestError('Passwords do not match');
    }

    //now give the control to the authservice to send the otp to the user
    const {otpSessionId} = await authService.sendOTP(firstName,lastName,email,password);


    // now store the otpSessionId in the cookie
    res.cookie('otp_session',otpSessionId,{
        httpOnly:true,
        secure: true,
        sameSite: 'strict',
        maxAge: config.OTP_TTL * 1000, // convert to milliseconds
    }).status(200).json({
        success:true,
        message:'OTP sent successfully'
    })

})
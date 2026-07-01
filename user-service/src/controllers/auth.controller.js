// Auth controller is just for handling incoming request related to authentication and route it 
// to correct bussiness logic layer and send the response back to the client
const { BadRequestError } = require("../utils/error");
const asyncHandler = require("../utils/asyncHandler");
const {config} = require("../config");
const authService = require("../services/auth.service");
const getDeviceFingerprint = require("../utils/deviceFingerprint");

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

exports.verifyOTP = asyncHandler(async(req,res)=>{
    // match the otpSessionId from the cookie with the one in the request body

    const {otp} = req.body;
    const otpSessionId = req.cookies.otp_session;

    //check if we have recived the both fields
    if(!otp || !otpSessionId){
        throw new BadRequestError('OTP and OTP session ID are required');
    }

    // now give the control to the authservice to verify the otp
    const user  = await authService.verifyOTP(otp,otpSessionId);
    return res.status(200).json({
        success:true,
        message:'User Account created  successfully',
        data:user
    })
})

exports.login = asyncHandler(async(req,res)=>{
    // get email and password from the request body
    const {email, password} = req.body;

    // chek if correctly recivers or not 
    if(!email || !password){
        throw new BadRequestError('Email and password are required');
    }

    //get the device id 
    const deviceId = getDeviceFingerprint(req);

    // now route the ttp request to correct bussiness logic layer
    const {accessToken, refreshToken, loggedInUser} = await authService.login(email,password,deviceId);


    //now store the accessToken and refreshToken in the cookie
    res.cookie('accessToken',accessToken, {
         httpOnly:true,
         secure: true,
         sameSite: 'strict',  // single dommain can access the cookie 
         maxAge: config.ACCESS_TOKEN_EXP_SEC * 1000, // convert to milliseconds
          
    })

    res.cookie('refreshToken',refreshToken,{
        httpOnly:true,
        secure: true,
        sameSite: 'strict',  // single dommain can access the cookie 
        maxAge: config.REFRESH_TOKEN_EXP_SEC * 1000, // convert to milliseconds 
    }).status(200).json({
        success:true,
        message:'User logged in successfully',
        loggedInUser
    })
})
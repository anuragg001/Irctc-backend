const { generateAndStoreOtp, verifyOtp } = require("../utils/otp");
const { sendOtpEmail, verifyOtpEmail } = require("../utils/email");
const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const { ConflictError, BadRequestError } = require("../utils/error");
const { generateAccessToken, generateRefreshToken } = require("../utils/auth");
const { config } = require("../config");
const jwt = require("jsonwebtoken");
const {redis} = require("../config/redis");

const sendOTP = async (firstName, lastName, email, password) => {
   //does user already exist in the db
   const existingUser = await prisma.user.findUnique({
      where: {
         email
      }
   })
   if (existingUser) {
      throw new ConflictError('User already exists with this email');
   }
   // if not exist then hash the password and send the otp to the user
   const hashedPassword = await bcrypt.hash(password, 12);
   const meta = { firstName, lastName, email, hashedPassword };

   //generate the otp and send it to the user
   const { otp, otpSessionId } = await generateAndStoreOtp(meta);
   await sendOtpEmail(email, otp)
   return { otpSessionId };
}

const verifyOTP = async (otp, otpSessionId) => {
   // firstly hash the otp and then check if it is valid or not
   const meta = await verifyOtp(otp, otpSessionId);

   if (meta == null) {
      throw new BadRequestError('Invalid OTP or OTP session ID','OTP_VERIFICATION_FAILED');
   }
   const user = await prisma.user.create({
      data:{
         firstName: meta.firstName,
         lastName: meta.lastName,
         email: meta.email,
         password: meta.hashedPassword,
         emailVerified: true
      }
   })
   await verifyOtpEmail(meta.email, firstName);
   return user;
   
}

const login = async( email, password, deviceId)=>{
   // check is email/user alerady exist
   const existingUser = await prisma.user.findUnique({
      where:{
         email
      }
   }) 
   if(!existingUser){
      throw new BadRequestError('User does not exist with this email');
   }

   // if email exist check the correctness of the password'
   const doesPasswordMatch = await bcrypt.compare(password, existingUser.password);

   if(!doesPasswordMatch){
      throw new BadRequestError('Incorrect password');
   }

   /// now if all are correct then generate the accessToken and refreshToeken and return it to the user
   const  accessToken = generateAccessToken(existingUser.id);
   const refreshToken = generateRefreshToken(existingUser.id);

   const {jti} = await jwt.decode(refreshToken);

   // now store the refreshToken in the db with the deviceId and jti in redis 
   await redis.set(`refresh: ${existingUser.id}:${deviceId}`,jti ,'EX', config.REFRESH_TOKEN_EXP_SEC);

   // now remove the password from the existingUser object before sending it to the user
   const {password: _password, ...safeUser} = existingUser;

   //now store the detail of user in redis
   await redis.set(`user:${existingUser.id}`,JSON.stringify(safeUser), 'EX', config.REDIS_USER_TTL);

   return {
      accessToken,
      refreshToken,
      loggedInUser: safeUser
   };
}


module.exports = { sendOTP, verifyOTP, login };
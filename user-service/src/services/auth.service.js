const { generateAndStoreOtp, verifyOtp } = require("../utils/otp");
const { sendOtpEmail, verifyOtpEmail } = require("../utils/email");
const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const { ConflictError, BadRequestError, ForbiddenError } = require("../utils/error");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/auth");
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
   await verifyOtpEmail(meta.email, meta.firstName); // this is synchronouse so this blocks the further execution
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
   await redis.set(`refresh:${existingUser.id}:${deviceId}`,jti ,'EX', config.REFRESH_TOKEN_EXP_SEC);

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



const rotateRefreshToken = async(refreshToken, deviceId)=>{
   //get the payload
   const payload = verifyRefreshToken(refreshToken);

   //now get the userId and jti from the payload
   const {id:userId, jti} = payload;

   //now fetch the stored jti from the redis
   const storedJti = await redis.get(`refresh:${userId}:${deviceId}`);

   //did we get the jti ??  (in case of 7d or refresh token exppiry )
   if(!storedJti){
      throw new ForbiddenError('Refresh token is invalid or expired',"Login again");
   }

   // now check if the stored jti is same as the jti in the payload
   if(storedJti !== jti){
      // if it doesn't get match it means the refresh token is compromised and we need to delete the stored jti from the redis  or already used , so we need to delte the stored jti from the redis and ask the user to login again

      await redis.del(`refresh:${userId}:${deviceId}`);
      throw new ForbiddenError('Refresh token is compromised or already used',"Login again");
   }

   //Note: userId is same as payload.id

   // in case if match
   const newAccessToken = generateAccessToken(payload.id);
   const newRefreshToken = generateRefreshToken(payload.id);

   const { jti:newJti} = await jwt.decode(newRefreshToken) // it will get the newRefreshToken from the jti

   // now store the new jti in the redis and delete the old jti from the redis
   await redis.set(`refresh:${payload.id}:${deviceId}`, newJti, 'EX', config.REFRESH_TOKEN_EXP_SEC);

   return {
      newAccessToken,
      newRefreshToken
   }
}


module.exports = { sendOTP, verifyOTP, login , rotateRefreshToken};

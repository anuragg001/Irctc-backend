const {generateAndStoreOtp} = require("../utils/otp");
const {sendOtpEmail} = require("../utils/email");
const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const {ConflictError} = require("../utils/error");

const sendOTP = async (firstName, lastName, email, password) => {
     //does user already exist in the db
     const existingUser = await prisma.user.findUnique({
        where: {
            email
        }
     })
     if(existingUser){
        throw new ConflictError('User already exists with this email');
     }
    // if not exist then hash the password and send the otp to the user
    const hashedPassword = await bcrypt.hash(password, 12);
    const meta = {firstName,lastName,email,hashedPassword};

    //generate the otp and send it to the user
    const {otp, otpSessionId} = await generateAndStoreOtp( meta);
    await sendOtpEmail(email, otp)
    return {otpSessionId};
}
module.exports = {sendOTP};
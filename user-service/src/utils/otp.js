const { TooManyRequestsError } = require("./error");
const otpGenerator = require("otp-generator");
const {config} = require("../config"); 
const {redis} = require("../config/redis");
const crypto = require("crypto");

const ATTEMPT_MAX = parseInt(config.OTP_MAX_VERIFY_ATTEMPTS || '5',10); // default to 5 if not set
const RATE_MAX = parseInt(config.OTP_RATE_MAX_PER_HOUR || '5', 10); // default to 5 if not set
const HMAC_SECRET = config.OTP_HMAC_SECRET
const OTP_TTL = parseInt(config.OTP_TTL || '300', 10); // default to 300 seconds (5 minutes) if not set

function hmacFor(email, otp) {
    return crypto.createHmac('sha256', HMAC_SECRET).update(email + ":" + otp).digest('hex');
}


async function generateAndStoreOtp(meta){

    //rate limit the otp generation to 5 per hour per user
    const rateKey = `otp-rate:${meta.email}`;
    const sentCount = parseInt(await redis.get(rateKey) || '0',10);

    if(sentCount >= RATE_MAX){
        throw new TooManyRequestsError('You have exceeded the maximum number of OTP requests. Please try again later.');
    }

    //generate a 6 digit otp
    const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    });


    //genrate otpSessionId
    const otpSessionId = crypto.randomUUID();
    const hashed  = hmacFor(meta.email,otp);


    //to store in redis with a ttl of 5 minutes
    await redis.set(`otp:session: ${otpSessionId}`, JSON.stringify({
        hashedOtp:hashed,
        meta
    }),'EX',OTP_TTL);


    //now increment the sent count and set the expiry to 1 hour
    await redis.incr(rateKey);
    await redis.expire(rateKey, 3600); // 1 hour in seconds
    
    return {otp, otpSessionId}; 
}


async function verifyOtp(otp, otpSessionId){
    // fetch the otp session fromm the redis
    const rawdata = await redis.get(`otp:session: ${otpSessionId}`);

    //check the data is correct or not
    if(!rawdata){
        return null;
    }

    // take out the hashed otp and meta from the rawdata

    const {hashedOtp:storedOtp, meta} = JSON.parse(rawdata);

    //now allows the user to verify the otp only 5 times
    const attemptsKey = `otp:attempts: ${meta.email}`
    const attemptsCount = parseInt(await redis.get(attemptsKey) || '0', 10);

    if(attemptsCount >= ATTEMPT_MAX){
        throw new TooManyRequestsError('You have exceeded the maximum number of OTP verification attempts. Please try again later.');
    }

    //hash the user provided otp and compare it with the stored otp
    const hashedOtp = hmacFor(meta.email, otp);
    
    if(crypto.timingSafeEqual(
        Buffer.from(hashedOtp, 'hex'),
        Buffer.from(storedOtp, 'hex')
    )){ 
        await redis.del(`otp:session: ${otpSessionId}`,attemptsKey);
        await redis.del(`otp:rate: ${meta.email}`)
        return meta;
    }else{
        //increment the attempts count and set the expiry to 1 hour
        await redis.incr(attemptsKey);
        await redis.expire(attemptsKey, config.OTP_TTL); // 1 hour in seconds
        return null;
    }   
 
}

module.exports = {generateAndStoreOtp, verifyOtp};
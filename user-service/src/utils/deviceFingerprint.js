// since we are making non-critical app so multiple device can
// login with same account so we need a device id so that we can tracck which id is sendinf refreshToken or accesstoken

const crypto = require('crypto');

function getDeviceFingerprint(req){
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || "";
    const accept = req.headers['accept'] || "";

    const raw = `${userAgent}|${ip}|${accept}`;

    return crypto
    .createHash('sha256')
    .update(raw)
    .digest('hex')
    .slice(0, 16); // short device id 
}
module.exports = getDeviceFingerprint;
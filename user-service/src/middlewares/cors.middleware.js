// cors midlware allows use to handle cross origin request from the client side
// browser does not allow cross origin request by default so we need to handle it in our server side
// so we use cors middleware to handle cross origin request from the client side

const cors = require('cors');
const { config } = require('../config');

const corsMiddleware = cors({
    origin: config.ALLOWED_ORIGINS ? config.ALLOWED_ORIGINS.split(',') : [],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization'
    ],
})
module.exports = { corsMiddleware };
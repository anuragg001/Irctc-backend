const nodemailer = require('nodemailer');
const { config } = require('../config');

const minutes = (parseInt(config.OTP_TTL) || 300) / 60;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.MAIL_USER,
        pass: config.MAIL_PASS  // App Password, not your Gmail password
    }
});

async function sendOtpEmail(email, otp) {
    const msg = {
        from: config.MAIL_USER,
        to: email,
        subject: 'Your IRCTC verification code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 420px; margin: auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px; background: #ffffff;">
                <h2 style="color: #1a1a1a;">Verify your email</h2>
                <p style="color: #333;">Your OTP expires in <strong>${minutes} minutes</strong>.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
                </div>
                <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
            </div>
        `
    };

    await transporter.sendMail(msg);
}

async function verifyOtpEmail(email, firstName) {
    const msg = {
        from: config.MAIL_USER,
        to: email,
        subject: 'Welcome to IRCTC — Account Created Successfully',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 420px; margin: auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px; background: #ffffff;">
                <h2 style="color: #1a1a1a;">Account Created 🎉</h2>
                <p style="color: #333;">Hi <strong>${firstName}</strong>,</p>
                <p style="color: #333;">Your IRCTC account has been successfully created. You can now log in and start booking tickets.</p>
                <p style="color: #999; font-size: 12px;">If you didn't create this account, please contact support immediately.</p>
            </div>
        `
    };

    await transporter.sendMail(msg);
}

module.exports = { sendOtpEmail, verifyOtpEmail };
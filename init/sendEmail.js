const nodemailer = require('nodemailer');
const userName = process.env.EMAIL;
const pass = process.env.EMAIL_PASS;

module.exports = async (email, subject, body) => {

    // Email Options
    let transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: `${userName}`, 
            pass: `${pass}`, 
        },
        tls:{
            rejectUnauthorized: false
        }
    });

    let mailOptions = {
        from: `"Splitwise Team "<${userName}>`, //Sender Address
        to: email, //Receiver's Address
        replyTo: `${userName}`,
        subject: subject,
        html: body
    };

    const finalSend = await transporter.sendMail(mailOptions);
    if (finalSend) {
        return true;
    }

};
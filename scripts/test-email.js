import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function testEmail() {
  console.log('Testing SMTP connection...');
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // Send to self
      subject: 'Test Email from Debugger',
      html: '<p>This is a test email to verify SMTP settings.</p>',
    });
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

testEmail();

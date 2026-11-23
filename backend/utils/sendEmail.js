
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import https from "node:https";
import { google } from "googleapis";

dotenv.config();

// Force HTTPS requests through IPv4.
https.globalAgent = new https.Agent({
  family: 4,
  keepAlive: true,
});

const {
  EMAIL_USER,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: GOOGLE_REFRESH_TOKEN,
});

// Nodemailer formats the email without using SMTP.
const transporter = nodemailer.createTransport({
  streamTransport: true,
  buffer: true,
  newline: "unix",
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (
      !EMAIL_USER ||
      !GOOGLE_CLIENT_ID ||
      !GOOGLE_CLIENT_SECRET ||
      !GOOGLE_REFRESH_TOKEN
    ) {
      throw new Error("Gmail API environment variables are missing.");
    }

    // Generate the email message.
    const info = await transporter.sendMail({
      from: `"Dairy Records System" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    // Convert the message into Gmail API Base64URL format.
    const rawMessage = info.message.toString("base64url");

    // Send the email using Gmail API over HTTPS.
    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log("Email sent successfully:", response.data.id);

    return response.data;
  } catch (error) {
    console.error("Email sending error:", error.message);
    console.error("Error code:", error.code);
    console.error("Google response:", error.response?.data);
    console.error("Full error:", error.stack);

    throw new Error("Unable to send email");
  }
};

export default sendEmail;

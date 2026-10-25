import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
const emailPort = Number(process.env.EMAIL_PORT || 587);



const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailPort === 465,
  auth: { user: emailUser, pass: emailPassword },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!emailUser || !emailPassword) {
      throw new Error("EMAIL_USER or EMAIL_PASSWORD is missing from the environment.");
    }

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"Dairy Records System" <${emailUser}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending error:", error.message);
    throw new Error("Unable to send email");
  }
};

export default sendEmail;
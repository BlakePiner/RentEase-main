// file: emailSender.js

// services/email/emailSender.js
import resend from "../../libs/resendClient.js";

export const sendEmail = async ({ to, subject, html }) => {
  if (!to || !subject || !html) {
    throw new Error("Missing required email fields");
  }

  try {
    await resend.emails.send({
      from: "RentEase <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || err };
  }
};

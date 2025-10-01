// file: sendEmailVerification.js

/**
 * Generates the HTML for the email verification code
 * @param {string} email - Recipient email
 * @param {string} code  - OTP / verification code
 * @returns {string} HTML string
 */
export const emailVerificationTemplate = (email, code) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>RentEase Verification Code</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { 
      margin: 0; 
      padding: 0; 
      background-color: #f9fafb;
      font-family: 'Inter', sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
    }
    .header {
      background: linear-gradient(135deg, #0ea5e9, #0d9488);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .content {
      padding: 40px 30px;
      color: #374151;
      line-height: 1.6;
    }
    .otp-container {
      margin: 40px 0;
      text-align: center;
    }
    .otp-code {
      display: inline-block;
      background: #f0fdfa;
      color: #0d9488;
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 8px;
      padding: 20px 40px;
      border-radius: 12px;
      border: 1px solid #ccfbf1;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.1);
    }
    .note {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 32px;
      border: 1px solid #e5e7eb;
    }
    .footer {
      text-align: center;
      padding: 24px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    @media (max-width: 480px) {
      .otp-code {
        font-size: 32px;
        padding: 16px 20px;
        letter-spacing: 6px;
      }
      .content {
        padding: 30px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">RentEase</div>
        <h1 style="margin: 0; font-weight: 600;">Email Verification</h1>
      </div>
      
      <div class="content">
        <p style="margin-top: 0;">Hello,</p>
        <p>Thank you for choosing RentEase! Please use the following verification code to complete your email verification:</p>
        
        <div class="otp-container">
          <div class="otp-code">${code}</div>
        </div>
        
        <p style="margin-bottom: 30px;">This code will expire in <strong>10 minutes</strong>. For security reasons, please do not share this code with anyone.</p>
        
        <div class="note">
          <strong>Note:</strong> If you didn't request this email, you can safely ignore it. 
          This verification was sent to ${email}.
        </div>
      </div>
      
      <div class="footer">
        <p style="margin: 0;">© ${new Date().getFullYear()} RentEase. All rights reserved.</p>
        <p style="margin: 8px 0 0; color: #9ca3af;">
          Need help? Contact us at <a href="mailto:support@rentease.com" style="color: #0d9488; text-decoration: none;">support@rentease.com</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// file: resetPassword.js

/**
 * Generates the HTML for the password reset email
 * @param {string} email - Recipient email
 * @param {string} resetUrl - Password reset link
 * @returns {string} HTML string
 */
export const resetPasswordTemplate = (email, resetUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>RentEase Password Reset</title>
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
    .btn-container {
      margin: 40px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background: #0d9488;
      color: white !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
      transition: all 0.3s ease;
    }
    .btn:hover {
      background: #0f766e;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(5, 150, 105, 0.5);
    }
    .note {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 32px;
      border: 1px solid #e5e7eb;
      color: #6b7280;
    }
    .footer {
      text-align: center;
      padding: 24px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    @media (max-width: 480px) {
      .content {
        padding: 30px 20px;
      }
      .btn {
        padding: 12px 28px;
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">RentEase</div>
        <h1 style="margin: 0; font-weight: 600;">Password Reset Request</h1>
      </div>

      <div class="content">
        <p>Hello,</p>
        <p>You recently requested to reset your RentEase account password. Click the button below to reset it securely:</p>

        <div class="btn-container">
          <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
        </div>

        <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>

        <div class="note">
          This password reset link is valid for 1 hour. For your security, please do not share this link with anyone.
        </div>
      </div>

      <div class="footer">
        <p>© ${new Date().getFullYear()} RentEase. All rights reserved.</p>
        <p>Need help? Contact us at <a href="mailto:support@rentease.com" style="color: #0d9488; text-decoration: none;">support@rentease.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// file: registrationWelcome.js

/**
 * Generates the HTML for the registration welcome email after successful verification
 * @param {string} email - Recipient email
 * @returns {string} HTML string
 */
export const registrationWelcomeTemplate = (email) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Welcome to RentEase</title>
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
    .footer {
      text-align: center;
      padding: 24px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    a.btn {
      display: inline-block;
      background: #0d9488;
      color: white !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: all 0.3s ease;
    }
    a.btn:hover {
      background: #0f766e;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
    }
    @media (max-width: 480px) {
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
        <h1 style="margin: 0; font-weight: 600;">Welcome!</h1>
      </div>

      <div class="content">
        <p style="margin-top: 0;">Hello ${email},</p>
        <p>Your email has been successfully verified. Thank you for registering with RentEase!</p>
        <p>We're excited to have you on board. You can now start browsing and renting properties easily and securely.</p>
        <p>Cheers,<br>The RentEase Team</p>
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

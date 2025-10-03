import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a PDF lease document
 */
export const generateLeasePDF = async (leaseData) => {
  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Generate HTML content for the lease
    const htmlContent = generateLeaseHTML(leaseData);
    
    // Set the HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Generate HTML content for the lease document
 */
const generateLeaseHTML = (lease) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lease Agreement - ${lease.leaseNickname || 'Lease'}</title>
        <style>
            body {
                font-family: 'Times New Roman', serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: white;
            }
            
            .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            
            .header h1 {
                font-size: 24px;
                margin: 0;
                color: #2c3e50;
            }
            
            .header h2 {
                font-size: 18px;
                margin: 10px 0 0 0;
                color: #7f8c8d;
                font-weight: normal;
            }
            
            .section {
                margin-bottom: 25px;
            }
            
            .section h3 {
                font-size: 16px;
                color: #2c3e50;
                border-bottom: 1px solid #bdc3c7;
                padding-bottom: 5px;
                margin-bottom: 15px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .info-item {
                margin-bottom: 10px;
            }
            
            .info-label {
                font-weight: bold;
                color: #34495e;
                margin-bottom: 5px;
            }
            
            .info-value {
                color: #2c3e50;
                padding: 5px 0;
            }
            
            .property-details {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
            
            .financial-summary {
                background: #e8f5e8;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
            
            .terms-section {
                background: #fff3cd;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
            
            .signature-section {
                margin-top: 40px;
                border-top: 1px solid #bdc3c7;
                padding-top: 20px;
            }
            
            .signature-line {
                display: flex;
                justify-content: space-between;
                margin: 30px 0;
            }
            
            .signature-box {
                width: 200px;
                border-bottom: 1px solid #333;
                text-align: center;
                padding-bottom: 5px;
            }
            
            .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #7f8c8d;
                border-top: 1px solid #bdc3c7;
                padding-top: 20px;
            }
            
            .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .status-active {
                background: #d4edda;
                color: #155724;
            }
            
            .status-draft {
                background: #fff3cd;
                color: #856404;
            }
            
            .status-expired {
                background: #f8d7da;
                color: #721c24;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>LEASE AGREEMENT</h1>
            <h2>${lease.leaseNickname || 'Property Lease'}</h2>
        </div>

        <div class="section">
            <h3>Lease Information</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Lease ID:</div>
                    <div class="info-value">${lease.id}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Lease Type:</div>
                    <div class="info-value">${lease.leaseType || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Status:</div>
                    <div class="info-value">
                        <span class="status-badge status-${lease.status?.toLowerCase() || 'draft'}">
                            ${lease.status || 'DRAFT'}
                        </span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Created:</div>
                    <div class="info-value">${formatDate(lease.createdAt)}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h3>Property Details</h3>
            <div class="property-details">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Property:</div>
                        <div class="info-value">${lease.unit?.property?.title || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Unit:</div>
                        <div class="info-value">${lease.unit?.label || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Address:</div>
                        <div class="info-value">${lease.unit?.property?.address || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Unit Status:</div>
                        <div class="info-value">${lease.unit?.status || 'N/A'}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h3>Parties</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Landlord:</div>
                    <div class="info-value">${lease.unit?.property?.owner ? `${lease.unit.property.owner.firstName} ${lease.unit.property.owner.lastName}` : 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tenant:</div>
                    <div class="info-value">${lease.tenant ? `${lease.tenant.firstName} ${lease.tenant.lastName}` : 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tenant Email:</div>
                    <div class="info-value">${lease.tenant?.email || 'N/A'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tenant Phone:</div>
                    <div class="info-value">${lease.tenant?.phoneNumber || 'N/A'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h3>Lease Terms</h3>
            <div class="terms-section">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Start Date:</div>
                        <div class="info-value">${formatDate(lease.startDate)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">End Date:</div>
                        <div class="info-value">${formatDate(lease.endDate)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Rent Amount:</div>
                        <div class="info-value">${formatCurrency(lease.rentAmount)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Payment Interval:</div>
                        <div class="info-value">${lease.interval || 'N/A'}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h3>Financial Summary</h3>
            <div class="financial-summary">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Monthly Rent:</div>
                        <div class="info-value">${formatCurrency(lease.rentAmount)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Security Deposit:</div>
                        <div class="info-value">${formatCurrency(lease.securityDeposit)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Total Lease Value:</div>
                        <div class="info-value">${formatCurrency(lease.rentAmount * (lease.interval === 'MONTHLY' ? 12 : 1))}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Formal Document:</div>
                        <div class="info-value">${lease.hasFormalDocument ? 'Yes' : 'No'}</div>
                    </div>
                </div>
            </div>
        </div>

        ${lease.notes ? `
        <div class="section">
            <h3>Additional Notes</h3>
            <div class="info-value">${lease.notes}</div>
        </div>
        ` : ''}

        <div class="signature-section">
            <h3>Signatures</h3>
            <div class="signature-line">
                <div class="signature-box">
                    <div>Landlord Signature</div>
                </div>
                <div class="signature-box">
                    <div>Date</div>
                </div>
            </div>
            <div class="signature-line">
                <div class="signature-box">
                    <div>Tenant Signature</div>
                </div>
                <div class="signature-box">
                    <div>Date</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This lease agreement was generated on ${formatDate(new Date().toISOString())}</p>
            <p>RentEase Property Management System</p>
        </div>
    </body>
    </html>
  `;
};

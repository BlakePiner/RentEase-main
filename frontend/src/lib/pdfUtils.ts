/**
 * Utility functions for PDF handling
 */

/**
 * Download a PDF blob as a file
 */
export const downloadPDF = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Generate a filename for lease PDF
 */
export const generateLeaseFilename = (leaseNickname: string | null, leaseId: string, isLandlord: boolean = false) => {
  const prefix = isLandlord ? 'lease' : 'my-lease';
  const name = leaseNickname || leaseId;
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${name}-${date}.pdf`;
};

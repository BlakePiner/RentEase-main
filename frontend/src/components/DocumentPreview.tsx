import { useState, useEffect } from "react";
import { FileText, Image, File, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DocumentPreviewProps {
  url: string;
  title: string;
  type?: string;
  className?: string;
}

const DocumentPreview = ({ url, title, type, className = "" }: DocumentPreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Construct full URL with backend server
  const getFullUrl = () => {
    // Handle placeholder URLs from example.com - these should not exist anymore
    if (url.includes('example.com')) {
      console.warn('Placeholder URL detected:', url);
      return url; // Keep as-is for now, but log warning
    }
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url; // Already a full URL
    }
    return `http://localhost:5000${url}`;
  };

  const fullUrl = getFullUrl();

  // Determine document type from URL or type prop
  const getDocumentType = () => {
    if (type) return type.toLowerCase();
    
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension || '')) {
      return 'document';
    }
    return 'unknown';
  };

  const documentType = getDocumentType();

  // Debug logging (after documentType is defined)
  console.log('DocumentPreview - Original URL:', url);
  console.log('DocumentPreview - Full URL:', fullUrl);
  console.log('DocumentPreview - Document Type:', documentType);

  // Handle image load
  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Render different document types
  const renderDocument = () => {
    switch (documentType) {
      case 'image':
        return (
          <div className="relative">
            {isLoading && (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            <img
              src={fullUrl}
              alt={title}
              className={`max-w-full max-h-[60vh] mx-auto rounded-lg shadow-lg transition-opacity duration-300 ${
                isLoading ? 'opacity-0 absolute' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {hasError && (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg p-4">
                <Image className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">Image preview not available</p>
                <p className="text-sm text-gray-400 mb-2">This image file cannot be displayed</p>
                <p className="text-xs text-gray-300 break-all text-center">
                  URL: {fullUrl}
                </p>
              </div>
            )}
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-[60vh] border rounded-lg overflow-hidden">
            <iframe
              src={`${fullUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full"
              title={title}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            {hasError && (
              <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-4">
                <FileText className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">PDF preview not available</p>
                <p className="text-sm text-gray-400 mb-2">This PDF file cannot be displayed in the browser</p>
                <p className="text-xs text-gray-300 break-all text-center">
                  URL: {fullUrl}
                </p>
              </div>
            )}
          </div>
        );

      case 'document':
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
            <File className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">Document preview not available</p>
            <p className="text-sm text-gray-400">Word documents cannot be previewed in the browser</p>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">Document preview not available</p>
            <p className="text-sm text-gray-400">This file type cannot be previewed</p>
          </div>
        );
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Document Type Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {documentType === 'image' && <Image className="h-4 w-4 text-blue-500" />}
          {documentType === 'pdf' && <FileText className="h-4 w-4 text-red-500" />}
          {documentType === 'document' && <File className="h-4 w-4 text-green-500" />}
          {documentType === 'unknown' && <FileText className="h-4 w-4 text-gray-500" />}
          <span className="text-sm font-medium text-gray-700 capitalize">
            {documentType} Document
          </span>
        </div>
        
        {/* Privacy Notice */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Eye className="h-3 w-3" />
          <span>Preview Only</span>
        </div>
      </div>

      {/* Document Preview */}
      {renderDocument()}

      {/* Document Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">Document ID: {url.split('/').pop()?.split('.')[0] || 'Unknown'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Type: {documentType.toUpperCase()}</p>
            <p className="text-xs text-gray-500">Preview Mode</p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <p className="text-xs text-blue-700">
            <strong>Privacy Notice:</strong> Documents are displayed in preview mode only. 
            Download functionality has been disabled to protect tenant privacy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;

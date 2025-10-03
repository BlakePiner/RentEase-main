import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Wrench
} from "lucide-react";
import { submitMaintenanceRequest, type MaintenanceRequestSubmission } from "@/api/tenantApi";
import { toast } from "sonner";

interface MaintenanceRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MaintenanceRequestForm = ({ isOpen, onClose, onSuccess }: MaintenanceRequestFormProps) => {
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // No need for image conversion - we'll send the file directly

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error("Please provide a description of the maintenance issue");
      return;
    }

    if (!selectedFile) {
      toast.error("Please upload a photo of the maintenance issue");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData to send file and description
      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('maintenanceImage', selectedFile);

      await submitMaintenanceRequest(formData);
      
      toast.success("Maintenance request submitted successfully!");
      
      // Reset form
      setDescription("");
      handleRemoveImage();
      
      // Close modal and refresh data
      onClose();
      onSuccess();
      
    } catch (error: any) {
      console.error("Error submitting maintenance request:", error);
      toast.error(error.response?.data?.message || "Failed to submit maintenance request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setDescription("");
      handleRemoveImage();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Submit Maintenance Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Describe the maintenance issue <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Please provide a detailed description of the maintenance issue you're experiencing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-500">
              Be as specific as possible to help us understand and address the issue quickly.
            </p>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>
              Upload a photo of the issue <span className="text-red-500">*</span>
            </Label>
            
            {!selectedFile ? (
              <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">
                        Upload a photo of the maintenance issue
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, or JPEG up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="photo-upload"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      disabled={isSubmitting}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Photo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={previewUrl || ""}
                    alt="Maintenance issue preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !description.trim() || !selectedFile}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important:</p>
              <ul className="space-y-1 text-xs">
                <li>• Your maintenance request will be sent to your landlord</li>
                <li>• Please provide clear photos and detailed descriptions</li>
                <li>• For emergencies, contact your landlord directly</li>
                <li>• You'll receive updates on the status of your request</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceRequestForm;

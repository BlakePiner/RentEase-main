import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Smartphone,
  DollarSign,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Zap,
  Globe,
  Clock,
  Receipt
} from "lucide-react";
import { toast } from "sonner";

interface ListingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
  unitDetails: {
    id: string;
    label: string;
    targetPrice: number;
    property: {
      title: string;
      address: string;
    };
  };
}

const ListingPaymentModal = ({ 
  isOpen, 
  onClose, 
  onPaymentSuccess, 
  unitDetails 
}: ListingPaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');

  // Calculate 3% commission
  const monthlyRent = unitDetails.targetPrice;
  const commissionRate = 0.03; // 3%
  const commissionAmount = monthlyRent * commissionRate;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Handle payment processing
  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      // Simulate payment processing (in real implementation, this would call Stripe API)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate successful payment
      const mockPaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setPaymentStep('success');
      toast.success("Payment successful! Your listing request has been submitted.");
      
      // Call success callback after a short delay
      setTimeout(() => {
        onPaymentSuccess(mockPaymentIntentId);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Payment failed. Please try again.");
      setPaymentStep('details');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setPaymentStep('details');
      setIsProcessing(false);
      setPaymentMethod('card');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            Listing Fee Payment
          </DialogTitle>
          <DialogDescription>
            Complete your payment to submit your unit listing request for admin approval.
          </DialogDescription>
        </DialogHeader>

        {paymentStep === 'details' && (
          <div className="space-y-6">
            {/* Unit Information */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Unit Listing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Unit:</span>
                  <span className="font-semibold">{unitDetails.label}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Property:</span>
                  <span className="font-semibold text-right max-w-xs truncate">{unitDetails.property.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Rent:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(monthlyRent)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Commission Rate:</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    3% of monthly rent
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-green-600" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Listing Fee (3% of {formatCurrency(monthlyRent)}):</span>
                  <span className="font-semibold text-green-600">{formatCurrency(commissionAmount)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-600">{formatCurrency(commissionAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  Choose Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Credit/Debit Card */}
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                      <div className="text-left">
                        <div className="font-semibold">Credit/Debit Card</div>
                        <div className="text-sm text-gray-600">Visa, Mastercard, etc.</div>
                      </div>
                    </div>
                  </button>

                  {/* GCash */}
                  <button
                    onClick={() => setPaymentMethod('gcash')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      paymentMethod === 'gcash'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-6 w-6 text-blue-600" />
                      <div className="text-left">
                        <div className="font-semibold">GCash</div>
                        <div className="text-sm text-gray-600">Mobile wallet payment</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Sandbox Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold text-yellow-800 mb-1">Sandbox Mode</div>
                      <div className="text-yellow-700">
                        This is a test environment. No real money will be charged. Use test card numbers for testing.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <div className="font-semibold mb-1">Payment Terms:</div>
                      <ul className="space-y-1 text-gray-600">
                        <li>• This is a one-time listing fee (3% of monthly rent)</li>
                        <li>• Payment is required before your unit can be listed</li>
                        <li>• Your listing will be reviewed by admin after payment</li>
                        <li>• Listing is valid for 3 months from approval date</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay {formatCurrency(commissionAmount)}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {paymentStep === 'processing' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h3>
            <p className="text-gray-600 mb-4">
              Please wait while we process your payment...
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Shield className="h-4 w-4" />
                <span>Your payment is being securely processed</span>
              </div>
            </div>
          </div>
        )}

        {paymentStep === 'success' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your listing fee has been paid successfully. Your unit listing request is now being submitted for admin review.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-sm text-green-800">
                <Zap className="h-4 w-4" />
                <span>Redirecting to your dashboard...</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ListingPaymentModal;

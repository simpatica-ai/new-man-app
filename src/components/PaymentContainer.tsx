'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Heart, CreditCard, Calendar, CheckCircle, AlertCircle, Loader2, Smartphone } from 'lucide-react';
import { validatePaymentAmount } from '@/lib/stripeConfig';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentContainerProps {
  userId: string;
  userType: 'individual' | 'organization_admin';
  organizationId?: string;
  onPaymentSuccess?: (paymentResult: PaymentResult) => void;
  onPaymentError?: (error: string) => void;
}

interface PaymentResult {
  paymentIntentId: string;
  amount: number;
  currency: string;
  paymentType: 'one-time' | 'recurring';
}

interface PaymentFormProps extends PaymentContainerProps {}

function PaymentForm({ 
  userId, 
  userType, 
  organizationId, 
  onPaymentSuccess, 
  onPaymentError 
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [amount, setAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'one-time' | 'recurring'>('one-time');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'venmo'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorType, setErrorType] = useState<'validation' | 'payment' | 'network' | 'unknown'>('unknown');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const validateForm = (): { isValid: boolean; error?: string; type?: 'validation' | 'payment' | 'network' | 'unknown' } => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount)) {
      return { isValid: false, error: 'Please enter a valid amount', type: 'validation' };
    }

    const validation = validatePaymentAmount(numAmount);
    if (!validation.isValid) {
      return { isValid: false, error: validation.error || 'Invalid amount', type: 'validation' };
    }

    if (!stripe || !elements) {
      return { isValid: false, error: 'Payment system not ready. Please try again in a moment.', type: 'network' };
    }

    return { isValid: true };
  };

  const getErrorMessage = (error: any): { message: string; type: 'validation' | 'payment' | 'network' | 'unknown'; canRetry: boolean } => {
    const errorMessage = error?.message || error || 'An unexpected error occurred';
    
    // Stripe-specific error handling
    if (error?.type) {
      switch (error.type) {
        case 'card_error':
          switch (error.code) {
            case 'card_declined':
              return {
                message: 'Your card was declined. Please try a different payment method or contact your bank.',
                type: 'payment',
                canRetry: true
              };
            case 'insufficient_funds':
              return {
                message: 'Insufficient funds. Please try a different payment method.',
                type: 'payment',
                canRetry: true
              };
            case 'expired_card':
              return {
                message: 'Your card has expired. Please use a different payment method.',
                type: 'payment',
                canRetry: true
              };
            case 'incorrect_cvc':
              return {
                message: 'Your card\'s security code is incorrect. Please check and try again.',
                type: 'payment',
                canRetry: true
              };
            case 'processing_error':
              return {
                message: 'An error occurred while processing your card. Please try again.',
                type: 'payment',
                canRetry: true
              };
            default:
              return {
                message: `Card error: ${error.message}`,
                type: 'payment',
                canRetry: true
              };
          }
        case 'rate_limit_error':
          return {
            message: 'Too many requests. Please wait a moment and try again.',
            type: 'network',
            canRetry: true
          };
        case 'api_connection_error':
          return {
            message: 'Network connection error. Please check your internet connection and try again.',
            type: 'network',
            canRetry: true
          };
        case 'api_error':
          return {
            message: 'A temporary error occurred. Please try again in a few moments.',
            type: 'network',
            canRetry: true
          };
        case 'authentication_error':
          return {
            message: 'Payment system configuration error. Please contact support.',
            type: 'unknown',
            canRetry: false
          };
        case 'validation_error':
          return {
            message: error.message || 'Please check your payment information and try again.',
            type: 'validation',
            canRetry: true
          };
      }
    }

    // Network/API errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connection')) {
      return {
        message: 'Network error. Please check your connection and try again.',
        type: 'network',
        canRetry: true
      };
    }

    // Venmo-specific errors
    if (errorMessage.includes('venmo') || errorMessage.includes('Venmo')) {
      return {
        message: 'Venmo payment failed. Please try again or use a card instead.',
        type: 'payment',
        canRetry: true
      };
    }

    // Default error
    return {
      message: errorMessage,
      type: 'unknown',
      canRetry: retryCount < 2
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      setErrorMessage(validation.error!);
      setErrorType(validation.type!);
      setPaymentStatus('error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');
    setErrorType('unknown');

    try {
      const numAmount = parseFloat(amount);
      
      if (paymentType === 'one-time') {
        await handleOneTimePayment(numAmount);
      } else {
        await handleRecurringPayment(numAmount);
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorInfo = getErrorMessage(error);
      setErrorMessage(errorInfo.message);
      setErrorType(errorInfo.type);
      setPaymentStatus('error');
      onPaymentError?.(errorInfo.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setPaymentStatus('idle');
    setErrorMessage('');
    setErrorType('unknown');
  };

  const handleOneTimePayment = async (numAmount: number) => {
    // Determine payment method types based on selection
    const paymentMethodTypes = paymentMethod === 'venmo' ? ['venmo'] : ['card'];
    
    // Create payment intent
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: numAmount,
        currency: 'usd',
        userId,
        organizationId,
        paymentMethodTypes,
        metadata: {
          userType,
          paymentType: 'one-time',
          paymentMethod,
        },
      }),
    });

    const responseData = await response.json();
    const { clientSecret, paymentIntentId, error } = responseData;
    
    if (error) {
      throw new Error(error);
    }
    
    if (!clientSecret) {
      throw new Error('Failed to create payment intent');
    }

    let stripeError: any;
    let paymentIntent: any;

    if (paymentMethod === 'venmo') {
      // For Venmo, we need to use confirmPayment with redirect
      const { error, paymentIntent: pi } = await stripe!.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}?payment_success=true`,
        },
      });
      stripeError = error;
      paymentIntent = pi;
    } else {
      // For cards, use the existing CardElement approach
      const cardElement = elements!.getElement(CardElement);
      const { error, paymentIntent: pi } = await stripe!.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement!,
        },
      });
      stripeError = error;
      paymentIntent = pi;
    }

    if (stripeError) {
      // Enhanced error handling with specific messages
      let userFriendlyMessage = 'Payment failed. Please try again.';
      
      if (stripeError.code) {
        switch (stripeError.code) {
          case 'card_declined':
            userFriendlyMessage = 'Your card was declined. Please try a different payment method or contact your bank.';
            break;
          case 'insufficient_funds':
            userFriendlyMessage = 'Insufficient funds. Please check your account balance or try a different card.';
            break;
          case 'expired_card':
            userFriendlyMessage = 'Your card has expired. Please use a different card.';
            break;
          case 'incorrect_cvc':
            userFriendlyMessage = 'The security code (CVC) is incorrect. Please check and try again.';
            break;
          case 'processing_error':
            userFriendlyMessage = 'A processing error occurred. Please try again in a few moments.';
            break;
          case 'rate_limit':
            userFriendlyMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          default:
            userFriendlyMessage = stripeError.message || 'Payment failed. Please try again.';
        }
      }
      
      throw new Error(userFriendlyMessage);
    }

    if (paymentIntent?.status === 'succeeded') {
      // Update payment status in database
      const confirmResponse = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
        }),
      });

      if (!confirmResponse.ok) {
        console.error('Failed to confirm payment in database');
      }

      setPaymentStatus('success');
      const methodText = paymentMethod === 'venmo' ? 'Venmo' : 'card';
      setSuccessMessage(`Thank you for your generous contribution! Your ${methodText} payment has been processed successfully.`);
      
      const result: PaymentResult = {
        paymentIntentId: paymentIntent.id,
        amount: numAmount,
        currency: 'usd',
        paymentType: 'one-time',
      };
      
      onPaymentSuccess?.(result);
      
      // Reset form
      setAmount('');
      setClientSecret('');
    }
  };

  const handleRecurringPayment = async (numAmount: number) => {
    // Create subscription
    const response = await fetch('/api/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: numAmount,
        currency: 'usd',
        interval: 'month',
        userId,
        organizationId,
        metadata: {
          userType,
          paymentType: 'recurring',
        },
      }),
    });

    const { clientSecret, subscriptionId, error } = await response.json();
    
    if (error) {
      throw new Error(error);
    }

    if (clientSecret) {
      // Confirm subscription payment with Stripe
      const cardElement = elements!.getElement(CardElement);
      const { error: stripeError, paymentIntent } = await stripe!.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement!,
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Subscription setup failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        console.log('Recurring payment succeeded, confirming in database:', paymentIntent.id);
        
        // Update payment status in database
        const confirmResponse = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
          }),
        });

        if (!confirmResponse.ok) {
          console.error('Failed to confirm recurring payment in database:', await confirmResponse.text());
        } else {
          console.log('Recurring payment confirmed in database successfully');
        }

        setPaymentStatus('success');
        setSuccessMessage('Thank you for setting up a recurring contribution! Your monthly subscription is now active.');
        
        const result: PaymentResult = {
          paymentIntentId: paymentIntent.id,
          amount: numAmount,
          currency: 'usd',
          paymentType: 'recurring',
        };
        
        onPaymentSuccess?.(result);
        
        // Reset form
        setAmount('');
        elements!.getElement(CardElement)?.clear();
      }
    } else {
      // Subscription created successfully without immediate payment
      setPaymentStatus('success');
      setSuccessMessage('Thank you for setting up a recurring contribution! Your monthly subscription is now active.');
      
      const result: PaymentResult = {
        paymentIntentId: subscriptionId,
        amount: numAmount,
        currency: 'usd',
        paymentType: 'recurring',
      };
      
      onPaymentSuccess?.(result);
      
      // Reset form
      setAmount('');
      elements!.getElement(CardElement)?.clear();
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1c1917', // stone-900
        fontFamily: 'system-ui, sans-serif',
        '::placeholder': {
          color: '#78716c', // stone-500
        },
      },
      invalid: {
        color: '#dc2626', // red-600
      },
    },
  };

  if (paymentStatus === 'success') {
    return (
      <Card className="border-stone-200 bg-gradient-to-br from-card via-amber-50/30 to-stone-50 shadow-gentle">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-800">Payment Successful!</h3>
              <p className="text-stone-600 mt-2">{successMessage}</p>
            </div>
            <Button 
              onClick={() => {
                setPaymentStatus('idle');
                setSuccessMessage('');
              }}
              variant="outline"
              className="mt-4"
            >
              Make Another Contribution
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-stone-200 bg-gradient-to-br from-card via-amber-50/30 to-stone-50 shadow-gentle">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Heart className="h-6 w-6 text-amber-600" />
          <div>
            <CardTitle className="text-stone-800 font-medium">
              {userType === 'organization_admin' ? 'Organization Contribution' : 'Generosity Contribution'}
            </CardTitle>
            <CardDescription className="text-stone-600">
              Support the platform with a voluntary contribution
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-stone-700 font-medium">
              Contribution Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-500">$</span>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="pl-8"
                disabled={isProcessing}
              />
            </div>
            <p className="text-xs text-stone-500">
              Minimum $1.00, Maximum $10,000.00
            </p>
          </div>

          {/* Payment Type Selection */}
          <div className="space-y-3">
            <Label className="text-stone-700 font-medium">Payment Frequency</Label>
            <RadioGroup
              value={paymentType}
              onValueChange={(value) => {
                setPaymentType(value as 'one-time' | 'recurring');
                // Reset payment method when switching to recurring (Venmo doesn't support recurring)
                if (value === 'recurring') {
                  setPaymentMethod('card');
                }
              }}
              disabled={isProcessing}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one-time" id="one-time" />
                <Label htmlFor="one-time" className="flex items-center space-x-2 cursor-pointer">
                  <CreditCard className="h-4 w-4 text-stone-600" />
                  <span>One-time contribution</span>
                  {isMobile && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      Card or Venmo
                    </Badge>
                  )}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="recurring" id="recurring" />
                <Label htmlFor="recurring" className="flex items-center space-x-2 cursor-pointer">
                  <Calendar className="h-4 w-4 text-stone-600" />
                  <span>Monthly recurring</span>
                  <Badge variant="secondary" className="text-xs">
                    Card only
                  </Badge>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Method Selection (only for one-time payments) */}
          {paymentType === 'one-time' && (
            <div className="space-y-3">
              <Label className="text-stone-700 font-medium">Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as 'card' | 'venmo')}
                disabled={isProcessing}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                    <CreditCard className="h-4 w-4 text-stone-600" />
                    <span>Credit/Debit Card</span>
                  </Label>
                </div>
                {isMobile && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="venmo" id="venmo" />
                    <Label htmlFor="venmo" className="flex items-center space-x-2 cursor-pointer">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-600 font-medium">Venmo</span>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        Mobile only
                      </Badge>
                    </Label>
                  </div>
                )}
              </RadioGroup>
              
              {paymentMethod === 'venmo' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Venmo payments:</strong> You'll be redirected to the Venmo app to complete your contribution. 
                    For recurring monthly contributions, please use a card instead.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Payment Element */}
          <div className="space-y-2">
            <Label className="text-stone-700 font-medium">
              {paymentMethod === 'venmo' ? 'Venmo Payment' : 'Payment Information'}
            </Label>
            <div className="border border-stone-300 rounded-md p-3 bg-white">
              {paymentType === 'one-time' && paymentMethod === 'venmo' ? (
                <div className="text-center py-4">
                  <Smartphone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-stone-600">
                    Click "Pay with Venmo" below to complete your contribution
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    You'll be redirected to the Venmo app
                  </p>
                </div>
              ) : (
                <CardElement options={cardElementOptions} />
              )}
            </div>
          </div>

          {/* Error Message */}
          {paymentStatus === 'error' && errorMessage && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 space-y-2">
                <div>{errorMessage}</div>
                
                {/* Helpful suggestions based on error type */}
                {errorType === 'payment' && (
                  <div className="text-sm text-red-600">
                    💡 Try using a different payment method or contact your bank for assistance.
                  </div>
                )}
                
                {errorType === 'network' && (
                  <div className="text-sm text-red-600">
                    💡 Check your internet connection and try again in a moment.
                  </div>
                )}
                
                {errorType === 'validation' && (
                  <div className="text-sm text-red-600">
                    💡 Please double-check your payment information and amount.
                  </div>
                )}

                {/* Retry button for retryable errors */}
                {retryCount < 2 && errorType !== 'validation' && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {retryCount >= 2 && (
                  <div className="text-sm text-red-600">
                    💬 Still having trouble? Please contact support for assistance.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className={`w-full text-white ${
              paymentMethod === 'venmo' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                {paymentMethod === 'venmo' ? (
                  <Smartphone className="h-4 w-4 mr-2" />
                ) : (
                  <Heart className="h-4 w-4 mr-2" />
                )}
                {paymentType === 'one-time' 
                  ? `${paymentMethod === 'venmo' ? 'Pay with Venmo' : 'Contribute'} $${amount || '0.00'}` 
                  : `Start $${amount || '0.00'}/month`
                }
              </>
            )}
          </Button>
        </form>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-xs text-stone-500">
            🔒 Payments are securely processed by Stripe. We never store your payment information.
          </p>
          {isMobile && (
            <p className="text-xs text-blue-600 mt-1">
              📱 Venmo available on mobile devices
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PaymentContainer(props: PaymentContainerProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}

export type { PaymentContainerProps, PaymentResult };
'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
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
import { Heart, CreditCard, Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const validateForm = (): string | null => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount)) {
      return 'Please enter a valid amount';
    }

    const validation = validatePaymentAmount(numAmount);
    if (!validation.isValid) {
      return validation.error || 'Invalid amount';
    }

    if (!stripe || !elements) {
      return 'Payment system not ready. Please try again.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setPaymentStatus('error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      const numAmount = parseFloat(amount);
      
      if (paymentType === 'one-time') {
        await handleOneTimePayment(numAmount);
      } else {
        await handleRecurringPayment(numAmount);
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      setErrorMessage(errorMsg);
      setPaymentStatus('error');
      onPaymentError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOneTimePayment = async (numAmount: number) => {
    // Create payment intent
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: numAmount,
        currency: 'usd',
        userId,
        organizationId,
        metadata: {
          userType,
          paymentType: 'one-time',
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

    // Confirm payment with Stripe
    const cardElement = elements!.getElement(CardElement);
    const { error: stripeError, paymentIntent } = await stripe!.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement!,
      },
    });

    if (stripeError) {
      throw new Error(stripeError.message || 'Payment confirmation failed');
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
      setSuccessMessage('Thank you for your generous contribution! Your payment has been processed successfully.');
      
      const result: PaymentResult = {
        paymentIntentId: paymentIntent.id,
        amount: numAmount,
        currency: 'usd',
        paymentType: 'one-time',
      };
      
      onPaymentSuccess?.(result);
      
      // Reset form
      setAmount('');
      elements!.getElement(CardElement)?.clear();
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
              onValueChange={(value) => setPaymentType(value as 'one-time' | 'recurring')}
              disabled={isProcessing}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one-time" id="one-time" />
                <Label htmlFor="one-time" className="flex items-center space-x-2 cursor-pointer">
                  <CreditCard className="h-4 w-4 text-stone-600" />
                  <span>One-time contribution</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="recurring" id="recurring" />
                <Label htmlFor="recurring" className="flex items-center space-x-2 cursor-pointer">
                  <Calendar className="h-4 w-4 text-stone-600" />
                  <span>Monthly recurring</span>
                  <Badge variant="secondary" className="text-xs">
                    Cancel anytime
                  </Badge>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Card Element */}
          <div className="space-y-2">
            <Label className="text-stone-700 font-medium">Payment Information</Label>
            <div className="border border-stone-300 rounded-md p-3 bg-white">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {/* Error Message */}
          {paymentStatus === 'error' && errorMessage && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                {paymentType === 'one-time' 
                  ? `Contribute $${amount || '0.00'}` 
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
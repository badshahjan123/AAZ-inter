import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import Button from '../common/Button';
import { CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../../config/api';

const CheckoutForm = ({ order, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create PaymentIntent as soon as the component loads
    const createIntent = async () => {
      try {
        const response = await fetch(api('/api/stripe/create-payment-intent'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId: order.orderId }),
        });
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.message || 'Failed to initialize payment');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      }
    };

    if (order?.orderId) {
      createIntent();
    }
  }, [order]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);

    const payload = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
        },
      },
    });

    if (payload.error) {
      setError(`Payment failed: ${payload.error.message}`);
      setProcessing(false);
    } else {
      setError(null);
      setProcessing(false);
      
      // Confirm on backend
      try {
        const confirmResponse = await fetch(api('/api/stripe/confirm-payment'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentIntentId: payload.paymentIntent.id }),
        });
        
        if (confirmResponse.ok) {
          onPaymentSuccess();
        } else {
          setError('Payment successful but failed to update order. Please contact support.');
        }
      } catch (err) {
        setError('Payment verification failed. Please contact support.');
      }
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-checkout-form">
      <div className="card-input-container">
        <label htmlFor="card-element">Card Details</label>
        <div id="card-element" className="stripe-element-wrapper">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="payment-error-msg">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="payment-security-tip">
        <ShieldCheck size={16} />
        <span>Payments are secure and encrypted by Stripe</span>
      </div>

      <Button
        variant="primary"
        type="submit"
        disabled={!stripe || processing || !clientSecret}
        loading={processing}
        fullWidth
        style={{ marginTop: '1.5rem' }}
      >
        {processing ? 'Processing...' : `Pay Rs. ${order.total}`}
      </Button>
    </form>
  );
};

const StripePayment = ({ order, onPaymentSuccess }) => {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(api('/api/stripe/config');
        const { publishableKey } = await response.json();
        setStripePromise(loadStripe(publishableKey));
      } catch (err) {
        console.error('Failed to load Stripe config:', err);
      }
    };

    fetchConfig();
  }, []);

  if (!stripePromise) {
    return <div className="loading-stripe">Initializing Stripe...</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm order={order} onPaymentSuccess={onPaymentSuccess} />
    </Elements>
  );
};

export default StripePayment;

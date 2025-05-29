import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('YOUR_STRIPE_PUBLISHABLE_KEY');

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [form, setForm] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    binCount: 1,
    day: '',
    time: '',
    timePeriod: 'AM',
    recurring: false,
  });

  const costPerBin = 12;
  const totalCost = form.binCount * costPerBin;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    let hour = parseInt(form.time);
    if (form.timePeriod === 'PM' && hour < 12) hour += 12;
    if (form.timePeriod === 'AM' && hour === 12) hour = 0;
    if (hour >= 17) {
      alert('We only accept appointments before 5 PM.');
      return;
    }

    const response = await fetch('https://YOUR_RENDER_BACKEND_URL/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: totalCost * 100 }),
    });
    const { clientSecret } = await response.json();

    const cardElement = elements.getElement(CardElement);
    const paymentResult = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: form.name, email: form.email },
      },
    });

    if (paymentResult.error) {
      alert(paymentResult.error.message);
    } else if (paymentResult.paymentIntent.status === 'succeeded') {
      alert('Payment succeeded! Booking confirmed.');
      // You can add saving booking info here later
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: 'auto' }}>
      <h2>Bin Bros Booking</h2>
      <input name="name" placeholder="Name" onChange={handleChange} required /><br />
      <input name="address" placeholder="Address" onChange={handleChange} required /><br />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} required /><br />
      <input name="phone" placeholder="Phone" onChange={handleChange} required /><br />
      <input name="binCount" type="number" min="1" placeholder="Number of Bins" onChange={handleChange} required /><br />
      <input name="day" placeholder="Preferred Day (e.g. Monday)" onChange={handleChange} required /><br />
      <input name="time" type="number" min="1" max="12" placeholder="Hour (1-12)" onChange={handleChange} required style={{ width: '60px' }} />
      <select name="timePeriod" value={form.timePeriod} onChange={handleChange}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select><br />
      <label>
        <input type="checkbox" name="recurring" onChange={handleChange} />
        Recurring Service
      </label><br />
      <h3>Total Cost: ${totalCost}</h3>
      <CardElement options={{ style: { base: { fontSize: '16px' } } }} /><br />
      <button type="submit" disabled={!stripe}>Pay Now</button>
    </form>
  );
}

export default function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

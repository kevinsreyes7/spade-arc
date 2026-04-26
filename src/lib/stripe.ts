import { loadStripe } from '@stripe/stripe-js'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string

export const stripePromise = loadStripe(publishableKey || '')

export const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID as string
export const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export async function redirectToCheckout(customerId?: string) {
  const stripe = await stripePromise
  if (!stripe) throw new Error('Stripe not loaded')

  const params = new URLSearchParams({
    price: PRICE_ID,
    success_url: `${APP_URL}/home?payment=success`,
    cancel_url: `${APP_URL}/paywall?payment=cancelled`,
    mode: 'subscription',
    ...(customerId ? { customer: customerId } : {}),
  })

  // Use Stripe Checkout hosted page
  window.location.href = `https://checkout.stripe.com/pay/${PRICE_ID}?${params.toString()}`
}

export async function redirectToPortal(customerId: string) {
  const res = await fetch('/api/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId }),
  })
  const { url } = await res.json()
  window.location.href = url
}

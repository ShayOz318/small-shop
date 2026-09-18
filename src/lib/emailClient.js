import emailjs from '@emailjs/browser'

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Sends an order-confirmation email straight from the browser via EmailJS.
// EmailJS's "public key" is designed to be exposed client-side (like the
// Supabase publishable key) — it is not a secret, so it's safe to ship in
// the built app. If it isn't configured, we just skip the email instead of
// failing the order (the order itself is already saved by then).
export function sendOrderConfirmationEmail({
  orderId,
  customerName,
  customerEmail,
  phone,
  shippingAddress,
  items,
  total,
}) {
  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS is not configured — skipping confirmation email.')
    return Promise.resolve()
  }

  const itemsText = items
    .map(
      (item) =>
        `${item.product.name} x${item.quantity} — ₪${(
          Number(item.product.price) * item.quantity
        ).toFixed(2)}`
    )
    .join('\n')

  return emailjs.send(
    serviceId,
    templateId,
    {
      to_email: customerEmail,
      order_id: orderId,
      customer_name: customerName,
      phone,
      shipping_address: shippingAddress,
      items_text: itemsText,
      total: total.toFixed(2),
    },
    { publicKey }
  )
}

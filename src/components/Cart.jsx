import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Cart({ items, onQuantityChange, onRemove, onOrderPlaced }) {
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const total = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (items.length === 0) return

    setSubmitting(true)
    setError(null)

    const trimmedEmail = customerEmail.trim()

    // Anonymous customers place orders through a single controlled RPC
    // (place_order) instead of inserting into orders/order_items directly —
    // those tables are no longer readable/writable by the public anon key.
    const { data: orderId, error: rpcError } = await supabase.rpc('place_order', {
      p_customer_name: customerName.trim(),
      p_customer_email: trimmedEmail,
      p_phone: phone.trim(),
      p_shipping_address: shippingAddress.trim(),
      p_items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    })

    setSubmitting(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    setCustomerName('')
    setCustomerEmail('')
    setPhone('')
    setShippingAddress('')
    onOrderPlaced?.({ orderId, customerEmail: trimmedEmail })
  }

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <p className="hint">Add products to see your order summary here.</p>
      </div>
    )
  }

  return (
    <form className="order-form" onSubmit={handleSubmit}>
      <div className="cart-summary">
        <span className="cart-summary-count">
          {items.length} item{items.length > 1 ? 's' : ''}
        </span>
        <span className="cart-summary-total">₪{total.toFixed(2)}</span>
      </div>

      <ul className="cart-list">
        {items.map(({ product, quantity }) => (
          <li key={product.id} className="cart-item">
            <div className="cart-item-info">
              <span className="cart-item-name">{product.name}</span>
              <span className="cart-item-price">₪{Number(product.price).toFixed(2)} each</span>
            </div>
            <div className="cart-item-controls">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => onQuantityChange(product.id, Number(e.target.value))}
              />
              <button type="button" className="remove-btn" onClick={() => onRemove(product.id)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <label>
        Full name
        <input
          type="text"
          required
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </label>

      <label>
        Phone number
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>

      <label>
        Email
        <input
          type="email"
          required
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
        />
      </label>

      <label>
        Shipping address
        <textarea
          required
          rows={2}
          value={shippingAddress}
          onChange={(e) => setShippingAddress(e.target.value)}
        />
      </label>

      {error && <p className="error">Error: {error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting
          ? 'Placing order...'
          : `Place order (${items.length} item${items.length > 1 ? 's' : ''})`}
      </button>
    </form>
  )
}

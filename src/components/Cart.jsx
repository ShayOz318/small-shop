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

    // 1. Create the order "header" (who placed it, where to ship, when)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        phone: phone.trim(),
        shipping_address: shippingAddress.trim(),
      })
      .select()
      .single()

    if (orderError) {
      setSubmitting(false)
      setError(orderError.message)
      return
    }

    // 2. Create one order_items row per product in the cart
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    setSubmitting(false)

    if (itemsError) {
      setError(itemsError.message)
      return
    }

    setCustomerName('')
    setCustomerEmail('')
    setPhone('')
    setShippingAddress('')
    onOrderPlaced?.({ orderId: order.id, customerEmail: order.customer_email })
  }

  if (items.length === 0) {
    return <p className="hint">Select one or more products above to start an order.</p>
  }

  return (
    <form className="order-form" onSubmit={handleSubmit}>
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

      <p className="cart-total">Total: ₪{total.toFixed(2)}</p>

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

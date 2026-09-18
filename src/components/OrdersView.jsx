import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function OrdersView() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          customer_name,
          customer_email,
          phone,
          shipping_address,
          created_at,
          order_items (
            quantity,
            products ( name, price )
          )
        `
        )
        .order('created_at', { ascending: false })

      if (!isMounted) return
      if (error) {
        setError(error.message)
      } else {
        setOrders(data ?? [])
      }
      setLoading(false)
    }

    loadOrders()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) return <p>Loading orders...</p>
  if (error) return <p className="error">Failed to load orders: {error}</p>
  if (orders.length === 0) return <p>No orders yet.</p>

  return (
    <div className="orders-table-wrap">
      <table className="orders-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Contact</th>
            <th>Shipping address</th>
            <th>Products</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const items = order.order_items ?? []
            const total = items.reduce(
              (sum, item) => sum + Number(item.products?.price ?? 0) * item.quantity,
              0
            )
            return (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{new Date(order.created_at).toLocaleString('he-IL')}</td>
                <td>{order.customer_name}</td>
                <td>
                  <div>{order.customer_email}</div>
                  <div>{order.phone}</div>
                </td>
                <td>{order.shipping_address}</td>
                <td>
                  <ul className="order-products-list">
                    {items.map((item, idx) => (
                      <li key={idx}>
                        {item.products?.name ?? 'Unknown product'} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>₪{total.toFixed(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

import { useMemo, useState } from 'react'
import ProductList from './components/ProductList'
import Cart from './components/Cart'
import OrdersView from './components/OrdersView'
import './App.css'

function App() {
  const [view, setView] = useState('shop') // 'shop' | 'orders'
  const [cart, setCart] = useState({}) // { [productId]: { product, quantity } }
  const [confirmation, setConfirmation] = useState(null)

  function toggleProduct(product) {
    setCart((prev) => {
      const next = { ...prev }
      if (next[product.id]) {
        delete next[product.id]
      } else {
        next[product.id] = { product, quantity: 1 }
      }
      return next
    })
  }

  function updateQuantity(productId, quantity) {
    setCart((prev) => {
      if (!prev[productId]) return prev
      return {
        ...prev,
        [productId]: { ...prev[productId], quantity: Math.max(1, quantity) },
      }
    })
  }

  function removeFromCart(productId) {
    setCart((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  function handleOrderPlaced(order) {
    setConfirmation(order)
    setCart({})
  }

  const cartItems = useMemo(() => Object.values(cart), [cart])
  const selectedIds = useMemo(() => new Set(Object.keys(cart).map(Number)), [cart])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Small Shop</h1>
        <p>Pick one or more products and place your order.</p>
        <nav className="view-nav">
          <button
            type="button"
            className={view === 'shop' ? 'active' : ''}
            onClick={() => setView('shop')}
          >
            Shop
          </button>
          <button
            type="button"
            className={view === 'orders' ? 'active' : ''}
            onClick={() => setView('orders')}
          >
            Orders (business view)
          </button>
        </nav>
      </header>

      {view === 'shop' ? (
        <>
          {confirmation && (
            <div className="confirmation">
              <span>
                Order #{confirmation.orderId} placed successfully! We'll follow up at{' '}
                {confirmation.customerEmail}.
              </span>
              <button type="button" onClick={() => setConfirmation(null)}>
                Dismiss
              </button>
            </div>
          )}

          <main className="app-main">
            <section>
              <h2>Products</h2>
              <ProductList selectedIds={selectedIds} onToggle={toggleProduct} />
            </section>

            <section>
              <h2>Your cart</h2>
              <Cart
                items={cartItems}
                onQuantityChange={updateQuantity}
                onRemove={removeFromCart}
                onOrderPlaced={handleOrderPlaced}
              />
            </section>
          </main>
        </>
      ) : (
        <section>
          <h2>All orders</h2>
          <OrdersView />
        </section>
      )}
    </div>
  )
}

export default App

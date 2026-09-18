import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ProductList({ selectedIds, onToggle }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadProducts() {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, image_url')
        .order('id', { ascending: true })

      if (!isMounted) return
      if (error) {
        setError(error.message)
      } else {
        setProducts(data ?? [])
      }
      setLoading(false)
    }

    loadProducts()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) return <p>Loading products...</p>
  if (error) return <p className="error">Failed to load products: {error}</p>
  if (products.length === 0) return <p>No products available yet.</p>

  return (
    <div className="product-grid">
      {products.map((product) => {
        const isSelected = selectedIds.has(product.id)
        return (
          <button
            key={product.id}
            type="button"
            className={`product-card${isSelected ? ' selected' : ''}`}
            onClick={() => onToggle(product)}
          >
            {isSelected && <span className="selected-badge">In cart</span>}
            {product.image_url && <img src={product.image_url} alt={product.name} />}
            <h3>{product.name}</h3>
            {product.description && <p className="description">{product.description}</p>}
            <p className="price">₪{Number(product.price).toFixed(2)}</p>
          </button>
        )
      })}
    </div>
  )
}

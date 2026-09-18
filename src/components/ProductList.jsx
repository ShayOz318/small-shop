import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ProductList({ selectedIds, onToggle }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

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

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    const min = minPrice === '' ? -Infinity : Number(minPrice)
    const max = maxPrice === '' ? Infinity : Number(maxPrice)

    return products.filter((product) => {
      const matchesName = term === '' || product.name.toLowerCase().includes(term)
      const price = Number(product.price)
      const matchesPrice = price >= min && price <= max
      return matchesName && matchesPrice
    })
  }, [products, search, minPrice, maxPrice])

  const hasActiveFilters = search !== '' || minPrice !== '' || maxPrice !== ''

  if (loading) return <p>Loading products...</p>
  if (error) return <p className="error">Failed to load products: {error}</p>

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-row">
          <label className="filter-field filter-search">
            Search by name
            <input
              type="text"
              placeholder="e.g. mug, wallet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="filter-field">
            Min price (₪)
            <input
              type="number"
              min="0"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </label>
          <label className="filter-field">
            Max price (₪)
            <input
              type="number"
              min="0"
              placeholder="Any"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </label>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            className="filter-clear"
            onClick={() => {
              setSearch('')
              setMinPrice('')
              setMaxPrice('')
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <p>No products available yet.</p>
      ) : filteredProducts.length === 0 ? (
        <p>No products match your filters.</p>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => {
            const isSelected = selectedIds.has(product.id)
            return (
              <div key={product.id} className={`product-card${isSelected ? ' selected' : ''}`}>
                {isSelected && <span className="selected-badge">In cart</span>}
                {product.image_url && <img src={product.image_url} alt={product.name} />}
                <h3>{product.name}</h3>
                {product.description && <p className="description">{product.description}</p>}
                <p className="price">₪{Number(product.price).toFixed(2)}</p>
                <button
                  type="button"
                  className={`add-to-cart-btn${isSelected ? ' in-cart' : ''}`}
                  onClick={() => onToggle(product)}
                >
                  {isSelected ? '✓ In cart — Remove' : '+ Add to cart'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

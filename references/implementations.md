# Component Implementations

## Cart Store (Nanostores)

```typescript
// src/lib/stores/cart.ts
import { atom, computed } from "nanostores"
import type { StoreCart } from "@medusajs/types"

export const $cart = atom<StoreCart | null>(null)
export const $cartOpen = atom(false)

export const $cartCount = computed($cart, (cart) =>
  cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0
)

export const $cartTotal = computed($cart, (cart) =>
  cart?.total ?? 0
)
```

## AddToCart Component

```tsx
// src/components/react/AddToCart.tsx
import { useState } from "react"
import { useStore } from "@nanostores/react"
import { $cart } from "@/lib/stores/cart"
import { medusa } from "@/lib/medusa"

interface Props {
  variantId: string
  productTitle: string
}

export default function AddToCart({ variantId, productTitle }: Props) {
  const cart = useStore($cart)
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState(1)

  async function handleAdd() {
    setLoading(true)
    try {
      let cartId = cart?.id

      // Create cart if doesn't exist
      if (!cartId) {
        const { cart: newCart } = await medusa.store.cart.create({})
        cartId = newCart.id
        $cart.set(newCart)
      }

      // Add item
      const { cart: updatedCart } = await medusa.store.cart.createLineItem(
        cartId,
        { variant_id: variantId, quantity }
      )
      $cart.set(updatedCart)
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="mt-8 space-y-4">
      <div class="flex items-center gap-4">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          class="w-10 h-10 border rounded"
        >
          -
        </button>
        <span class="w-12 text-center">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          class="w-10 h-10 border rounded"
        >
          +
        </button>
      </div>
      <button
        onClick={handleAdd}
        disabled={loading}
        class="w-full bg-black text-white py-3 px-6 rounded-lg hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Adding..." : `Add to Cart`}
      </button>
    </div>
  )
}
```

## Cart Sidebar

```tsx
// src/components/react/Cart.tsx
import { useStore } from "@nanostores/react"
import { $cart, $cartOpen, $cartTotal } from "@/lib/stores/cart"
import { medusa } from "@/lib/medusa"

export default function Cart() {
  const cart = useStore($cart)
  const open = useStore($cartOpen)
  const total = useStore($cartTotal)

  if (!open) return null

  async function updateQuantity(lineId: string, quantity: number) {
    if (!cart) return
    if (quantity < 1) {
      const { cart: updated } = await medusa.store.cart.deleteLineItem(
        cart.id,
        lineId
      )
      $cart.set(updated)
    } else {
      const { cart: updated } = await medusa.store.cart.updateLineItem(
        cart.id,
        lineId,
        { quantity }
      )
      $cart.set(updated)
    }
  }

  return (
    <div class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/50" onClick={() => $cartOpen.set(false)} />
      <aside class="absolute right-0 top-0 h-full w-full max-w-md bg-white p-6 overflow-y-auto">
        <header class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">Cart</h2>
          <button onClick={() => $cartOpen.set(false)}>✕</button>
        </header>

        {!cart?.items?.length ? (
          <p>Your cart is empty</p>
        ) : (
          <>
            <ul class="space-y-4">
              {cart.items.map((item) => (
                <li key={item.id} class="flex gap-4">
                  <img
                    src={item.thumbnail ?? "/placeholder.jpg"}
                    alt={item.title}
                    class="w-20 h-20 object-cover rounded"
                  />
                  <div class="flex-1">
                    <p class="font-medium">{item.title}</p>
                    <p class="text-sm text-gray-600">{item.variant?.title}</p>
                    <div class="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <footer class="mt-6 pt-6 border-t">
              <div class="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>
                  {new Intl.NumberFormat("en", {
                    style: "currency",
                    currency: cart.currency_code ?? "usd",
                  }).format(total / 100)}
                </span>
              </div>
              <a
                href="/checkout"
                class="block w-full bg-black text-white text-center py-3 mt-4 rounded-lg"
              >
                Checkout
              </a>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
```

## Product Listing Page

```astro
---
// src/pages/products/index.astro
import BaseLayout from "@/layouts/BaseLayout.astro"
import ProductCard from "@/components/astro/ProductCard.astro"
import { getProducts } from "@/lib/medusa"

const { products } = await getProducts({ limit: 50 })
---

<BaseLayout title="All Products">
  <main class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Products</h1>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard product={product} />
      ))}
    </div>
  </main>
</BaseLayout>
```

## Dynamic Product Page with SSG

```astro
---
// src/pages/products/[handle].astro
import BaseLayout from "@/layouts/BaseLayout.astro"
import AddToCart from "@/components/react/AddToCart"
import { getProducts, getProduct } from "@/lib/medusa"

export async function getStaticPaths() {
  const { products } = await getProducts({ limit: 1000 })
  return products.map((product) => ({
    params: { handle: product.handle },
  }))
}

const { handle } = Astro.params
const product = await getProduct(handle!)

if (!product) return Astro.redirect("/404")

const variant = product.variants?.[0]
const price = variant?.calculated_price?.calculated_amount
const currency = variant?.calculated_price?.currency_code ?? "usd"
---

<BaseLayout title={product.title}>
  <main class="container mx-auto px-4 py-8">
    <div class="grid md:grid-cols-2 gap-12">
      <div class="aspect-square">
        <img
          src={product.thumbnail ?? "/placeholder.jpg"}
          alt={product.title}
          class="w-full h-full object-cover rounded-lg"
          loading="eager"
          fetchpriority="high"
        />
      </div>
      <div>
        <h1 class="text-3xl font-bold">{product.title}</h1>
        <p class="text-2xl mt-4">
          {new Intl.NumberFormat("en", {
            style: "currency",
            currency,
          }).format(price / 100)}
        </p>
        <div class="mt-6" set:html={product.description} />

        <!-- React island: only this hydrates -->
        <AddToCart
          client:visible
          variantId={variant?.id}
          productTitle={product.title}
        />
      </div>
    </div>
  </main>
</BaseLayout>
```

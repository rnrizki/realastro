# MedusaJS SDK Setup

## Client Configuration

```typescript
// src/lib/medusa.ts
import Medusa from "@medusajs/js-sdk"

export const medusa = new Medusa({
  baseUrl: import.meta.env.MEDUSA_BACKEND_URL,
  publishableKey: import.meta.env.MEDUSA_PUBLISHABLE_KEY,
})
```

## Server-Side Helpers

Use these in Astro page frontmatter for static generation:

```typescript
// src/lib/medusa.ts

export async function getProducts(params?: {
  limit?: number
  offset?: number
  collection_id?: string[]
}) {
  const { products, count } = await medusa.store.product.list({
    limit: params?.limit ?? 100,
    offset: params?.offset ?? 0,
    collection_id: params?.collection_id,
    fields: "+variants.calculated_price",
  })
  return { products, count }
}

export async function getProduct(handle: string) {
  const { products } = await medusa.store.product.list({
    handle,
    fields: "+variants.calculated_price,+variants.inventory_quantity",
  })
  return products[0] ?? null
}

export async function getCollections() {
  const { collections } = await medusa.store.collection.list()
  return collections
}
```

## Cart Operations

All cart operations are client-side (React islands):

```typescript
// Create cart
const { cart } = await medusa.store.cart.create({})

// Add line item
const { cart } = await medusa.store.cart.createLineItem(cartId, {
  variant_id: variantId,
  quantity: 1,
})

// Update line item
const { cart } = await medusa.store.cart.updateLineItem(cartId, lineId, {
  quantity: newQuantity,
})

// Delete line item
const { cart } = await medusa.store.cart.deleteLineItem(cartId, lineId)
```

## Price Formatting

Medusa returns prices in cents. Always format with Intl:

```typescript
const formatted = new Intl.NumberFormat("en", {
  style: "currency",
  currency: cart.currency_code ?? "usd",
}).format(priceInCents / 100)
```

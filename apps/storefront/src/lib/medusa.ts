import Medusa from "@medusajs/js-sdk";
import type { StoreCart } from "@medusajs/types";

/**
 * Medusa JS SDK client initialization
 *
 * Environment variables:
 * - MEDUSA_BACKEND_URL: The URL of the Medusa backend (required for server-side)
 * - PUBLIC_MEDUSA_BACKEND_URL: The URL for client-side requests (uses same backend)
 * - MEDUSA_PUBLISHABLE_KEY: Server-side publishable API key
 * - PUBLIC_MEDUSA_PUBLISHABLE_KEY: Client-side publishable API key
 */

// Get environment variables based on context (server vs client)
const getBackendUrl = (): string => {
  // Server-side: use import.meta.env for Astro
  if (typeof window === "undefined") {
    return (
      import.meta.env.MEDUSA_BACKEND_URL ||
      import.meta.env.PUBLIC_MEDUSA_BACKEND_URL ||
      "http://localhost:9000"
    );
  }
  // Client-side: use PUBLIC_ prefixed env var
  return import.meta.env.PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
};

const getPublishableKey = (): string | undefined => {
  // Server-side
  if (typeof window === "undefined") {
    return (
      import.meta.env.MEDUSA_PUBLISHABLE_KEY ||
      import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY
    );
  }
  // Client-side
  return import.meta.env.PUBLIC_MEDUSA_PUBLISHABLE_KEY;
};

/**
 * Medusa SDK client instance
 * Configured with the backend URL and publishable key from environment variables
 */
export const medusa = new Medusa({
  baseUrl: getBackendUrl(),
  publishableKey: getPublishableKey(),
  auth: {
    type: "jwt",
    jwtTokenStorageMethod: typeof window === "undefined" ? "memory" : "local",
  },
});

// Re-export types for convenience
export type { Config } from "@medusajs/js-sdk";

/**
 * Helper function to get the backend URL
 * Useful for debugging or constructing URLs manually
 */
export const getMedusaBackendUrl = getBackendUrl;

// =============================================================================
// Product Helpers
// =============================================================================

/**
 * List all products with optional filters
 */
export async function listProducts(
  query?: Parameters<typeof medusa.store.product.list>[0],
) {
  return medusa.store.product.list(query);
}

/**
 * Get a single product by ID
 */
export async function getProduct(
  id: string,
  query?: Parameters<typeof medusa.store.product.retrieve>[1],
) {
  return medusa.store.product.retrieve(id, query);
}

/**
 * Get a product by handle (URL slug)
 * Note: The API filters by handle, returns list - we take the first result
 */
export async function getProductByHandle(handle: string) {
  const { products } = await medusa.store.product.list({
    handle,
    limit: 1,
  });
  return products[0] || null;
}

// =============================================================================
// Collection Helpers
// =============================================================================

/**
 * List all collections with optional filters
 */
export async function listCollections(
  query?: Parameters<typeof medusa.store.collection.list>[0],
) {
  return medusa.store.collection.list(query);
}

/**
 * Get a single collection by ID
 */
export async function getCollection(
  id: string,
  query?: Parameters<typeof medusa.store.collection.retrieve>[1],
) {
  return medusa.store.collection.retrieve(id, query);
}

/**
 * Get a collection by handle (URL slug)
 */
export async function getCollectionByHandle(handle: string) {
  const { collections } = await medusa.store.collection.list({
    handle: [handle],
    limit: 1,
  });
  return collections[0] || null;
}

/**
 * Get products in a collection by collection ID
 */
export async function getProductsByCollection(
  collectionId: string,
  query?: Parameters<typeof medusa.store.product.list>[0],
) {
  return medusa.store.product.list({
    ...query,
    collection_id: [collectionId],
  });
}

// =============================================================================
// Region Helpers
// =============================================================================

/**
 * List all regions
 */
export async function listRegions(
  query?: Parameters<typeof medusa.store.region.list>[0],
) {
  return medusa.store.region.list(query);
}

/**
 * Get a single region by ID
 */
export async function getRegion(
  id: string,
  query?: Parameters<typeof medusa.store.region.retrieve>[1],
) {
  return medusa.store.region.retrieve(id, query);
}

/**
 * Cache for the default region (first region from the backend)
 */
let cachedDefaultRegion: { id: string; currency_code: string } | null = null;

/**
 * Get the default region (first available region)
 * Caches the result to avoid repeated API calls
 */
export async function getDefaultRegion() {
  if (cachedDefaultRegion) {
    return cachedDefaultRegion;
  }

  const { regions } = await listRegions({ limit: 1 });
  if (regions.length > 0) {
    cachedDefaultRegion = {
      id: regions[0].id,
      currency_code: regions[0].currency_code,
    };
  }
  return cachedDefaultRegion;
}

// =============================================================================
// Cart Helpers
// =============================================================================

/**
 * Create a new cart
 */
export async function createCart(
  body: Parameters<typeof medusa.store.cart.create>[0],
  query?: Parameters<typeof medusa.store.cart.create>[1],
) {
  return medusa.store.cart.create(body, query);
}

/**
 * Retrieve a cart by ID
 */
export async function getCart(
  id: string,
  query?: Parameters<typeof medusa.store.cart.retrieve>[1],
) {
  return medusa.store.cart.retrieve(id, query);
}

/**
 * Update a cart
 */
export async function updateCart(
  id: string,
  body: Parameters<typeof medusa.store.cart.update>[1],
  query?: Parameters<typeof medusa.store.cart.update>[2],
) {
  return medusa.store.cart.update(id, body, query);
}

/**
 * Add a line item to a cart
 */
export async function addToCart(
  cartId: string,
  body: Parameters<typeof medusa.store.cart.createLineItem>[1],
  query?: Parameters<typeof medusa.store.cart.createLineItem>[2],
) {
  return medusa.store.cart.createLineItem(cartId, body, query);
}

/**
 * Update a line item in a cart
 */
export async function updateLineItem(
  cartId: string,
  lineItemId: string,
  body: Parameters<typeof medusa.store.cart.updateLineItem>[2],
  query?: Parameters<typeof medusa.store.cart.updateLineItem>[3],
) {
  return medusa.store.cart.updateLineItem(cartId, lineItemId, body, query);
}

/**
 * Remove a line item from a cart
 */
export async function removeLineItem(
  cartId: string,
  lineItemId: string,
  query?: Parameters<typeof medusa.store.cart.deleteLineItem>[2],
) {
  return medusa.store.cart.deleteLineItem(cartId, lineItemId, query);
}

/**
 * Complete a cart (checkout)
 */
export async function completeCart(
  cartId: string,
  query?: Parameters<typeof medusa.store.cart.complete>[1],
) {
  return medusa.store.cart.complete(cartId, query);
}

// =============================================================================
// Fulfillment Helpers
// =============================================================================

/**
 * List shipping options for a cart
 */
export async function listShippingOptions(
  query?: Parameters<typeof medusa.store.fulfillment.listCartOptions>[0],
) {
  return medusa.store.fulfillment.listCartOptions(query);
}

/**
 * Add a shipping method to a cart
 */
export async function addShippingMethod(
  cartId: string,
  body: Parameters<typeof medusa.store.cart.addShippingMethod>[1],
  query?: Parameters<typeof medusa.store.cart.addShippingMethod>[2],
) {
  return medusa.store.cart.addShippingMethod(cartId, body, query);
}

// =============================================================================
// Payment Helpers
// =============================================================================

/**
 * List payment providers for a region
 */
export async function listPaymentProviders(
  query?: Parameters<typeof medusa.store.payment.listPaymentProviders>[0],
) {
  return medusa.store.payment.listPaymentProviders(query);
}

/**
 * Initiate a payment session for a cart
 */
export async function initiatePaymentSession(
  cart: StoreCart,
  body: Parameters<typeof medusa.store.payment.initiatePaymentSession>[1],
  query?: Parameters<typeof medusa.store.payment.initiatePaymentSession>[2],
) {
  return medusa.store.payment.initiatePaymentSession(cart, body, query);
}

// =============================================================================
// Order Helpers
// =============================================================================

/**
 * Retrieve an order by ID
 */
export async function retrieveOrder(
  id: string,
  query?: Parameters<typeof medusa.store.order.retrieve>[1],
) {
  return medusa.store.order.retrieve(id, query);
}

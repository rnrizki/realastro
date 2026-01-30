import { atom, computed } from "nanostores";
import type { StoreCart } from "@medusajs/types";

/**
 * Cart state management using Nanostores
 *
 * Atoms:
 * - $cart: The full cart object from Medusa
 * - $cartOpen: Whether the cart sidebar is visible
 * - $cartLoading: Whether cart is being loaded from storage
 *
 * Computed:
 * - $cartCount: Total number of items in cart
 * - $cartTotal: Formatted total price
 */

// =============================================================================
// Constants
// =============================================================================

const CART_ID_KEY = "medusa_cart_id";

// =============================================================================
// Atoms
// =============================================================================

/**
 * The cart data from Medusa
 * null when no cart exists yet
 */
export const $cart = atom<StoreCart | null>(null);

/**
 * Whether the cart sidebar is open
 */
export const $cartOpen = atom<boolean>(false);

/**
 * The element that triggered opening the cart (for returning focus on close)
 */
export const $cartTrigger = atom<HTMLElement | null>(null);

/**
 * Message for screen readers to announce cart updates
 */
export const $cartAnnouncement = atom<string | null>(null);

/**
 * Whether cart is being loaded from localStorage
 */
export const $cartLoading = atom<boolean>(false);

// =============================================================================
// Computed Values
// =============================================================================

/**
 * Total number of items in the cart
 * Sums up quantities of all line items
 */
export const $cartCount = computed($cart, (cart) => {
  if (!cart?.items) return 0;
  return cart.items.reduce((total, item) => total + item.quantity, 0);
});

/**
 * Cart total as a formatted string
 * Returns the cart's total amount with currency
 */
export const $cartTotal = computed($cart, (cart) => {
  if (!cart) return null;

  const total = cart.total ?? 0;
  const currencyCode = cart.currency_code ?? "usd";

  // Format the total as currency
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(total / 100); // Medusa stores amounts in cents
});

/**
 * Raw cart total in cents (for calculations)
 */
export const $cartTotalRaw = computed($cart, (cart) => {
  return cart?.total ?? 0;
});

// =============================================================================
// Actions
// =============================================================================

/**
 * Set the cart data and persist cart ID to localStorage
 */
export function setCart(cart: StoreCart | null) {
  $cart.set(cart);
  // Persist cart ID to localStorage
  if (cart?.id) {
    setStoredCartId(cart.id);
  }
}

/**
 * Open the cart sidebar
 * @param trigger - The element that triggered opening (for returning focus on close)
 */
export function openCart(trigger?: HTMLElement | null) {
  if (trigger) {
    $cartTrigger.set(trigger);
  }
  $cartOpen.set(true);
}

/**
 * Close the cart sidebar and return focus to trigger element
 */
export function closeCart() {
  const trigger = $cartTrigger.get();
  $cartOpen.set(false);
  // Return focus to trigger element after sidebar closes
  if (trigger) {
    // Use setTimeout to ensure focus happens after animations
    setTimeout(() => {
      trigger.focus();
    }, 0);
    $cartTrigger.set(null);
  }
}

/**
 * Toggle the cart sidebar
 */
export function toggleCart() {
  $cartOpen.set(!$cartOpen.get());
}

/**
 * Clear the cart (set to null and remove from localStorage)
 */
export function clearCart() {
  $cart.set(null);
  removeStoredCartId();
}

// =============================================================================
// LocalStorage Persistence
// =============================================================================

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Get the stored cart ID from localStorage
 */
export function getStoredCartId(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(CART_ID_KEY);
  } catch {
    // Handle cases where localStorage is not available
    return null;
  }
}

/**
 * Save cart ID to localStorage
 */
export function setStoredCartId(cartId: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(CART_ID_KEY, cartId);
  } catch {
    // Handle cases where localStorage is not available
    console.warn("Failed to save cart ID to localStorage");
  }
}

/**
 * Remove cart ID from localStorage
 */
export function removeStoredCartId(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(CART_ID_KEY);
  } catch {
    // Handle cases where localStorage is not available
  }
}

/**
 * Initialize the cart from localStorage
 * Call this on app/page load to restore the cart state
 *
 * @param fetchCart - Function to fetch cart by ID from the Medusa API
 * @returns The loaded cart or null if no cart exists/is invalid
 */
export async function initializeCart(
  fetchCart: (cartId: string) => Promise<{ cart: StoreCart } | null>,
): Promise<StoreCart | null> {
  const storedCartId = getStoredCartId();

  if (!storedCartId) {
    return null;
  }

  $cartLoading.set(true);

  try {
    const response = await fetchCart(storedCartId);

    if (response?.cart) {
      // Check if cart is still valid (not completed)
      if (response.cart.completed_at) {
        // Cart was completed, clear it
        removeStoredCartId();
        $cartLoading.set(false);
        return null;
      }

      $cart.set(response.cart);
      $cartLoading.set(false);
      return response.cart;
    }

    // Cart not found, clear stored ID
    removeStoredCartId();
    $cartLoading.set(false);
    return null;
  } catch (error) {
    // Cart is expired or invalid, clear stored ID
    console.warn("Failed to load cart from storage:", error);
    removeStoredCartId();
    $cartLoading.set(false);
    return null;
  }
}

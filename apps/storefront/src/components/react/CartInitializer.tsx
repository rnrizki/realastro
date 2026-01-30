import { useEffect } from "preact/hooks";
import { $cart, initializeCart } from "@/lib/stores/cart";
import { getCart } from "@/lib/medusa";

/**
 * CartInitializer component
 *
 * This component should be rendered with client:load to ensure
 * the cart is loaded from localStorage on page load.
 *
 * It renders nothing - its only purpose is to initialize cart state.
 */
export default function CartInitializer() {
  useEffect(() => {
    // Only initialize if cart is not already loaded
    if ($cart.get()) {
      return;
    }

    // Initialize cart from localStorage
    initializeCart(async (cartId: string) => {
      try {
        const result = await getCart(cartId);
        return result;
      } catch {
        return null;
      }
    });
  }, []);

  // This component renders nothing - it just initializes state
  return null;
}

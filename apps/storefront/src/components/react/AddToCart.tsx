import { useState } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { $cart, setCart, openCart, $cartAnnouncement } from "@/lib/stores/cart";
import { addToCart, createCart } from "@/lib/medusa";

interface AddToCartProps {
  variantId: string;
  productTitle?: string;
}

export default function AddToCart({ variantId, productTitle }: AddToCartProps) {
  const cart = useStore($cart);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let cartId = cart?.id;

      // 1. Create cart if it doesn't exist
      if (!cartId) {
        const { cart: newCart } = await createCart({});
        setCart(newCart);
        cartId = newCart.id;
      }

      if (!cartId) throw new Error("Failed to create cart");

      // 2. Add line item
      const { cart: updatedCart } = await addToCart(cartId, {
        variant_id: variantId,
        quantity: 1,
      });

      // 3. Update store
      setCart(updatedCart);

      // 4. Announce to screen reader
      const message = productTitle
        ? `Added ${productTitle} to cart`
        : "Added item to cart";
      $cartAnnouncement.set(message);

      // 5. Open cart sidebar (optional but good UX)
      openCart();
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError("Failed to add item. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleAddToCart}
        disabled={isLoading || !variantId}
        className={`w-full rounded-md px-6 py-3 text-base font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          isLoading
            ? "cursor-not-allowed bg-indigo-400"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Adding...
          </span>
        ) : (
          "Add to Cart"
        )}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

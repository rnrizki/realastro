import { useStore } from "@nanostores/preact";
import { $cartCount, openCart } from "@/lib/stores/cart";

export default function CartButton() {
  const cartCount = useStore($cartCount);

  const handleClick = (e: MouseEvent) => {
    openCart(e.currentTarget as HTMLElement);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative flex items-center rounded-md p-2 text-gray-700 hover:text-gray-900"
      aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
    >
      {/* Cart Icon */}
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121 0 2.09-.773 2.342-1.868l1.687-7.327c.197-.855-.454-1.68-1.337-1.68H5.75m-.428 3.375h13.878"
        />
      </svg>

      {/* Count Badge */}
      {cartCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </button>
  );
}

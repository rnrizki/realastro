import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import {
  $cart,
  $cartOpen,
  $cartTotal,
  $cartAnnouncement,
  closeCart,
  setCart,
} from "@/lib/stores/cart";
import { updateLineItem, removeLineItem, getCart } from "@/lib/medusa";

// Focusable element selector for focus trapping
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Cart() {
  const cart = useStore($cart);
  const isOpen = useStore($cartOpen);
  const cartTotal = useStore($cartTotal);
  const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle Escape key to close cart
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeCart();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus trap: keep focus within the cart when open
  const handleKeyDownFocusTrap = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !sidebarRef.current) return;

      const focusableElements =
        sidebarRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab on first element -> go to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element -> go to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    },
    [sidebarRef],
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("keydown", handleKeyDownFocusTrap);
    return () =>
      document.removeEventListener("keydown", handleKeyDownFocusTrap);
  }, [isOpen, handleKeyDownFocusTrap]);

  // Move focus to close button when cart opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      // Small delay to ensure the sidebar is visible
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleUpdateQuantity = async (
    lineItemId: string,
    newQuantity: number,
  ) => {
    if (!cart?.id) return;

    // Find item for announcement
    const item = cart.items?.find((i) => i.id === lineItemId);
    const itemTitle = item?.title || "Item";

    setError(null);
    setUpdatingItems((prev) => ({ ...prev, [lineItemId]: true }));
    try {
      if (newQuantity === 0) {
        await removeLineItem(cart.id, lineItemId);
        // Re-fetch cart to ensure we have the latest state (delete might not return cart directly in types)
        const { cart: updatedCart } = await getCart(cart.id);
        setCart(updatedCart);
        $cartAnnouncement.set(`Removed ${itemTitle} from cart`);
      } else {
        const { cart: updatedCart } = await updateLineItem(
          cart.id,
          lineItemId,
          {
            quantity: newQuantity,
          },
        );
        setCart(updatedCart);
        $cartAnnouncement.set(
          `Updated quantity for ${itemTitle} to ${newQuantity}`,
        );
      }
    } catch (err) {
      console.error("Failed to update item", err);
      setError("Failed to update item. Please try again.");
    } finally {
      setUpdatingItems((prev) => {
        const next = { ...prev };
        delete next[lineItemId];
        return next;
      });
    }
  };

  const handleRemoveItem = (lineItemId: string) => {
    handleUpdateQuantity(lineItemId, 0);
  };

  // Helper to format currency
  const formatMoney = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div
      className={`relative z-50 ${isOpen ? "visible" : "invisible"}`}
      aria-labelledby="slide-over-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Background backdrop */}
      <div
        className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity duration-500 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            {/* Sidebar panel */}
            <div
              ref={sidebarRef}
              className={`pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out sm:duration-700 ${
                isOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                {/* Header */}
                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                  <div className="flex items-start justify-between">
                    <h2
                      className="text-lg font-medium text-gray-900"
                      id="slide-over-title"
                    >
                      Shopping Cart
                    </h2>
                    <div className="ml-3 flex h-7 items-center">
                      <button
                        ref={closeButtonRef}
                        type="button"
                        className="-m-2 rounded-md p-2 text-gray-400 hover:text-gray-500"
                        onClick={closeCart}
                      >
                        <span className="sr-only">Close panel</span>
                        {/* X Icon */}
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 rounded-md bg-red-50 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-red-700">{error}</p>
                        <button
                          type="button"
                          onClick={() => setError(null)}
                          className="ml-2 rounded text-red-500 hover:text-red-700"
                          aria-label="Dismiss error"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    <div className="flow-root">
                      {!cart?.items?.length ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <p className="text-gray-500">Your cart is empty.</p>
                          <button
                            onClick={closeCart}
                            className="mt-4 rounded text-sm font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            Continue Shopping
                            <span aria-hidden="true"> &rarr;</span>
                          </button>
                        </div>
                      ) : (
                        <ul
                          className="-my-6 divide-y divide-gray-200"
                        >
                          {cart.items.map((item) => (
                            <li key={item.id} className="flex py-6">
                              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                {item.thumbnail ? (
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    width={96}
                                    height={96}
                                    className="h-full w-full object-cover object-center"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                    <svg
                                      className="h-8 w-8"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              <div className="ml-4 flex flex-1 flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-gray-900">
                                    <h3>
                                      <a
                                        href={`/products/${item.variant?.product?.handle}`}
                                      >
                                        {item.title}
                                      </a>
                                    </h3>
                                    <p className="ml-4">
                                      {formatMoney(
                                        item.unit_price,
                                        cart.currency_code,
                                      )}
                                    </p>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-500">
                                    {item.variant?.title}
                                  </p>
                                </div>
                                <div className="flex flex-1 items-end justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <label
                                      htmlFor={`quantity-${item.id}`}
                                      className="sr-only"
                                    >
                                      Quantity
                                    </label>
                                    <div className="flex items-center rounded border border-gray-200">
                                      <button
                                        type="button"
                                        className="rounded-l px-2 py-1 text-gray-600 hover:text-indigo-600 disabled:opacity-50"
                                        disabled={
                                          updatingItems[item.id] ||
                                          item.quantity <= 1
                                        }
                                        aria-label={`Decrease quantity for ${item.title}`}
                                        onClick={() =>
                                          handleUpdateQuantity(
                                            item.id,
                                            item.quantity - 1,
                                          )
                                        }
                                      >
                                        -
                                      </button>
                                      <span className="w-8 text-center text-gray-900">
                                        {updatingItems[item.id] ? (
                                          <svg
                                            className="mx-auto h-4 w-4 animate-spin text-indigo-600"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
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
                                        ) : (
                                          item.quantity
                                        )}
                                      </span>
                                      <button
                                        type="button"
                                        className="rounded-r px-2 py-1 text-gray-600 hover:text-indigo-600 disabled:opacity-50"
                                        disabled={updatingItems[item.id]}
                                        aria-label={`Increase quantity for ${item.title}`}
                                        onClick={() =>
                                          handleUpdateQuantity(
                                            item.id,
                                            item.quantity + 1,
                                          )
                                        }
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex">
                                    <button
                                      type="button"
                                      className="rounded font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                                      onClick={() => handleRemoveItem(item.id)}
                                      disabled={updatingItems[item.id]}
                                      aria-label={`Remove ${item.title} from cart`}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {cart?.items?.length ? (
                  <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <p>Subtotal</p>
                      <p>{cartTotal}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Shipping and taxes calculated at checkout.
                    </p>
                    <div className="mt-6">
                      <a
                        href="/checkout"
                        className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
                        onClick={closeCart}
                      >
                        Checkout
                      </a>
                    </div>
                    <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                      <p>
                        or{" "}
                        <button
                          type="button"
                          className="rounded font-medium text-indigo-600 hover:text-indigo-500"
                          onClick={closeCart}
                        >
                          Continue Shopping
                          <span aria-hidden="true"> &rarr;</span>
                        </button>
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

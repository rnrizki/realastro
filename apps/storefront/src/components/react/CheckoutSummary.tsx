import { useStore } from "@nanostores/preact";
import { $cart, $cartTotal } from "@/lib/stores/cart";

/**
 * CheckoutSummary displays the order summary on the checkout page.
 * Shows line items with images, quantities, prices, and totals.
 */
export default function CheckoutSummary() {
  const cart = useStore($cart);
  const cartTotal = useStore($cartTotal);

  // Helper to format currency
  const formatMoney = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode.toUpperCase(),
    }).format(amount / 100);
  };

  if (!cart) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-500">Loading cart...</p>
      </div>
    );
  }

  if (!cart.items?.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-600">Your cart is empty.</p>
        <a
          href="/products"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Continue Shopping &rarr;
        </a>
      </div>
    );
  }

  const subtotal = cart.subtotal ?? cart.total ?? 0;
  const shippingTotal = cart.shipping_total ?? 0;
  const taxTotal = cart.tax_total ?? 0;
  const currencyCode = cart.currency_code ?? "usd";

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <h2 className="border-b border-gray-200 px-6 py-4 text-lg font-medium text-gray-900">
        Order Summary
      </h2>

      {/* Line Items */}
      <ul className="divide-y divide-gray-200 px-6">
        {cart.items.map((item) => (
          <li key={item.id} className="flex py-4">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                  <svg
                    className="h-6 w-6"
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
              <div className="flex justify-between text-sm font-medium text-gray-900">
                <h3>{item.title}</h3>
                <p className="ml-4">
                  {formatMoney(item.unit_price * item.quantity, currencyCode)}
                </p>
              </div>
              {item.variant?.title && (
                <p className="mt-1 text-sm text-gray-500">
                  {item.variant.title}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex justify-between text-sm text-gray-600">
          <p>Subtotal</p>
          <p>{formatMoney(subtotal, currencyCode)}</p>
        </div>
        <div className="mt-2 flex justify-between text-sm text-gray-600">
          <p>Shipping</p>
          <p>
            {shippingTotal > 0
              ? formatMoney(shippingTotal, currencyCode)
              : "Calculated at next step"}
          </p>
        </div>
        <div className="mt-2 flex justify-between text-sm text-gray-600">
          <p>Tax</p>
          <p>
            {taxTotal > 0
              ? formatMoney(taxTotal, currencyCode)
              : "Calculated at next step"}
          </p>
        </div>
        <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-base font-medium text-gray-900">
          <p>Total</p>
          <p>{cartTotal}</p>
        </div>
      </div>
    </div>
  );
}

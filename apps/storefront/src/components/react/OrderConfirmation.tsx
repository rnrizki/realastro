import { useState, useEffect } from "preact/hooks";
import { retrieveOrder } from "@/lib/medusa";
import type { StoreOrder } from "@medusajs/types";

export default function OrderConfirmation() {
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("id");

    if (!orderId) {
      setError("No order ID provided.");
      setIsLoading(false);
      return;
    }

    async function fetchOrder(id: string) {
      try {
        const { order: retrievedOrder } = await retrieveOrder(id, {
          fields: "+items.variant.product.title,+items.thumbnail",
        });
        setOrder(retrievedOrder);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder(orderId);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <svg
          className="h-8 w-8 animate-spin text-blue-600"
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
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-center">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-2 text-sm text-red-700">
          {error || "Order not found"}
        </p>
        <a
          href="/"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Return to Home
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 sm:p-8">
        <div className="border-b border-gray-200 pb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Thank you for your order!
          </h1>
          <p className="mt-2 text-gray-600">
            Order #{order.display_id} has been placed successfully.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Confirmation sent to {order.email}
          </p>
        </div>

        <div className="py-8">
          <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
          <ul className="mt-4 divide-y divide-gray-200">
            {(order.items || []).map((item) => (
              <li key={item.id} className="flex py-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                      <span className="text-xs">No img</span>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex flex-1 flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <h3>{item.title}</h3>
                      <p>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: order.currency_code.toUpperCase(),
                        }).format(item.total / 100)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.variant_title}
                    </p>
                  </div>
                  <div className="flex flex-1 items-end justify-between text-sm">
                    <p className="text-gray-500">Qty {item.quantity}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <div className="flex justify-between text-base font-medium text-gray-900">
              <p>Total</p>
              <p>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: order.currency_code.toUpperCase(),
                }).format(order.total / 100)}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-lg font-medium text-gray-900">
            Shipping Details
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Shipping Address
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {order.shipping_address?.first_name}{" "}
                {order.shipping_address?.last_name}
                <br />
                {order.shipping_address?.address_1}
                <br />
                {order.shipping_address?.address_2 && (
                  <>
                    {order.shipping_address.address_2}
                    <br />
                  </>
                )}
                {order.shipping_address?.city},{" "}
                {order.shipping_address?.postal_code}
                <br />
                {order.shipping_address?.country_code?.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 text-center">
          <a
            href="/products"
            className="inline-block rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  );
}

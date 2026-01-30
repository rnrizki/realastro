import { useState, useEffect } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { $cart, setCart } from "@/lib/stores/cart";
import {
  listPaymentProviders,
  initiatePaymentSession,
  completeCart,
} from "@/lib/medusa";
import type { StoreOrder, StorePaymentSession } from "@medusajs/types";

interface Props {
  onComplete?: (order: StoreOrder) => void;
}

interface PaymentProvider {
  id: string;
  is_enabled?: boolean;
}

export default function PaymentForm({ onComplete }: Props) {
  const cart = useStore($cart);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Load payment providers
  useEffect(() => {
    async function loadProviders() {
      if (!cart?.region_id) return;

      try {
        const { payment_providers } = await listPaymentProviders({
          region_id: cart.region_id,
        });
        setProviders(payment_providers);

        // If we already have a payment session in the payment collection, select it
        const paymentCollection = cart.payment_collection;
        if (paymentCollection?.payment_sessions?.length) {
          // Assume the first one is active or check status
          const activeSession = paymentCollection.payment_sessions.find(
            (s: StorePaymentSession) => s.status === "pending",
          );
          if (activeSession) {
            setSelectedProvider(activeSession.provider_id);
          }
        }
      } catch (err) {
        console.error("Error loading payment providers:", err);
        setError("Failed to load payment options.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProviders();
  }, [cart?.region_id, cart?.payment_collection]);

  const handleSelectPayment = async (providerId: string) => {
    if (!cart) return;

    setSelectedProvider(providerId);
    setError(null);
    setIsProcessing(true);

    try {
      // In V2, we initiate a session for the specific provider
      // This creates/updates the payment collection
      await initiatePaymentSession(cart, {
        provider_id: providerId,
      });

      // We don't get the updated cart back directly, but the payment_collection

      // We should ideally update the local cart store.
      // For now, simple UI selection update is handled by selectedProvider state.
    } catch (err) {
      console.error("Error selecting payment:", err);
      setError("Failed to initialize payment method. Please try again.");
      setSelectedProvider(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart?.id || !selectedProvider) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await completeCart(cart.id);

      if (response.type === "order") {
        setCart(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("cart_id");
        }
        onComplete?.(response.order);
      } else {
        // Handle cart-type response (error or further steps)
        // The cart response doesn't have an error property in the type,
        // so we show a generic message
        setError("Payment incomplete. Please check details.");
      }
    } catch (err) {
      console.error("Error placing order:", err);
      setError("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading payment options...
        </div>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-700">
          No payment methods available for this region.
        </p>
      </div>
    );
  }

  if (!cart) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Payment</h3>
        <p className="mt-1 text-sm text-gray-500">
          All transactions are secure and encrypted.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        {providers.map((provider) => {
          const isSelected = selectedProvider === provider.id;

          return (
            // eslint-disable-next-line jsx-a11y/label-has-associated-control
            <label
              key={provider.id}
              className={`relative flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                isSelected
                  ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment-provider"
                  value={provider.id}
                  checked={isSelected}
                  onChange={() => handleSelectPayment(provider.id)}
                  disabled={isProcessing}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  className={`block font-medium ${isSelected ? "text-blue-900" : "text-gray-900"}`}
                >
                  {provider.id === "pp_system_default"
                    ? "Manual Payment (Test)"
                    : provider.id}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={!selectedProvider || isProcessing}
        className={`w-full rounded-md px-6 py-3 text-base font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          !selectedProvider || isProcessing
            ? "cursor-not-allowed bg-gray-400"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-5 w-5 animate-spin text-white"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          `Pay ${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: cart.region?.currency_code?.toUpperCase() || "USD",
          }).format((cart.total || 0) / 100)}`
        )}
      </button>
    </div>
  );
}

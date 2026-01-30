import { useState, useEffect } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { $cart, setCart } from "@/lib/stores/cart";
import { listShippingOptions, addShippingMethod } from "@/lib/medusa";

interface ShippingOption {
  id: string;
  name: string;
  amount: number;
  price_type: string;
}

interface Props {
  onComplete?: () => void;
}

/**
 * ShippingMethodSelector fetches and displays available shipping options,
 * allowing the customer to select one and apply it to their cart.
 */
export default function ShippingMethodSelector({ onComplete }: Props) {
  const cart = useStore($cart);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch shipping options when component mounts or cart changes
  useEffect(() => {
    async function fetchShippingOptions() {
      if (!cart?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        const { shipping_options } = await listShippingOptions({
          cart_id: cart.id,
        });

        // Map the response to our simpler interface
        const options: ShippingOption[] = shipping_options.map((opt) => ({
          id: opt.id,
          name: opt.name,
          amount: opt.amount ?? 0,
          price_type: opt.price_type ?? "flat_rate",
        }));

        setShippingOptions(options);

        // If cart already has a shipping method selected, set it
        if (cart.shipping_methods && cart.shipping_methods.length > 0) {
          setSelectedOption(cart.shipping_methods[0].shipping_option_id ?? null);
        }
      } catch (err) {
        console.error("Error fetching shipping options:", err);
        setError("Unable to load shipping options. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchShippingOptions();
  }, [cart?.id]);

  const handleSelectOption = async (optionId: string) => {
    if (!cart?.id) return;

    setSelectedOption(optionId);
    setIsSaving(true);
    setError(null);

    try {
      const { cart: updatedCart } = await addShippingMethod(cart.id, {
        option_id: optionId,
      });

      setCart(updatedCart);
      onComplete?.();
    } catch (err) {
      console.error("Error setting shipping method:", err);
      setError("Failed to set shipping method. Please try again.");
      setSelectedOption(null);
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (amount: number): string => {
    if (amount === 0) return "Free";
    const currencyCode = cart?.currency_code?.toUpperCase() || "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-2 text-gray-500">
          <svg
            className="h-5 w-5 animate-spin"
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
          Loading shipping options...
        </div>
      </div>
    );
  }

  if (error && shippingOptions.length === 0) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => {
            setIsLoading(true);
            setError(null);
          }}
          className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
        >
          Try again
        </button>
      </div>
    );
  }

  if (shippingOptions.length === 0) {
    return (
      <div className="rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-700">
          No shipping options available for your address. Please check your
          shipping address and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900">Shipping method</h3>

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        {shippingOptions.map((option) => {
          const isSelected = selectedOption === option.id;
          const isCurrentlySaving = isSaving && isSelected;

          return (
            <label
              key={option.id}
              className={`relative flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                isSelected
                  ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                  : "border-gray-200 hover:border-gray-300"
              } ${isSaving && !isSelected ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shipping-option"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => handleSelectOption(option.id)}
                  disabled={isSaving}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span
                    className={`block font-medium ${
                      isSelected ? "text-blue-900" : "text-gray-900"
                    }`}
                  >
                    {option.name}
                  </span>
                  {option.price_type === "calculated" && (
                    <span className="text-sm text-gray-500">
                      Calculated at checkout
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isCurrentlySaving && (
                  <svg
                    className="h-4 w-4 animate-spin text-blue-600"
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
                )}
                <span
                  className={`font-medium ${
                    isSelected ? "text-blue-900" : "text-gray-900"
                  }`}
                >
                  {option.price_type === "calculated"
                    ? "—"
                    : formatPrice(option.amount)}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {selectedOption && !isSaving && (
        <div className="flex items-center gap-2 pt-2 text-sm text-green-700">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
          Shipping method selected
        </div>
      )}
    </div>
  );
}

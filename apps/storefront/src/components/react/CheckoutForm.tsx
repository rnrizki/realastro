import { useState } from "preact/hooks";
import { useStore } from "@nanostores/preact";
import { $cart, setCart } from "@/lib/stores/cart";
import { updateCart } from "@/lib/medusa";
import ShippingMethodSelector from "./ShippingMethodSelector";
import PaymentForm from "./PaymentForm";

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface FormErrors {
  [key: string]: string;
}

const initialFormData: FormData = {
  email: "",
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  postalCode: "",
  country: "us",
  phone: "",
};

/**
 * CheckoutForm collects shipping information from the customer.
 * Validates required fields and updates the cart with the shipping address.
 */
export default function CheckoutForm() {
  const cart = useStore($cart);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isShippingSelected, setIsShippingSelected] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Postal code is required";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: Event & { currentTarget: HTMLInputElement | HTMLSelectElement },
  ) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    if (!cart?.id) {
      setApiError("No cart found. Please add items to your cart first.");
      return;
    }

    setIsLoading(true);

    try {
      const { cart: updatedCart } = await updateCart(cart.id, {
        email: formData.email,
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          address_2: formData.apartment || undefined,
          city: formData.city,
          postal_code: formData.postalCode,
          country_code: formData.country,
          phone: formData.phone || undefined,
        },
      });

      setCart(updatedCart);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Error updating cart:", err);
      setApiError("Failed to save shipping information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-green-700"
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
            <h3 className="font-medium text-green-800">
              Shipping information saved
            </h3>
          </div>
          <p className="mt-2 text-sm text-green-700">
            {formData.firstName} {formData.lastName}
            <br />
            {formData.address}
            {formData.apartment && `, ${formData.apartment}`}
            <br />
            {formData.city}, {formData.postalCode}
          </p>
          {!isShippingSelected && (
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="mt-4 text-sm font-medium text-green-700 hover:text-green-600"
            >
              Edit shipping address
            </button>
          )}
        </div>

        <div className="mt-6">
          <ShippingMethodSelector
            onComplete={() => setIsShippingSelected(true)}
          />
        </div>

        {isShippingSelected && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <PaymentForm
              onComplete={(order) => {
                window.location.href = `/order?id=${order.id}`;
              }}
            />
          </div>
        )}
      </>
    );
  }

  const inputClasses = (fieldName: string) =>
    `mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
      errors[fieldName]
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Contact</h2>
        <div className="mt-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className={inputClasses("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-700">{errors.email}</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900">Shipping address</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={handleChange}
              className={inputClasses("firstName")}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-700">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
              className={inputClasses("lastName")}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-700">{errors.lastName}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700"
            >
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              autoComplete="street-address"
              value={formData.address}
              onChange={handleChange}
              className={inputClasses("address")}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-700">{errors.address}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="apartment"
              className="block text-sm font-medium text-gray-700"
            >
              Apartment, suite, etc. (optional)
            </label>
            <input
              type="text"
              id="apartment"
              name="apartment"
              autoComplete="address-line2"
              value={formData.apartment}
              onChange={handleChange}
              className={inputClasses("apartment")}
            />
          </div>

          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700"
            >
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              autoComplete="address-level2"
              value={formData.city}
              onChange={handleChange}
              className={inputClasses("city")}
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-700">{errors.city}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="postalCode"
              className="block text-sm font-medium text-gray-700"
            >
              Postal code
            </label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              autoComplete="postal-code"
              value={formData.postalCode}
              onChange={handleChange}
              className={inputClasses("postalCode")}
            />
            {errors.postalCode && (
              <p className="mt-1 text-sm text-red-700">{errors.postalCode}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700"
            >
              Country
            </label>
            <select
              id="country"
              name="country"
              autoComplete="country"
              value={formData.country}
              onChange={handleChange}
              className={inputClasses("country")}
            >
              <option value="us">United States</option>
              <option value="ca">Canada</option>
              <option value="gb">United Kingdom</option>
              <option value="de">Germany</option>
              <option value="fr">France</option>
              <option value="au">Australia</option>
            </select>
            {errors.country && (
              <p className="mt-1 text-sm text-red-700">{errors.country}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone (optional)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              className={inputClasses("phone")}
            />
          </div>
        </div>
      </div>

      {apiError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full rounded-md px-6 py-3 text-base font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isLoading
            ? "cursor-not-allowed bg-blue-400"
            : "bg-blue-600 hover:bg-blue-700"
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
            Saving...
          </span>
        ) : (
          "Continue to shipping method"
        )}
      </button>
    </form>
  );
}

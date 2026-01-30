import { useState, useMemo } from "preact/hooks";
import type { StoreProduct } from "@medusajs/types";
import AddToCart from "./AddToCart";
import { formatPrice } from "@/lib/utils";

interface ProductActionsProps {
  product: StoreProduct;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    if (product.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      const initialOptions: Record<string, string> = {};

      firstVariant.options?.forEach((option) => {
        if (option.option_id) {
          initialOptions[option.option_id] = option.value;
        }
      });

      return initialOptions;
    }
    return {};
  });

  // Find the variant that matches selected options
  const selectedVariant = useMemo(() => {
    if (!product.variants || Object.keys(selectedOptions).length === 0)
      return undefined;

    return product.variants.find((variant) => {
      // Check if all variant options match selected options
      // Note: variant.options might be undefined in some partial returns, but we requested it.
      return variant.options?.every((variantOption) => {
        if (!variantOption.option_id) return false;
        const selectedValue = selectedOptions[variantOption.option_id];
        return selectedValue === variantOption.value;
      });
    });
  }, [product.variants, selectedOptions]);

  // Handle option selection
  const handleOptionChange = (optionId: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }));
  };

  // Get price
  const price = selectedVariant?.calculated_price;
  const formattedPrice = formatPrice(
    price?.calculated_amount,
    price?.currency_code ?? undefined,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Price */}
      <div className="text-2xl font-semibold text-gray-900">
        {formattedPrice ||
          (selectedVariant ? "Price unavailable" : "Select options")}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-4">
        {product.options?.map((option) => {
          // Deduplicate values just in case
          const uniqueValues = Array.from(
            new Set(option.values?.map((v) => v.value)),
          );

          return (
            <div key={option.id}>
              <h3 className="text-sm font-medium text-gray-900">
                {option.title}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {uniqueValues.map((value) => {
                  const isSelected = selectedOptions[option.id] === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleOptionChange(option.id, value)}
                      className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add to Cart */}
      <div>
        {selectedVariant ? (
          <AddToCart
            variantId={selectedVariant.id}
            productTitle={product.title}
          />
        ) : (
          <button
            disabled
            className="w-full rounded-md border border-transparent bg-gray-300 px-6 py-3 text-base font-medium text-white cursor-not-allowed"
          >
            {Object.keys(selectedOptions).length !==
            (product.options?.length || 0)
              ? "Select Options"
              : "Out of Stock"}
          </button>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "preact/hooks";

interface Image {
  url: string;
  id?: string;
}

interface ProductImageGalleryProps {
  images?: Image[] | null;
  thumbnail?: string | null;
  title: string;
}

export default function ProductImageGallery({
  images = [],
  thumbnail,
  title,
}: ProductImageGalleryProps) {
  // Initialize with the first image or thumbnail
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    images?.[0]?.url || thumbnail || undefined,
  );

  // Update selected image if props change (e.g. navigation)
  useEffect(() => {
    setSelectedImage(images?.[0]?.url || thumbnail || undefined);
  }, [images, thumbnail]);

  if (!selectedImage) {
    return (
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        <div className="flex h-full w-full items-center justify-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        <img
          src={selectedImage}
          alt={title}
          className="h-full w-full object-cover object-center"
          loading="eager"
          fetchpriority="high"
        />
      </div>

      {/* Thumbnails */}
      {images && images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              type="button"
              onClick={() => setSelectedImage(image.url)}
              className={`aspect-square overflow-hidden rounded-md bg-gray-100 ring-2 ring-offset-2 transition-all ${
                selectedImage === image.url
                  ? "ring-indigo-600"
                  : "ring-transparent hover:ring-gray-300"
              }`}
              aria-label={`View image ${index + 1} of ${title}`}
            >
              <img
                src={image.url}
                alt=""
                className="h-full w-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

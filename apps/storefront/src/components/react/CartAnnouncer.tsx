import { useStore } from "@nanostores/preact";
import { useEffect, useState } from "preact/hooks";
import { $cartAnnouncement } from "@/lib/stores/cart";

/**
 * A hidden component that announces cart updates to screen readers
 * using an aria-live region.
 */
export default function CartAnnouncer() {
  const announcement = useStore($cartAnnouncement);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (announcement) {
      setMessage(announcement);

      // Clear the message from the store so the same message can be announced again if triggered
      // We don't clear the local state immediately so screen readers have time to read it
      // but we need to reset the store to allow re-triggering
      const timer = setTimeout(() => {
        $cartAnnouncement.set(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [announcement]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

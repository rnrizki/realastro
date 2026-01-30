import { useState } from "preact/hooks";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setCount(count - 1)}
        className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
      >
        -
      </button>
      <span className="text-xl font-semibold">{count}</span>
      <button
        onClick={() => setCount(count + 1)}
        className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
      >
        +
      </button>
    </div>
  );
}

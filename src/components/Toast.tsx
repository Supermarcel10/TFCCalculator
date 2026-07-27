import { useEffect } from "react";

export type ToastPosition =
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  position?: ToastPosition;
}

const POSITION_CLASSES: Record<ToastPosition, string> = {
  top: "top-4 left-1/2 -translate-x-1/2",
  bottom: "bottom-4 left-1/2 -translate-x-1/2",
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
};

export function Toast({
  message,
  onClose,
  duration = 5000,
  position = "top-right",
}: Readonly<ToastProps>) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 ${POSITION_CLASSES[position]}`}
    >
      <p>{message}</p>
    </div>
  );
}

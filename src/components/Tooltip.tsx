import { InfoIcon } from "@phosphor-icons/react";
import { useState } from "react";

interface TooltipProps {
  content: string;
}

export function Tooltip({ content }: Readonly<TooltipProps>) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        className="inline-flex items-center justify-center text-black hover:text-gray-500 focus:text-gray-500"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="More information"
      >
        <InfoIcon size={16} weight={isVisible ? "fill" : "regular"} />
      </button>
      {isVisible && (
        <div
          role="tooltip"
          className="absolute z-10 w-64 p-2 mt-2 text-sm text-white bg-gray-800 rounded shadow-lg -left-2 bottom-full mb-2"
        >
          {content}
          <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 left-3 -bottom-1"></div>
        </div>
      )}
    </div>
  );
}

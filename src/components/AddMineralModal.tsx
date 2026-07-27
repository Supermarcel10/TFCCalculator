import { QuantifiedMineral } from "@/types";
import { useEffect, useState } from "react";
import { searchMinerals } from "@/functions/inventory";


interface AddMineralModalProps {
  availableMinerals: QuantifiedMineral[];
  inventoryMinerals: QuantifiedMineral[];
  onAdd: (mineral: QuantifiedMineral) => void;
  onClose: () => void;
}

export function AddMineralModal({
  availableMinerals,
  inventoryMinerals,
  onAdd,
  onClose,
}: Readonly<AddMineralModalProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMineral, setSelectedMineral] =
    useState<QuantifiedMineral | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const inventoryNames = new Set(inventoryMinerals.map((m) => m.name));
  const notInInventory = availableMinerals.filter(
    (m) => !inventoryNames.has(m.name),
  );

  const filteredMinerals = searchMinerals(searchQuery, notInInventory);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setSelectedMineral(null);
  }, [searchQuery]);

  const handleSelectMineral = (mineral: QuantifiedMineral) => {
    setSelectedMineral(mineral);
  };

  const handleAdd = () => {
    if (!selectedMineral || quantity <= 0) return;

    const entryWithQuantity: QuantifiedMineral = {
      ...selectedMineral,
      quantity,
    };
    onAdd(entryWithQuantity);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white text-black rounded-lg shadow-xl p-6 w-96 max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">Add Mineral</h3>

        {!selectedMineral && (
          <input
            type="text"
            placeholder="Search minerals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4 bg-white"
            autoFocus
          />
        )}

        {!selectedMineral && (
          <div className="max-h-48 overflow-y-auto mb-4 border border-gray-200 rounded">
            {filteredMinerals.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">
                {notInInventory.length === 0
                  ? "All minerals already added"
                  : "No minerals found"}
              </p>
            ) : (
              filteredMinerals.map((mineral) => (
                <button
                  key={mineral.name}
                  onClick={() => handleSelectMineral(mineral)}
                  className="w-full p-3 text-left hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium">{mineral.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({mineral.yield} mB)
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {selectedMineral && (
          <div className="mb-4">
            <div className="flex items-center justify-between bg-teal-50 rounded p-2 mb-4">
              <div>
                <span className="font-medium">{selectedMineral.name}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({selectedMineral.yield} mB)
                </span>
              </div>
              <button
                onClick={() => setSelectedMineral(null)}
                className="text-sm text-teal-600 hover:text-teal-800 font-medium"
              >
                Edit
              </button>
            </div>
            <div>
              <label
                htmlFor="add-mineral-quantity"
                className="block text-sm text-gray-700 mb-1"
              >
                Quantity
              </label>
              <input
                type="number"
                id="add-mineral-quantity"
                value={quantity <= 0 ? "" : quantity}
                placeholder="0"
                onChange={(e) => {
                  const val =
                    e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                  setQuantity(isNaN(val) ? 0 : val);
                }}
                min="1"
                className="w-full p-2 border border-gray-300 rounded no-spinners bg-white"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-black"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedMineral || quantity <= 0}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white transition-colors disabled:bg-gray-400 disabled:hover:bg-gray-500"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

import { QuantifiedMineral, SmeltingComponent } from "@/types";
import { useMemo, useState } from "react";
import { AddMineralModal } from "./AddMineralModal";
import { capitaliseFirstLetterOfEachWord } from "@/functions/utils";


interface InventoryListProps {
  components: SmeltingComponent[];
  allMinerals: Map<string, QuantifiedMineral[]>;
  inventory: QuantifiedMineral[];
  inventoryMap: Map<string, QuantifiedMineral[]>;
  onUpdateQuantity: (name: string, quantity: number) => void;
  onDelete: (name: string) => void;
  onAddMineral: (mineral: QuantifiedMineral) => void;
  onMergeToast: (mineralName: string) => void;
}

export function InventoryList({
  components,
  allMinerals,
  inventory,
  inventoryMap,
  onUpdateQuantity,
  onDelete,
  onAddMineral,
  onMergeToast,
}: Readonly<InventoryListProps>) {
  const [showModal, setShowModal] = useState(false);
  const [editingQty, setEditingQty] = useState<Record<string, string>>({});

  const flatAvailableMinerals = useMemo(() => {
    const result: QuantifiedMineral[] = [];
    for (const minerals of allMinerals.values()) {
      result.push(...minerals);
    }
    return result;
  }, [allMinerals]);

  const handleAdd = (mineral: QuantifiedMineral) => {
    const existing = inventory.find((m) => m.name === mineral.name);
    if (existing) {
      onMergeToast(mineral.name);
    }
    onAddMineral(mineral);
  };

  return (
    <div>
      {flatAvailableMinerals.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white transition-colors"
          >
            + Add mineral
          </button>
        </div>
      )}

      {components.map((component) => {
        const componentKey = component.mineral.toLowerCase();
        const componentEntries = inventoryMap.get(componentKey) ?? [];

        return (
          <div key={componentKey} className="mb-6">
            <div className="bg-teal-200 text-black rounded-lg p-3 mb-2">
              <h3 className="font-semibold">
                {capitaliseFirstLetterOfEachWord(componentKey)}
              </h3>
              <p className="text-xs text-gray-600">
                {component.min}% - {component.max}%
              </p>
            </div>

            {componentEntries.length === 0 ? (
              <p className="text-gray-500 text-sm px-2 mb-2">
                No minerals added for this component.
              </p>
            ) : (
              <div className="space-y-1 mb-2">
                {componentEntries.map((entry) => (
                  <div
                    key={entry.name}
                    className="flex items-center gap-2 bg-gray-100 rounded p-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.name}
                      </p>
                      <p className="text-xs text-gray-500">{entry.yield} mB</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`qty-${entry.name}`}>
                        Quantity for {entry.name}
                      </label>
                      <input
                        type="number"
                        id={`qty-${entry.name}`}
                        value={
                          editingQty[entry.name] !== undefined
                            ? editingQty[entry.name]
                            : entry.quantity <= 0
                              ? ""
                              : entry.quantity
                        }
                        placeholder="0"
                        onChange={(e) => {
                          setEditingQty((prev) => ({
                            ...prev,
                            [entry.name]: e.target.value,
                          }));
                          const val =
                            e.target.value === ""
                              ? 0
                              : parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            onUpdateQuantity(entry.name, val);
                          }
                        }}
                        onBlur={(e) => {
                          const raw = editingQty[entry.name] ?? e.target.value;
                          const val = raw === "" ? 0 : parseInt(raw, 10);

                          if (isNaN(val) || val <= 0) {
                            onDelete(entry.name);
                          } else {
                            onUpdateQuantity(entry.name, val);
                          }

                          setEditingQty((prev) => {
                            const next = { ...prev };
                            delete next[entry.name];
                            return next;
                          });
                        }}
                        min="0"
                        className="w-20 p-1 border border-gray-300 rounded no-spinners bg-white text-sm text-center"
                      />
                      <button
                        onClick={() => onDelete(entry.name)}
                        className="text-red-500 hover:text-red-700 text-lg leading-none p-1"
                        aria-label={`Remove ${entry.name}`}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {showModal && (
        <AddMineralModal
          availableMinerals={flatAvailableMinerals}
          inventoryMinerals={inventory}
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

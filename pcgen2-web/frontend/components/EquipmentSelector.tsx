'use client';

import { useState, useEffect } from 'react';
import { Equipment as EquipmentType } from '../types/gameRules';
import { EquipmentSelection } from '../types/character';

interface Props {
  equipment: EquipmentType[];
  selectedEquipment: EquipmentSelection[];
  strScore: number;
  onEquipmentChange: (equipment: EquipmentSelection[]) => void;
}

export default function EquipmentSelector({
  equipment,
  selectedEquipment,
  strScore,
  onEquipmentChange,
}: Props) {
  const [selectedItems, setSelectedItems] = useState<EquipmentSelection[]>(selectedEquipment);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Calculate encumbrance limits based on STR score
  const lightLoad = strScore * 10;
  const mediumLoad = strScore * 20;
  const heavyLoad = strScore * 30;

  // Calculate total weight
  const totalWeight = selectedItems.reduce((sum, item) => sum + item.weight * item.quantity, 0);

  // Determine encumbrance level
  const getEncumbranceLevel = (): 'light' | 'medium' | 'heavy' | 'overencumbered' => {
    if (totalWeight <= lightLoad) return 'light';
    if (totalWeight <= mediumLoad) return 'medium';
    if (totalWeight <= heavyLoad) return 'heavy';
    return 'overencumbered';
  };

  const encumbranceLevel = getEncumbranceLevel();
  const encumbranceColors: Record<string, string> = {
    light: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    heavy: 'bg-orange-100 text-orange-800 border-orange-300',
    overencumbered: 'bg-red-100 text-red-800 border-red-300',
  };

  // Group equipment by type
  const groupedEquipment = equipment.reduce(
    (acc, item) => {
      const type = item.data.type || 'Misc';
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    },
    {} as Record<string, EquipmentType[]>
  );

  // Handle adding item
  const addItem = (item: EquipmentType) => {
    const existing = selectedItems.find((s) => s.equipmentId === item.id);

    if (existing) {
      setSelectedItems(
        selectedItems.map((s) =>
          s.equipmentId === item.id
            ? { ...s, quantity: s.quantity + 1 }
            : s
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          equipmentId: item.id,
          name: item.name,
          type: item.data.type,
          quantity: 1,
          weight: item.data.weight,
          equipped: true,
        },
      ]);
    }
  };

  // Handle removing item
  const removeItem = (equipmentId: string) => {
    setSelectedItems(
      selectedItems
        .map((item) =>
          item.equipmentId === equipmentId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Update parent when items change
  useEffect(() => {
    onEquipmentChange(selectedItems);
  }, [selectedItems, onEquipmentChange]);

  return (
    <div className="space-y-6">
      {/* Encumbrance Info */}
      <div className={`p-4 rounded border ${encumbranceColors[encumbranceLevel]}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-bold mb-2">Carrying Capacity</p>
            <div className="text-xs space-y-1">
              <p>Light Load: ≤ {lightLoad} lbs</p>
              <p>Medium Load: {lightLoad + 1} - {mediumLoad} lbs</p>
              <p>Heavy Load: {mediumLoad + 1} - {heavyLoad} lbs</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold mb-2">Current Status</p>
            <div className="text-xs space-y-1">
              <p>
                Total Weight: <span className="font-bold">{totalWeight} lbs</span>
              </p>
              <p>
                Encumbrance:{' '}
                <span className="font-bold uppercase">
                  {encumbranceLevel === 'overencumbered'
                    ? 'OVERENCUMBERED'
                    : encumbranceLevel}
                </span>
              </p>
              {encumbranceLevel === 'overencumbered' && (
                <p className="text-red-600 font-bold mt-2">⚠ Too heavy to carry!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Categories */}
      <div className="space-y-4">
        {Object.entries(groupedEquipment).map(([category, categoryItems]) => (
          <div key={category}>
            <h3 className="font-bold text-lg mb-3 uppercase text-gray-700">{category}</h3>

            <div className="space-y-2">
              {categoryItems.map((item) => {
                const selectedCount = selectedItems.find(
                  (s) => s.equipmentId === item.id
                )?.quantity || 0;

                return (
                  <div
                    key={item.id}
                    className={`border rounded overflow-hidden ${
                      selectedCount > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center p-3">
                      <div className="flex-1">
                        <button
                          onClick={() =>
                            setExpandedItemId(expandedItemId === item.id ? null : item.id)
                          }
                          className="font-bold text-left hover:text-blue-600 flex items-center gap-2"
                        >
                          {item.name}
                          <span className="text-xs text-gray-500">({item.data.cost})</span>
                          <span className="text-xs text-gray-600 ml-2">{item.data.weight} lbs</span>
                          <span className="ml-auto text-gray-400">
                            {expandedItemId === item.id ? '▼' : '▶'}
                          </span>
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={selectedCount === 0}
                          className="px-2 py-1 bg-red-500 text-white rounded disabled:opacity-50"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-bold">{selectedCount}</span>
                        <button
                          onClick={() => addItem(item)}
                          className="px-2 py-1 bg-green-500 text-white rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedItemId === item.id && (
                      <div className="border-t p-3 bg-gray-50 text-sm space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-gray-600">Cost</p>
                            <p className="font-bold">{item.data.cost}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Weight</p>
                            <p className="font-bold">{item.data.weight} lbs</p>
                          </div>
                        </div>

                        {item.data.armor && (
                          <div className="border-t pt-2 mt-2">
                            <p className="font-bold text-gray-700 mb-1">Armor Stats</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-600">Armor Bonus: </span>
                                <span className="font-bold">+{item.data.armor.armorBonus}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Max DEX: </span>
                                <span className="font-bold">{item.data.armor.maxDexBonus >= 0 ? '+' : ''}{item.data.armor.maxDexBonus}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Check Penalty: </span>
                                <span className="font-bold">{item.data.armor.armorCheckPenalty}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {item.data.weapon && (
                          <div className="border-t pt-2 mt-2">
                            <p className="font-bold text-gray-700 mb-1">Weapon Stats</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-600">Damage (S): </span>
                                <span className="font-bold">{item.data.weapon.damageSmall}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Damage (M): </span>
                                <span className="font-bold">{item.data.weapon.damageMedium}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Critical: </span>
                                <span className="font-bold">{item.data.weapon.criticalRange}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Type: </span>
                                <span className="font-bold">{item.data.weapon.type.join(', ')}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <h3 className="font-bold mb-3">Selected Equipment</h3>
          <div className="space-y-1 text-sm">
            {selectedItems.map((item) => (
              <div key={item.equipmentId} className="flex justify-between">
                <span>{item.name} x{item.quantity}</span>
                <span className="text-gray-600">{item.weight * item.quantity} lbs</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 font-bold flex justify-between">
              <span>Total Weight:</span>
              <span>{totalWeight} lbs</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

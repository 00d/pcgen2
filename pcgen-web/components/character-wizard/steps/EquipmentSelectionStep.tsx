'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateCreationData } from '@/store/slices/characterSlice';
import { loadWeapons, loadArmor, loadClasses } from '@/lib/data-loaders';
import type { PF1EWeapon, PF1EArmor, PF1EClass, PF1ECharacterEquipment } from '@/types/pathfinder1e';
import { Shield, Sword, Search, Plus, Minus, ShoppingBag } from 'lucide-react';

const STARTING_GOLD = 150; // Average starting gold for level 1 character

export function EquipmentSelectionStep() {
  const dispatch = useAppDispatch();
  const creationData = useAppSelector((state) => state.character.creation.data);
  const selectedClassData = (creationData as any).classes?.[0];

  const [weapons, setWeapons] = useState<PF1EWeapon[]>([]);
  const [armor, setArmor] = useState<PF1EArmor[]>([]);
  const [selectedClass, setSelectedClass] = useState<PF1EClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, PF1ECharacterEquipment>>({});
  const [goldRemaining, setGoldRemaining] = useState(STARTING_GOLD);
  const [activeTab, setActiveTab] = useState<'weapons' | 'armor'>('weapons');
  const [searchQuery, setSearchQuery] = useState('');
  const [weaponFilter, setWeaponFilter] = useState<'all' | 'simple' | 'martial' | 'exotic'>('all');
  const [armorFilter, setArmorFilter] = useState<'all' | 'light' | 'medium' | 'heavy' | 'shield'>('all');

  useEffect(() => {
    Promise.all([loadWeapons(), loadArmor(), loadClasses()])
      .then(([weaponsData, armorData, classesData]) => {
        setWeapons(weaponsData);
        setArmor(armorData);
        if (selectedClassData?.classId) {
          const cls = classesData.find((c) => c.id === selectedClassData.classId);
          if (cls) {
            setSelectedClass(cls);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedClassData?.classId]);

  useEffect(() => {
    // Initialize equipment from Redux if available
    const existingEquipment = (creationData as any).equipment as PF1ECharacterEquipment[] | undefined;
    const existingCurrency = (creationData as any).currency;

    if (existingEquipment) {
      const equipmentMap: Record<string, PF1ECharacterEquipment> = {};
      existingEquipment.forEach((item) => {
        equipmentMap[item.itemId] = item;
      });
      setSelectedEquipment(equipmentMap);
    }

    if (existingCurrency?.gp !== undefined) {
      setGoldRemaining(existingCurrency.gp);
    }
  }, []);

  useEffect(() => {
    // Calculate gold spent and update Redux
    const totalSpent = calculateTotalCost();
    const newGoldRemaining = STARTING_GOLD - totalSpent;
    setGoldRemaining(newGoldRemaining);

    // Update Redux store
    const equipmentArray = Object.values(selectedEquipment).filter((item) => item.quantity > 0);
    dispatch(
      updateCreationData({
        equipment: equipmentArray,
        currency: {
          cp: 0,
          sp: 0,
          gp: Math.max(0, newGoldRemaining),
          pp: 0,
        },
      })
    );
  }, [selectedEquipment, dispatch]);

  const calculateTotalCost = (): number => {
    return Object.entries(selectedEquipment).reduce((total, [itemId, item]) => {
      const weapon = weapons.find((w) => w.id === itemId);
      if (weapon) return total + weapon.cost * item.quantity;

      const armorItem = armor.find((a) => a.id === itemId);
      if (armorItem) return total + armorItem.cost * item.quantity;

      return total;
    }, 0);
  };

  const getItemCost = (itemId: string): number => {
    const weapon = weapons.find((w) => w.id === itemId);
    if (weapon) return weapon.cost;

    const armorItem = armor.find((a) => a.id === itemId);
    if (armorItem) return armorItem.cost;

    return 0;
  };

  const canAfford = (itemId: string, additionalQuantity: number = 1): boolean => {
    const cost = getItemCost(itemId) * additionalQuantity;
    return goldRemaining >= cost;
  };

  const isProficient = (item: PF1EWeapon | PF1EArmor): boolean => {
    if (!selectedClass) return false;

    if ('weaponType' in item) {
      // Weapon proficiency check
      return selectedClass.proficiencies.weapons.some((prof) => {
        if (prof === 'Simple') return item.weaponType === 'simple';
        if (prof === 'Martial') return item.weaponType === 'simple' || item.weaponType === 'martial';
        return prof.toLowerCase() === item.id.toLowerCase();
      });
    } else {
      // Armor proficiency check
      return selectedClass.proficiencies.armor.some((prof) => {
        if (prof === 'Light') return item.armorType === 'light';
        if (prof === 'Medium') return item.armorType === 'light' || item.armorType === 'medium';
        if (prof === 'Heavy') return ['light', 'medium', 'heavy'].includes(item.armorType);
        return prof.toLowerCase() === item.id.toLowerCase();
      });
    }
  };

  const handleAddItem = (itemId: string) => {
    if (!canAfford(itemId)) return;

    setSelectedEquipment((prev) => {
      const existing = prev[itemId];
      if (existing) {
        return {
          ...prev,
          [itemId]: {
            ...existing,
            quantity: existing.quantity + 1,
          },
        };
      } else {
        return {
          ...prev,
          [itemId]: {
            itemId,
            quantity: 1,
            equipped: false,
          },
        };
      }
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedEquipment((prev) => {
      const existing = prev[itemId];
      if (!existing || existing.quantity <= 0) return prev;

      if (existing.quantity === 1) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      } else {
        return {
          ...prev,
          [itemId]: {
            ...existing,
            quantity: existing.quantity - 1,
          },
        };
      }
    });
  };

  const getItemQuantity = (itemId: string): number => {
    return selectedEquipment[itemId]?.quantity || 0;
  };

  const filteredWeapons = useMemo(() => {
    let filtered = weapons;

    // Filter by type
    if (weaponFilter !== 'all') {
      filtered = filtered.filter((weapon) => weapon.weaponType === weaponFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (weapon) =>
          weapon.name.toLowerCase().includes(query) ||
          weapon.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [weapons, weaponFilter, searchQuery]);

  const filteredArmor = useMemo(() => {
    let filtered = armor;

    // Filter by type
    if (armorFilter !== 'all') {
      filtered = filtered.filter((armorItem) => armorItem.armorType === armorFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (armorItem) =>
          armorItem.name.toLowerCase().includes(query) ||
          armorItem.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [armor, armorFilter, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-text">Select Equipment</h2>
          <p className="text-muted">Purchase your starting equipment.</p>
        </div>
        <div className="text-center text-muted">Loading equipment...</div>
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="mb-4 text-2xl font-bold text-text">Select Equipment</h2>
          <p className="text-error">Please select a class first (Step 3).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold text-text">Select Equipment</h2>
        <p className="text-muted">
          Purchase your starting equipment. You have {STARTING_GOLD} gp to spend.
        </p>
      </div>

      {/* Gold Remaining */}
      <div className="rounded-lg border-2 border-primary bg-primary/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-text">Gold Remaining</span>
          <span
            className={`text-2xl font-bold ${
              goldRemaining < 0 ? 'text-red-500' : 'text-primary'
            }`}
          >
            {goldRemaining.toFixed(2)} gp
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('weapons')}
          className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'weapons'
              ? 'bg-primary text-white'
              : 'border border-surface bg-background text-text hover:border-primary'
          }`}
        >
          <Sword size={16} />
          Weapons ({weapons.length})
        </button>
        <button
          onClick={() => setActiveTab('armor')}
          className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'armor'
              ? 'bg-primary text-white'
              : 'border border-surface bg-background text-text hover:border-primary'
          }`}
        >
          <Shield size={16} />
          Armor ({armor.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-surface bg-background py-2 pl-10 pr-4 text-text placeholder-muted focus:border-primary focus:outline-none"
          />
        </div>

        {activeTab === 'weapons' ? (
          <div className="flex gap-2">
            <button
              onClick={() => setWeaponFilter('simple')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                weaponFilter === 'simple'
                  ? 'bg-primary text-white'
                  : 'border border-surface bg-background text-text hover:border-primary'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setWeaponFilter('martial')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                weaponFilter === 'martial'
                  ? 'bg-primary text-white'
                  : 'border border-surface bg-background text-text hover:border-primary'
              }`}
            >
              Martial
            </button>
            <button
              onClick={() => setWeaponFilter('exotic')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                weaponFilter === 'exotic'
                  ? 'bg-primary text-white'
                  : 'border border-surface bg-background text-text hover:border-primary'
              }`}
            >
              Exotic
            </button>
            <button
              onClick={() => setWeaponFilter('all')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                weaponFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'border border-surface bg-background text-text hover:border-primary'
              }`}
            >
              All
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setArmorFilter('light')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                armorFilter === 'light'
                  ? 'bg-primary text-white'
                  : 'border border-surface bg-background text-text hover:border-primary'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setArmorFilter('medium')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                armorFilter === 'medium'
                  ? 'bg-primary text-white'
                  : 'border border-surface bg-background text-text hover:border-primary'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setArmorFilter('heavy')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                armorFilter === 'heavy'
                  ? 'bg-primary text-white'
                  : 'border border-surface bg-background text-text hover:border-primary'
              }`}
            >
              Heavy
            </button>
            <button
              onClick={() => setArmorFilter('shield')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                armorFilter === 'shield'
                  ? 'bg-primary text-white'
                  : 'border border-surface bg-background text-text hover:border-primary'
              }`}
            >
              Shields
            </button>
            <button
              onClick={() => setArmorFilter('all')}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                armorFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'border border-surface bg-background text-text hover:border-primary'
              }`}
            >
              All
            </button>
          </div>
        )}
      </div>

      {/* Equipment List */}
      <div className="space-y-2">
        {activeTab === 'weapons' &&
          filteredWeapons.map((weapon) => {
            const quantity = getItemQuantity(weapon.id);
            const proficient = isProficient(weapon);

            return (
              <div
                key={weapon.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  quantity > 0
                    ? 'border-primary bg-primary/5'
                    : !proficient
                      ? 'border-surface bg-surface/30'
                      : 'border-surface bg-background'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-text">{weapon.name}</div>
                    <span className="rounded bg-surface px-2 py-0.5 text-xs font-medium text-muted capitalize">
                      {weapon.weaponType}
                    </span>
                    {!proficient && (
                      <span className="rounded bg-error/20 px-2 py-0.5 text-xs font-medium text-error">
                        Not Proficient
                      </span>
                    )}
                    {quantity > 0 && (
                      <span className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-white">
                        Qty: {quantity}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    Damage: {weapon.damageMedium} • Critical: {weapon.critical} • Type:{' '}
                    {weapon.damageType.join(', ')}
                    {weapon.range && ` • Range: ${weapon.range} ft`}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-text">{weapon.cost} gp</div>
                    <div className="text-xs text-muted">{weapon.weight} lb</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRemoveItem(weapon.id)}
                      disabled={quantity === 0}
                      className="rounded border border-surface bg-background p-1.5 text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      onClick={() => handleAddItem(weapon.id)}
                      disabled={!canAfford(weapon.id)}
                      className="rounded border border-surface bg-background p-1.5 text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        {activeTab === 'armor' &&
          filteredArmor.map((armorItem) => {
            const quantity = getItemQuantity(armorItem.id);
            const proficient = isProficient(armorItem);

            return (
              <div
                key={armorItem.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  quantity > 0
                    ? 'border-primary bg-primary/5'
                    : !proficient
                      ? 'border-surface bg-surface/30'
                      : 'border-surface bg-background'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-text">{armorItem.name}</div>
                    <span className="rounded bg-surface px-2 py-0.5 text-xs font-medium text-muted capitalize">
                      {armorItem.armorType}
                    </span>
                    {!proficient && (
                      <span className="rounded bg-error/20 px-2 py-0.5 text-xs font-medium text-error">
                        Not Proficient
                      </span>
                    )}
                    {quantity > 0 && (
                      <span className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-white">
                        Qty: {quantity}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    AC: +{armorItem.armorBonus} • Max Dex:{' '}
                    {armorItem.maxDexBonus === null ? '—' : `+${armorItem.maxDexBonus}`} • ACP:{' '}
                    {armorItem.armorCheckPenalty} • ASF: {armorItem.arcaneSpellFailure}%
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-text">{armorItem.cost} gp</div>
                    <div className="text-xs text-muted">{armorItem.weight} lb</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRemoveItem(armorItem.id)}
                      disabled={quantity === 0}
                      className="rounded border border-surface bg-background p-1.5 text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      onClick={() => handleAddItem(armorItem.id)}
                      disabled={!canAfford(armorItem.id)}
                      className="rounded border border-surface bg-background p-1.5 text-text transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {((activeTab === 'weapons' && filteredWeapons.length === 0) ||
        (activeTab === 'armor' && filteredArmor.length === 0)) && (
        <div className="text-center text-muted">No items found matching your search criteria.</div>
      )}

      {/* Shopping Cart Summary */}
      {Object.keys(selectedEquipment).length > 0 && (
        <div className="rounded border border-surface bg-surface/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-lg font-medium text-text">
            <ShoppingBag size={20} />
            <span>Shopping Cart</span>
          </div>
          <div className="space-y-1 text-sm">
            {Object.entries(selectedEquipment)
              .filter(([_, item]) => item.quantity > 0)
              .map(([itemId, item]) => {
                const weapon = weapons.find((w) => w.id === itemId);
                const armorItem = armor.find((a) => a.id === itemId);
                const itemName = weapon?.name || armorItem?.name || itemId;
                const itemCost = getItemCost(itemId);

                return (
                  <div key={itemId} className="flex justify-between text-muted">
                    <span>
                      {itemName} × {item.quantity}
                    </span>
                    <span>{(itemCost * item.quantity).toFixed(2)} gp</span>
                  </div>
                );
              })}
            <div className="border-t border-surface pt-2 font-medium text-text">
              <div className="flex justify-between">
                <span>Total Spent:</span>
                <span>{calculateTotalCost().toFixed(2)} gp</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span className={goldRemaining < 0 ? 'text-red-500' : 'text-primary'}>
                  {goldRemaining.toFixed(2)} gp
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

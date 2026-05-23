import React from "react";
import { Topping, ShopUpgrade, MASTER_TOPPINGS } from "../types";
import { 
  Lock, 
  Unlock, 
  Coins, 
  ArrowUp, 
  UtensilsCrossed, 
  Smile, 
  Compass, 
  Layout, 
  AlertCircle 
} from "lucide-react";

interface ShopUpgradesProps {
  gold: number;
  unlockedToppingIds: string[];
  upgrades: ShopUpgrade[];
  onUnlockTopping: (toppingId: string, cost: number) => void;
  onUpgradeShop: (upgradeId: string, cost: number) => void;
}

export default function ShopUpgrades({
  gold,
  unlockedToppingIds,
  upgrades,
  onUnlockTopping,
  onUpgradeShop
}: ShopUpgradesProps) {

  // Retrieve toppings that require unlocking
  const lockableToppings = MASTER_TOPPINGS.filter(t => t.cost > 0);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col gap-8">
      
      {/* 2 GRID BLOCKS: SHOP UPGRADES & INGREDIENTS SHOP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* BLOCK 1: SHOP UPGRADES & INFRASTRUCTURE */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-lg flex flex-col gap-4">
          <h3 className="text-stone-100 font-sans font-black text-sm tracking-wider uppercase flex items-center gap-1.5 pb-2 border-b border-stone-850">
            <Layout className="w-4 h-4 text-yellow-500" /> 店舗設備 & スタッフの強化 (Upgrades)
          </h3>

          <div className="flex flex-col gap-4">
            {upgrades.map((upgrade) => {
              const capMaxed = upgrade.level >= upgrade.maxLevel;
              const nextUpgradeCost = upgrade.cost * (upgrade.level + 1);
              const isAffordable = gold >= nextUpgradeCost && !capMaxed;

              return (
                <div 
                  key={upgrade.id}
                  className="bg-stone-950 border border-stone-880 p-4 rounded-2xl flex flex-col justify-between"
                  style={{ contentVisibility: "auto" }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-stone-200 text-xs font-sans tracking-wide">
                        {upgrade.jpName}
                      </h4>
                      <p className="text-stone-400 font-sans text-[10px] mt-1 leading-snug">
                        {upgrade.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                      Lv.{upgrade.level} / {upgrade.maxLevel}
                    </span>
                  </div>

                  {/* Level progress ticks */}
                  <div className="flex gap-1.5 mt-3">
                    {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 flex-1 rounded-full ${
                          i < upgrade.level ? "bg-yellow-500" : "bg-stone-800"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Action trigger */}
                  <div className="mt-4 flex justify-between items-center bg-stone-900/60 p-2 rounded-xl border border-stone-900">
                    <span className="text-[10px] font-sans text-stone-400">
                      {capMaxed ? "最大限界レベルに到達" : `強化費用: ${nextUpgradeCost} G`}
                    </span>
                    
                    {!capMaxed ? (
                      <button
                        onClick={() => onUpgradeShop(upgrade.id, nextUpgradeCost)}
                        disabled={!isAffordable}
                        className={`px-3 py-1.5 rounded-lg font-bold font-sans text-[10px] flex gap-1 items-center cursor-pointer transition ${
                          isAffordable
                            ? "bg-yellow-500 text-stone-950 hover:bg-yellow-400 font-black shadow-sm"
                            : "bg-stone-800 text-stone-500 cursor-not-allowed"
                        }`}
                      >
                        <ArrowUp className="w-3 h-3" />
                        <span>レベルアップ</span>
                      </button>
                    ) : (
                      <span className="text-[9px] font-sans font-bold text-green-400">MAXED OUT</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BLOCK 2: PREMIUM HIGH-END TOPPINGS SHOP */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-lg flex flex-col gap-4">
          <h3 className="text-stone-100 font-sans font-black text-sm tracking-wider uppercase flex items-center gap-1.5 pb-2 border-b border-stone-850">
            <UtensilsCrossed className="w-4 h-4 text-green-500" /> 特製高級トッピング素材 (Ingredients)
          </h3>

          <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[460px] pr-1">
            {lockableToppings.map((topping) => {
              const isUnlocked = unlockedToppingIds.includes(topping.id);
              const isAffordable = gold >= topping.cost;

              return (
                <div 
                  key={topping.id}
                  className={`bg-stone-950 border p-3 rounded-2xl flex items-center justify-between transition-all ${
                    isUnlocked 
                      ? "border-emerald-900/40 bg-gradient-to-r from-stone-950 to-emerald-990/5" 
                      : "border-stone-880"
                  }`}
                  style={{ contentVisibility: "auto" }}
                >
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="w-12 h-12 bg-stone-910 border border-stone-850 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                      {topping.iconName}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-stone-200 text-xs font-sans tracking-wide truncate">
                          {topping.jpName}
                        </h4>
                        {isUnlocked && (
                          <span className="text-[8px] px-1.5 bg-emerald-950 text-emerald-400 border border-emerald-900/50 rounded font-bold font-sans">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="text-stone-400 font-sans text-[10px] mt-0.5 leading-tight truncate">
                        {topping.description}
                      </p>
                    </div>
                  </div>

                  {/* Purchase/State action trigger */}
                  <div className="flex-shrink-0 pl-2">
                    {!isUnlocked ? (
                      <button
                        onClick={() => onUnlockTopping(topping.id, topping.cost)}
                        disabled={!isAffordable}
                        className={`px-3 py-1.5 rounded-lg font-bold font-sans text-[10px] flex gap-1 items-center cursor-pointer transition ${
                          isAffordable
                            ? "bg-[#34d399] text-stone-950 hover:bg-[#4ade80] font-black shadow-sm"
                            : "bg-stone-800 text-stone-500 cursor-not-allowed"
                        }`}
                      >
                        <Coins className="w-3 h-3" />
                        <span>解禁 {topping.cost} G</span>
                      </button>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center">
                        <Unlock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

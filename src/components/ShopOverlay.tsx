"use client";

import { ShopItem } from "@/engine/types";

const RARITY_COLORS = {
  common: "border-gray-500",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-yellow-500",
};

interface Props {
  items: ShopItem[];
  coins: number;
  onPurchase: (item: ShopItem) => void;
  onClose: () => void;
}

export default function ShopOverlay({ items, coins, onPurchase, onClose }: Props) {
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="card-space p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl text-purple-300 font-bold">星际商店</h2>
          <span className="text-yellow-400 font-bold">💰 {coins}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 max-h-80 overflow-y-auto">
          {items.map((item) => {
            const canBuy = coins >= item.cost;
            return (
              <button
                key={item.id}
                onClick={() => canBuy && onPurchase(item)}
                disabled={!canBuy}
                className={`p-3 rounded-lg border ${RARITY_COLORS[item.rarity]} text-left transition-all ${
                  canBuy ? "bg-purple-900/30 hover:bg-purple-800/40 cursor-pointer" : "bg-gray-900/30 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="text-lg mb-1">{item.icon}</div>
                <div className="text-sm font-bold text-white">{item.name}</div>
                <div className="text-xs text-gray-400 mb-1">{item.description}</div>
                <div className="text-xs text-yellow-400">💰 {item.cost}</div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="btn-primary w-full"
        >
          继续远征
        </button>
      </div>
    </div>
  );
}

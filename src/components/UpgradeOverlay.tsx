"use client";

import { UpgradeOption } from "@/engine/types";

const RARITY_COLORS = {
  common: "border-gray-500 bg-gray-900/80",
  rare: "border-blue-500 bg-blue-950/80",
  epic: "border-purple-500 bg-purple-950/80",
  legendary: "border-yellow-500 bg-yellow-950/80",
};

const RARITY_LABELS = {
  common: "普通",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说",
};

interface Props {
  options: UpgradeOption[];
  onSelect: (option: UpgradeOption) => void;
}

export default function UpgradeOverlay({ options, onSelect }: Props) {
  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="text-center">
        <h2 className="text-xl text-purple-300 font-bold mb-4">选择增益</h2>
        <div className="flex gap-3 flex-wrap justify-center max-w-lg">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className={`w-36 p-4 rounded-xl border-2 ${RARITY_COLORS[opt.rarity]} hover:scale-105 transition-transform text-left cursor-pointer`}
            >
              <div className="text-2xl mb-2">{opt.icon}</div>
              <div className="text-sm font-bold text-white mb-1">{opt.name}</div>
              <div className="text-xs text-gray-300 mb-2">{opt.description}</div>
              <div className={`text-xs px-2 py-0.5 rounded inline-block ${
                opt.rarity === "legendary" ? "bg-yellow-600 text-yellow-100" :
                opt.rarity === "epic" ? "bg-purple-600 text-purple-100" :
                opt.rarity === "rare" ? "bg-blue-600 text-blue-100" :
                "bg-gray-600 text-gray-100"
              }`}>
                {RARITY_LABELS[opt.rarity]}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

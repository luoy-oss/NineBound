"use client";

import type { BuffOption } from "@/types/game";

interface BuffSelectorProps {
  onSelect: (buff: BuffOption) => void;
}

const BUFF_OPTIONS: BuffOption[] = [
  { id: "atk1", name: "力量强化", description: "攻击力 +15", type: "attack", value: 15 },
  { id: "def1", name: "护甲强化", description: "防御力 +10", type: "defense", value: 10 },
  { id: "hp1", name: "生命强化", description: "最大生命 +100", type: "hp", value: 100 },
  { id: "spd1", name: "速度强化", description: "攻击速度 +0.2", type: "speed", value: 0.2 },
];

export function BuffSelector({ onSelect }: BuffSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-space-800 border border-purple-accent/30 rounded-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-purple-accent text-center mb-2">
          增益选择
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          选择一项增益Buff
        </p>

        <div className="space-y-3">
          {BUFF_OPTIONS.map((buff) => (
            <button
              key={buff.id}
              onClick={() => onSelect(buff)}
              className="w-full p-4 bg-space-900 border border-space-600 rounded-lg text-left hover:border-purple-accent/50 hover:bg-space-700 transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{buff.name}</span>
                <span className="text-purple-accent text-sm">{buff.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

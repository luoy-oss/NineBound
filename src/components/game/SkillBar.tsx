"use client";

import type { SkillState } from "@/engine/BattleManager";

interface SkillBarProps {
  skills: SkillState[];
  onActivate: (slot: number) => void;
  disabled: boolean;
}

export function SkillBar({ skills, onActivate, disabled }: SkillBarProps) {
  return (
    <div className="flex gap-3 justify-center">
      {skills.map((skill, i) => (
        <button
          key={skill.id}
          onClick={() => onActivate(i)}
          disabled={disabled || skill.cooldown > 0}
          className={`relative w-20 h-20 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
            skill.cooldown > 0
              ? "border-space-600 bg-space-900 opacity-50"
              : "border-purple-accent/50 bg-space-800 hover:bg-purple-accent/20 hover:border-purple-accent cursor-pointer"
          }`}
        >
          <span className="text-2xl mb-1">
            {i === 0 ? "⚔" : i === 1 ? "🗡" : "💥"}
          </span>
          <span className="text-xs text-gray-300">{skill.name}</span>
          {skill.cooldown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <span className="text-sm font-bold text-white">
                {Math.ceil(skill.cooldown)}s
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

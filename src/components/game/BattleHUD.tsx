"use client";

interface BattleHUDProps {
  floor: number;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyName: string;
  isElite: boolean;
  isBoss: boolean;
}

export function BattleHUD({
  floor,
  playerHp,
  playerMaxHp,
  enemyHp,
  enemyMaxHp,
  enemyName,
  isElite,
  isBoss,
}: BattleHUDProps) {
  return (
    <div className="w-full max-w-[800px] space-y-3">
      {/* 楼层信息 */}
      <div className="flex justify-between items-center">
        <span className="text-purple-accent font-bold text-lg">第 {floor} 层</span>
        {isBoss && (
          <span className="px-2 py-0.5 bg-hp-red/20 text-hp-red text-xs rounded-full">
            BOSS
          </span>
        )}
        {isElite && !isBoss && (
          <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
            精英
          </span>
        )}
      </div>

      {/* 玩家血条 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-purple-accent">幸存者</span>
          <span className="text-gray-400">
            {Math.ceil(playerHp)} / {playerMaxHp}
          </span>
        </div>
        <div className="h-3 bg-space-900 rounded-full overflow-hidden border border-space-600">
          <div
            className="h-full bg-hp-green transition-all duration-200 rounded-full"
            style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }}
          />
        </div>
      </div>

      {/* 敌人血条 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className={isBoss ? "text-hp-red" : isElite ? "text-orange-400" : "text-gray-300"}>
            {enemyName}
          </span>
          <span className="text-gray-400">
            {Math.ceil(enemyHp)} / {enemyMaxHp}
          </span>
        </div>
        <div className="h-3 bg-space-900 rounded-full overflow-hidden border border-space-600">
          <div
            className={`h-full transition-all duration-200 rounded-full ${
              isBoss ? "bg-hp-red" : isElite ? "bg-orange-500" : "bg-hp-red/80"
            }`}
            style={{ width: `${Math.max(0, (enemyHp / enemyMaxHp) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

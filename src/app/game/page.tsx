"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BATTLE_CONFIG, SKILLS, BUFFS, ENEMY_NAMES } from "@/lib/game-config";
import LuojiuAssistant from "@/components/LuojiuAssistant";

interface PlayerState {
  uid: string;
  nickname: string;
  floor: number;
  power: number;
  coins: number;
  gems: number;
  equipment: any[];
  unlockedSkills: string[];
}

interface BattleEntity {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
}

interface SkillState {
  id: string;
  name: string;
  cooldown: number;
  currentCd: number;
  damageMult?: number;
  healPercent?: number;
}

export default function GamePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [enemy, setEnemy] = useState<BattleEntity | null>(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [playerMaxHp, setPlayerMaxHp] = useState(0);
  const [inBattle, setInBattle] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [skills, setSkills] = useState<SkillState[]>([]);
  const [showBuffSelect, setShowBuffSelect] = useState(false);
  const [buffOptions, setBuffOptions] = useState<typeof BUFFS>([]);
  const [luojiuTrigger, setLuojiuTrigger] = useState<string | null>(null);
  const [luojiuFloor, setLuojiuFloor] = useState(0);
  const [victory, setVictory] = useState(false);
  const [defeat, setDefeat] = useState(false);
  const [rewardInfo, setRewardInfo] = useState<any>(null);

  const battleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tickRef = useRef(0);
  const playerBuffsRef = useRef({ atk: 0, maxHp: 0, critRate: 0.05, damageReduce: 0 });

  // 加载玩家数据
  useEffect(() => {
    const token = localStorage.getItem("nb_token");
    if (!token) {
      router.push("/");
      return;
    }

    fetch("/api/player/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push("/");
          return;
        }
        setPlayer(data);
        initSkills(data.unlockedSkills);
        // 首次登录触发洛玖
        if (data.floor === 1) {
          setLuojiuTrigger("first_login");
        }
      })
      .catch(() => router.push("/"));
  }, []);

  // 初始化技能
  const initSkills = (unlocked: string[]) => {
    const s = SKILLS.filter((sk) => unlocked.includes(sk.id) || sk.unlockFloor <= 1).map((sk) => ({
      id: sk.id,
      name: sk.name,
      cooldown: sk.cooldown,
      currentCd: 0,
      damageMult: sk.damageMult,
      healPercent: sk.healPercent,
    }));
    setSkills(s);
  };

  // 生成敌人
  const generateEnemy = useCallback(
    (floor: number): BattleEntity => {
      const isBoss = floor % 50 === 0;
      const isElite = floor % 10 === 0 && !isBoss;

      const hpScale = Math.pow(BATTLE_CONFIG.enemyHpScale, floor - 1);
      const atkScale = Math.pow(BATTLE_CONFIG.enemyAtkScale, floor - 1);

      let hp = Math.floor(BATTLE_CONFIG.baseEnemyHp * hpScale);
      let atk = Math.floor(BATTLE_CONFIG.baseEnemyAtk * atkScale);
      let namePool = ENEMY_NAMES.normal;

      if (isBoss) {
        hp *= BATTLE_CONFIG.bossHpMult;
        atk *= BATTLE_CONFIG.bossAtkMult;
        namePool = ENEMY_NAMES.boss;
      } else if (isElite) {
        hp *= BATTLE_CONFIG.eliteHpMult;
        atk *= BATTLE_CONFIG.eliteAtkMult;
        namePool = ENEMY_NAMES.elite;
      }

      const name = namePool[Math.floor(Math.random() * namePool.length)];
      return { name, hp, maxHp: hp, atk };
    },
    []
  );

  // 开始战斗
  const startBattle = () => {
    if (!player) return;
    setVictory(false);
    setDefeat(false);
    setRewardInfo(null);
    setBattleLog([]);

    const baseAtk = BATTLE_CONFIG.basePlayerAtk + player.power * 0.5;
    const baseHp = BATTLE_CONFIG.basePlayerHp + player.power * 5;
    const totalAtk = baseAtk + playerBuffsRef.current.atk;
    const totalHp = baseHp + playerBuffsRef.current.maxHp;

    setPlayerHp(totalHp);
    setPlayerMaxHp(totalHp);

    const e = generateEnemy(player.floor);
    setEnemy(e);
    setInBattle(true);
    tickRef.current = 0;

    // 战斗循环
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    battleTimerRef.current = setInterval(() => {
      tickRef.current += 1;
      battleTick(totalAtk, totalHp, e);
    }, BATTLE_CONFIG.battleTickMs);
  };

  // 战斗tick
  const battleTick = (playerAtk: number, maxHp: number, enemyState: BattleEntity) => {
    setEnemy((prev) => {
      if (!prev || prev.hp <= 0) return prev;

      // 玩家攻击
      let newEnemyHp = prev.hp;
      if (tickRef.current % BATTLE_CONFIG.playerAttackInterval === 0) {
        const isCrit = Math.random() < playerBuffsRef.current.critRate;
        const dmg = isCrit ? Math.floor(playerAtk * 2) : Math.floor(playerAtk);
        newEnemyHp = Math.max(0, prev.hp - dmg);
        addLog(`你攻击${prev.name}造成${dmg}伤害${isCrit ? "(暴击!)" : ""}`);
      }

      // 敌人攻击
      if (tickRef.current % 3 === 0 && newEnemyHp > 0) {
        const rawDmg = prev.atk;
        const reduced = Math.floor(rawDmg * (1 - playerBuffsRef.current.damageReduce));
        setPlayerHp((hp) => {
          const newHp = Math.max(0, hp - reduced);
          if (newHp <= 0) {
            handleDefeat();
          }
          return newHp;
        });
        addLog(`${prev.name}攻击你造成${reduced}伤害`);
      }

      // 敌人死亡
      if (newEnemyHp <= 0 && prev.hp > 0) {
        handleVictory();
      }

      return { ...prev, hp: newEnemyHp };
    });

    // 冷却递减
    setSkills((prev) =>
      prev.map((s) => ({
        ...s,
        currentCd: Math.max(0, s.currentCd - 1),
      }))
    );
  };

  // 胜利处理
  const handleVictory = () => {
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    setInBattle(false);
    setVictory(true);

    const floor = player!.floor;
    const isBoss = floor % 50 === 0;
    const isElite = floor % 10 === 0 && !isBoss;
    const coins = BATTLE_CONFIG.baseEnemyHp * (isBoss ? 5 : isElite ? 3 : 1);

    setRewardInfo({ floor, coins, isElite, isBoss });

    // 保存到服务器
    const token = localStorage.getItem("nb_token");
    fetch("/api/floor/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ floor, coinsEarned: coins, itemsEarned: [] }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setPlayer((p) => (p ? { ...p, floor: data.newFloor, power: p.power + (isBoss ? 50 : isElite ? 20 : 5) } : p));
          // 检查是否解锁新技能
          const newSkill = SKILLS.find((sk) => sk.unlockFloor === data.newFloor);
          if (newSkill) {
            setSkills((prev) => [
              ...prev,
              {
                id: newSkill.id,
                name: newSkill.name,
                cooldown: newSkill.cooldown,
                currentCd: 0,
                damageMult: newSkill.damageMult,
                healPercent: newSkill.healPercent,
              },
            ]);
            addLog(`解锁新技能：${newSkill.name}！`);
          }

          // 每5层Buff选择
          if (data.newFloor % 5 === 0) {
            const options = [...BUFFS].sort(() => Math.random() - 0.5).slice(0, 3);
            setBuffOptions(options);
            setShowBuffSelect(true);
          }
        }
      })
      .catch(() => {});
  };

  // 失败处理
  const handleDefeat = () => {
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    setInBattle(false);
    setDefeat(true);
    setLuojiuTrigger("fail");
  };

  // 使用技能
  const useSkill = (index: number) => {
    if (!inBattle || !enemy) return;
    setSkills((prev) => {
      const updated = [...prev];
      const skill = updated[index];
      if (skill.currentCd > 0) return prev;

      if (skill.healPercent) {
        // 治疗技能
        const heal = Math.floor(playerMaxHp * skill.healPercent);
        setPlayerHp((hp) => Math.min(playerMaxHp, hp + heal));
        addLog(`使用${skill.name}，恢复${heal}生命`);
      } else {
        // 伤害技能
        const dmg = Math.floor(BATTLE_CONFIG.basePlayerAtk * (skill.damageMult || 1));
        setEnemy((e) => {
          if (!e) return e;
          const newHp = Math.max(0, e.hp - dmg);
          if (newHp <= 0) handleVictory();
          return { ...e, hp: newHp };
        });
        addLog(`使用${skill.name}，造成${dmg}伤害`);
      }

      updated[index] = { ...skill, currentCd: skill.cooldown };
      return updated;
    });
  };

  // 选择Buff
  const selectBuff = (buff: (typeof BUFFS)[0]) => {
    buff.apply(playerBuffsRef.current);
    setShowBuffSelect(false);
    addLog(`获得增益：${buff.name} - ${buff.desc}`);
  };

  const addLog = (msg: string) => {
    setBattleLog((prev) => [...prev.slice(-20), msg]);
  };

  // 绘制Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#0a0a1a");
    grad.addColorStop(1, "#12122a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 星星
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(i * 137.5) * 0.5 + 0.5) * w;
      const y = (Math.cos(i * 97.3) * 0.5 + 0.5) * h;
      const r = (Math.sin(Date.now() / 1000 + i) * 0.5 + 0.5) * 2;
      ctx.fillStyle = `rgba(139, 92, 246, ${0.3 + Math.sin(Date.now() / 1000 + i) * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 玩家（左侧像素机器人）
    const px = w * 0.25;
    const py = h * 0.5;
    drawPixelRobot(ctx, px, py, "#8b5cf6", "#c4b5fd", playerHp / playerMaxHp);

    // 敌人（右侧）
    if (enemy) {
      const ex = w * 0.75;
      const ey = h * 0.5;
      const isBoss = player && player.floor % 50 === 0;
      const color = isBoss ? "#ef4444" : player && player.floor % 10 === 0 ? "#f59e0b" : "#6366f1";
      drawPixelEnemy(ctx, ex, ey, color, enemy.hp / enemy.maxHp, isBoss ? 1.5 : 1);
    }

    // 层数显示
    ctx.fillStyle = "#8b5cf6";
    ctx.font = "bold 16px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(`第 ${player?.floor || "?"} 层`, w / 2, 30);
  }, [playerHp, enemy, player]);

  // 绘制像素机器人
  const drawPixelRobot = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    light: string,
    hpRatio: number
  ) => {
    const s = 4; // 像素大小
    // 身体
    ctx.fillStyle = color;
    ctx.fillRect(x - 4 * s, y - 3 * s, 8 * s, 6 * s);
    // 头
    ctx.fillRect(x - 3 * s, y - 6 * s, 6 * s, 3 * s);
    // 眼睛
    ctx.fillStyle = light;
    ctx.fillRect(x - 2 * s, y - 5 * s, 2 * s, 1.5 * s);
    ctx.fillRect(x + 0.5 * s, y - 5 * s, 2 * s, 1.5 * s);
    // 嘴
    ctx.fillRect(x - 1 * s, y - 3.5 * s, 2 * s, 0.5 * s);
    // 天线
    ctx.fillStyle = light;
    ctx.fillRect(x - 0.5 * s, y - 8 * s, 1 * s, 2 * s);
    ctx.fillRect(x - 1 * s, y - 9 * s, 2 * s, 1 * s);
    // 手臂
    ctx.fillStyle = color;
    ctx.fillRect(x - 6 * s, y - 2 * s, 2 * s, 4 * s);
    ctx.fillRect(x + 4 * s, y - 2 * s, 2 * s, 4 * s);
    // 腿
    ctx.fillRect(x - 3 * s, y + 3 * s, 2 * s, 3 * s);
    ctx.fillRect(x + 1 * s, y + 3 * s, 2 * s, 3 * s);
    // 血条
    drawHpBar(ctx, x, y + 8 * s, 8 * s, hpRatio, "#22c55e");
  };

  // 绘制像素敌人
  const drawPixelEnemy = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    hpRatio: number,
    scale: number
  ) => {
    const s = 4 * scale;
    ctx.fillStyle = color;
    // 身体（三角形感觉）
    ctx.fillRect(x - 4 * s, y - 2 * s, 8 * s, 5 * s);
    ctx.fillRect(x - 3 * s, y - 4 * s, 6 * s, 2 * s);
    // 眼睛
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(x - 2 * s, y - 3 * s, 1.5 * s, 1.5 * s);
    ctx.fillRect(x + 1 * s, y - 3 * s, 1.5 * s, 1.5 * s);
    // 角
    ctx.fillStyle = color;
    ctx.fillRect(x - 4 * s, y - 6 * s, 2 * s, 2 * s);
    ctx.fillRect(x + 2 * s, y - 6 * s, 2 * s, 2 * s);
    // 爪子
    ctx.fillRect(x - 6 * s, y - 1 * s, 2 * s, 3 * s);
    ctx.fillRect(x + 4 * s, y - 1 * s, 2 * s, 3 * s);
    // 血条
    drawHpBar(ctx, x, y + 5 * s, 8 * s, hpRatio, "#ef4444");
  };

  const drawHpBar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    ratio: number,
    color: string
  ) => {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - width / 2, y, width, 6);
    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2, y, width * Math.max(0, ratio), 6);
  };

  if (!player) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-purple-400 animate-pulse">正在连接...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 洛玖助手 */}
      <LuojiuAssistant trigger={luojiuTrigger} floor={luojiuFloor} />

      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between px-4 py-3 card-space border-0 border-b border-purple-500/20">
        <div className="flex items-center gap-4">
          <span className="text-purple-300 font-bold">{player.nickname}</span>
          <span className="text-xs text-purple-400">战力 {player.power}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-yellow-400">{player.coins} 金币</span>
          <span className="text-cyan-400">{player.gems} 宝石</span>
          <button
            onClick={() => router.push("/rewards")}
            className="text-xs text-purple-300 hover:text-purple-100 underline"
          >
            奖励池
          </button>
        </div>
      </div>

      {/* 战斗区域 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full max-w-2xl rounded-lg border border-purple-500/20"
          style={{ height: "300px" }}
        />

        {/* 血条 */}
        <div className="w-full max-w-2xl mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-300 w-16">你</span>
            <div className="flex-1 progress-bar">
              <div
                className="progress-bar-fill bg-green-500"
                style={{ width: `${playerMaxHp > 0 ? (playerHp / playerMaxHp) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-purple-300 w-20 text-right">
              {playerHp}/{playerMaxHp}
            </span>
          </div>
          {enemy && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-300 w-16 truncate">{enemy.name}</span>
              <div className="flex-1 progress-bar">
                <div
                  className="progress-bar-fill bg-red-500"
                  style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                />
              </div>
              <span className="text-xs text-red-300 w-20 text-right">
                {enemy.hp}/{enemy.maxHp}
              </span>
            </div>
          )}
        </div>

        {/* 技能栏 */}
        <div className="flex gap-3 mt-4">
          {skills.map((skill, i) => (
            <button
              key={skill.id}
              onClick={() => useSkill(i)}
              disabled={skill.currentCd > 0 || !inBattle}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                skill.currentCd > 0
                  ? "bg-purple-900/50 text-purple-500 cursor-not-allowed"
                  : "bg-purple-800/80 text-purple-200 hover:bg-purple-700 purple-glow cursor-pointer"
              }`}
            >
              <div>{skill.name}</div>
              {skill.currentCd > 0 && (
                <div className="text-xs text-purple-500">{skill.currentCd}s</div>
              )}
            </button>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 mt-4">
          {!inBattle && !showBuffSelect && (
            <button className="btn-primary" onClick={startBattle}>
              {defeat ? "重新挑战" : victory ? "继续前进" : `开始第${player.floor}层`}
            </button>
          )}
        </div>

        {/* 胜利/失败信息 */}
        {victory && rewardInfo && (
          <div className="card-space p-4 mt-4 text-center max-w-md w-full">
            <h3 className="text-green-400 font-bold mb-2">通关成功</h3>
            <p className="text-sm text-purple-300">获得 {rewardInfo.coins} 金币</p>
            {rewardInfo.isElite && <p className="text-sm text-yellow-400">精英层奖励已存入奖励池</p>}
            {rewardInfo.isBoss && <p className="text-sm text-red-400">Boss层奖励已存入奖励池</p>}
            <p className="text-xs text-purple-400 mt-2">奖励暂存于奖励池，前往领取页面生成Token</p>
          </div>
        )}

        {defeat && (
          <div className="card-space p-4 mt-4 text-center max-w-md w-full">
            <h3 className="text-red-400 font-bold mb-2">战斗失败</h3>
            <p className="text-sm text-purple-300">休整后再来挑战吧</p>
          </div>
        )}

        {/* Buff选择 */}
        {showBuffSelect && (
          <div className="card-space p-4 mt-4 max-w-md w-full">
            <h3 className="text-purple-300 font-bold mb-3 text-center">选择增益Buff</h3>
            <div className="space-y-2">
              {buffOptions.map((buff) => (
                <button
                  key={buff.id}
                  onClick={() => selectBuff(buff)}
                  className="w-full p-3 rounded-lg bg-purple-900/50 border border-purple-500/30 text-left hover:bg-purple-800/50 transition-colors"
                >
                  <div className="text-sm text-purple-200 font-bold">{buff.name}</div>
                  <div className="text-xs text-purple-400">{buff.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 战斗日志 */}
        <div className="w-full max-w-2xl mt-4 max-h-32 overflow-y-auto">
          {battleLog.map((log, i) => (
            <p key={i} className="text-xs text-purple-400/70 py-0.5">
              {log}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

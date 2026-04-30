"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { GameEngine } from "@/engine/GameEngine";
import { GameState, PlayerStats, UpgradeOption, ShopItem } from "@/engine/types";
import UpgradeOverlay from "./UpgradeOverlay";
import ShopOverlay from "./ShopOverlay";
import MobileControls from "./MobileControls";

interface PlayerData {
  floor: number;
  power: number;
  coins: number;
}

interface Props {
  playerData: PlayerData;
  onWaveComplete: (floor: number, coinsEarned: number) => void;
  onPlayerDeath: () => void;
  onStateChange: (state: GameState) => void;
}

function computeInitialStats(player: PlayerData): PlayerStats {
  const powerBonus = player.power * 0.5;
  return {
    atk: 50 + powerBonus,
    maxHp: 1000 + player.power * 5,
    atkSpeed: 1.5,
    moveSpeed: 200,
    critRate: 0.05,
    critMult: 2.0,
    armor: 0,
    hpRegen: 0,
    pierce: 1,
    multishot: 1,
    lifeSteal: 0,
  };
}

export default function GameCanvas({ playerData, onWaveComplete, onPlayerDeath, onStateChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [showShop, setShowShop] = useState(false);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [shopCoins, setShopCoins] = useState(0);
  const [dead, setDead] = useState(false);
  const [playerHp, setPlayerHp] = useState({ hp: 1000, maxHp: 1000 });
  const [speed, setSpeed] = useState(1);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
    onStateChange(state);
    // Sync player HP
    const engine = engineRef.current;
    if (engine) {
      const p = (engine as any).em.player;
      if (p) setPlayerHp({ hp: p.hp, maxHp: p.maxHp });
    }
  }, [onStateChange]);

  const handleWaveComplete = useCallback((floor: number, coinsEarned: number) => {
    onWaveComplete(floor, coinsEarned);
  }, [onWaveComplete]);

  const handlePlayerDeath = useCallback(() => {
    setDead(true);
    onPlayerDeath();
  }, [onPlayerDeath]);

  const handleShowUpgrades = useCallback((options: UpgradeOption[]) => {
    setUpgradeOptions(options);
    setShowUpgrade(true);
  }, []);

  const handleShowShop = useCallback((items: ShopItem[], coins: number) => {
    setShopItems(items);
    setShopCoins(coins);
    setShowShop(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onStateChange: handleStateChange,
      onWaveComplete: handleWaveComplete,
      onPlayerDeath: handlePlayerDeath,
      onShowUpgrades: handleShowUpgrades,
      onShowShop: handleShowShop,
    });
    engineRef.current = engine;

    engine.start(playerData.floor, computeInitialStats(playerData));

    return () => {
      engine.stop();
    };
  }, [playerData.floor]);

  const handleUpgradeSelect = useCallback((option: UpgradeOption) => {
    setShowUpgrade(false);
    engineRef.current?.applyUpgrade(option);
  }, []);

  const handleShopPurchase = useCallback((item: ShopItem) => {
    engineRef.current?.purchaseShopItem(item);
    setShopCoins(prev => prev - item.cost);
  }, []);

  const handleShopClose = useCallback(() => {
    setShowShop(false);
    engineRef.current?.closeShopAndAdvance();
  }, []);

  const handleRetry = useCallback(() => {
    setDead(false);
    engineRef.current?.retry();
  }, []);

  const handleJoystickMove = useCallback((dir: { x: number; y: number }) => {
    engineRef.current?.getInput().setJoystickVector(dir);
  }, []);

  const toggleSpeed = useCallback(() => {
    const newSpeed = speed === 1 ? 2 : 1;
    setSpeed(newSpeed);
    engineRef.current?.setSpeed(newSpeed);
  }, [speed]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Speed toggle */}
      <button
        onClick={toggleSpeed}
        className="absolute top-3 right-3 z-30 px-3 py-1 rounded-lg text-xs font-bold border border-purple-500/30 bg-purple-900/60 text-purple-200 hover:bg-purple-800/60 transition-colors"
      >
        {speed === 1 ? "1x" : "2x"}
      </button>

      {/* HP bar overlay */}
      {gameState && gameState.phase === "playing" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48">
          <div className="progress-bar">
            <div
              className="progress-bar-fill bg-green-500"
              style={{ width: `${playerHp.maxHp > 0 ? (playerHp.hp / playerHp.maxHp) * 100 : 100}%` }}
            />
          </div>
          <div className="text-center text-xs text-purple-300 mt-1">
            {Math.ceil(playerHp.hp)} / {playerHp.maxHp}
          </div>
        </div>
      )}

      {/* Upgrade selection */}
      {showUpgrade && upgradeOptions.length > 0 && (
        <UpgradeOverlay options={upgradeOptions} onSelect={handleUpgradeSelect} />
      )}

      {/* Shop */}
      {showShop && (
        <ShopOverlay
          items={shopItems}
          coins={shopCoins}
          onPurchase={handleShopPurchase}
          onClose={handleShopClose}
        />
      )}

      {/* Death screen */}
      {dead && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-2xl text-red-400 font-bold mb-2">远征中断</h2>
            <p className="text-purple-300 mb-4">锚点的光芒不会熄灭</p>
            <button className="btn-primary" onClick={handleRetry}>
              重新远征
            </button>
          </div>
        </div>
      )}

      {/* Mobile joystick */}
      <MobileControls onMove={handleJoystickMove} />
    </div>
  );
}

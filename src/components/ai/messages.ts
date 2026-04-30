export const LUOJIU_MESSAGES: Record<string, string> = {
  first_login: "指挥官，我是洛玖。锚点已失，但我们还没输。准备好了就出发吧。",
  floor_10: "丧家之犬？让他们看看谁才是宇宙的灾厄。",
  floor_50: "坐标碎片已解析12%，继续前进。",
  floor_100: "地球在呼唤，我们能听到。",
  floor_200: "你已经走得很远了，指挥官。但宇宙深处还有更多秘密。",
  floor_500: "半千层...你的名字将被刻在星尘中。",
  defeat: "休整一下，锚点的光芒不会熄灭。",
  token_generated: "把这个交给群里的我，我会帮你处理。",
  boss_incoming: "小心，前方检测到强大的能量波动...",
  elite_incoming: "精英守卫出现了，全力以赴！",
};

export function getLuoJiuMessage(
  event: string,
  floor?: number
): string | null {
  if (event === "floor_milestone" && floor) {
    if (floor === 10) return LUOJIU_MESSAGES.floor_10;
    if (floor === 50) return LUOJIU_MESSAGES.floor_50;
    if (floor === 100) return LUOJIU_MESSAGES.floor_100;
    if (floor === 200) return LUOJIU_MESSAGES.floor_200;
    if (floor === 500) return LUOJIU_MESSAGES.floor_500;
    return null;
  }
  return LUOJIU_MESSAGES[event] ?? null;
}

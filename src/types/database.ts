import { ObjectId } from "mongodb";

export interface Equipment {
  id: string;
  name: string;
  type: "weapon" | "armor" | "accessory";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  stats: Record<string, number>;
  floorObtained: number;
}

export interface UserDoc {
  _id?: ObjectId;
  uid: string;
  qqHash: string;
  passwordHash: string;
  nickname: string;
  floor: number;
  power: number;
  coins: number;
  gems: number;
  equipment: Equipment[];
  unlockedSkills: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingRewardDoc {
  _id?: ObjectId;
  uid: string;
  coins: number;
  items: Equipment[];
  token: string;
  tokenExpiry: Date;
  claimed: boolean;
  createdAt: Date;
}

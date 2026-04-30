import { z } from "zod";

export const loginSchema = z.object({
  qq: z
    .string()
    .regex(/^\d{5,11}$/, "QQ号必须为5-11位数字"),
  password: z
    .string()
    .min(6, "密码至少6位")
    .max(16, "密码最多16位"),
});

export const floorCompleteSchema = z.object({
  floor: z.number().int().positive(),
});

export const generateTokenSchema = z.object({
  rewardId: z.string().optional(),
});

export const claimSchema = z.object({
  uid: z.string().length(12),
  token: z.string().length(6).regex(/^\d{6}$/),
});

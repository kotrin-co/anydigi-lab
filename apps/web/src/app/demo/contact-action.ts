"use server";

import { z } from "zod";

const schema = z.object({
  name: z.string().max(120).optional(),
  email: z
    .union([z.string().email("メールアドレスの形式を確認してください"), z.literal("")])
    .optional(),
  message: z
    .string()
    .min(1, "内容を入力してください")
    .max(2000, "内容は 2000 文字以内でお願いします"),
});

export type ContactState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

const MENTION = "<@U0986NL18QP>";

export async function submitContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: (formData.get("name") as string | null)?.trim() || undefined,
    email: (formData.get("email") as string | null)?.trim() || undefined,
    message: ((formData.get("message") as string | null) ?? "").trim(),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "入力内容を確認してください",
    };
  }

  const { name, email, message } = parsed.data;
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    return { ok: false, error: "送信先が設定されていません" };
  }

  const text = [
    MENTION,
    "",
    "💬 Lab Demo にご意見が届きました",
    "",
    `*お名前:* ${name || "（任意・未入力）"}`,
    `*メール:* ${email || "（任意・未入力）"}`,
    `*メッセージ:*`,
    message,
  ].join("\n");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`slack ${res.status}`);
    return { ok: true };
  } catch (e) {
    console.error("Slack send failed", e);
    return {
      ok: false,
      error: "送信に失敗しました。時間をおいて再度お試しください。",
    };
  }
}

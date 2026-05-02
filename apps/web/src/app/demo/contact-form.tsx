"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitContact, type ContactState } from "./contact-action";

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(
    submitContact,
    null
  );

  if (state && "ok" in state && state.ok) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-6 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" />
        <p className="mt-2 text-sm font-semibold text-foreground">
          送信ありがとうございました
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          name="name"
          type="text"
          placeholder="お名前（任意）"
          maxLength={120}
          className={inputCls}
        />
        <input
          name="email"
          type="email"
          placeholder="メール（任意）"
          maxLength={200}
          className={inputCls}
        />
      </div>
      <textarea
        name="message"
        required
        rows={5}
        placeholder="ご意見・ご感想・お問い合わせ内容をどうぞ"
        maxLength={2000}
        className={`${inputCls} resize-none`}
      />
      {state && "ok" in state && !state.ok && (
        <p className="text-xs text-rose-600">{state.error}</p>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          内容のみ必須。お名前・連絡先は返信が必要な場合のみで OK です。
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          {pending ? "送信中…" : "送信する"}
        </button>
      </div>
    </form>
  );
}

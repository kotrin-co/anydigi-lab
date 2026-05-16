"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Database,
  Info,
  Mail,
  MessageCircleQuestion,
  Workflow,
  X as XIcon,
  type LucideIcon,
} from "lucide-react";
import { AnalysisOverlay } from "./analysis-overlay";
import { ContactForm } from "./contact-form";

type PanelKey = "about" | "why_chat" | "data" | "pipeline" | "contact";
type Accent = "emerald" | "violet" | "sky" | "amber" | "rose";

const PANEL_BUTTONS: {
  key: PanelKey;
  label: string;
  icon: LucideIcon;
  accent: Accent;
}[] = [
  { key: "about", label: "このデモについて", icon: Info, accent: "violet" },
  {
    key: "why_chat",
    label: "なぜ選択式なのか",
    icon: MessageCircleQuestion,
    accent: "amber",
  },
  { key: "data", label: "元になるデータは？", icon: Database, accent: "sky" },
  {
    key: "pipeline",
    label: "裏側の仕組みについて",
    icon: Workflow,
    accent: "rose",
  },
  {
    key: "contact",
    label: "ご意見・お問い合わせ",
    icon: Mail,
    accent: "emerald",
  },
];

const ACCENT: Record<
  Accent,
  {
    icon: string;
    buttonHover: string;
    iconBadge: string;
    headerGradient: string;
    border: string;
    strongClass: string;
    bullet: string;
    glowRing: string;
  }
> = {
  emerald: {
    icon: "text-emerald-600",
    buttonHover:
      "hover:border-emerald-500/60 hover:bg-emerald-500/5 hover:text-emerald-700",
    iconBadge:
      "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/30",
    headerGradient:
      "bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent",
    border: "border-emerald-500/30",
    strongClass:
      "[&_strong]:text-emerald-700 [&_strong]:font-semibold dark:[&_strong]:text-emerald-400",
    bullet: "bg-emerald-500",
    glowRing: "ring-emerald-500/20",
  },
  violet: {
    icon: "text-violet-600",
    buttonHover:
      "hover:border-violet-500/60 hover:bg-violet-500/5 hover:text-violet-700",
    iconBadge: "bg-violet-500/15 text-violet-600 ring-1 ring-violet-500/30",
    headerGradient:
      "bg-gradient-to-br from-violet-500/20 via-violet-500/5 to-transparent",
    border: "border-violet-500/30",
    strongClass:
      "[&_strong]:text-violet-700 [&_strong]:font-semibold dark:[&_strong]:text-violet-400",
    bullet: "bg-violet-500",
    glowRing: "ring-violet-500/20",
  },
  sky: {
    icon: "text-sky-600",
    buttonHover:
      "hover:border-sky-500/60 hover:bg-sky-500/5 hover:text-sky-700",
    iconBadge: "bg-sky-500/15 text-sky-600 ring-1 ring-sky-500/30",
    headerGradient:
      "bg-gradient-to-br from-sky-500/20 via-sky-500/5 to-transparent",
    border: "border-sky-500/30",
    strongClass:
      "[&_strong]:text-sky-700 [&_strong]:font-semibold dark:[&_strong]:text-sky-400",
    bullet: "bg-sky-500",
    glowRing: "ring-sky-500/20",
  },
  amber: {
    icon: "text-amber-600",
    buttonHover:
      "hover:border-amber-500/60 hover:bg-amber-500/5 hover:text-amber-700",
    iconBadge: "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30",
    headerGradient:
      "bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent",
    border: "border-amber-500/30",
    strongClass:
      "[&_strong]:text-amber-700 [&_strong]:font-semibold dark:[&_strong]:text-amber-400",
    bullet: "bg-amber-500",
    glowRing: "ring-amber-500/20",
  },
  rose: {
    icon: "text-rose-600",
    buttonHover:
      "hover:border-rose-500/60 hover:bg-rose-500/5 hover:text-rose-700",
    iconBadge: "bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/30",
    headerGradient:
      "bg-gradient-to-br from-rose-500/20 via-rose-500/5 to-transparent",
    border: "border-rose-500/30",
    strongClass:
      "[&_strong]:text-rose-700 [&_strong]:font-semibold dark:[&_strong]:text-rose-400",
    bullet: "bg-rose-500",
    glowRing: "ring-rose-500/20",
  },
};

const TEXT_PANELS: Record<
  Exclude<PanelKey, "pipeline">,
  { title: string; body: (close: () => void) => ReactNode }
> = {
  about: {
    title: "このデモについて",
    body: () => (
      <>
        <p>
          大量に流れ込むデータの中から、<strong>自然言語の質問</strong>{" "}
          だけで目的の情報を取り出し、欲しい形（分析レポート）に
          まとめて返す——その流れを体験できるデモです。
        </p>
        <p>
          毎朝集まる国内外のテック系ニュース約 100 件を AI が読み込み、
          あなたの「立場」と「読みたい視点（わかりやすく解説 / 分析する）」に合わせて、
          自分専用に書き起こしたレポートを返します。
        </p>
        <p>
          同じ仕組みは、社内に蓄積されている議事録・営業メモ・問い合わせ履歴・
          売上データなど、どんな情報源にも当てはめられます。
          <strong>蓄積されたデータと AI を組み合わせることで、</strong>
          「聞けば答えてくれる業務基盤」が作れる、という提案がこのデモの裏側にあります。
        </p>
      </>
    ),
  },
  why_chat: {
    title: "なぜ選択式なのか",
    body: () => (
      <>
        <p>
          AI には<strong>自由入力でも</strong>答えさせられますが、
          このデモは<strong>あえて選択式</strong>にしています。
        </p>
        <p>
          同じニュースでも、経営者と現場マネージャーでは「読みたい角度」が違います。
          1 人会社の代表と大企業の企画担当でも、必要な視点は違います。
          一般的なニュースサイトは「全員に同じ記事」を出しますが、このデモは
          まず <strong>あなたの立場と視点</strong> を聞いてから、その人向けに
          書き起こしたレポートを返します。
        </p>
        <p>
          選択式にしたのは、初見の人でも迷わず数秒で「自分向けの結果」に
          たどり着ける体験を優先したからです。社内導入する場合は、用途に応じて
          自由入力チャット型と選択式を <strong>組み合わせて設計</strong> できます。
        </p>
      </>
    ),
  },
  data: {
    title: "元になるデータは？",
    body: (close) => (
      <>
        <ul className="space-y-2.5 text-sm">
          {[
            ["毎朝、別サーバーが", "国内外のニュース記事を自動で取得"],
            ["集めた記事は", "クラウドストレージに蓄積"],
          ].map(([k, v]) => (
            <li key={k} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
              <span>
                {k}
                <strong>{v}</strong>
              </span>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              close();
              setTimeout(() => {
                document
                  .getElementById("raw-data")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 280);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-500/30 transition hover:from-sky-600 hover:to-sky-700"
          >
            <Database className="h-4 w-4" />
            元データを見る
          </button>
        </div>
      </>
    ),
  },
  contact: {
    title: "ご意見・お問い合わせ",
    body: () => (
      <>
        <p className="text-sm leading-relaxed">
          このデモへのご感想や、AI 業務活用に関するご相談を、お気軽にお寄せください。
        </p>
        <ContactForm />
      </>
    ),
  },
};

export function InfoPanels() {
  const [open, setOpen] = useState<PanelKey | null>(null);
  const close = () => setOpen(null);
  const openPanel = open && open !== "pipeline" ? PANEL_BUTTONS.find((p) => p.key === open) : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {PANEL_BUTTONS.map((p) => {
          const a = ACCENT[p.accent];
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setOpen(p.key)}
              className={`group inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition ${a.buttonHover}`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${a.iconBadge} transition-transform group-hover:scale-110`}
              >
                <p.icon className="h-3 w-3" />
              </span>
              {p.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {open === "pipeline" && (
          <AnalysisOverlay onComplete={close} onSkip={close} />
        )}
        {openPanel && (
          <InfoPanelModal
            title={TEXT_PANELS[openPanel.key as Exclude<PanelKey, "pipeline">].title}
            icon={openPanel.icon}
            accent={openPanel.accent}
            onClose={close}
          >
            {TEXT_PANELS[openPanel.key as Exclude<PanelKey, "pipeline">].body(
              close
            )}
          </InfoPanelModal>
        )}
      </AnimatePresence>
    </>
  );
}

function InfoPanelModal({
  title,
  icon: Icon,
  accent,
  onClose,
  children,
}: {
  title: string;
  icon: LucideIcon;
  accent: Accent;
  onClose: () => void;
  children: ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-md px-4"
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl overflow-hidden rounded-2xl border ${a.border} bg-card shadow-2xl ring-4 ${a.glowRing}`}
      >
        <div className={`relative ${a.headerGradient} px-6 py-5 border-b ${a.border}`}>
          <div className="flex items-center gap-3 pr-10">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${a.iconBadge}`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div
          className={`px-6 py-5 space-y-3 text-sm leading-relaxed text-foreground/90 ${a.strongClass}`}
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

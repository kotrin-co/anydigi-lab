"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, RotateCcw, Sparkles, User } from "lucide-react";
import { fetchReport, type FetchReportResult } from "./actions";
import { AnalysisOverlay } from "./analysis-overlay";
import type {
  DemoDepth,
  DemoRole,
  DemoTopic,
} from "@anydigi-lab/database/schema/demo";

type Q2Option = { value: DemoRole; label: string; sublabel: string };
type Q3Option = { value: DemoDepth; label: string; sublabel: string };

const Q2_OPTIONS: Q2Option[] = [
  { value: "executive", label: "経営者・役員", sublabel: "全社視点・意思決定" },
  { value: "manager", label: "現場マネージャー", sublabel: "チーム運用・実装" },
  { value: "planner", label: "企画・新規事業", sublabel: "アイデア・事業設計" },
  { value: "solo", label: "個人事業主・1人会社", sublabel: "1人で回す視点" },
];

// DB 上の depth カラム値は 'digest' / 'detailed' のまま据え置き。
// 'digest' を「わかりやすく解説」、'detailed' を「分析レポート」として再解釈する。
const Q3_OPTIONS: Q3Option[] = [
  { value: "digest", label: "わかりやすく解説", sublabel: "専門用語ゼロ・例え話で" },
  { value: "detailed", label: "分析レポートを見る", sublabel: "業界感度ある人向け・深掘り" },
];

type Step = "q1" | "q2" | "q3" | "loading" | "result";

type Selection = {
  topicIndex?: number;
  role?: DemoRole;
  depth?: DemoDepth;
};

type Bubble =
  | { kind: "bot"; text: string; id: string }
  | { kind: "user"; text: string; id: string }
  | { kind: "report"; report: FetchReportResult; id: string };

type Props = {
  questionSetId: number | null;
  topics: DemoTopic[];
  intro: string | null;
};

export function ChatBot({ questionSetId, topics, intro }: Props) {
  const [step, setStep] = useState<Step>("q1");
  const [bubbles, setBubbles] = useState<Bubble[]>(() => initialBubbles(intro));
  const [selection, setSelection] = useState<Selection>({});
  const [, startTransition] = useTransition();
  const [overlayDone, setOverlayDone] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const analysisResultRef = useRef<FetchReportResult | null>(null);
  const overlayDoneRef = useRef(false);
  const fetchPendingRef = useRef(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [bubbles, step]);

  const setOverlayDoneSync = (v: boolean) => {
    overlayDoneRef.current = v;
    setOverlayDone(v);
  };

  const tryFinalize = () => {
    const result = analysisResultRef.current;
    if (!result || !overlayDoneRef.current) {
      setShowTypingIndicator(
        overlayDoneRef.current && fetchPendingRef.current && !result
      );
      return;
    }
    setBubbles((b) => [
      ...b,
      { kind: "report", id: `r-${Date.now()}`, report: result },
    ]);
    setStep("result");
    analysisResultRef.current = null;
    fetchPendingRef.current = false;
    setShowTypingIndicator(false);
    setOverlayDoneSync(false);
  };

  const pushBot = (text: string) =>
    setBubbles((b) => [
      ...b,
      { kind: "bot", text, id: `b-${b.length}-${Date.now()}` },
    ]);
  const pushUser = (text: string) =>
    setBubbles((b) => [
      ...b,
      { kind: "user", text, id: `u-${b.length}-${Date.now()}` },
    ]);

  const handleQ1 = (i: number) => {
    pushUser(topics[i].label);
    setSelection((s) => ({ ...s, topicIndex: i }));
    setTimeout(() => {
      pushBot("ありがとうございます。あなたの立場を教えてください。");
      setStep("q2");
    }, 350);
  };

  const handleQ2 = (role: DemoRole, label: string) => {
    pushUser(label);
    setSelection((s) => ({ ...s, role }));
    setTimeout(() => {
      pushBot("最後に、どちらの読み方がいいですか？");
      setStep("q3");
    }, 350);
  };

  const handleQ3 = (depth: DemoDepth, label: string) => {
    pushUser(label);
    setSelection((s) => ({ ...s, depth }));
    setStep("loading");
    analysisResultRef.current = null;
    fetchPendingRef.current = true;
    setShowTypingIndicator(true);
    setOverlayDoneSync(true);

    if (questionSetId === null || selection.topicIndex === undefined || selection.role === undefined) {
      setTimeout(() => {
        analysisResultRef.current = { ok: false, reason: "not_found" };
        fetchPendingRef.current = false;
        tryFinalize();
      }, 600);
      return;
    }

    startTransition(async () => {
      const result = await fetchReport({
        questionSetId,
        topicIndex: selection.topicIndex!,
        role: selection.role!,
        depth,
      });
      analysisResultRef.current = result;
      fetchPendingRef.current = false;
      tryFinalize();
    });
  };

  const reset = () => {
    setBubbles(initialBubbles(intro));
    setSelection({});
    setStep("q1");
    analysisResultRef.current = null;
    fetchPendingRef.current = false;
    setShowTypingIndicator(false);
    setOverlayDoneSync(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-emerald-500/5">
      <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent px-4 py-3">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-500/20">
          <Bot className="h-6 w-6 text-white" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-400 animate-pulse" />
        </span>
        <div className="text-base font-semibold tracking-tight text-foreground">
          LaBot
        </div>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[480px] min-h-[320px] overflow-y-auto px-4 py-5 space-y-3.5 bg-gradient-to-b from-emerald-500/[0.06] via-emerald-500/[0.02] to-background"
      >
        <AnimatePresence initial={false}>
          {bubbles.map((b) =>
            b.kind === "bot" ? (
              <BotBubble key={b.id} text={b.text} />
            ) : b.kind === "user" ? (
              <UserBubble key={b.id} text={b.text} />
            ) : (
              <ReportBubble key={b.id} result={b.report} />
            )
          )}
        </AnimatePresence>

        {step === "loading" && showTypingIndicator && <TypingIndicator />}
      </div>

      <AnimatePresence>
        {replayOpen && (
          <AnalysisOverlay
            onComplete={() => setReplayOpen(false)}
            onSkip={() => setReplayOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="border-t border-border bg-gradient-to-b from-muted/10 to-muted/30 px-4 py-3.5">
        {step === "q1" && (
          <OptionGrid
            options={topics.map((t, i) => ({
              key: String(i),
              label: t.label,
              sublabel: t.description ?? "",
              onClick: () => handleQ1(i),
            }))}
          />
        )}
        {step === "q2" && (
          <OptionGrid
            options={Q2_OPTIONS.map((o) => ({
              key: o.value,
              label: o.label,
              sublabel: o.sublabel,
              onClick: () => handleQ2(o.value, o.label),
            }))}
          />
        )}
        {step === "q3" && (
          <OptionGrid
            options={Q3_OPTIONS.map((o) => ({
              key: o.value,
              label: o.label,
              sublabel: o.sublabel,
              onClick: () => handleQ3(o.value, o.label),
            }))}
            cols={2}
          />
        )}
        {step === "loading" && (
          <div className="text-xs text-muted-foreground">分析中…</div>
        )}
        {step === "result" && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-emerald-700"
            >
              <RotateCcw className="h-4 w-4" />
              もう一度試す
            </button>
            <button
              type="button"
              onClick={() => setReplayOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-400"
            >
              <Sparkles className="h-4 w-4" />
              裏側の仕組みを見る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function initialBubbles(_intro: string | null): Bubble[] {
  const base: Bubble[] = [
    {
      kind: "bot",
      id: "b-init-1",
      text: "こんにちは。AIアナリストの LaBot です。",
    },
    {
      kind: "bot",
      id: "b-init-2",
      text:
        "毎日の数あるニュースから 4 テーマに絞って、見る人のポジション別に「わかりやすく解説」「分析する」の 2 つの視点で AI がまとめます。",
    },
    {
      kind: "bot",
      id: "b-init-3",
      text: "どのニュースが気になりますか？",
    },
  ];
  return base;
}

function BotBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-2.5"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-500/30">
        <Bot className="h-4 w-4 text-white" />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 text-sm text-foreground leading-relaxed shadow-sm">
        {text}
      </div>
    </motion.div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex justify-end gap-2.5"
    >
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-medium text-white leading-relaxed shadow-md shadow-emerald-500/25">
        {text}
      </div>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 ring-1 ring-foreground/10">
        <User className="h-4 w-4 text-foreground/70" />
      </span>
    </motion.div>
  );
}

function ReportBubble({ result }: { result: FetchReportResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex gap-2.5"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-500/30">
        <Bot className="h-4 w-4 text-white" />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 px-4 py-3 text-sm text-foreground leading-relaxed space-y-2 shadow-sm">
        {result.ok ? (
          <>
            <div className="font-semibold text-foreground">
              {result.report.title}
            </div>
            <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
              {result.report.content}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground leading-relaxed">
            このパターンのレポートはまだ準備中です。深夜の自動生成が完了するとここに表示されます。
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-2.5"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-500/30">
        <Bot className="h-4 w-4 text-white" />
      </span>
      <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-emerald-500"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

type GridOption = {
  key: string;
  label: string;
  sublabel: string;
  onClick: () => void;
};

function OptionGrid({
  options,
  cols = 2,
}: {
  options: GridOption[];
  cols?: 2 | 4;
}) {
  return (
    <div
      className={`grid gap-2 ${
        cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
      }`}
    >
      {options.map((o, idx) => (
        <button
          key={o.key}
          type="button"
          onClick={o.onClick}
          className="group flex items-start gap-3 rounded-lg border-2 border-emerald-500/25 bg-gradient-to-br from-emerald-500/5 to-transparent px-3.5 py-3 text-left shadow-sm transition hover:border-emerald-500/70 hover:from-emerald-500/15 hover:shadow-md hover:shadow-emerald-500/15 active:scale-[0.98]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-xs font-bold text-white shadow-sm shadow-emerald-500/40 transition-transform group-hover:scale-110">
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground leading-snug">
              {o.label}
            </div>
            {o.sublabel && (
              <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                {o.sublabel}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

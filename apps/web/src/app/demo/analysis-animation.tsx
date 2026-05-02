"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type Ref,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Database,
  FileText,
  HardDrive,
  Layers,
  MessageSquareText,
  Play,
  RotateCcw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type FlowNodeDef = {
  icon: LucideIcon;
  label: string;
  explanation: string;
};

const nodes: FlowNodeDef[] = [
  {
    icon: MessageSquareText,
    label: "質問",
    explanation: "あなたの知りたいことを言葉で受け取ります。",
  },
  {
    icon: Layers,
    label: "セマンティック層",
    explanation:
      "質問の意味を解釈して、必要な情報がどこにあるかを判断する「翻訳役」です。",
  },
  {
    icon: Database,
    label: "データベース",
    explanation:
      "条件に合うデータを、蓄積された情報の中からすばやく抽出します。",
  },
  {
    icon: HardDrive,
    label: "ストレージ",
    explanation:
      "クラウドに保管された大量の生データから、必要な部分だけを取り出します。",
  },
  {
    icon: Sparkles,
    label: "AI 分析",
    explanation:
      "取り出した情報を AI が読み解き、傾向や気づきを抽出します。",
  },
  {
    icon: FileText,
    label: "レポート",
    explanation: "わかりやすい言葉と形にまとめて、結果として表示します。",
  },
];

type Phase =
  | { kind: "idle" }
  | { kind: "active"; node: number }
  | { kind: "explain"; node: number }
  | { kind: "flow"; from: number }
  | { kind: "done" };

const TIMING = {
  active: 500,
  explain: 2000,
  flow: 800,
};

type AnalysisAnimationProps = {
  autoPlay?: boolean;
  onComplete?: () => void;
};

export function AnalysisAnimation({
  autoPlay = false,
  onComplete,
}: AnalysisAnimationProps = {}) {
  const [phase, setPhase] = useState<Phase>(() =>
    autoPlay ? { kind: "active", node: 0 } : { kind: "idle" }
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const completeFiredRef = useRef(false);

  useEffect(() => {
    if (phase.kind !== "done") return;
    if (completeFiredRef.current) return;
    completeFiredRef.current = true;
    onComplete?.();
  }, [phase.kind, onComplete]);

  useEffect(() => {
    let targetIndex: number | null = null;
    if (phase.kind === "active" || phase.kind === "explain") {
      targetIndex = phase.node;
    } else if (phase.kind === "flow") {
      targetIndex = phase.from + 1;
    }
    if (targetIndex === null) return;

    const container = scrollContainerRef.current;
    const node = nodeRefs.current[targetIndex];
    if (!container || !node) return;

    const containerRect = container.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const currentScroll = container.scrollLeft;
    const nodeLeftInContainer =
      nodeRect.left - containerRect.left + currentScroll;
    const targetScroll =
      nodeLeftInContainer - (container.clientWidth - nodeRect.width) / 2;

    container.scrollTo({ left: targetScroll, behavior: "smooth" });
  }, [phase]);

  useEffect(() => {
    let next: Phase | null = null;
    let delay = 0;

    if (phase.kind === "active") {
      next = { kind: "explain", node: phase.node };
      delay = TIMING.active;
    } else if (phase.kind === "explain") {
      next =
        phase.node === nodes.length - 1
          ? { kind: "done" }
          : { kind: "flow", from: phase.node };
      delay = TIMING.explain;
    } else if (phase.kind === "flow") {
      next = { kind: "active", node: phase.from + 1 };
      delay = TIMING.flow;
    }

    if (!next) return;
    const t = setTimeout(() => setPhase(next!), delay);
    return () => clearTimeout(t);
  }, [phase]);

  const start = useCallback(() => setPhase({ kind: "active", node: 0 }), []);
  const reset = useCallback(() => setPhase({ kind: "idle" }), []);

  const isAnimating = phase.kind !== "idle" && phase.kind !== "done";
  const isDone = phase.kind === "done";

  const getNodeState = (i: number): { active: boolean; done: boolean } => {
    if (phase.kind === "idle") return { active: false, done: false };
    if (phase.kind === "done") return { active: false, done: true };
    if (phase.kind === "active" || phase.kind === "explain") {
      return { active: phase.node === i, done: phase.node > i };
    }
    if (phase.kind === "flow") {
      return { active: false, done: phase.from >= i };
    }
    return { active: false, done: false };
  };

  const getConnectorState = (
    i: number
  ): { filled: boolean; flowing: boolean } => {
    if (phase.kind === "flow") {
      return { filled: phase.from > i, flowing: phase.from === i };
    }
    if (phase.kind === "active" || phase.kind === "explain") {
      return { filled: phase.node > i, flowing: false };
    }
    if (phase.kind === "done") return { filled: true, flowing: false };
    return { filled: false, flowing: false };
  };

  const explainingNode = phase.kind === "explain" ? phase.node : null;

  return (
    <div className="space-y-4">
      {!autoPlay && (
        <div className="flex items-center gap-3">
          {isAnimating ? (
            <div className="inline-flex items-center gap-2 rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              分析中…
            </div>
          ) : (
            <button
              type="button"
              onClick={isDone ? reset : start}
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
            >
              {isDone ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isDone ? "もう一度実行" : "AI 分析プロセスを見る"}
            </button>
          )}
        </div>
      )}

      <div className="flex min-h-[120px] items-center justify-center">
        <AnimatePresence mode="wait">
          {explainingNode !== null && (
            <ExplanationCard
              key={explainingNode}
              node={nodes[explainingNode]}
            />
          )}
        </AnimatePresence>
      </div>

      <div
        ref={scrollContainerRef}
        className="overflow-x-auto rounded-lg border border-border bg-card p-6"
      >
        <div className="flex items-start gap-2">
          {nodes.map((node, i) => {
            const state = getNodeState(i);
            const cstate =
              i < nodes.length - 1 ? getConnectorState(i) : null;
            return (
              <Fragment key={node.label}>
                <FlowNode
                  ref={(el) => {
                    nodeRefs.current[i] = el;
                  }}
                  node={node}
                  isActive={state.active}
                  isDone={state.done}
                />
                {cstate && (
                  <Connector
                    filled={cstate.filled}
                    flowing={cstate.flowing}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExplanationCard({ node }: { node: FlowNodeDef }) {
  const Icon = node.icon;
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.94, opacity: 0, y: -6 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-xl rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 px-5 py-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500/70 bg-emerald-500/15">
          <Icon className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <div className="text-base font-semibold text-foreground">
            {node.label}
          </div>
          <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {node.explanation}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FlowNode({
  ref,
  node,
  isActive,
  isDone,
}: {
  ref?: Ref<HTMLDivElement>;
  node: FlowNodeDef;
  isActive: boolean;
  isDone: boolean;
}) {
  const Icon = node.icon;
  const colored = isActive || isDone;

  return (
    <div
      ref={ref}
      className="flex w-24 shrink-0 flex-col items-center gap-2"
    >
      <div className="relative h-14 w-14">
        {isActive && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-emerald-500"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-emerald-500"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />
          </>
        )}
        <motion.div
          animate={{ scale: isActive ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors ${
            isActive
              ? "border-emerald-500 bg-emerald-500/15"
              : isDone
                ? "border-emerald-500/60 bg-emerald-500/5"
                : "border-border bg-muted/40"
          }`}
        >
          <Icon
            className={`h-6 w-6 transition-colors ${
              colored ? "text-emerald-500" : "text-muted-foreground"
            }`}
          />
        </motion.div>
      </div>
      <div className="text-center">
        <div
          className={`text-xs font-medium ${
            colored ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {node.label}
        </div>
      </div>
    </div>
  );
}

function Connector({
  filled,
  flowing,
}: {
  filled: boolean;
  flowing: boolean;
}) {
  return (
    <div className="relative mt-7 h-0.5 min-w-[40px] flex-1 overflow-hidden bg-border">
      <motion.div
        animate={{ scaleX: filled || flowing ? 1 : 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="absolute inset-0 origin-left bg-emerald-500/60"
      />
      {flowing && (
        <motion.div
          className="absolute top-1/2 h-1.5 w-3 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
          initial={{ left: "-10%" }}
          animate={{ left: "110%" }}
          transition={{ duration: 0.8, ease: "linear" }}
        />
      )}
    </div>
  );
}

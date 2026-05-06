import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  X,
  ThumbsUp,
  CheckCircle,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";

interface Step {
  step: number;
  title: string;
  description: string;
  image: string;
}

interface Problem {
  title: string;
  severity: "common" | "moderate" | "rare";
  steps: Step[];
}

interface TroubleshootingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem;
  deviceName: string;
  deviceIcon: ComponentType<{ className?: string }>;
  deviceColor: string;
  onFeedback: (helpful: boolean) => void;
  hasFeedback?: boolean;
}

const SEVERITY = {
  common: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    label: "Common Issue",
  },
  moderate: {
    color: "bg-orange-100 text-orange-700 border-orange-300",
    label: "Moderate Issue",
  },
  rare: {
    color: "bg-red-100 text-red-700 border-red-300",
    label: "Rare Issue",
  },
} as const;

export function TroubleshootingGuideModal({
  isOpen,
  onClose,
  problem,
  deviceName,
  deviceIcon,
  deviceColor,
  onFeedback,
  hasFeedback = false,
}: TroubleshootingGuideModalProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(hasFeedback);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const Icon = (deviceIcon ?? HelpCircle) as ComponentType<{ className?: string }>;
  const badge = SEVERITY[problem.severity] ?? SEVERITY.common;
  const steps = useMemo(() => problem.steps ?? [], [problem.steps]);

  useEffect(() => {
    setFeedbackGiven(hasFeedback);
  }, [hasFeedback, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setActiveStep(steps[0]?.step ?? null);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, steps]);

  const handleFeedback = (helpful: boolean) => {
    setFeedbackGiven(true);
    onFeedback(helpful);
  };

  const scrollToStep = (stepNum: number) => {
    const target = stepRefs.current[stepNum];
    const container = scrollRef.current;
    if (!target || !container) return;
    const top = target.offsetTop - container.offsetTop - 16;
    container.scrollTo({ top, behavior: "smooth" });
    setActiveStep(stepNum);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${deviceName} — ${problem.title}`}
        className="relative w-full max-w-5xl h-full max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 ${deviceColor} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {deviceName}
              </div>
              <h2 className="text-lg sm:text-xl text-slate-900 truncate">
                {problem.title}
              </h2>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </header>

        <div className="grid lg:grid-cols-3 flex-1 overflow-hidden">
          <aside className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 overflow-y-auto">
            <div className="p-6 space-y-5">
              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}
                >
                  {badge.label}
                </span>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-4">
                <div className="text-xs text-slate-500 mb-1">Device</div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 ${deviceColor} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-900">{deviceName}</span>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                  Steps ({steps.length})
                </div>
                <ol className="space-y-1">
                  {steps.map((step) => {
                    const isActive = activeStep === step.step;
                    return (
                      <li key={step.step}>
                        <button
                          type="button"
                          onClick={() => scrollToStep(step.step)}
                          className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg border transition-colors ${
                            isActive
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {step.step}
                          </span>
                          <span
                            className={`text-sm truncate ${
                              isActive ? "text-white" : "text-slate-700"
                            }`}
                          >
                            {step.title}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 ml-auto flex-shrink-0 ${
                              isActive ? "text-white" : "text-slate-400"
                            }`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm text-slate-900 mb-3 font-medium">
                  Did this guide help?
                </h3>
                {!feedbackGiven ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleFeedback(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Yes, it helped
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(false)}
                      className="w-full text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md py-2 transition-colors flex items-center justify-center gap-1.5"
                    >
                      No — contact support
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Thanks for the feedback!</span>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <div
            ref={scrollRef}
            className="lg:col-span-2 overflow-y-auto bg-white"
          >
            <div className="px-6 py-8 max-w-xl mx-auto">
              <h3 className="text-xl text-slate-900 mb-1">
                Step-by-Step Guide
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Follow these steps in order to resolve the issue.
              </p>

              <div className="space-y-5">
                {steps.map((step) => (
                  <div
                    key={step.step}
                    ref={(el) => {
                      stepRefs.current[step.step] = el;
                    }}
                    className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-white font-medium">
                          {step.step}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base text-slate-900 mb-1">
                          {step.title}
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {step.image ? (
                      <div className="mx-auto max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <ImageWithFallback
                          src={step.image}
                          alt={step.title}
                          className="w-full max-h-44 object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

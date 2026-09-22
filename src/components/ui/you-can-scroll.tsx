"use client";
import React, { useEffect, useRef, useState } from "react";
import "@/index.css";
import {
  Shield,
  Activity,
  Terminal,
  Cpu,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database,
  Radio,
  FileSearch,
  ChevronUp,
  ChevronDown,
  RotateCw,
  MousePointer,
} from "lucide-react";

export interface ScrollAnimationProps {
  words?: string[];
  title?: string;
  subtitle?: string;
  showConfig?: boolean;
}

interface CapabilityItem {
  verb: string;
  tag: string;
  engine: string;
  metric: string;
  description: string;
  icon: any;
}

const DEFAULT_CAPABILITIES: CapabilityItem[] = [
  {
    verb: "detect.",
    tag: "ZERO-DAY PHISH",
    engine: "NLP & Urgency Classifier",
    metric: "98.02% Accuracy",
    description: "Deep NLP decomposes urgency pretexts, CEO impersonation, and hidden payload links.",
    icon: Search,
  },
  {
    verb: "attribute.",
    tag: "ORIGIN GEO & ASN",
    engine: "RFC 822 Relay Tracer",
    metric: "Hop-by-Hop Trace",
    description: "Reconstructs the full Received header chain to map physical server geolocation and ASN routing.",
    icon: Radio,
  },
  {
    verb: "quish-proof.",
    tag: "OPTICAL VISION",
    engine: "Computer Vision (pyzbar)",
    metric: "Zero Text Blindspots",
    description: "Scans embedded QR codes and screenshots, recursively resolving malicious shortlink redirects.",
    icon: Cpu,
  },
  {
    verb: "correlate.",
    tag: "CAMPAIGN GRAPH",
    engine: "Cross-Incident Clustering",
    metric: "Graph Correlation",
    description: "Discovers shared sender infrastructure and multi-target campaigns via interactive D3 graphs.",
    icon: Activity,
  },
  {
    verb: "unmask.",
    tag: "HOMOGLYPH DEFENSE",
    engine: "Domain Intel Engine",
    metric: "Punycode Resolved",
    description: "Detects deceptive Cyrillic homoglyphs, lookalike domains, and typo-squatted senders.",
    icon: Shield,
  },
  {
    verb: "verify.",
    tag: "STRICT AUTH",
    engine: "RFC Cryptographic Engine",
    metric: "SPF / DKIM / DMARC",
    description: "Validates cryptographic signatures and detects forged or soft-failing Authentication-Results.",
    icon: CheckCircle2,
  },
  {
    verb: "audit.",
    tag: "TAMPER-EVIDENT",
    engine: "Immutable Audit Ledger",
    metric: "NIST SP 800-86",
    description: "Maintains an immutable chain-of-custody ledger for every parse, triage, and deletion event.",
    icon: FileSearch,
  },
  {
    verb: "defend.",
    tag: "REAL-TIME SENSOR",
    engine: "Live Gmail Push Pipeline",
    metric: "15s Sync Interval",
    description: "Monitors authorized Gmail inboxes and pushes case updates instantly via Server-Sent Events.",
    icon: Lock,
  },
  {
    verb: "scale.",
    tag: "HIGH-THROUGHPUT",
    engine: "Unified Pipeline Engine",
    metric: "Zero Leakage",
    description: "Processes bulk enterprise .eml archives with deduplication and automated data retention lifecycles.",
    icon: Database,
  },
  {
    verb: "do it.",
    tag: "COMMAND ARMED",
    engine: "SOC Forensic Terminal",
    metric: "Instant Triage",
    description: "Gives incident response analysts explainable evidence cards and actionable risk scores.",
    icon: Terminal,
  },
];

export default function ScrollAnimation({
  words,
  title = "you can",
  subtitle = "trace.",
}: ScrollAnimationProps) {
  const hudRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const wheelAcc = useRef(0);
  const lastStepTime = useRef(0);

  const capabilities = words
    ? words.map((w, i) => ({
        verb: w,
        tag: `CORE SIGNAL ${i + 1}`,
        engine: "Forensic Analysis Engine",
        metric: "Active Inspection",
        description: `Autonomous verification for ${w.replace(".", "")} operations across all incoming message streams.`,
        icon: Shield,
      }))
    : DEFAULT_CAPABILITIES;

  // Wheel listener: traps scroll inside this box to scroll ONLY in a loop,
  // preventing the outer main page from scrolling while cursor is over the box.
  useEffect(() => {
    const el = hudRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Stop the main window / screen from scrolling
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      wheelAcc.current += e.deltaY;

      // Throttle steps so each mouse wheel notch moves 1 item cleanly
      if (Math.abs(wheelAcc.current) >= 28 && now - lastStepTime.current > 60) {
        const direction = wheelAcc.current > 0 ? 1 : -1;
        setActiveIndex((prev) => (prev + direction + capabilities.length) % capabilities.length);
        wheelAcc.current = 0;
        lastStepTime.current = now;
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const delta = touchStartY - currentY;
      if (Math.abs(delta) > 22) {
        e.preventDefault();
        const direction = delta > 0 ? 1 : -1;
        setActiveIndex((prev) => (prev + direction + capabilities.length) % capabilities.length);
        touchStartY = currentY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [capabilities.length]);

  const activeCap = capabilities[activeIndex] || capabilities[0];
  const IconComponent = activeCap.icon || Shield;

  const nextItem = () => {
    setActiveIndex((prev) => (prev + 1) % capabilities.length);
  };

  const prevItem = () => {
    setActiveIndex((prev) => (prev - 1 + capabilities.length) % capabilities.length);
  };

  return (
    <div className="you-can-scroll-root py-20 bg-[#070C16] border-y border-slate-800/80 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[550px] h-[350px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-blue-600/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-3">
            <Activity className="w-3.5 h-3.5" />
            <span>Continuous Capability Matrix</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-mono font-bold text-white tracking-tight">
            Every Threat Vector Attributed
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
            Hover inside the box and scroll to cycle capabilities in a continuous loop. Scroll outside to navigate the page.
          </p>
        </div>

        {/* Central Cyber SOC HUD Container with isolated wheel trap */}
        <div
          ref={hudRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`rounded-[6px] bg-[#090E17] border transition-all duration-300 shadow-2xl overflow-hidden ${
            isHovered
              ? "border-slate-700 shadow-soc-card"
              : "border-slate-800"
          }`}
        >
          {/* Top terminal titlebar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800/80 bg-slate-950/70 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-slate-300 font-bold hidden sm:inline">
                MAILTRACE // CAPABILITY WHEEL (LOOPING)
              </span>
            </div>

            {/* Status indicator badge */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                  isHovered
                    ? "bg-slate-800 border border-slate-700 text-slate-200"
                    : "bg-slate-900 border border-slate-800 text-slate-400"
                }`}
              >
                <RotateCw className={`w-3 h-3 ${isHovered ? "text-slate-300 animate-spin" : "text-slate-500"}`} />
                <span>
                  {isHovered
                    ? "SCROLL LOCKED TO BOX (LOOPING)"
                    : "HOVER HERE TO SCROLL BOX"}
                </span>
              </div>

              {/* Prev / Next manual controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex(
                      (prev) => (prev - 1 + capabilities.length) % capabilities.length
                    )
                  }
                  className="p-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Previous capability"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveIndex((prev) => (prev + 1) % capabilities.length)
                  }
                  className="p-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Next capability"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Body: Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8">
            {/* Left Column: Action Verb Selector */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2">
                <span>SIGNAL ENGINE PIPELINE</span>
                <span>
                  {String(activeIndex + 1).padStart(2, "0")} /{" "}
                  {String(capabilities.length).padStart(2, "0")}
                </span>
              </div>

              {/* Action Verbs List */}
              <div className="space-y-1.5 pt-1">
                {capabilities.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-[4px] cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "bg-slate-800/90 border border-slate-600 text-white translate-x-1"
                          : "hover:bg-slate-800/40 text-slate-500 hover:text-slate-300 border border-transparent opacity-40 hover:opacity-80"
                      }`}
                      onClick={() => setActiveIndex(idx)}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full transition-all ${
                            isActive
                              ? "bg-sky-400 scale-110"
                              : "bg-slate-700"
                          }`}
                        />
                        <span
                          className={`font-mono text-xl sm:text-2xl font-bold tracking-tight ${
                            isActive ? "text-white" : ""
                          }`}
                        >
                          {item.verb}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider ${
                          isActive ? "text-slate-300 font-semibold" : "text-slate-600"
                        }`}
                      >
                        {item.tag}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Live Telemetry Inspector */}
            <div className="lg:col-span-6">
              <div className="rounded-[6px] bg-slate-950 border border-slate-800 p-6 font-mono relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-[4px] bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-200 shadow-soc-subtle">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        {activeCap.tag}
                      </div>
                      <div className="text-sm font-bold text-slate-100">
                        {activeCap.engine}
                      </div>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    {activeCap.metric}
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed min-h-[48px]">
                  {activeCap.description}
                </p>

                <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3 text-[10px]">
                  <div className="p-2.5 rounded bg-[#070C16] border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Execution Mode</span>
                    <span className="text-slate-200 font-bold">Autonomous SOC Engine</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#070C16] border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Telemetry Status</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> VERIFIED ARMED
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded bg-slate-900/50 border border-slate-800/50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Scroll wheel behavior:</span>
                  <span className="text-cyan-400 font-semibold">
                    {isHovered ? "Trapped inside box (looping)" : "Move cursor outside to scroll page"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

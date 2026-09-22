import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AeroShards from '../components/ui/AeroShards';
import SplitFlapText from '../components/ui/SplitFlapText';
import ScrollReveal from '../components/ui/ScrollReveal';
import LetterGlitch from '../components/ui/LetterGlitch';
import SpecularButton from '../components/ui/SpecularButton';
import ScrollAnimation from '../components/ui/you-can-scroll';
import CybeeLockHero from '../components/ui/CybeeLockHero';
import BlockchainTexture from '../components/ui/BlockchainTexture';
import {
  Shield,
  ArrowRight,
  Radio,
  Network,
  QrCode,
  FileSearch,
  Globe2,
  Lock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Server,
  Activity,
  ChevronRight,
  Database,
  Cpu,
  Mail,
  Sliders,
  Terminal,
  Crosshair,
  Wifi,
  Layers,
  Search,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [showGlitchIntro, setShowGlitchIntro] = useState(true);
  const [isGlitchFading, setIsGlitchFading] = useState(false);
  const [bootStep, setBootStep] = useState(0);

  const bootMessages = [
    'INITIALIZING FORENSIC TELEMETRY CORES...',
    'MOUNTING RFC 822 HEADER GRAPH ANALYZER...',
    'DECRYPTING OPTICAL QUISHING HEURISTICS...',
    'SYNCHRONIZING REAL-TIME GMAIL SENSOR...',
    'FORENSIC OS ARMED // SYSTEM READY.'
  ];

  useEffect(() => {
    // Step forward through boot milestones across the extended sequence
    const stepInterval = setInterval(() => {
      setBootStep(prev => (prev < bootMessages.length - 1 ? prev + 1 : prev));
    }, 1050);

    // Trigger smooth fade-out at 5500ms (5.5s intro)
    const fadeTimer = setTimeout(() => {
      setIsGlitchFading(true);
    }, 5500);

    // Completely unmount LetterGlitch and stop canvas loop at 6100ms
    const stopTimer = setTimeout(() => {
      setShowGlitchIntro(false);
    }, 6100);

    // Keyboard shortcut to skip intro
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        setIsGlitchFading(true);
        setTimeout(() => setShowGlitchIntro(false), 500);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(fadeTimer);
      clearTimeout(stopTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSkipIntro = () => {
    setIsGlitchFading(true);
    setTimeout(() => setShowGlitchIntro(false), 500);
  };

  const scrollToSensor = () => {
    const el = document.getElementById('sensor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#06090F] text-slate-100 font-sans selection:bg-slate-700 selection:text-white relative overflow-x-hidden">
      {/* 0. INTRO BOOTLOADER GLITCH SCREEN (5.5s WITH SKIP) */}
      {showGlitchIntro && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#06090F] transition-opacity duration-700 ease-out cursor-pointer ${
            isGlitchFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          onClick={handleSkipIntro}
          role="dialog"
          aria-label="System Initializing"
        >
          {/* Canvas glitch background */}
          <div className="absolute inset-0 z-0 opacity-50">
            <LetterGlitch
              glitchColors={['#06b6d4', '#0891b2', '#0284c7', '#38bdf8', '#10b981']}
              glitchSpeed={45}
              centerVignette={true}
              outerVignette={true}
              smooth={true}
              backgroundColor="#06090F"
            />
          </div>

          {/* Central Terminal HUD */}
          <div
            className="relative z-10 max-w-lg w-full mx-4 p-6 sm:p-8 rounded-[6px] bg-[#070C16] border border-slate-700 shadow-2xl font-mono text-center cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-[4px] bg-slate-900 border border-slate-700 flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-slate-200" />
              </div>
            </div>

            <div className="text-base sm:text-lg font-bold tracking-widest text-white uppercase">
              MAILTRACE FORENSIC OS
            </div>
            <div className="text-[10px] text-slate-400 tracking-widest uppercase mt-1">
              v2.0 // CRYPTOGRAPHIC CONSENSUS ENGINE
            </div>

            {/* Solid technical progress bar (no rainbow gradient) */}
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden my-5 border border-slate-800">
              <div
                className="h-full bg-sky-400 transition-all duration-1000 ease-out"
                style={{ width: `${((bootStep + 1) / bootMessages.length) * 100}%` }}
              />
            </div>

            {/* Live boot message */}
            <div className="text-xs text-slate-300 font-mono tracking-wide h-6 flex items-center justify-center">
              <span className="inline-block w-2 h-2 rounded-full bg-sky-400 mr-2 shrink-0" />
              <span>{bootMessages[bootStep]}</span>
            </div>

            <button
              onClick={handleSkipIntro}
              type="button"
              className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] border border-slate-700 hover:border-slate-500 bg-slate-900 text-[10px] text-slate-400 hover:text-white transition-colors"
            >
              <span>[ ESC / CLICK TO INITIALIZE NOW ]</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP NAVIGATION */}
      <header className="sticky top-0 z-50 bg-[#070C16] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-900 border border-slate-700 group-hover:border-slate-500 transition-colors">
              <Shield className="w-4 h-4 text-slate-200 group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-wider text-white font-mono">
                MAIL<span className="text-slate-400">TRACE</span>
              </span>
              <span className="px-1.5 py-0.2 text-[8px] font-mono uppercase font-bold tracking-widest bg-slate-900 text-slate-400 border border-slate-800 rounded">
                v2.0
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Forensic Signals</a>
            <a href="#pipeline" className="hover:text-white transition-colors">How It Works</a>
            <a href="#sensor" className="hover:text-white transition-colors">Live Sensor</a>
            <a href="#explainability" className="hover:text-white transition-colors">Explainable AI</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/sign-in">
              <SpecularButton
                size="sm"
                radius={4}
                tint="#ffffff"
                tintOpacity={0.06}
                blur={2}
                textColor="#cbd5e1"
                lineColor="#64748b"
                baseColor="#1e293b"
                intensity={1.0}
                shineSize={10}
                shineFade={25}
                thickness={1}
                speed={0.35}
                followMouse={true}
                proximity={150}
                className="font-mono text-xs font-medium"
              >
                Sign In
              </SpecularButton>
            </Link>
            <Link
              to="/sign-up"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-white font-mono text-xs font-semibold transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. CYBEE CYBER SECURITY HERO SECTION (BLOCKCHAIN TEXTURE ARCHITECTURE) */}
      <section className="relative pt-12 pb-24 overflow-hidden border-b border-slate-800">
        {/* A. AUTHENTIC ISOMETRIC BLOCKCHAIN BLOCK TEXTURE (NO GRADIENT BLOBS) */}
        <BlockchainTexture opacity={0.25} />

        {/* B. Ambient AeroShards WebGPU Sculpture Background (Monochrome Chrome Shards) */}
        <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
          <AeroShards
            backgroundColor="#06090F"
            shardColor="#475569"
            accentColor="#94a3b8"
            placement="full"
            flow="stream"
            material="chrome"
            detail="balanced"
            effect="none"
            speed={0.45}
            spin={0.5}
            scale={1.1}
            spread={0.8}
            depth={0.9}
            density={1.0}
            shardSize={1.0}
            glow={0.5}
            bloom={0.2}
            grain={0.04}
            interaction="repel"
            interactionRadius={1.2}
            interactionStrength={0.35}
            rippleIntensity={0.8}
            holdToGather={true}
          />
        </div>

        {/* C. Technical Hairline Coordinate Grid (No colorful blur) */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute left-[15%] top-0 bottom-0 w-px bg-slate-700" />
          <div className="absolute right-[15%] top-0 bottom-0 w-px bg-slate-700" />
          <div className="absolute top-[28%] left-0 right-0 h-px bg-slate-700" />
          <div className="absolute bottom-[18%] left-0 right-0 h-px bg-slate-700" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Top Eyebrow Status with SplitFlapText */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#090e17] border border-slate-700 text-slate-300 text-xs font-mono mb-4 shadow-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <SplitFlapText
                words={[
                  'ZERO-DAY PHISH BLOCKED',
                  'RFC RELAY ATTRIBUTED',
                  'QUISHING DETECTED',
                  'EXPLAINABLE FORENSICS'
                ]}
                fontSize={12}
                tileColor="#0e1524"
                textColor="#f1f5f9"
                tileRadius={3}
                gap={3}
                padTo={22}
                cycleDelay={3000}
                flipsPerChar={6}
                flipDuration={0.08}
              />
            </div>
            <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">
              MAILTRACE FORENSIC OS // IMMUTABLE LEDGER VERIFICATION
            </div>
          </div>

          {/* D. CYBEE SPLIT HEADLINE WITH 3D BLOCKCHAIN VAULT PADLOCK (MATHEMATICALLY CENTERED FROM 768px+) */}
          <div className="relative my-6 sm:my-10 w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-4 md:gap-0">
            {/* Left Headline Half: CYBER (Takes 1fr, aligned to the right towards center) */}
            <div className="w-full text-center md:text-right md:pr-8 lg:pr-10 flex flex-col items-center md:items-end justify-center">
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black font-mono tracking-tighter text-white uppercase drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
                CYBER
              </h1>
              <div className="hidden md:block text-[9px] lg:text-[11px] font-mono text-slate-400 tracking-widest uppercase mt-1">
                ADVANCED FORENSIC SIGNAL RECONSTRUCTION
              </div>
            </div>

            {/* Central Cybee Blockchain Lock Emblem (Locked to exact 50% horizontal center) */}
            <div className="flex flex-col items-center justify-center py-2 md:py-0">
              <CybeeLockHero
                ctaText="EXPLORE SENSOR"
                onCtaClick={scrollToSensor}
              />
            </div>

            {/* Right Headline Half: DEFENSE (Takes 1fr, aligned to the left towards center) */}
            <div className="w-full text-center md:text-left md:pl-8 lg:pl-10 flex flex-col items-center md:items-start justify-center">
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black font-mono tracking-tighter text-white uppercase drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
                DEFENSE
              </h1>
              <div className="hidden md:block text-[9px] lg:text-[11px] font-mono text-slate-400 tracking-widest uppercase mt-1">
                RFC 5322 & OPTICAL QUISHING ATTRIBUTION
              </div>
            </div>
          </div>

          {/* Value Proposition Description (Centered) */}
          <div className="text-center max-w-2xl mx-auto mt-6 flex flex-col items-center justify-center px-4">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans text-center">
              Deterministic email forensics engine reconstructing RFC transmission relay hops, resolving optical quishing vectors, and correlating adversarial campaign infrastructure into auditable evidence.
            </p>

            {/* Action Buttons (Perfect Center Alignment & Symmetrically Balanced 210px Widths) */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 font-mono text-xs w-full max-w-lg mx-auto">
              <Link to="/sign-up" className="w-full sm:w-[210px] inline-flex items-center justify-center">
                <SpecularButton
                  size="md"
                  radius={6}
                  tint="#ffffff"
                  tintOpacity={0.12}
                  blur={4}
                  textColor="#ffffff"
                  lineColor="#94a3b8"
                  baseColor="#1e293b"
                  intensity={1.2}
                  shineSize={14}
                  shineFade={30}
                  thickness={1}
                  speed={0.4}
                  followMouse={true}
                  proximity={200}
                  className="w-full sm:w-[210px] h-[46px] font-mono text-xs font-bold tracking-wide uppercase shadow-lg shadow-black/50 inline-flex items-center justify-center"
                >
                  <span className="flex items-center justify-center gap-2">
                    Access Forensic Station
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </span>
                </SpecularButton>
              </Link>
              <a
                href="#pipeline"
                className="w-full sm:w-[210px] h-[46px] inline-flex items-center justify-center gap-2 rounded-[6px] bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white transition-colors font-mono text-xs font-semibold uppercase tracking-wider shadow-sm"
              >
                <span>Explore Architecture</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* Security Trust Badges (Centered) */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] font-mono text-slate-400 w-full text-center">
              <span className="flex items-center justify-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-300" /> Read-Only Gmail OAuth</span>
              <span className="flex items-center justify-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-300" /> 100% Explainable Scoring</span>
              <span className="flex items-center justify-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-slate-300" /> AES-256 Encrypted</span>
            </div>
          </div>

          {/* E. SIGNATURE 3-COLUMN TELEMETRY BAR (CLEAN TACTICAL MONOCHROME) */}
          <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs">
            {/* 3-Column Metrics Counters */}
            <div className="grid grid-cols-3 gap-6 sm:gap-12 text-left">
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight flex items-center">
                  99.9<span className="text-slate-400 text-lg">%</span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                  Detection Accuracy
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight flex items-center">
                  500<span className="text-slate-400 text-lg">K+</span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                  Relays Attribute-Traced
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight flex items-center">
                  24<span className="text-slate-400 text-lg">/7</span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                  Autonomous SOC Sensor
                </div>
              </div>
            </div>

            {/* Live Status Beacon & Block Coordinates */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-[4px] bg-slate-900 border border-slate-800">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <div>
                <div className="text-[11px] font-bold text-white tracking-wider">
                  CONSENSUS ARMED // BLOCK #8492 VERIFIED
                </div>
                <div className="text-[9px] text-slate-500 tracking-tighter font-mono">
                  NODE_ID: 0x4F8B91A2 // MERKLE ROOT: 0x7E3A9C [ACTIVE]
                </div>
              </div>
            </div>
          </div>

          {/* F. Hero Forensic Telemetry Showcase */}
          <div className="mt-12 max-w-5xl mx-auto">
            <div className="rounded-[6px] bg-[#090E17] border border-slate-800 shadow-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-300" />
                  <span className="text-white font-bold">LIVE FORENSIC INCIDENT TRIAGE</span>
                  <span className="px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/80 text-[10px]">
                    FRAUD SCORE 88 / 100 — PHISHING & BEC
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 hidden sm:block">
                  SHA-256: 4f8b91a2e3...09b8
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                {/* Panel 1 */}
                <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold mb-2">RFC Header Authentication</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">SPF Record:</span>
                      <span className="text-red-400 font-bold">FAIL (SoftFail IP 185.220.x)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">DKIM Signature:</span>
                      <span className="text-amber-400 font-bold">INVALID (Selector Mismatch)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">DMARC Policy:</span>
                      <span className="text-red-400 font-bold">REJECT (Unaligned)</span>
                    </div>
                  </div>
                </div>

                {/* Panel 2 */}
                <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold mb-2">Optical & Content Vectors</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">QR Quishing:</span>
                      <span className="text-red-400 font-bold">DETECTED (pyzbar)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Redirect Resolved:</span>
                      <span className="text-slate-200">auth-login-sec.xyz</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">NLP Urgency:</span>
                      <span className="text-amber-400 font-bold">0.94 Credential Harvest</span>
                    </div>
                  </div>
                </div>

                {/* Panel 3 */}
                <div className="p-3 rounded bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold mb-2">Infrastructure & Origin</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Attributing Origin:</span>
                      <span className="text-slate-200">Sofia, Bulgaria (BG)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ASN / ISP:</span>
                      <span className="text-slate-200">AS49981 WorldStream</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Domain Age:</span>
                      <span className="text-red-400 font-bold">3 days old (Newly Reg)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM STATEMENT: THE THREAT LANDSCAPE */}
      <section className="py-20 bg-[#080D18] border-y border-slate-800 relative">
        <BlockchainTexture opacity={0.12} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-3">Threat Landscape Reality</h2>
            <ScrollReveal
              baseOpacity={0.12}
              enableBlur={true}
              baseRotation={2}
              blurStrength={6}
              containerClassName="my-4"
              textClassName="text-2xl sm:text-3xl lg:text-4xl font-mono font-bold text-white tracking-tight leading-snug"
            >
              Adversaries evade perimeter filters by authenticating through compromised identity portals, forged upstream relay hops, and optical lure vectors.
            </ScrollReveal>
            <p className="mt-4 text-xs text-slate-400 font-sans leading-relaxed max-w-2xl mx-auto">
              Standard email filters check static blacklists and keywords. Adversaries have evolved beyond simple spam:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors">
              <div className="text-3xl font-bold font-mono text-white mb-2">3.4B+</div>
              <h4 className="text-xs font-bold font-mono text-slate-300 uppercase mb-1">Phishing Emails / Day</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Over 3 billion phishing emails are dispatched daily across global infrastructure, overwhelming static filters.
              </p>
            </div>

            <div className="p-5 rounded bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors">
              <div className="text-3xl font-bold font-mono text-amber-400 mb-2">91%</div>
              <h4 className="text-xs font-bold font-mono text-slate-300 uppercase mb-1">Targeted Cyberattacks</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Nine out of ten advanced persistent threats and ransomware deployments begin with a deceptive email lure.
              </p>
            </div>

            <div className="p-5 rounded bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors">
              <div className="text-3xl font-bold font-mono text-red-400 mb-2">51%</div>
              <h4 className="text-xs font-bold font-mono text-slate-300 uppercase mb-1">Rise in Quishing Attacks</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Attackers embed credential links inside image-only QR codes and screenshots to completely blind text-only spam analyzers.
              </p>
            </div>

            <div className="p-5 rounded bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors">
              <div className="text-3xl font-bold font-mono text-slate-200 mb-2">0 Explanations</div>
              <h4 className="text-xs font-bold font-mono text-slate-300 uppercase mb-1">Black-Box Dilemma</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Legacy gateway filters provide zero evidence or audit trails, leaving analysts incapable of defending verdicts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE CAPABILITIES / FEATURES GRID */}
      <section id="features" className="py-24 relative">
        <BlockchainTexture opacity={0.15} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">Forensic Capabilities</h2>
            <ScrollReveal
              baseOpacity={0.15}
              enableBlur={true}
              baseRotation={2}
              blurStrength={5}
              containerClassName="my-2"
              textClassName="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono text-white tracking-tight leading-snug"
            >
              Six Specialized Forensic Signal Engines
            </ScrollReveal>
            <p className="mt-3 text-xs text-slate-400 font-sans">
              Every analyzed email undergoes multi-layer forensic decomposition before scoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded bg-[#090E17] border border-slate-800 hover:border-slate-600 transition-colors group">
              <div className="p-2.5 rounded bg-slate-800 text-slate-200 w-fit mb-4 group-hover:scale-105 transition-transform">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white mb-2">Header & Relay Hop Forensics</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Reconstructs the full Received chain server by server. Validates SPF, DKIM, and DMARC alignment, detects clock skew anomalies, and exposes reply-to diversion attacks.
              </p>
            </div>

            <div className="p-6 rounded bg-[#090E17] border border-slate-800 hover:border-slate-600 transition-colors group">
              <div className="p-2.5 rounded bg-slate-800 text-slate-200 w-fit mb-4 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white mb-2">Multi-Signal NLP Classifier</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Trained scikit-learn models evaluate urgency signals, financial diversion phrases, credential harvesting cues, and Bayesian comment poisoning evasion techniques.
              </p>
            </div>

            <div className="p-6 rounded bg-[#090E17] border border-slate-800 hover:border-slate-600 transition-colors group">
              <div className="p-2.5 rounded bg-slate-800 text-slate-200 w-fit mb-4 group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white mb-2">Optical QR & Quishing Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Scans attachments and embedded inline images with pyzbar. Decodes QR payloads, traverses HTTP redirect chains safely, and extracts lure text via Tesseract OCR.
              </p>
            </div>

            <div className="p-6 rounded bg-[#090E17] border border-slate-800 hover:border-slate-600 transition-colors group">
              <div className="p-2.5 rounded bg-slate-800 text-slate-200 w-fit mb-4 group-hover:scale-105 transition-transform">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white mb-2">Geolocation & Origin Attribution</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Inspects originating client IP addresses with MaxMind GeoLite2 databases. Flags VPN/Tor exit nodes, datacenter relays, and newly registered malicious domains.
              </p>
            </div>

            <div className="p-6 rounded bg-[#090E17] border border-slate-800 hover:border-slate-600 transition-colors group">
              <div className="p-2.5 rounded bg-slate-800 text-slate-200 w-fit mb-4 group-hover:scale-105 transition-transform">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white mb-2">Campaign Graph Correlation</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Interactive d3-force network graph clusters disparate cases sharing threat infrastructure (IP ranges, domain families, body hashes, or attack signatures).
              </p>
            </div>

            <div className="p-6 rounded bg-[#090E17] border border-slate-800 hover:border-slate-600 transition-colors group">
              <div className="p-2.5 rounded bg-slate-800 text-slate-200 w-fit mb-4 group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white mb-2">Autonomous Live Mailbox Sensor</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Continuously polls connected Gmail accounts using read-only scopes. Delivers zero-delay threat alerts directly to the SOC console via Server-Sent Events (SSE).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FORENSIC PIPELINE — HOW IT WORKS */}
      <section id="pipeline" className="py-20 bg-[#070C16] border-y border-slate-800 relative">
        <BlockchainTexture opacity={0.12} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">Pipeline Architecture</h2>
            <ScrollReveal
              baseOpacity={0.15}
              enableBlur={true}
              baseRotation={2}
              blurStrength={5}
              containerClassName="my-2"
              textClassName="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono text-white tracking-tight leading-snug"
            >
              End-to-End Forensic Execution Flow
            </ScrollReveal>
            <p className="mt-3 text-xs text-slate-400 font-sans">
              From raw RFC 5322 bytes to court-admissible forensic audit evidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono text-xs">
            <div className="p-4 rounded bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-white font-bold text-sm">01. INGESTION</span>
                <p className="text-slate-300 font-medium mt-2">MIME Parsing & Hashing</p>
                <p className="text-[11px] text-slate-400 font-sans mt-1">
                  SHA-256 evidence hashing, EML payload extraction, comment stripping.
                </p>
              </div>
              <div className="mt-4 text-[10px] text-slate-500">BytesParser / aiofiles</div>
            </div>

            <div className="p-4 rounded bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-white font-bold text-sm">02. HEADERS</span>
                <p className="text-slate-300 font-medium mt-2">Relay Path & Auth</p>
                <p className="text-[11px] text-slate-400 font-sans mt-1">
                  SPF verification, DKIM validation, DMARC alignment, timestamp sequence audit.
                </p>
              </div>
              <div className="mt-4 text-[10px] text-slate-500">RFC 5321 / RFC 7489</div>
            </div>

            <div className="p-4 rounded bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-white font-bold text-sm">03. CONTENT</span>
                <p className="text-slate-300 font-medium mt-2">NLP & Optical OCR</p>
                <p className="text-[11px] text-slate-400 font-sans mt-1">
                  pyzbar QR decoding, Tesseract OCR screenshot extraction, scikit-learn NLP.
                </p>
              </div>
              <div className="mt-4 text-[10px] text-slate-500">Scikit-learn / OpenCV</div>
            </div>

            <div className="p-4 rounded bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-white font-bold text-sm">04. ORIGIN</span>
                <p className="text-slate-300 font-medium mt-2">Geo & Domain Intel</p>
                <p className="text-[11px] text-slate-400 font-sans mt-1">
                  MaxMind GeoLite2 lookup, ASN classification, domain registration age analysis.
                </p>
              </div>
              <div className="mt-4 text-[10px] text-slate-500">GeoLite2 / AbuseIPDB</div>
            </div>

            <div className="p-4 rounded bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-white font-bold text-sm">05. FUSION</span>
                <p className="text-slate-300 font-medium mt-2">Score & Attribution</p>
                <p className="text-[11px] text-slate-400 font-sans mt-1">
                  Weighted signal fusion (0–100), campaign graph linking, PDF report export.
                </p>
              </div>
              <div className="mt-4 text-[10px] text-slate-500">D3-Force / AuditLog</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. REAL-TIME GMAIL SENSOR */}
      <section id="sensor" className="py-24 relative">
        <BlockchainTexture opacity={0.14} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono mb-4">
                <Radio className="w-3.5 h-3.5 text-slate-300" />
                <span>REAL-TIME SENSOR INTEGRATION</span>
              </div>
              <ScrollReveal
                baseOpacity={0.15}
                enableBlur={true}
                baseRotation={2}
                blurStrength={5}
                containerClassName="my-2"
                textClassName="text-3xl sm:text-4xl font-bold font-mono text-white leading-tight max-w-md"
              >
                Connect Once. Monitor Continuously.
              </ScrollReveal>
              <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                MailTrace connects directly to institutional Google Workspace and Gmail inboxes using strictly read-only authorization. Incoming emails are streamed into the forensic pipeline with zero user disruption.
              </p>

              <div className="mt-6 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-3 p-3 rounded bg-[#090E17] border border-slate-800">
                  <Lock className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="text-slate-300">Strictly <span className="text-white font-semibold">gmail.readonly</span> — cannot alter or send mail</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded bg-[#090E17] border border-slate-800">
                  <Zap className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="text-slate-300">Background APScheduler sync with History API</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded bg-[#090E17] border border-slate-800">
                  <Activity className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="text-slate-300">Zero-latency Server-Sent Events (SSE) notification stream</span>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/sign-up"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <span>Connect Mailbox Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Sensor visual panel */}
            <div className="rounded-[6px] bg-[#090E17] border border-slate-800 p-5 shadow-2xl font-mono text-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-300" />
                  <span className="text-white font-bold">LIVE MAILBOX THREAT FEED</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                  CONNECTED
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded bg-slate-950/80 border border-red-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-red-400 font-bold">URGENT: Payroll Account Re-verification</div>
                    <div className="text-[10px] text-slate-400">sender: hr-update@payroll-adp-secure.com</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-red-950 text-red-300 font-bold text-xs border border-red-800/80">92/100</span>
                </div>

                <div className="p-2.5 rounded bg-slate-950/80 border border-amber-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-amber-300 font-bold">Invoice #8849 Attached for Review</div>
                    <div className="text-[10px] text-slate-400">sender: billing@supplier-vendor-portal.net</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-amber-950 text-amber-300 font-bold text-xs border border-amber-800/80">68/100</span>
                </div>

                <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-slate-300 font-bold">Quarterly Engineering Sync Summary</div>
                    <div className="text-[10px] text-slate-400">sender: alex.rivera@organization.com</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-slate-900 text-slate-300 font-bold text-xs border border-slate-800">12/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. EXPLAINABLE DETECTION CASE STUDY */}
      <section id="explainability" className="py-20 bg-[#080D18] border-y border-slate-800 relative">
        <BlockchainTexture opacity={0.12} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">Explainability Principle</h2>
            <ScrollReveal
              baseOpacity={0.15}
              enableBlur={true}
              baseRotation={2}
              blurStrength={5}
              containerClassName="my-2"
              textClassName="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono text-white tracking-tight leading-snug"
            >
              Every Score Has a Verifiable Story
            </ScrollReveal>
            <p className="mt-3 text-xs text-slate-400 font-sans">
              Deterministic signal decomposition: every fraud classification publishes an auditable ledger with exact signal weights and verification telemetry.
            </p>
          </div>

          <div className="max-w-3xl mx-auto rounded-[6px] bg-[#090E17] border border-slate-800 p-6 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <span className="text-white font-bold">Signal Contribution Ledger</span>
              <span className="text-slate-300 font-bold">Cumulative Fraud Score: 87 / 100</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 font-bold">+35</span>
                  <span className="text-slate-300">SPF Failure with Sender Domain Impersonation</span>
                </div>
                <span className="text-[10px] text-slate-500">Header Engine</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 font-bold">+25</span>
                  <span className="text-slate-300">QR Code Embedded Lure Resolved to Credential Form</span>
                </div>
                <span className="text-[10px] text-slate-500">Quishing Engine</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">+15</span>
                  <span className="text-slate-300">Domain Registered 48 Hours Ago on High-Risk Registrar</span>
                </div>
                <span className="text-[10px] text-slate-500">Domain Intel</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">+12</span>
                  <span className="text-slate-300">NLP Urgency Tone: Financial Authority Impersonation</span>
                </div>
                <span className="text-[10px] text-slate-500">NLP Classifier</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-sans leading-relaxed">
              <strong className="text-white font-mono">Verdict:</strong> High confidence credential-harvesting phishing campaign utilizing visual QR code obfuscation and relay spoofing.
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRIVACY & SECURITY INTEGRITY */}
      <section id="security" className="py-24 relative">
        <BlockchainTexture opacity={0.12} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">Security Architecture</h2>
            <ScrollReveal
              baseOpacity={0.15}
              enableBlur={true}
              baseRotation={2}
              blurStrength={5}
              containerClassName="my-2"
              textClassName="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono text-white tracking-tight leading-snug"
            >
              Institutional-Grade Privacy Controls
            </ScrollReveal>
          </div>

          {/* Institutional Security Specification Matrix (Segmented Console) */}
          <div className="rounded-[6px] bg-[#090E17] border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs">
            {/* Console Spec Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-bold text-slate-200 tracking-wider">
                  SECURITY & PRIVACY SPECIFICATION MATRIX
                </span>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] text-slate-400 border border-slate-700">
                  NIST SP 800-86
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span>ENCRYPTION: <strong className="text-slate-200">AES-256-CBC</strong></span>
                <span className="text-slate-700">|</span>
                <span>AUDIT: <strong className="text-emerald-400">IMMUTABLE_LOG</strong></span>
              </div>
            </div>

            {/* 3-Segment Architecture Ledger */}
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* Segment 1 */}
              <div className="p-6 flex flex-col justify-between hover:bg-slate-900/30 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-[4px] bg-slate-900 border border-slate-700 text-slate-200">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                      FERNET / AES-128
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Cryptographic Key Isolation</h4>
                  <p className="text-slate-400 font-sans text-xs leading-relaxed">
                    OAuth refresh tokens and credentials are encrypted using Fernet envelopes (AES-128-CBC + HMAC-SHA256). Sensitive tokens are never committed to disk unencrypted or printed in stdout telemetry.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>KEY SPEC</span>
                  <span className="text-slate-300 font-mono">128-bit IV // URL-Safe Key</span>
                </div>
              </div>

              {/* Segment 2 */}
              <div className="p-6 flex flex-col justify-between hover:bg-slate-900/30 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-[4px] bg-slate-900 border border-slate-700 text-slate-200">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                      LIFECYCLE ENFORCED
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Configurable Data Lifecycle</h4>
                  <p className="text-slate-400 font-sans text-xs leading-relaxed">
                    Automated data retention schedules enforce deterministic purging of raw MIME bodies, attachment buffers, and decoded OCR lures based on institutional policy (30, 60, or 90 days).
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>SCHEDULE</span>
                  <span className="text-slate-300 font-mono">Automated Cron Purge</span>
                </div>
              </div>

              {/* Segment 3 */}
              <div className="p-6 flex flex-col justify-between hover:bg-slate-900/30 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-[4px] bg-slate-900 border border-slate-700 text-slate-200">
                      <FileSearch className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                      CHAIN-OF-CUSTODY
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">Tamper-Evident Audit Ledger</h4>
                  <p className="text-slate-400 font-sans text-xs leading-relaxed">
                    Every analyst case opening, triage judgment, PDF dossier export, and purge event is logged to an immutable SQLite/PostgreSQL audit trail with cryptographically linked evidence hashes.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span>AUDIT SCHEMA</span>
                  <span className="text-slate-300 font-mono">Append-Only // SHA-256</span>
                </div>
              </div>
            </div>

            {/* Console Spec Footer Bar */}
            <div className="px-5 py-2.5 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-400">All institutional safeguards active and verifiable in runtime ledger</span>
              </div>
              <span className="text-slate-500 font-mono">ZERO UNENCRYPTED TOKEN PERSISTENCE</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8.5. INTERACTIVE FORENSIC CAPABILITIES STREAM */}
      <section id="capabilities-stream" className="relative">
        <ScrollAnimation
          title="you can"
          subtitle="trace."
        />
      </section>

      {/* 9. FINAL CTA & FOOTER (SOLID DARK - NO COLORFUL GRADIENTS) */}
      <section className="py-20 bg-[#070C16] border-t border-slate-800 relative">
        <BlockchainTexture opacity={0.16} />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <ScrollReveal
            baseOpacity={0.15}
            enableBlur={true}
            baseRotation={2}
            blurStrength={5}
            containerClassName="my-2"
            textClassName="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight"
          >
            Ready to Protect Your Infrastructure?
          </ScrollReveal>
          <p className="mt-4 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-sans leading-relaxed">
            Deploy MailTrace to unmask deceptive senders, inspect optical lures, and attribute adversarial infrastructure.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 font-mono text-xs">
            <Link to="/sign-up" className="w-full sm:w-auto">
              <SpecularButton
                size="lg"
                radius={6}
                tint="#ffffff"
                tintOpacity={0.15}
                blur={4}
                textColor="#ffffff"
                lineColor="#94a3b8"
                baseColor="#1e293b"
                intensity={1.2}
                shineSize={16}
                shineFade={35}
                thickness={1}
                speed={0.4}
                followMouse={true}
                proximity={250}
                className="w-full sm:w-auto font-mono text-xs font-bold uppercase tracking-wider shadow-xl shadow-black/60"
              >
                <span className="flex items-center gap-2">
                  Create Free Account
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </span>
              </SpecularButton>
            </Link>
            <Link to="/sign-in" className="w-full sm:w-auto">
              <SpecularButton
                size="lg"
                radius={6}
                tint="#ffffff"
                tintOpacity={0.06}
                blur={3}
                textColor="#cbd5e1"
                lineColor="#64748b"
                baseColor="#0f172a"
                intensity={1.0}
                shineSize={14}
                shineFade={30}
                thickness={1}
                speed={0.35}
                followMouse={true}
                proximity={200}
                className="w-full sm:w-auto font-mono text-xs font-medium uppercase tracking-wider"
              >
                <span>Operator Sign In</span>
              </SpecularButton>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-6 border-t border-slate-800 bg-[#05080E] text-center font-mono text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            MAIL<span className="text-slate-300">TRACE</span> Forensic Station • v2.0
          </div>
          <div>
            NIST SP 800-86 Compliant Forensic Pipeline
          </div>
        </div>
      </footer>
    </div>
  );
};

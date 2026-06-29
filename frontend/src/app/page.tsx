"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ArrowRight, Brain, Search, FileText, Zap, ChevronRight, 
  Database, Server, Cloud, Shield, Target, Code, Cpu, LineChart, 
  Users, ExternalLink, Activity, Menu, X
} from "lucide-react";

import SpotlightCard from "@/components/interactions/SpotlightCard";

// --- Components ---

const CountUp = ({ end, duration = 2, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold: 0.5 });
    
    if (nodeRef.current) observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView) {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [inView, end, duration]);

  return <span ref={nodeRef}>{count}{suffix}</span>;
};

// --- Main Page ---

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Typing effect keywords
  const keywords = [
    "Research Gaps", "Novel Ideas", "Future Directions", "Hidden Patterns", 
    "Scientific Insights", "Knowledge Graphs", "Evidence", "Research Opportunities", 
    "Innovation Paths", "Cross-Domain Links", "Missing Connections", 
    "Emerging Trends", "Literature Intelligence", "Breakthrough Ideas"
  ];
  const [currentKeyword, setCurrentKeyword] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentKeyword((prev) => (prev + 1) % keywords.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [keywords.length]);

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/30 overflow-x-hidden">
      {/* Background Animated Gradient & Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div style={{ y }} className="absolute inset-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1], 
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[150px] mix-blend-screen" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1], 
              opacity: [0.3, 0.6, 0.3],
              rotate: [0, -90, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[150px] mix-blend-screen" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1], 
              opacity: [0.2, 0.4, 0.2],
              x: [0, 100, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[120px] mix-blend-screen" 
          />
        </motion.div>
        {/* Subtle grid pattern & noise */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 w-full px-6 py-4 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group relative z-[60]" data-cursor="hover">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">Gap Analyzer</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex gap-4 items-center">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-cursor="hover">Features</Link>
            <Link href="#architecture" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-cursor="hover">Architecture</Link>
              <Link 
                href="/dashboard"
                className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all flex items-center gap-2 glow-primary shadow-lg shadow-primary/20"
                data-cursor="hover"
              >
                Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
          </div>

          {/* Mobile Nav Toggle */}
          <button 
            className="md:hidden relative z-[60] p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-3xl md:hidden flex flex-col items-center justify-center gap-8"
          >
            <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold tracking-tight">Features</Link>
            <Link href="#workflow" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold tracking-tight">Workflow</Link>
            <Link href="#architecture" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold tracking-tight">Architecture</Link>
            <Link 
              href="/dashboard"
              className="mt-4 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-lg flex items-center gap-2 w-[90vw] max-w-[340px] justify-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="flex flex-col items-center">
        
        {/* --- 1. HERO SECTION --- */}
        <section className="relative w-full max-w-7xl mx-auto px-6 pt-32 md:pt-40 pb-24 md:pb-32 flex flex-col items-center justify-center text-center min-h-[90vh]">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="z-10 flex flex-col items-center w-full">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-primary/30 bg-primary/10 mb-6 md:mb-8 text-xs md:text-sm font-medium text-primary backdrop-blur-md transition-colors cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.15)]" data-cursor="hover">
              <SparklesIcon className="w-4 h-4" /> Next-Gen Agentic RAG Architecture
            </div>
            
            <h1 className="text-[clamp(2.5rem,8vw,5.5rem)] font-bold tracking-tighter mb-6 md:mb-8 leading-[1.1] flex flex-col items-center w-full justify-center max-w-[95vw] md:max-w-none text-balance">
              <span className="text-center mb-1 md:mb-4">Turn Thousands of Papers</span>
              <span className="flex items-center justify-center flex-wrap gap-x-3 md:gap-x-6 w-full">
                <span className="whitespace-nowrap">Into One Clear</span>
                <span className="text-gradient relative flex justify-center text-center h-[1.2em] items-center min-w-max">
                  {/* Invisible placeholder for max width/height to strictly prevent layout shift. */}
                  <span className="invisible whitespace-nowrap pointer-events-none">Research Opportunities.</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentKeyword}
                      initial={{ opacity: 0, filter: "blur(8px)", y: 20 }}
                      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                      exit={{ opacity: 0, filter: "blur(8px)", y: -20 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-1/2 -translate-x-1/2 md:left-0 md:-translate-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap"
                    >
                      {keywords[currentKeyword]}.
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>
            </h1>
            
            <p className="text-base md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed text-balance px-4">
              Upload research papers and let autonomous AI agents analyze global literature, connect evidence across multiple sources, and uncover novel research opportunities in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full px-4">
              <div className="w-full sm:w-auto @media(hover:hover):block">
                  <Link href="/dashboard" data-cursor="hover" className="w-full sm:w-auto px-8 py-4 min-h-[48px] rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 glow-primary shadow-[0_0_40px_rgba(139,92,246,0.3)]">
                    Start Research <ArrowRight className="w-5 h-5" />
                  </Link>
              </div>
              <div className="w-full sm:w-auto @media(hover:hover):block">
                  <a href="#workflow" data-cursor="hover" className="w-full sm:w-auto px-8 py-4 min-h-[48px] rounded-full glass font-semibold text-lg hover:bg-card-hover hover:scale-[1.02] transition-all flex items-center justify-center gap-2 border border-border/50">
                    Explore Workflow
                  </a>
              </div>
            </div>
          </motion.div>
          
          <motion.div style={{ opacity: useTransform(scrollYProgress, [0, 0.05], [1, 0]) }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
              <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
            </div>
          </motion.div>
        </section>

        {/* --- 2. STATISTICS --- */}
        <section className="w-full border-y border-border/50 bg-card/30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border/50 text-center">
              <div className="flex flex-col items-center pt-4 sm:pt-0">
                <span className="text-4xl font-bold text-foreground mb-1"><CountUp end={215} suffix="M+" /></span>
                <span className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">Searchable Papers</span>
              </div>
              <div className="flex flex-col items-center pt-4 sm:pt-0">
                <span className="text-4xl font-bold text-primary mb-1"><CountUp end={4} /></span>
                <span className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">API Providers</span>
              </div>
              <div className="flex flex-col items-center pt-4 sm:pt-0">
                <span className="text-4xl font-bold text-accent mb-1"><CountUp end={70} suffix="B" /></span>
                <span className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">LLM Parameters</span>
              </div>
              <div className="flex flex-col items-center pt-4 sm:pt-0">
                <span className="text-4xl font-bold text-foreground mb-1"><CountUp end={98} suffix="%" /></span>
                <span className="text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-wider">Retrieval Accuracy</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- 3. FEATURES GRID --- */}
        <section id="features" className="w-full max-w-7xl mx-auto px-6 py-32 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-20 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Supercharge your Literature Review.</h2>
            <p className="text-muted-foreground text-lg">Stop reading hundreds of papers manually. Let our system extract methodologies, results, and limitations to give you a structural overview of your field.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Search, color: "text-primary", bg: "bg-primary/20", title: "Multi-Source RAG", desc: "Simultaneously queries Semantic Scholar, arXiv, OpenAlex, and your uploaded documents to build comprehensive context." },
              { icon: Brain, color: "text-accent", bg: "bg-accent/20", title: "Agentic Synthesis", desc: "Planner agents decompose complex research queries, orchestrate concurrent searches, and seamlessly merge deduplicated contexts." },
              { icon: FileText, color: "text-purple-500", bg: "bg-purple-500/20", title: "Automated Reporting", desc: "Generates heavily structured Markdown and PDF reports with automated citation mapping, extracting methodologies and datasets." },
              { icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/20", title: "Gap Inference", desc: "Analyzes recurring limitations and authors' future work sections to infer novel, previously unexplored research directions." },
              { icon: Shield, color: "text-red-500", bg: "bg-red-500/20", title: "Contradiction Detection", desc: "Automatically flags studies that contradict each other on empirical results, sample sizes, or baseline comparisons." },
              { icon: Database, color: "text-blue-500", bg: "bg-blue-500/20", title: "Vector Search", desc: "Uses Qdrant for blazing fast semantic similarity search across chunked PDFs, ensuring high recall for local literature." }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="h-full"
              >
                <SpotlightCard className="h-full glass-card p-6 md:p-8 rounded-3xl border border-border/40 hover:border-primary/30 transition-colors">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                    <f.icon className={`w-6 h-6 md:w-7 md:h-7 ${f.color}`} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">{f.desc}</p>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity -translate-x-0 md:-translate-x-2 md:group-hover:translate-x-0">
                    Explore Feature <ChevronRight className="w-4 h-4" />
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- 4. WORKFLOW SECTION --- */}
        <section id="workflow" className="w-full py-32 bg-card/20 border-y border-border/50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-3xl md:text-5xl font-bold mb-16"
            >
              The Agentic RAG Pipeline
            </motion.h2>
            
            <div className="relative max-w-4xl mx-auto">
              {/* Scrolling drawn line */}
              <motion.div 
                className="absolute top-0 bottom-0 left-6 md:left-1/2 md:-translate-x-1/2 w-0.5 bg-gradient-to-b from-primary via-accent to-primary" 
                style={{ 
                  scaleY: useTransform(scrollYProgress, [0.3, 0.7], [0, 1]),
                  transformOrigin: "top center"
                }}
              />
              {/* Faded background line track */}
              <div className="absolute top-0 bottom-0 left-6 md:left-1/2 md:-translate-x-1/2 w-0.5 bg-border/30" />
              
              {[
                { title: "Query Understanding", desc: "LLM analyzes intent and extracts key entities.", icon: Brain, color: "text-primary", align: "right" },
                { title: "Planner Agent", desc: "Generates an execution graph of necessary searches.", icon: Activity, color: "text-accent", align: "left" },
                { title: "Concurrent Retrieval", desc: "Local Qdrant RAG + OpenAlex + ArXiv + Semantic Scholar.", icon: Database, color: "text-emerald-500", align: "right" },
                { title: "Context Merger", desc: "Deduplicates findings, ranks by relevance, formats citations.", icon: LayersIcon, color: "text-purple-500", align: "left" },
                { title: "Research Analyzer", desc: "Groq Llama-3 infers gaps and detects contradictions.", icon: Target, color: "text-red-500", align: "right" },
                { title: "Final Output", gap: false, desc: "JSON Dashboard Updates + PDF Report Generation.", icon: FileText, color: "text-blue-500", align: "left" }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`flex flex-row md:items-center gap-6 md:gap-8 mb-12 relative ${step.align === "left" ? "md:flex-row-reverse" : ""}`}
                >
                  {/* Left spacer for desktop left items, content for right items */}
                  <div className={`flex-1 text-left ${step.align === "left" ? "md:text-left hidden md:block" : "md:text-right hidden md:block"}`}>
                    {step.align === "right" && (
                      <>
                        <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{step.title}</h3>
                        <p className="text-sm md:text-base text-muted-foreground">{step.desc}</p>
                      </>
                    )}
                  </div>

                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full bg-background border-2 border-primary/30 shadow-[0_0_20px_rgba(139,92,246,0.1)] flex items-center justify-center z-10 relative group hover:border-primary transition-colors cursor-pointer"
                    data-cursor="hover"
                  >
                    <step.icon className={`w-5 h-5 md:w-7 md:h-7 ${step.color} group-hover:scale-110 transition-transform`} />
                  </motion.div>

                  {/* Right content for mobile, left content for desktop left items */}
                  <div className={`flex-1 text-left ${step.align === "left" ? "md:text-left block" : "md:text-right block md:hidden"}`}>
                    <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{step.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 5. TECH STACK --- */}
        <section id="architecture" className="w-full max-w-7xl mx-auto px-6 py-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Enterprise-Grade Stack</h2>
            <p className="text-muted-foreground text-lg">Built on scalable, modern infrastructure.</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Next.js 15", category: "Frontend", icon: Code },
              { name: "FastAPI", category: "Backend", icon: Server },
              { name: "Neon Postgres", category: "Database", icon: Database },
              { name: "Qdrant", category: "Vector DB", icon: Target },
              { name: "Supabase", category: "Storage", icon: Cloud },
              { name: "Groq", category: "Inference", icon: Cpu },
              { name: "Zustand", category: "State", icon: LayersIcon },
              { name: "Upstash Redis", category: "Cache", icon: Zap }
            ].map((tech, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6 flex flex-col items-center text-center group hover:bg-card/80 transition-colors"
              >
                <tech.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-lg mb-1">{tech.name}</h4>
                <span className="text-xs text-muted-foreground uppercase tracking-widest">{tech.category}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- 6. HIGHLIGHTS --- */}
        <section className="w-full py-32 bg-primary/5 border-y border-border/50">
          <div className="max-w-7xl mx-auto px-6">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-3xl md:text-5xl font-bold mb-16 text-center"
            >
              Platform Capabilities
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="glass-panel p-8 rounded-3xl"
              >
                <LineChart className="w-10 h-10 text-accent mb-6" />
                <h3 className="text-2xl font-bold mb-4">Semantic Meta-Analysis</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Unlike keyword-based search engines, our vector-based approach understands the semantics of methodologies. If you ask for papers using "Transformer models for EEG", it will find studies using "attention mechanisms on neural time-series" even if the keywords differ.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-emerald-500" /> Dense retrieval via Qdrant</li>
                  <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-emerald-500" /> Cross-encoder re-ranking</li>
                </ul>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="glass-panel p-8 rounded-3xl"
              >
                <Users className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-2xl font-bold mb-4">Autonomous Literature Mapping</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Provide a single high-level query like "Find gaps in federated learning for healthcare". The planner agent will autonomously query PubMed, ArXiv, and OpenAlex, download abstracts, cross-reference them, and present a structured map of unexplored territory.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-emerald-500" /> Multi-agent orchestration</li>
                  <li className="flex items-center gap-3"><CheckIcon className="w-5 h-5 text-emerald-500" /> Automated deduplication</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* --- 7. FOOTER --- */}
      <footer className="w-full bg-background border-t border-border/50 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-primary" />
                <span className="font-bold text-xl">Gap Analyzer</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                An advanced AI research assistant powered by Agentic RAG, designed to synthesize literature and identify novel research gaps.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4"></path></svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><Link href="/upload" className="hover:text-primary transition-colors">Upload PDFs</Link></li>
                <li><Link href="/reports" className="hover:text-primary transition-colors">Reports</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Technology</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>FastAPI Backend</li>
                <li>Next.js Frontend</li>
                <li>Qdrant Vector Store</li>
                <li>Neon PostgreSQL</li>
                <li>Llama 3 (Groq)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal & Meta</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Use</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><span className="text-xs bg-muted px-2 py-1 rounded">v1.0.0</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2026 Research Gap Analyzer. All Rights Reserved.</p>
            <p>Built using Agentic RAG, Next.js, and GROQ.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper icons
function SparklesIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function LayersIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>
}

function CheckIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}

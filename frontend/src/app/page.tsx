"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Brain, Search, FileText, Zap, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px]" />

      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10 glass-panel mt-4 rounded-full">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          <span className="font-bold text-xl text-foreground">Gap Analyzer</span>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/dashboard"
            className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center z-10 mt-20 mb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          <div className="inline-block px-4 py-1.5 rounded-full border border-border bg-card mb-6 text-sm font-medium text-muted-foreground backdrop-blur-md">
            🚀 Introducing the ultimate AI research assistant
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Discover <span className="text-gradient">Research Gaps</span> <br />
            in Seconds.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Upload your PDFs, let our multi-agent AI system synthesize the literature, 
            and uncover hidden contradictions and novel research directions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:scale-105 transition-transform flex items-center gap-2 glow-primary"
            >
              Start Analyzing
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 rounded-full glass font-semibold text-lg hover:bg-card-hover transition-colors"
            >
              Learn More
            </a>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          id="features"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full"
        >
          <motion.div variants={itemVariants} className="glass-card p-8 text-left">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Multi-Source RAG</h3>
            <p className="text-muted-foreground leading-relaxed">
              We query Semantic Scholar, arXiv, OpenAlex, and your own uploaded PDFs simultaneously to build a comprehensive context.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-card p-8 text-left">
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-3">Agentic Synthesis</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our planner agents break down your queries, execute searches, and merge contexts to identify exact contradictions.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="glass-card p-8 text-left">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-6">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Automated Reports</h3>
            <p className="text-muted-foreground leading-relaxed">
              Generate structured Markdown or PDF reports summarizing methodologies, limitations, and inferred research gaps.
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/50 py-8 text-center text-muted-foreground z-10 glass">
        <p>© 2026 Research Gap Analyzer. All rights reserved.</p>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import {
  Sparkles,
  Camera,
  Receipt,
  ScanLine,
  Mic,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Package,
  Bot,
} from "lucide-react";

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-[#fcfcf9] text-stone-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#fcfcf9]/90 border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" href="/" />
            <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Meta Hackathon Edition
            </span>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-stone-600 hover:text-stone-900 px-3 py-2 rounded-lg transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all shadow-emerald-700/20"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))]" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-8">
            <Bot className="h-4 w-4 text-emerald-700" />
            Powered by Meta Muse Spark, SAM 3.1 & Llama 3.2 Vision
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-900 max-w-4xl mx-auto leading-[1.12]">
            Your Home Knows <br className="hidden sm:block" />
            <span className="text-emerald-700 underline decoration-emerald-300 underline-offset-4">
              What It Needs.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Stop buying what you already own. RepeatLess AI observes your groceries,
            monitors household consumption, and autonomously prepares your personalized
            weekly shopping list.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-base font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-700/25 transition-all hover:scale-[1.02]"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-base font-medium px-7 py-3.5 rounded-xl shadow-sm transition-all"
            >
              Sign In to Household
            </Link>
          </div>

          {/* Interactive Workflow Banner */}
          <div className="mt-16 p-4 sm:p-6 rounded-2xl bg-white border border-stone-200 shadow-xl shadow-stone-200/50 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Autonomous Grocery Lifecycle
                </span>
              </div>
              <span className="text-xs text-stone-400 font-mono">RepeatLess Engine v2.4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-4 text-center">
              {[
                { step: "1", title: "Capture Groceries", desc: "Snap photo or receipt", icon: Camera },
                { step: "2", title: "Understand Products", desc: "Meta Muse Spark vision", icon: Bot },
                { step: "3", title: "Update Inventory", desc: "Automatic categorization", icon: Package },
                { step: "4", title: "Predict Restocking", desc: "Deterministic burn rate", icon: TrendingUp },
                { step: "5", title: "Generate Shopping List", desc: "Ready for checkout", icon: CheckCircle2 },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all flex flex-col items-center"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs mb-2">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-800">{item.title}</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-20 bg-stone-50 border-y border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Intelligent Household Management
            </h2>
            <h3 className="text-3xl font-bold tracking-tight text-stone-900 mt-2">
              Engineered with Meta Multimodal AI
            </h3>
            <p className="mt-3 text-stone-600 text-sm">
              From shelf photos to receipt recognition, eliminate food waste and repetitive shopping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5">
                <Camera className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-stone-900">AI Grocery Photo Recognition</h4>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                Take a picture of grocery bags on your kitchen counter. Meta Muse Spark extracts
                visible brand names, categories, quantities, and packaging units without assuming
                hidden items.
              </p>
              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> User confirmation before saving
              </div>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5">
                <Receipt className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-stone-900">Smart Receipt OCR & Pricing</h4>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                Upload grocery paper slips. Meta Muse Spark parses individual line items, quantities,
                and store pricing, automatically populating purchase history and monthly spending summaries.
              </p>
              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Accurate spending estimates
              </div>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5">
                <ScanLine className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-stone-900">Visual Pantry Intelligence (SAM 3.1)</h4>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                Scan refrigerator or cupboard shelves. Meta SAM 3.1 visually segments object instances,
                flags duplicate items, and politely reminds you to check opaque jars or oil containers.
              </p>
              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Object-level spatial coordinates
              </div>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-stone-900">Deterministic Restock Engine</h4>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                No hallucinated inventory numbers. Transparent formulas analyze minimum thresholds,
                household size, and historical burn rates to suggest exact replenishment quantities.
              </p>
              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Transparent mathematical logic
              </div>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5">
                <Mic className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-stone-900">Voice-Based Restocking</h4>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                Hands full while cooking? Speak naturally: &ldquo;I finished the olive oil and opened
                a new milk carton.&rdquo; Meta Muse Voice Transcribe parses intent and queues adjustments.
              </p>
              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Hands-free kitchen logging
              </div>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-stone-900">Household Collaboration</h4>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                Invite roommates, partners, or family members. Everyone sees live grocery quantities,
                shared restock checklists, and who bought what without duplicate purchases.
              </p>
              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Role-based household isolation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security and Privacy */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-emerald-950 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold mb-4">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Zero-Trust Household Data Isolation
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Your pantry data stays private to your home.
              </h3>
              <p className="mt-4 text-emerald-100/80 text-sm sm:text-base leading-relaxed">
                Every API endpoint enforces server-side cryptographic user validation, password hashing
                with bcrypt, strict Zod payload validation, and scoped household tenancy. Your images
                are never used to train public models without your explicit consent.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 text-xs font-medium text-emerald-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> HTTP-only Secure Cookies
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> MongoDB Injection Immunity
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Rate-limited Login Protection
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-50 py-12 text-sm text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" href="/" />
            <span className="text-xs">&copy; 2026 Meta Global AI Hackathon.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-stone-900 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-stone-900 transition-colors">
              Create Household
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

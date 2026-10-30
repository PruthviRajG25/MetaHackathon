"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Package,
  Camera,
  Receipt,
  ScanLine,
  ShoppingCart,
  History,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Mic,
} from "lucide-react";
import { VoiceRationAssistantModal } from "@/components/voice/VoiceRationAssistantModal";
import { Logo } from "@/components/brand/Logo";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Inventory", href: "/inventory", icon: Package },
  { name: "Voice Ration", href: "/inventory?voice=true", icon: Mic, badge: "Meta Voice" },
  { name: "Scan Groceries", href: "/scan-groceries", icon: Camera, badge: "Meta Vision" },
  { name: "Scan Receipt", href: "/scan-receipt", icon: Receipt },
  { name: "Visual Pantry", href: "/pantry", icon: ScanLine, badge: "SAM 3.1" },
  { name: "Shopping List", href: "/shopping-list", icon: ShoppingCart },
  { name: "Purchases", href: "/purchases", icon: History },
  { name: "Household", href: "/household", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isGlobalVoiceOpen, setIsGlobalVoiceOpen] = useState(false);
  const [autoStartVoice, setAutoStartVoice] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; householdName?: string } | null>(null);

  const handleOpenVoice = (autoStart = true) => {
    setAutoStartVoice(autoStart);
    setIsGlobalVoiceOpen(true);
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthenticated");
        return res.json();
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser({
            name: data.user.name,
            email: data.user.email,
            householdName: data.user.household?.name || "My Household",
          });
        }
      })
      .catch(() => {
        // If not authenticated, redirect to login
        router.push("/login");
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#fcfcf9] text-stone-900 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-stone-200 sticky top-0 z-40">
        <Logo size="sm" href="/dashboard" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenVoice(true)}
            className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center transition-all"
            title="Speak Ration Products"
          >
            <Mic className="h-4 w-4 text-emerald-700" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-stone-600 hover:bg-stone-100"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-stone-200/80 bg-white min-h-screen sticky top-0 h-screen overflow-y-auto">
        {/* Brand */}
        <div className="p-5 border-b border-stone-100">
          <Logo size="md" href="/dashboard" showTagline={true} />
        </div>

        {/* Household selector preview */}
        <div className="px-4 py-3 mx-3 my-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
          <div className="truncate">
            <span className="block text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
              Active Household
            </span>
            <span className="text-xs font-semibold text-stone-800 truncate block">
              {user?.householdName || "Loading Household..."}
            </span>
          </div>
          <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-700 text-white font-semibold shadow-sm shadow-emerald-700/20"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-stone-400"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-emerald-800 text-emerald-100"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-stone-100 mt-auto">
          <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-between">
            <div className="truncate">
              <span className="text-xs font-bold text-stone-900 block truncate">
                {user?.name || "Household Admin"}
              </span>
              <span className="text-[11px] text-stone-400 block truncate">
                {user?.email || "user@household.com"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex">
          <div className="w-4/5 max-w-xs bg-white h-full p-4 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <span className="font-bold text-stone-900 text-lg">
                RepeatLess<span className="text-emerald-700">.AI</span>
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-stone-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                      isActive ? "bg-emerald-700 text-white" : "text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-stone-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-rose-600 font-medium w-full py-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>

      {/* Floating Interactive Microphone Dock */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 group">
        <button
          onClick={() => handleOpenVoice(true)}
          className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-xl shadow-emerald-700/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-emerald-400/20 hover:ring-emerald-400/40"
          title="Click to speak household ration items"
        >
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full animate-ping" />
          <Mic className="h-6 w-6" />
        </button>
      </div>

      {/* Global Voice Ration Assistant Modal */}
      <VoiceRationAssistantModal
        isOpen={isGlobalVoiceOpen}
        onClose={() => setIsGlobalVoiceOpen(false)}
        onSuccess={() => router.refresh()}
        autoStartMicrophone={autoStartVoice}
      />
    </div>
  );
}

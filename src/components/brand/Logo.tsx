import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  href?: string;
}

export function Logo({
  size = "md",
  showText = true,
  showTagline = false,
  className,
  href,
}: LogoProps) {
  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
    xl: "h-14 w-14",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Brand Icon Image */}
      <div className={cn("relative shrink-0 rounded-2xl overflow-hidden shadow-sm shadow-emerald-900/10", iconSizes[size])}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-icon.svg"
          alt="RepeatLess AI Logo Icon"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={cn("font-black tracking-tight text-stone-900", textSizes[size])}>
              Repeat<span className="text-emerald-700">Less</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-700 text-white shadow-sm">
              AI
            </span>
          </div>

          {showTagline && (
            <span className="text-[10px] font-bold text-stone-400 tracking-wider uppercase mt-1">
              Autonomous Grocery Restocking
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

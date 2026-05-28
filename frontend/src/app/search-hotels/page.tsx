"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// ── 1. CONFIG & GLOBALS ──
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
);

const B = "#1447b8";
const YELLOW = "#FCD34D";
const NAVY = "#0f172a";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOWS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── 2. UTILITY FUNCTIONS ──
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check(); 
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getDaysInMonth(y: number, m: number): number { return new Date(y, m + 1, 0).getDate(); }
function getFirstDow(y: number, m: number): number { return new Date(y, m, 1).getDay(); }

// ── 3. STATIC DATA ASSETS ──
const TICKER_ITEMS = [
  { name: "Rahul M.", hotel: "Park Hyatt, Maldives", saved: "₹31,600", time: "Just now" },
  { name: "Priya S.", hotel: "Atlantis The Palm, Dubai", saved: "₹22,400", time: "4 min ago" },
  { name: "Vikram S.", hotel: "Burj Al Arab, Dubai", saved: "₹48,000", time: "11 min ago" },
  { name: "Neha R.", hotel: "Four Seasons, Bali", saved: "₹18,200", time: "23 min ago" },
  { name: "Arjun T.", hotel: "The Langham, London", saved: "₹26,200", time: "31 min ago" },
];

const DESTINATIONS = [
  { flag: "🇦🇪", city: "Dubai", country: "UAE", badge: "🔥 Hot", badgeColor: "#ef4444", badgeText: "#fff" },
  { flag: "🇮🇳", city: "New Delhi", country: "India", badge: "Member Deal", badgeColor: "#1447b8", badgeText: "#fff" },
  { flag: "🇸🇬", city: "Singapore", country: "Southeast Asia" },
  { flag: "🇮🇳", city: "Goa", country: "India", badge: "Most Popular", badgeColor: "#f59e0b", badgeText: "#1a1a1a" },
  { flag: "🇮🇩", city: "Bali", country: "Indonesia" },
  { flag: "🇮🇳", city: "Mumbai", country: "India" },
];

const HOTELS_BY_CITY: Record<string, Array<{name:string;loc:string;stars:number;rating:string;tags:string[];was:string;now:string;save:string;badges:[string,string][]}>> = {
  "All Hotels": [
    { name: "Atlantis The Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (32.4k)", tags: ["Waterpark","Beach","Resort"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", badges: [["Trending","trending"],["AI Watching","watching"]] },
    { name: "Four Seasons Bali", loc: "Bali, Indonesia", stars: 5, rating: "4.9 (8.1k)", tags: ["Jungle view","Spa","Yoga"], was: "₹29,200", now: "₹22,800", save: "Save ₹6,400", badges: [["Trending","trending"],["3.5% Off","off"]] },
    { name: "Marina Bay Sands", loc: "Singapore", stars: 5, rating: "4.7 (19.1k)", tags: ["Infinity pool","SkyPark","Casino"], was: "₹47,000", now: "₹34,600", save: "Save ₹12,400", badges: [["AI Watching","watching"],["4% Off","off"]] },
  ],
  "Dubai": [
    { name: "Atlantis The Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (32.4k)", tags: ["Waterpark","Beach"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", badges: [["Trending","trending"],["AI Watching","watching"]] },
    { name: "Burj Al Arab", loc: "Dubai, UAE", stars: 5, rating: "4.8 (12.3k)", tags: ["Iconic","Private beach"], was: "₹1,20,000", now: "₹84,000", save: "Save ₹36,000", badges: [["Luxury","luxury"],["AI Watching","watching"]] },
  ],
};

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  luxury: { bg: "#1e293b", color: "#fff" }, 
  best: { bg: "#16a34a", color: "#fff" },
  watching: { bg: "rgba(20,71,184,0.92)", color: "#fff" }, 
  trending: { bg: "#f59e0b", color: "#1a1a1a" }, 
  off: { bg: "#ef4444", color: "#fff" },
};

const CITY_FILTERS =

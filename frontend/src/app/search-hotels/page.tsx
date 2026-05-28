"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder"
);

const B = "#1447b8";
const YELLOW = "#FCD34D";
const NAVY = "#0f172a";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DOWS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Custom hook to detect mobile screen sizes
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
    };
    handleResize(); // run once on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDow(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const TICKER_ITEMS = [
  { name: "Rahul M.", hotel: "Park Hyatt, Maldives", saved: "₹31,600", time: "Just now" },
  { name: "Priya S.", hotel: "Atlantis The Palm, Dubai", saved: "₹22,400", time: "4 min ago" },
  { name: "Vikram S.", hotel: "Burj Al Arab, Dubai", saved: "₹48,000", time: "11 min ago" },
  { name: "Neha R.", hotel: "Four Seasons, Bali", saved: "₹18,200", time: "23 min ago" },
  { name: "Arjun T.", hotel: "The Langham, London", saved: "₹26,200", time: "31 min ago" },
];

const DESTINATIONS = [
  { flag: "🇦🇪", city: "Dubai", country: "UAE", img: "/images/dubai.jpg", badge: "🔥 Hot", badgeBg: "#ef4444", badgeColor: "#fff" },
  { flag: "🇮🇳", city: "New Delhi", country: "India", img: "/images/delhi.jpg", badge: "Member Deal", badgeBg: "#1447b8", badgeColor: "#fff" },
  { flag: "🇸🇬", city: "Singapore", country: "Southeast Asia", img: "/images/singapore.jpg" },
  { flag: "🇮🇳", city: "Goa", country: "India", img: "/images/goa.jpg", badge: "Most Popular", badgeBg: "#f59e0b", badgeColor: "#1a1a1a" },
  { flag: "🇮🇩", city: "Bali", country: "Indonesia", img: "/images/bali.jpg" },
  { flag: "🇮🇳", city: "Mumbai", country: "India", img: "/images/mumbai.jpg" },
];

const HOTELS_BY_CITY: Record<string, Array<{name:string;loc:string;stars:number;rating:string;tags:string[];was:string;now:string;save:string;img:string;badges:[string,string][]}>> = {
  "All Hotels": [
    { name: "Atlantis The Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (32.4k reviews)", tags: ["Waterpark", "Private Beach", "Luxury Resort"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", img: "/images/atlantis.jpg", badges: [["Trending ✨", "trending"], ["AI Watching 🤖", "watching"]] },
    { name: "Four Seasons Resort", loc: "Bali, Indonesia", stars: 5, rating: "4.9 (8.1k reviews)", tags: ["Private Pool", "Jungle View", "Wellness Spa"], was: "₹29,200", now: "₹22,800", save: "Save ₹6,400", img: "/images/fourseasons.jpg", badges: [["Trending ✨", "trending"], ["3.5% Lower Drop", "off"]] },
    { name: "Marina Bay Sands", loc: "Singapore", stars: 5, rating: "4.7 (19.1k reviews)", tags: ["Infinity Pool", "SkyPark", "Casino"], was: "₹47,000", now: "₹34,600", save: "Save ₹12,400", img: "/images/marinabay.jpg", badges: [["AI Watching 🤖", "watching"], ["4% Price Drop", "off"]] },
  ],
  "Dubai": [
    { name: "Atlantis The Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (32.4k reviews)", tags: ["Waterpark", "Private Beach", "Luxury Resort"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", img: "/images/atlantis.jpg", badges: [["Trending ✨", "trending"], ["AI Watching 🤖", "watching"]] },
    { name: "Burj Al Arab Jumeirah", loc: "Dubai, UAE", stars: 5, rating: "4.8 (12.3k reviews)", tags: ["7-Star Luxury", "Private Butler", "Private Beach"], was: "₹1,20,000", now: "₹84,000", save: "Save ₹36,000", img: "/images/burj.jpg", badges: [["Ultra Luxury 👑", "luxury"], ["AI Watching 🤖", "watching"]] },
  ],
};

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  luxury: { bg: "#1e293b", color: "#fff" },
  best: { bg: "#16a34a", color: "#fff" },
  watching: { bg: "rgba(20, 71, 184, 0.92)", color: "#fff" },
  trending: { bg: "#f59e0b", color: "#1a1a1a" },
  off: { bg: "#ef4444", color: "#fff" },
};

const CITY_FILTERS = ["All Hotels", "Dubai", "New Delhi", "Singapore", "Goa", "Bali", "Mumbai"];

const STATS = [
  { id: 0, target: 4200, prefix: "", suffix: "+", label: "Member deals live right now" },
  { id: 1, target: 18, prefix: "₹", suffix: "Cr", label: "Saved for members" },
  { id: 2, target: 28, prefix: "", suffix: "%", label: "Avg below OTA price" },
  { id: 3, target: 500000, prefix: "", suffix: "+", label: "Hotels in our network" },
];

const RAW_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .sora { font-family: 'Sora', sans-serif; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .ticker-visible { animation: fadeIn 0.4s ease forwards; }
  .ticker-hidden { opacity: 0; }
  .hotel-card { transition: transform 0.2s, box-shadow 0.2s; }
  .hotel-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); }
  .gbtn { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; transition: all 0.15s; color: #475569; }
  .gbtn:hover:not(:disabled) { border-color: #1447b8; color: #1447b8; background: #eff6ff; }
  .gbtn:disabled { opacity: 0.3; cursor: not-allowed; }
  .sfield { cursor: pointer; transition: background 0.15s; position: relative; }
  .sfield:hover { background: rgba(0, 0, 0, 0.02); }
  .arrow-indicator { font-size: 10px; color: #64748b; margin-left: 6px; display: inline-block; vertical-align: middle; transition: transform 0.2s; }
  .sfield:hover .arrow-indicator { color: #1447b8; }
  .fs { position: fixed; inset: 0; background: #fff; z-index: 9999; display: flex; flex-direction: column; animation: slideInRight 0.22s ease; }
  .ybtn:hover { background: #e6b800 !important; }
`;

interface MonthRendererProps {
  year: number;
  month: number;
  todayStr: string;
  checkIn: string;
  checkOut: string;
  onDayClick: (ds: string) => void;
}

function CalendarMonthCard({ year, month, todayStr, checkIn, checkOut, onDayClick }: MonthRendererProps) {
  const days = getDaysInMonth(year, month);
  const firstDow = getFirstDow(year, month);

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: NAVY, textAlign: "center", marginBottom: 16, fontFamily: "'Sora', sans-serif" }}>
        {MONTHS[month]} {year}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {DOWS.map((d) => (

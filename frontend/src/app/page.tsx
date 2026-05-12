"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";

const WINS = [
  { flag: "🇦🇪", hotel: "Taj Jumeirah Lakes Towers", loc: "Dubai · 4 nights · Dec 14–18", old: "₹1,12,000", new: "₹89,600", saved: "₹22,400", time: "Found in 18 hrs · refundable booking" },
  { flag: "🇹🇭", hotel: "Park Hyatt Bangkok", loc: "Bangkok · 4 nights · Jan 3–7", old: "₹1,58,000", new: "₹1,26,400", saved: "₹31,600", time: "Found in 6 hrs · refundable booking" },
  { flag: "🇮🇩", hotel: "W Bali Seminyak", loc: "Bali · 4 nights · Feb 8–12", old: "₹91,000", new: "₹72,800", saved: "₹18,200", time: "Found in 31 hrs · refundable booking" },
];

const STATS = [
  { color: "#1447b8", bg: "#EFF6FF", num: "₹18Cr", label: "Saved for Indian travelers", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1447b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { color: "#16a34a", bg: "#F0FDF4", num: "28%", label: "Avg. price drop found", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { color: "#7c3aed", bg: "#F5F3FF", num: "2.4L+", label: "Bookings monitored", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { color: "#ca8a04", bg: "#FEFCE8", num: "4.9/5", label: "Customer satisfaction", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round"

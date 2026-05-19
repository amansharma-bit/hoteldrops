"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const B = "#1447b8";
const NAVY = "#0f172a";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const TICKER_ITEMS = [
  { name: "Rahul M.", hotel: "Park Hyatt, Maldives", saved: "₹31,600", time: "Just now" },
  { name: "Priya S.", hotel: "Atlantis The Palm, Dubai", saved: "₹22,400", time: "4 min ago" },
  { name: "Vikram S.", hotel: "Burj Al Arab, Dubai", saved: "₹48,000", time: "11 min ago" },
  { name: "Neha R.", hotel: "Four Seasons, Bali", saved: "₹18,200", time: "23 min ago" },
  { name: "Arjun T.", hotel: "The Langham, London", saved: "₹26,200", time: "31 min ago" },
];

const DESTINATIONS = [
  { flag: "🇦🇪", city: "Dubai", country: "UAE", img: "https://images.pexels.com/photos/33720952/pexels-photo-33720952.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop&h=500", badge: "🔥 Hot", badgeColor: "#ef4444", badgeText: "#fff" },
  { flag: "🇮🇳", city: "New Delhi", country: "India", img: "https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop&h=500", badge: "Member Deal", badgeColor: "#1447b8", badgeText: "#fff" },
  { flag: "🇸🇬", city: "Singapore", country: "Southeast Asia", img: "https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop&h=500" },
  { flag: "🇮🇳", city: "Goa", country: "India", img: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop&h=500", badge: "Most Popular", badgeColor: "#f59e0b", badgeText: "#1a1a1a" },
  { flag: "🇮🇩", city: "Bali", country: "Indonesia", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=85&fit=crop" },
  { flag: "🇮🇳", city: "Mumbai", country: "India", img: "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=800&fit=crop&h=500" },
];

const HOTELS_BY_CITY: Record<string, Array<{name:string;loc:string;stars:number;rating:string;tags:string[];was:string;now:string;save:string;badges:[string,string][];img:string}>> = {
  "All Hotels": [
    { name: "Atlantis The Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (32.4k)", tags: ["Waterpark", "Beach", "Resort"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", badges: [["Trending", "trending"], ["⚡ AI Watching", "watching"]], img: "https://images.pexels.com/photos/33720952/pexels-photo-33720952.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "Soneva Fushi", loc: "Maldives", stars: 5, rating: "4.9 (5.1k)", tags: ["Overwater", "Private pool", "Butler"], was: "₹1,70,000", now: "₹1,24,000", save: "Save ₹46,000", badges: [["Luxury", "luxury"], ["⚡ AI Watching", "watching"]], img: "https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "Capella Bangkok", loc: "Bangkok, Thailand", stars: 5, rating: "4.8 (2.1k)", tags: ["River view", "Pool", "Fine dining"], was: "₹26,600", now: "₹18,200", save: "Save ₹8,400", badges: [["Best Value", "best"], ["↓ 4% Off", "off"]], img: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=85&fit=crop" },
    { name: "Four Seasons Bali", loc: "Bali, Indonesia", stars: 5, rating: "4.9 (8.1k)", tags: ["Jungle view", "Spa", "Yoga"], was: "₹29,200", now: "₹22,800", save: "Save ₹6,400", badges: [["Trending", "trending"], ["↓ 3.5% Off", "off"]], img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=85&fit=crop" },
    { name: "Marina Bay Sands", loc: "Singapore", stars: 5, rating: "4.7 (19.1k)", tags: ["Infinity pool", "SkyPark", "Casino"], was: "₹47,000", now: "₹34,600", save: "Save ₹12,400", badges: [["⚡ AI Watching", "watching"], ["↓ 4% Off", "off"]], img: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=85&fit=crop" },
    { name: "The Ritz Paris", loc: "Paris, France", stars: 5, rating: "4.8 (4.2k)", tags: ["Fine dining", "Spa", "Concierge"], was: "₹74,000", now: "₹52,000", save: "Save ₹22,000", badges: [["Best Value", "best"], ["↓ 15% Off", "off"]], img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=85&fit=crop" },
  ],
  "Dubai": [
    { name: "Atlantis The Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (32.4k)", tags: ["Waterpark", "Beach", "Resort"], was: "₹41,200", now: "₹28,400", save: "Save ₹12,800", badges: [["Trending", "trending"], ["⚡ AI Watching", "watching"]], img: "https://images.pexels.com/photos/33720952/pexels-photo-33720952.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "Burj Al Arab", loc: "Dubai, UAE", stars: 5, rating: "4.8 (12.3k)", tags: ["Iconic", "Private beach", "Helipad"], was: "₹1,20,000", now: "₹84,000", save: "Save ₹36,000", badges: [["Luxury", "luxury"], ["⚡ AI Watching", "watching"]], img: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "Four Seasons DIFC", loc: "Dubai, UAE", stars: 5, rating: "4.7 (6.2k)", tags: ["City view", "Spa", "Pool"], was: "₹38,000", now: "₹26,600", save: "Save ₹11,400", badges: [["Best Value", "best"], ["↓ 3% Off", "off"]], img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop" },
    { name: "Jumeirah Al Qasr", loc: "Dubai, UAE", stars: 5, rating: "4.6 (8.9k)", tags: ["Beach", "Madinat view", "Pool"], was: "₹44,000", now: "₹31,800", save: "Save ₹12,200", badges: [["Trending", "trending"], ["↓ 5% Off", "off"]], img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=85&fit=crop" },
    { name: "Address Downtown", loc: "Dubai, UAE", stars: 5, rating: "4.7 (14.2k)", tags: ["Burj view", "Rooftop pool", "Metro"], was: "₹52,000", now: "₹37,400", save: "Save ₹14,600", badges: [["⚡ AI Watching", "watching"], ["↓ 6% Off", "off"]], img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop" },
    { name: "W Dubai Palm", loc: "Dubai, UAE", stars: 5, rating: "4.5 (9.1k)", tags: ["Palm view", "Beach", "Nightlife"], was: "₹35,000", now: "₹24,500", save: "Save ₹10,500", badges: [["Best Value", "best"], ["↓ 4% Off", "off"]], img: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
  ],
  "Maldives": [
    { name: "Soneva Fushi", loc: "Maldives", stars: 5, rating: "4.9 (5.1k)", tags: ["Overwater", "Private pool", "Butler"], was: "₹1,70,000", now: "₹1,24,000", save: "Save ₹46,000", badges: [["Luxury", "luxury"], ["⚡ AI Watching", "watching"]], img: "https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "Gili Lankanfushi", loc: "Maldives", stars: 5, rating: "4.9 (3.2k)", tags: ["Overwater", "No shoes", "Organic"], was: "₹1,40,000", now: "₹98,000", save: "Save ₹42,000", badges: [["Luxury", "luxury"], ["↓ 12% Off", "off"]], img: "https://images.pexels.com/photos/28843967/pexels-photo-28843967.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "One&Only Reethi Rah", loc: "Maldives", stars: 5, rating: "4.8 (4.4k)", tags: ["Private island", "Water villas", "Spa"], was: "₹1,20,000", now: "₹88,000", save: "Save ₹32,000", badges: [["Best Value", "best"], ["⚡ AI Watching", "watching"]], img: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=85&fit=crop" },
    { name: "Six Senses Laamu", loc: "Maldives", stars: 5, rating: "4.9 (2.8k)", tags: ["Eco luxury", "Overwater", "Surf"], was: "₹1,10,000", now: "₹79,200", save: "Save ₹30,800", badges: [["Trending", "trending"], ["↓ 8% Off", "off"]], img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&q=85&fit=crop" },
    { name: "Cheval Blanc Randheli", loc: "Maldives", stars: 5, rating: "4.9 (1.9k)", tags: ["Private lagoon", "Butler", "Spa"], was: "₹2,00,000", now: "₹1,48,000", save: "Save ₹52,000", badges: [["Luxury", "luxury"], ["↓ 10% Off", "off"]], img: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=85&fit=crop" },
    { name: "COMO Maalifushi", loc: "Maldives", stars: 5, rating: "4.7 (3.1k)", tags: ["Surf", "Wellness", "Overwater"], was: "₹95,000", now: "₹68,400", save: "Save ₹26,600", badges: [["Best Value", "best"], ["↓ 9% Off", "off"]], img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=85&fit=crop" },
  ],
  "Bangkok": [
    { name: "Capella Bangkok", loc: "Bangkok, Thailand", stars: 5, rating: "4.8 (2.1k)", tags: ["River view", "Pool", "Fine dining"], was: "₹26,600", now: "₹18,200", save: "Save ₹8,400", badges: [["Best Value", "best"], ["↓ 4% Off", "off"]], img: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=85&fit=crop" },
    { name: "Mandarin Oriental Bangkok", loc: "Bangkok, Thailand", stars: 5, rating: "4.9 (11.2k)", tags: ["Riverside", "Heritage", "Spa"], was: "₹48,000", now: "₹33,600", save: "Save ₹14,400", badges: [["Luxury", "luxury"], ["⚡ AI Watching", "watching"]], img: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "The Peninsula Bangkok", loc: "Bangkok, Thailand", stars: 5, rating: "4.8 (8.4k)", tags: ["River view", "Pool", "Iconic"], was: "₹42,000", now: "₹29,400", save: "Save ₹12,600", badges: [["Trending", "trending"], ["↓ 5% Off", "off"]], img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop" },
    { name: "Rosewood Bangkok", loc: "Bangkok, Thailand", stars: 5, rating: "4.7 (3.2k)", tags: ["Sky pool", "City view", "Modern"], was: "₹36,000", now: "₹25,200", save: "Save ₹10,800", badges: [["⚡ AI Watching", "watching"], ["↓ 6% Off", "off"]], img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=85&fit=crop" },
    { name: "Four Seasons Bangkok", loc: "Bangkok, Thailand", stars: 5, rating: "4.8 (4.6k)", tags: ["Riverside", "Spa", "Fine dining"], was: "₹44,000", now: "₹30,800", save: "Save ₹13,200", badges: [["Best Value", "best"], ["↓ 7% Off", "off"]], img: "https://images.unsplash.com/photo-1551882547-ff40c4fe1fa7?w=600&q=85&fit=crop" },
    { name: "Anantara Riverside", loc: "Bangkok, Thailand", stars: 5, rating: "4.6 (12.1k)", tags: ["Riverside", "Pool", "Spa"], was: "₹22,000", now: "₹15,400", save: "Save ₹6,600", badges: [["Trending", "trending"], ["↓ 4% Off", "off"]], img: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
  ],
  "Bali": [
    { name: "Four Seasons Bali", loc: "Bali, Indonesia", stars: 5, rating: "4.9 (8.1k)", tags: ["Jungle view", "Spa", "Yoga"], was: "₹29,200", now: "₹22,800", save: "Save ₹6,400", badges: [["Trending", "trending"], ["↓ 3.5% Off", "off"]], img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=85&fit=crop" },
    { name: "Viceroy Bali", loc: "Bali, Indonesia", stars: 5, rating: "4.8 (4.2k)", tags: ["Valley view", "Private pool", "Villa"], was: "₹38,000", now: "₹26,600", save: "Save ₹11,400", badges: [["Luxury", "luxury"], ["⚡ AI Watching", "watching"]], img: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "COMO Uma Ubud", loc: "Bali, Indonesia", stars: 5, rating: "4.7 (3.8k)", tags: ["Wellness", "Yoga", "Jungle"], was: "₹32,000", now: "₹22,400", save: "Save ₹9,600", badges: [["Best Value", "best"], ["↓ 5% Off", "off"]], img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop" },
    { name: "Alila Villas Uluwatu", loc: "Bali, Indonesia", stars: 5, rating: "4.8 (5.1k)", tags: ["Clifftop", "Ocean view", "Pool"], was: "₹44,000", now: "₹30,800", save: "Save ₹13,200", badges: [["Trending", "trending"], ["↓ 6% Off", "off"]], img: "https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "Bulgari Resort Bali", loc: "Bali, Indonesia", stars: 5, rating: "4.9 (2.4k)", tags: ["Cliffside", "Iconic", "Private beach"], was: "₹80,000", now: "₹56,000", save: "Save ₹24,000", badges: [["Luxury", "luxury"], ["⚡ AI Watching", "watching"]], img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=85&fit=crop" },
    { name: "Amankila", loc: "Bali, Indonesia", stars: 5, rating: "4.9 (1.8k)", tags: ["Terraced pools", "Ocean view", "Spa"], was: "₹68,000", now: "₹47,600", save: "Save ₹20,400", badges: [["Best Value", "best"], ["↓ 8% Off", "off"]], img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=85&fit=crop" },
  ],
  "Singapore": [
    { name: "Marina Bay Sands", loc: "Singapore", stars: 5, rating: "4.7 (19.1k)", tags: ["Infinity pool", "SkyPark", "Casino"], was: "₹47,000", now: "₹34,600", save: "Save ₹12,400", badges: [["⚡ AI Watching", "watching"], ["↓ 4% Off", "off"]], img: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=85&fit=crop" },
    { name: "Capella Singapore", loc: "Singapore", stars: 5, rating: "4.9 (3.4k)", tags: ["Sentosa", "Heritage", "Pool"], was: "₹62,000", now: "₹43,400", save: "Save ₹18,600", badges: [["Luxury", "luxury"], ["⚡ AI Watching", "watching"]], img: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "The Fullerton Bay Hotel", loc: "Singapore", stars: 5, rating: "4.8 (7.2k)", tags: ["Marina view", "Rooftop bar", "Heritage"], was: "₹44,000", now: "₹30,800", save: "Save ₹13,200", badges: [["Best Value", "best"], ["↓ 5% Off", "off"]], img: "https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "Mandarin Oriental Singapore", loc: "Singapore", stars: 5, rating: "4.7 (9.8k)", tags: ["Marina view", "Spa", "Pool"], was: "₹38,000", now: "₹26,600", save: "Save ₹11,400", badges: [["Trending", "trending"], ["↓ 6% Off", "off"]], img: "https://images.unsplash.com/photo-1551882547-ff40c4fe1fa7?w=600&q=85&fit=crop" },
    { name: "Raffles Singapore", loc: "Singapore", stars: 5, rating: "4.8 (6.1k)", tags: ["Colonial", "Heritage", "Butler"], was: "₹72,000", now: "₹50,400", save: "Save ₹21,600", badges: [["Luxury", "luxury"], ["↓ 7% Off", "off"]], img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop" },
    { name: "Andaz Singapore", loc: "Singapore", stars: 5, rating: "4.6 (4.2k)", tags: ["Rooftop", "Modern", "City view"], was: "₹32,000", now: "₹22,400", save: "Save ₹9,600", badges: [["Best Value", "best"], ["↓ 4% Off", "off"]], img: "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
  ],
  "New Delhi": [
    { name: "The Leela Palace", loc: "New Delhi, India", stars: 5, rating: "4.9 (8.2k)", tags: ["Pool", "Spa", "Fine dining"], was: "₹28,000", now: "₹19,600", save: "Save ₹8,400", badges: [["Luxury", "luxury"], ["⚡ AI Watching", "watching"]], img: "https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "The Oberoi New Delhi", loc: "New Delhi, India", stars: 5, rating: "4.8 (6.4k)", tags: ["Golf course view", "Spa", "Pool"], was: "₹24,000", now: "₹16,800", save: "Save ₹7,200", badges: [["Best Value", "best"], ["↓ 5% Off", "off"]], img: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "ITC Maurya", loc: "New Delhi, India", stars: 5, rating: "4.7 (11.2k)", tags: ["Bukhara", "Pool", "Heritage"], was: "₹22,000", now: "₹15,400", save: "Save ₹6,600", badges: [["Trending", "trending"], ["↓ 4% Off", "off"]], img: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "Taj Mahal Hotel", loc: "New Delhi, India", stars: 5, rating: "4.8 (14.1k)", tags: ["Heritage", "Pool", "Spa"], was: "₹26,000", now: "₹18,200", save: "Save ₹7,800", badges: [["Luxury", "luxury"], ["↓ 6% Off", "off"]], img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop" },
    { name: "The Imperial", loc: "New Delhi, India", stars: 5, rating: "4.7 (9.8k)", tags: ["Colonial", "Pool", "Art collection"], was: "₹20,000", now: "₹14,000", save: "Save ₹6,000", badges: [["Best Value", "best"], ["↓ 5% Off", "off"]], img: "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "Hyatt Regency Delhi", loc: "New Delhi, India", stars: 5, rating: "4.6 (18.4k)", tags: ["Pool", "Spa", "Multiple dining"], was: "₹18,000", now: "₹12,600", save: "Save ₹5,400", badges: [["⚡ AI Watching", "watching"], ["↓ 4% Off", "off"]], img: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
  ],
  "Goa": [
    { name: "The Leela Goa", loc: "Goa, India", stars: 5, rating: "4.8 (12.1k)", tags: ["Beach", "Lagoon", "Golf"], was: "₹22,000", now: "₹15,400", save: "Save ₹6,600", badges: [["Luxury", "luxury"], ["⚡ AI Watching", "watching"]], img: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "Taj Exotica Goa", loc: "Goa, India", stars: 5, rating: "4.7 (9.4k)", tags: ["Beach", "Spa", "Pool"], was: "₹18,000", now: "₹12,600", save: "Save ₹5,400", badges: [["Best Value", "best"], ["↓ 5% Off", "off"]], img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=85&fit=crop" },
    { name: "W Goa", loc: "Goa, India", stars: 5, rating: "4.6 (7.2k)", tags: ["Vagator", "Beach", "Nightlife"], was: "₹20,000", now: "₹14,000", save: "Save ₹6,000", badges: [["Trending", "trending"], ["↓ 6% Off", "off"]], img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop" },
    { name: "Park Hyatt Goa", loc: "Goa, India", stars: 5, rating: "4.7 (8.6k)", tags: ["Beach", "Pool", "Spa"], was: "₹16,000", now: "₹11,200", save: "Save ₹4,800", badges: [["Best Value", "best"], ["↓ 4% Off", "off"]], img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=85&fit=crop" },
    { name: "Alila Diwa Goa", loc: "Goa, India", stars: 5, rating: "4.6 (5.1k)", tags: ["Paddy field view", "Pool", "Spa"], was: "₹14,000", now: "₹9,800", save: "Save ₹4,200", badges: [["⚡ AI Watching", "watching"], ["↓ 3% Off", "off"]], img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop" },
    { name: "Taj Fort Aguada", loc: "Goa, India", stars: 5, rating: "4.5 (14.2k)", tags: ["Heritage fort", "Beach", "Pool"], was: "₹15,000", now: "₹10,500", save: "Save ₹4,500", badges: [["Trending", "trending"], ["↓ 5% Off", "off"]], img: "https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
  ],
  "Mumbai": [
    { name: "Taj Mahal Palace", loc: "Mumbai, India", stars: 5, rating: "4.9 (22.4k)", tags: ["Gateway of India", "Heritage", "Sea view"], was: "₹32,000", now: "₹22,400", save: "Save ₹9,600", badges: [["Luxury", "luxury"], ["⚡ AI Watching", "watching"]], img: "https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "The Oberoi Mumbai", loc: "Mumbai, India", stars: 5, rating: "4.8 (8.2k)", tags: ["Sea view", "Spa", "Pool"], was: "₹28,000", now: "₹19,600", save: "Save ₹8,400", badges: [["Best Value", "best"], ["↓ 5% Off", "off"]], img: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "Four Seasons Mumbai", loc: "Mumbai, India", stars: 5, rating: "4.7 (6.8k)", tags: ["Worli sea link view", "Spa", "Pool"], was: "₹24,000", now: "₹16,800", save: "Save ₹7,200", badges: [["Trending", "trending"], ["↓ 6% Off", "off"]], img: "https://images.unsplash.com/photo-1551882547-ff40c4fe1fa7?w=600&q=85&fit=crop" },
    { name: "St Regis Mumbai", loc: "Mumbai, India", stars: 5, rating: "4.8 (9.1k)", tags: ["Sky high pool", "City view", "Butler"], was: "₹26,000", now: "₹18,200", save: "Save ₹7,800", badges: [["Luxury", "luxury"], ["↓ 4% Off", "off"]], img: "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "ITC Grand Central", loc: "Mumbai, India", stars: 5, rating: "4.6 (7.4k)", tags: ["Parel", "Pool", "Spa"], was: "₹18,000", now: "₹12,600", save: "Save ₹5,400", badges: [["Best Value", "best"], ["↓ 5% Off", "off"]], img: "https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
    { name: "JW Marriott Mumbai", loc: "Mumbai, India", stars: 5, rating: "4.7 (16.2k)", tags: ["Juhu beach", "Pool", "Spa"], was: "₹20,000", now: "₹14,000", save: "Save ₹6,000", badges: [["⚡ AI Watching", "watching"], ["↓ 4% Off", "off"]], img: "https://images.pexels.com/photos/1134176/pexels-photo-1134176.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" },
  ],
};

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  luxury: { bg: "#1e293b", color: "#fff" },
  best: { bg: "#16a34a", color: "#fff" },
  watching: { bg: "rgba(20,71,184,0.92)", color: "#fff" },
  trending: { bg: "#f59e0b", color: "#1a1a1a" },
  off: { bg: "#ef4444", color: "#fff" },
};

const CITY_FILTERS = ["All Hotels", "Dubai", "New Delhi", "Singapore", "Goa", "Bali", "Mumbai"];
const PILLS = ["🇦🇪 Dubai, UAE","🇮🇳 New Delhi, India","🇸🇬 Singapore","🇮🇳 Goa, India","🇮🇩 Bali, Indonesia","🇮🇳 Mumbai, India"];
const SORTS = ["↓ Savings","★ Rating","₹ Price"];

const STATS = [
  { id: 0, target: 4200, prefix: "", suffix: "+", label: "Member deals live right now" },
  { id: 1, target: 18, prefix: "₹", suffix: "Cr", label: "Saved for members" },
  { id: 2, target: 28, prefix: "", suffix: "%", label: "Avg below OTA price" },
  { id: 3, target: 500000, prefix: "", suffix: "+", label: "Hotels in our network" },
];

export default function SearchHotelsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2 Adults");
  const [activeCity, setActiveCity] = useState("All Hotels");
  const [activeSort, setActiveSort] = useState(0);
  const [activePill, setActivePill] = useState(-1);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);
  const [statVals, setStatVals] = useState(STATS.map(s => `${s.prefix}${s.target.toLocaleString("en-IN")}${s.suffix}`));
  const [menuOpen, setMenuOpen] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsAnimated = useRef(false);

  // Ticker rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIdx(prev => (prev + 1) % TICKER_ITEMS.length);
        setTickerVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Stats animation
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !statsAnimated.current) {
        statsAnimated.current = true;
        STATS.forEach((s, i) => {
          let start: number | null = null;
          const step = (ts: number) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / 1200, 1);
            setStatVals(prev => {
              const next = [...prev];
              next[i] = `${s.prefix}${Math.floor(p * s.target).toLocaleString("en-IN")}${s.suffix}`;
              return next;
            });
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
        observer.disconnect();
      }
    }, { threshold: 0.4 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCheckInChange = (val: string) => {
    setCheckIn(val);
    if (checkOut && checkOut <= val) {
      const next = new Date(val);
      next.setDate(next.getDate() + 1);
      setCheckOut(next.toISOString().split("T")[0]);
    }
  };

  const handleCheckOutChange = (val: string) => {
    if (checkIn && val <= checkIn) return;
    setCheckOut(val);
  };

  const requireAuth = async (action: () => void) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      action();
    } else {
      router.push(`/signin?redirect=/search-hotels`);
    }
  };

  const handleSearch = () => {
    if (!destination) return;
    requireAuth(() => {
      router.push(`/search?destination=${encodeURIComponent(destination)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}`);
    });
  };

  const ticker = TICKER_ITEMS[tickerIdx];
  const hotels = HOTELS_BY_CITY[activeCity] || HOTELS_BY_CITY["All Hotels"];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#fff", color: "#1e293b", fontSize: 15, lineHeight: 1.6, WebkitFontSmoothing: "antialiased", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sora { font-family: 'Sora', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .ticker-visible { animation: fadeIn 0.4s ease forwards; }
        .ticker-hidden { opacity: 0; }
        input[type=date]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 20px" : "0 40px", height: 60 }}>
        <a href="/" style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 20, color: NAVY, textDecoration: "none" }}>rebuq<span style={{ color: B }}>.</span></a>
        {!isMobile && (
          <ul style={{ display: "flex", gap: 32, listStyle: "none" }}>
            <li><a href="/#how" style={{ fontSize: 14, color: "#64748b", textDecoration: "none", fontWeight: 500 }}>How it works</a></li>
            <li><a href="/search-hotels" style={{ fontSize: 14, color: B, textDecoration: "none", fontWeight: 600 }}>Exclusive Member Deals</a></li>
          </ul>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!isMobile && <button style={{ fontSize: 14, color: NAVY, background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: "inherit", padding: "7px 12px" }}>Sign in</button>}
          {!isMobile && <button onClick={() => router.push("/upload")} style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Check my booking</button>}
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ display: "block", width: 22, height: 2, background: NAVY, transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
              <span style={{ display: "block", width: 22, height: 2, background: menuOpen ? "transparent" : NAVY, transition: "all 0.2s" }} />
              <span style={{ display: "block", width: 22, height: 2, background: NAVY, transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
            </button>
          )}
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={{ position: "fixed", top: 60, left: 0, right: 0, bottom: 0, zIndex: 199, background: "#fff", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => { router.push("/#how"); setMenuOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 600, color: NAVY, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>How it works</button>
          <button onClick={() => { router.push("/search-hotels"); setMenuOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 600, color: B, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>Exclusive Member Deals</button>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 17, fontWeight: 500, color: NAVY, textAlign: "left", padding: "14px 0", borderBottom: "1px solid #f1f5f9" }}>Sign in</button>
          <button onClick={() => { router.push("/upload"); setMenuOpen(false); }} style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 12 }}>Check my booking — it&apos;s free</button>
        </div>
      )}

      {/* HERO */}
      <section style={{ background: "linear-gradient(160deg,#0c1f5c 0%,#1a3a8f 40%,#1e4fc2 100%)", padding: isMobile ? "48px 20px 64px" : "72px 40px 96px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 30%,rgba(255,255,255,0.05) 0%,transparent 60%)" }} />

        {/* BADGE */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)", fontSize: 11.5, fontWeight: 700, padding: "6px 18px", borderRadius: 100, marginBottom: 28, border: "1px solid rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" as const, position: "relative" }}>
          ✦ Curated Member Deals
        </div>

        {/* HEADLINE */}
        <h1 className="sora" style={{ fontSize: isMobile ? 34 : 60, fontWeight: 800, color: "#fff", lineHeight: 1.08, marginBottom: 18, position: "relative", maxWidth: 760, margin: "0 auto 18px" }}>
          Find your <span style={{ color: "#FCD34D" }}>perfect stay</span>
        </h1>

        {/* LIVE RATES LINE */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 12 : 20, marginBottom: 16, position: "relative", flexWrap: "wrap" as const }}>
          {["Members Only", "Direct Rates", "No Middleman"].map((item, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
              {i > 0 && <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>}
              {i === 0 && <span style={{ width: 6, height: 6, background: "#4ade80", borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s infinite" }} />}
              {item}
            </span>
          ))}
        </div>

        {/* SUBHEAD */}
        <p style={{ fontSize: isMobile ? 15 : 16.5, color: "rgba(255,255,255,0.72)", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.7, position: "relative" }}>
          500,000+ exclusive deals across the globe for members only.
        </p>

        {/* LIVE TICKER */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: isMobile ? 12 : 13, padding: "8px 18px", borderRadius: 100, marginBottom: 32, position: "relative" }}>
          <span style={{ width: 8, height: 8, background: "#4ade80", borderRadius: "50%", flexShrink: 0, animation: "pulse 1.5s infinite" }} />
          <span className={tickerVisible ? "ticker-visible" : "ticker-hidden"} style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const, justifyContent: "center" }}>
            <span style={{ fontWeight: 600, color: "#FCD34D" }}>{ticker.name}</span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>accessed a member rate on</span>
            <span style={{ fontWeight: 600 }}>{ticker.hotel}</span>
            <span style={{ color: "#4ade80", fontWeight: 700 }}>— {ticker.saved} below OTA</span>
            <span style={{ background: "rgba(255,255,255,0.15)", fontSize: 11, padding: "2px 8px", borderRadius: 6, color: "rgba(255,255,255,0.7)" }}>{ticker.time}</span>
          </span>
        </div>

        {/* SEARCH BOX */}
        <div style={{ background: "#fff", borderRadius: 16, padding: isMobile ? "16px" : "20px 24px", maxWidth: 900, margin: "0 auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1.2fr 1.2fr 0.8fr auto", gap: 0, position: "relative" }}>
          <div style={{ padding: isMobile ? "10px 0" : "8px 16px", borderRight: isMobile ? "none" : "1px solid #e2e8f0", borderBottom: isMobile ? "1px solid #f1f5f9" : "none" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>📍 Destination or Hotel</label>
            <input type="text" placeholder="Where to?" value={destination} onChange={e => setDestination(e.target.value)}
              style={{ width: "100%", border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 500, color: NAVY, background: "transparent" }} />
          </div>
          <div style={{ padding: isMobile ? "10px 0" : "8px 16px", borderRight: isMobile ? "none" : "1px solid #e2e8f0", borderBottom: isMobile ? "1px solid #f1f5f9" : "none" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>📅 Check-in</label>
            <input type="date" value={checkIn} onChange={e => handleCheckInChange(e.target.value)}
              style={{ width: "100%", border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 500, color: NAVY, background: "transparent" }} />
          </div>
          <div style={{ padding: isMobile ? "10px 0" : "8px 16px", borderRight: isMobile ? "none" : "1px solid #e2e8f0", borderBottom: isMobile ? "1px solid #f1f5f9" : "none" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>📅 Check-out</label>
            <input type="date" value={checkOut} min={checkIn || undefined} onChange={e => handleCheckOutChange(e.target.value)}
              style={{ width: "100%", border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 500, color: NAVY, background: "transparent" }} />
          </div>
          <div style={{ padding: isMobile ? "10px 0" : "8px 16px", borderBottom: isMobile ? "1px solid #f1f5f9" : "none" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>👤 Guests</label>
            <select value={guests} onChange={e => setGuests(e.target.value)} style={{ width: "100%", border: "none", outline: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 500, color: NAVY, background: "transparent", cursor: "pointer" }}>
              {["1 Adult", "2 Adults", "3 Adults", "4 Adults"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={handleSearch} style={{ background: B, color: "#fff", border: "none", borderRadius: 10, padding: "14px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginLeft: isMobile ? 0 : 12, marginTop: isMobile ? 12 : 0, whiteSpace: "nowrap" as const, width: isMobile ? "100%" : "auto" }}>
            🔍 Search
          </button>
        </div>

        {/* DEST PILLS */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, flexWrap: "wrap" as const, position: "relative" }}>
          {PILLS.map((p, i) => (
            <button key={i} onClick={() => { setActivePill(i); setDestination(p.split(' ').slice(1).join(' ')); }}
              style={{ background: activePill === i ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)", fontSize: 12.5, fontWeight: 500, padding: "5px 14px", borderRadius: 100, cursor: "pointer", fontFamily: "inherit" }}>
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }} ref={statsRef}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "20px" : "26px 40px", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center", borderRight: !isMobile && i < 3 ? "1px solid #e2e8f0" : "none", padding: "0 20px" }}>
              <div className="sora" style={{ fontSize: 26, fontWeight: 800, color: NAVY }}>{statVals[i]}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP DESTINATIONS */}
      <div style={{ padding: isMobile ? "50px 20px" : "70px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: B, marginBottom: 10 }}>Member Exclusive Rates</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <h2 className="sora" style={{ fontSize: isMobile ? 22 : 34, fontWeight: 800, color: NAVY, lineHeight: 1.15 }}>Curated for rebuq members</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Handpicked destinations with rates unavailable anywhere else.</p>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#16a34a" }}>
            <span style={{ width: 7, height: 7, background: "#16a34a", borderRadius: "50%", display: "inline-block", animation: "pulse 1.5s infinite" }} /> Live rates
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 14 }}>
          {DESTINATIONS.map((d, i) => (
            <div key={i}
              onClick={() => { setActiveCity(d.city); setDestination(`${d.city}, ${d.country}`); document.getElementById("hotels-section")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ borderRadius: 14, overflow: "hidden", position: "relative", cursor: "pointer", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", transition: "transform .25s", height: isMobile ? 140 : 200 }}
              onMouseOver={e => (e.currentTarget.style.transform = "translateY(-4px)")} onMouseOut={e => (e.currentTarget.style.transform = "none")}>
              <img src={d.img} alt={d.city} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 55%)" }} />
              {d.badge && <span style={{ position: "absolute", top: 10, left: 10, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, padding: "3px 9px", borderRadius: 6, background: d.badgeColor, color: d.badgeText }}>{d.badge}</span>}
              <div style={{ position: "absolute", bottom: 14, left: 14, color: "#fff" }}>
                <div className="sora" style={{ fontSize: 17, fontWeight: 700 }}>{d.city}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{d.country}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: B, fontWeight: 600, cursor: "pointer" }}>Don&apos;t see your destination? Search any city or hotel →</p>
      </div>

      {/* HOTELS */}
      <div id="hotels-section" style={{ background: "#f8fafc", padding: isMobile ? "50px 0" : "70px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 20px" : "0 40px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: B, marginBottom: 10 }}>Member Exclusive Rates</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap" as const, gap: 16 }}>
            <div>
              <h2 className="sora" style={{ fontSize: isMobile ? 22 : 34, fontWeight: 800, color: NAVY, lineHeight: 1.15 }}>Curated for rebuq members</h2>
              <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Members save an average of <strong>₹24,600</strong> on these properties.</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>Sort</span>
              {SORTS.map((s, i) => (
                <button key={i} onClick={() => setActiveSort(i)}
                  style={{ border: `1.5px solid ${activeSort === i ? NAVY : "#e2e8f0"}`, background: activeSort === i ? NAVY : "#fff", color: activeSort === i ? "#fff" : NAVY, fontSize: 12.5, fontWeight: 600, padding: "6px 16px", borderRadius: 100, cursor: "pointer", fontFamily: "inherit" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* CITY FILTER TABS */}
          <div style={{ display: "flex", gap: 8, marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
            {CITY_FILTERS.map((f) => (
              <button key={f} onClick={() => setActiveCity(f)}
                style={{ background: activeCity === f ? NAVY : "#fff", border: `1.5px solid ${activeCity === f ? NAVY : "#e2e8f0"}`, color: activeCity === f ? "#fff" : NAVY, fontSize: 13, fontWeight: 500, padding: "7px 18px", borderRadius: 100, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const, flexShrink: 0, transition: "all 0.2s" }}>
                {f === "All Hotels" ? f : `${DESTINATIONS.find(d => d.city === f)?.flag || ""} ${f}`}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20 }}>
            {hotels.map((h, i) => (
              <div key={i} onClick={() => requireAuth(() => router.push(`/hotel/372446?checkIn=${checkIn || "2026-08-11"}&checkOut=${checkOut || "2026-08-13"}&adults=${guests || "2"}`))}
                style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1.5px solid #e2e8f0", cursor: "pointer", transition: "transform .2s" }}
                onMouseOver={e => (e.currentTarget.style.transform = "translateY(-4px)")} onMouseOut={e => (e.currentTarget.style.transform = "none")}>
                <div style={{ height: 190, position: "relative", overflow: "hidden" }}>
                  <img src={h.img} alt={h.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                    {h.badges.map(([label, type]) => {
                      const s = BADGE_STYLES[type] || BADGE_STYLES.luxury;
                      return <span key={label} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, letterSpacing: "0.04em", textTransform: "uppercase" as const, background: s.bg, color: s.color }}>{label}</span>;
                    })}
                  </div>
                </div>
                <div style={{ padding: "16px 18px 18px" }}>
                  <div style={{ color: "#f59e0b", fontSize: 12, marginBottom: 4 }}>{"★".repeat(h.stars)}</div>
                  <div className="sora" style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{h.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>📍 {h.loc} · {h.rating}</div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 14 }}>
                    {h.tags.map(t => <span key={t} style={{ background: "#f8fafc", color: "#64748b", fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 }}>{t}</span>)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#64748b", textDecoration: "line-through" }}>{h.was}</div>
                      <div className="sora" style={{ fontSize: 20, fontWeight: 800, color: NAVY }}>{h.now} <span style={{ fontSize: 11, color: "#64748b", fontFamily: "Inter,sans-serif", fontWeight: 400 }}>/night</span></div>
                      <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginTop: 2 }}>{h.save}</div>
                    </div>
                    <button style={{ background: B, color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const }}>
                      View deal →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button onClick={handleSearch} style={{ background: "#fff", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              ↓ Explore more member deals
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div style={{ background: "linear-gradient(135deg,#0c1f5c 0%,#1e4fc2 100%)", padding: isMobile ? "50px 20px" : "64px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100, marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              ✦ Already booked elsewhere?
            </div>
            <h2 className="sora" style={{ fontSize: isMobile ? 26 : 42, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 14 }}>
              Don&apos;t overpay. Let our AI <span style={{ color: "#FCD34D" }}>watch the price.</span>
            </h2>
            <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginBottom: 28 }}>
              Upload your booking voucher. We&apos;ll monitor the rate 24/7 and WhatsApp you the moment it drops.
            </p>
            <div style={{ display: "flex", gap: 28 }}>
              {[["₹18Cr+", "Total saved"], ["12,000+", "Members"], ["28%", "Avg drop"]].map(([n, l]) => (
                <div key={l}>
                  <div className="sora" style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{n}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eff6ff", color: B, fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 6, marginBottom: 16, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
              📤 Upload your voucher
            </div>
            <div className="sora" style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 5 }}>Already booked? Check for a drop</div>
            <div style={{ fontSize: 12.5, color: "#64748b", marginBottom: 16 }}>Takes 30 seconds. We handle the rest.</div>
            <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" as const }}>
              {["Booking.com", "Agoda", "MakeMyTrip"].map(o => (
                <span key={o} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 7, padding: "4px 10px", fontSize: 11.5, fontWeight: 500, color: NAVY }}>{o}</span>
              ))}
            </div>
            <button onClick={() => router.push("/upload")} style={{ width: "100%", background: B, color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
              Upload my booking →
            </button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ width: "100%", background: "transparent", color: NAVY, border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 11, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Search member deals instead
            </button>
            <div style={{ textAlign: "center", fontSize: 11.5, color: "#64748b", marginTop: 10 }}>Free to check · Pay only if we save you money</div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: NAVY, padding: isMobile ? "36px 20px 24px" : "40px 40px 28px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32, gap: 32, flexWrap: "wrap" as const, flexDirection: isMobile ? "column" : "row" }}>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 8 }}>rebuq<span style={{ color: B }}>.</span></div>
              <p style={{ fontSize: 13, color: "#94a3b8", maxWidth: 240, lineHeight: 1.6 }}>AI price monitoring for hotel bookings. Free to check — we earn only when you save.</p>
            </div>
            <div style={{ display: "flex", gap: isMobile ? 24 : 48, flexDirection: isMobile ? "column" : "row" }}>
              {[
                { title: "Product", links: ["How it works", "Member Deals", "Why rebuq", "Check my booking"] },
                { title: "Company", links: ["Privacy", "Terms"] },
              ].map(col => (
                <div key={col.title}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#64748b", marginBottom: 12 }}>{col.title}</h4>
                  {col.links.map(l => <a key={l} href="#" style={{ display: "block", fontSize: 13.5, color: "#94a3b8", textDecoration: "none", marginBottom: 9 }}>{l}</a>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
            <span style={{ fontSize: 12.5, color: "#475569" }}>© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <a href="https://twitter.com/rebuq" target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#94a3b8"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="https://linkedin.com/company/rebuq" target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#94a3b8"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
              <a href="https://instagram.com/rebuq" target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#94a3b8"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

const API_BASE = "https://hoteldrops-production.up.railway.app";

interface HotelRate {
  rateKey: string;
  net: string;
  currency: string;
  boardName: string;
  rooms: number;
  adults: number;
  children: number;
}

interface Hotel {
  code: number;
  name: string;
  categoryName: string;
  destinationName: string;
  zoneName: string;
  latitude: string;
  longitude: string;
  minRate: string;
  maxRate: string;
  currency: string;
  rooms?: { rates: HotelRate[]; }[];
  images?: { path: string; type: { code: string } }[];
}

interface SearchResponse {
  hotels: {
    hotels: Hotel[];
    total: number;
    checkIn: string;
    checkOut: string;
  };
}

function nights(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

function formatPrice(price: string, currency: string) {
  const num = parseFloat(price);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(num);
}

function starCount(categoryName: string): number {
  const match = categoryName?.match(/(\d)/);
  return match ? parseInt(match[1]) : 0;
}

function hotelImage(hotel: Hotel): string | null {
  if (!hotel.images?.length) return null;
  const preferred = hotel.images.find((img) => img.type?.code === "GEN" || img.type?.code === "HAB");
  const img = preferred || hotel.images[0];
  if (!img?.path) return null;
  return `https://photos.hotelbeds.com/giata/bigger/${img.path}`;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse flex flex-col md:flex-row">
      <div className="md:w-64 w-full h-48 md:h-auto bg-gray-200 shrink-0" />
      <div className="flex-1 p-5 flex flex-col gap-3">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="mt-auto flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-28" />
          <div className="h-10 bg-gray-200 rounded-xl w-32" />
        </div>
      </div>
    </div>
  );
}

function HotelCard({ hotel, checkIn, checkOut, guests, destination, onViewDeal }: {
  hotel: Hotel; checkIn: string; checkOut: string; guests: number; destination: string; onViewDeal: (hotelCode: number) => void;
}) {
  const imgSrc = hotelImage(hotel);
  const numNights = nights(checkIn, checkOut);
  const stars = starCount(hotel.categoryName);
  const pricePerNight = hotel.minRate ? formatPrice(String(parseFloat(hotel.minRate) / numNights), hotel.currency) : null;
  const totalPrice = hotel.minRate ? formatPrice(hotel.minRate, hotel.currency) : null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all flex flex-col md:flex-row group">
      <div className="md:w-64 w-full h-48 md:h-auto bg-gray-100 shrink-0 relative overflow-hidden">
        {imgSrc ? (
          <img src={imgSrc} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H5m0 0H3m2 0v-5a1 1 0 011-1h4a1 1 0 011 1v5m-6 0h6" />
            </svg>
          </div>
        )}
        {hotel.categoryName && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
            {hotel.categoryName}
          </span>
        )}
      </div>
      <div className="flex-1 p-5 flex flex-col gap-2">
        {stars > 0 && (
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className={`w-3.5 h-3.5 ${i < stars ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        )}
        <h3 className="font-semibold text-gray-900 text-base leading-snug">{hotel.name}</h3>
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {[hotel.zoneName, hotel.destinationName].filter(Boolean).join(", ")}
        </p>
        {hotel.rooms?.[0]?.rates?.[0]?.boardName && (
          <p className="text-sm text-gray-400">{hotel.rooms[0].rates[0].boardName}</p>
        )}
        <div className="mt-auto pt-3 flex items-end justify-between gap-4">
          <div>
            {pricePerNight && (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">{pricePerNight}</span>
                <span className="text-sm text-gray-400">/night</span>
              </div>
            )}
            {totalPrice && numNights > 1 && (
              <p className="text-xs text-gray-400">{totalPrice} total · {numNights} nights · {guests} {guests === 1 ? "guest" : "guests"}</p>
            )}
          </div>
          <button
            onClick={() => onViewDeal(hotel.code)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            View deal
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSidebar({ minPrice, maxPrice, priceRange, onPriceRange, starFilter, onStarFilter, sortBy, onSortBy, hotelName, onHotelName }: {
  minPrice: number; maxPrice: number; priceRange: [number, number]; onPriceRange: (v: [number, number]) => void;
  starFilter: number[]; onStarFilter: (v: number[]) => void; sortBy: string; onSortBy: (v: string) => void;
  hotelName: string; onHotelName: (v: string) => void;
}) {
  const toggleStar = (s: number) => {
    onStarFilter(starFilter.includes(s) ? starFilter.filter((x) => x !== s) : [...starFilter, s]);
  };

  return (
    <aside className="w-full md:w-60 shrink-0 flex flex-col gap-6">
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Search by hotel name</h3>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="e.g. Hyatt, Marriott…" value={hotelName} onChange={e => onHotelName(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 bg-gray-50 placeholder-gray-300" />
          {hotelName && (
            <button onClick={() => onHotelName("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sort by</h3>
        <div className="flex flex-col gap-2">
          {[
            { value: "price_asc", label: "Price: Low to high" },
            { value: "price_desc", label: "Price: High to low" },
            { value: "name_asc", label: "Name A–Z" },
            { value: "stars_desc", label: "Stars: High to low" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="sort" value={opt.value} checked={sortBy === opt.value} onChange={() => onSortBy(opt.value)} className="accent-blue-600" />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Star rating</h3>
        <div className="flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={starFilter.includes(s)} onChange={() => toggleStar(s)} className="accent-blue-600 rounded" />
              <span className="flex gap-0.5">
                {Array.from({ length: s }).map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </span>
            </label>
          ))}
        </div>
      </div>
      {maxPrice > minPrice && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Max total price</h3>
          <input type="range" min={minPrice} max={maxPrice} value={priceRange[1]}
            onChange={(e) => onPriceRange([priceRange[0], Number(e.target.value)])} className="w-full accent-blue-600" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(minPrice)}</span>
            <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(priceRange[1])}</span>
          </div>
        </div>
      )}
    </aside>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const destination = searchParams.get("destination") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = Number(searchParams.get("guests") || 2);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("price_asc");
  const [starFilter, setStarFilter] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 99999]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(99999);
  const [hotelName, setHotelName] = useState("");

  const fetchHotels = useCallback(async () => {
    if (!destination || !checkIn || !checkOut) { setError("Missing search parameters."); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const url = new URL(`${API_BASE}/api/hotels/search`);
      url.searchParams.set("destination", destination);
      url.searchParams.set("checkIn", checkIn);
      url.searchParams.set("checkOut", checkOut);
      url.searchParams.set("adults", String(guests));
      const res = await fetch(url.toString());
      if (!res.ok) { const body = await res.text(); throw new Error(`API error ${res.status}: ${body}`); }
      const data: SearchResponse = await res.json();
      const list = data?.hotels?.hotels || [];
      setHotels(list);
      const prices = list.map((h) => parseFloat(h.minRate)).filter((p) => !isNaN(p));
      if (prices.length) {
        const lo = Math.floor(Math.min(...prices));
        const hi = Math.ceil(Math.max(...prices));
        setMinPrice(lo); setMaxPrice(hi); setPriceRange([lo, hi]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  }, [destination, checkIn, checkOut, guests]);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  const filtered = hotels
    .filter((h) => {
      if (hotelName && !h.name.toLowerCase().includes(hotelName.toLowerCase())) return false;
      if (starFilter.length) { const s = starCount(h.categoryName); if (!starFilter.includes(s)) return false; }
      const price = parseFloat(h.minRate);
      if (!isNaN(price) && price > priceRange[1]) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return parseFloat(a.minRate || "0") - parseFloat(b.minRate || "0");
      if (sortBy === "price_desc") return parseFloat(b.minRate || "0") - parseFloat(a.minRate || "0");
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "stars_desc") return starCount(b.categoryName) - starCount(a.categoryName);
      return 0;
    });

  const numNights = nights(checkIn, checkOut);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <a href="/" className="flex items-center">
          <Image src="/rebuq-logo.svg" alt="Rebuq" width={100} height={30} priority />
        </a>
        <button onClick={() => router.push("/")} className="hidden md:flex items-center gap-3 text-sm text-gray-600 border border-gray-200 rounded-full px-4 py-2 hover:shadow-sm transition-shadow">
          <span className="font-medium text-gray-900">{destination}</span>
          <span className="text-gray-300">|</span>
          <span>{checkIn} – {checkOut}</span>
          <span className="text-gray-300">|</span>
          <span>{guests} {guests === 1 ? "guest" : "guests"}</span>
        </button>
        <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign in</a>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? "Searching hotels…" : error ? "Search error" : `${filtered.length} hotel${filtered.length !== 1 ? "s" : ""} in ${destination}`}
          </h1>
          {!loading && !error && (
            <p className="text-sm text-gray-500 mt-1">{checkIn} → {checkOut} · {numNights} night{numNights !== 1 ? "s" : ""} · {guests} {guests === 1 ? "guest" : "guests"}</p>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {!loading && !error && hotels.length > 0 && (
            <FilterSidebar minPrice={minPrice} maxPrice={maxPrice} priceRange={priceRange} onPriceRange={setPriceRange}
              starFilter={starFilter} onStarFilter={setStarFilter} sortBy={sortBy} onSortBy={setSortBy}
              hotelName={hotelName} onHotelName={setHotelName} />
          )}
          <div className="flex-1 flex flex-col gap-4">
            {loading ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : error ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                <p className="text-red-600 font-medium mb-2">Couldn&apos;t load results</p>
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <button onClick={fetchHotels} className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-700 transition-colors">Try again</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
                <p className="text-gray-500 text-lg font-medium">No hotels match your filters</p>
                <button onClick={() => { setStarFilter([]); setPriceRange([minPrice, maxPrice]); setHotelName(""); }} className="mt-4 text-blue-600 text-sm font-medium hover:underline">Clear filters</button>
              </div>
            ) : (
              filtered.map((hotel) => (
                <HotelCard key={hotel.code} hotel={hotel} checkIn={checkIn} checkOut={checkOut} guests={guests} destination={destination}
                  onViewDeal={(code) => {
                    const params = new URLSearchParams({ destination, checkIn, checkOut, guests: String(guests) });
                    router.push(`/hotel/${code}?${params.toString()}`);
                  }} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}

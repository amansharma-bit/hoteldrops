"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !checkIn || !checkOut) return;

    const params = new URLSearchParams({
      destination,
      checkIn,
      checkOut,
      guests: String(guests),
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <a href="/" className="flex items-center">
          <Image
            src="/rebuq-logo.svg"
            alt="Rebuq"
            width={120}
            height={36}
            priority
          />
        </a>
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Sign in
          </a>
          <a
            href="#"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
          >
            Register
          </a>
        </div>
      </nav>

      {/* Hero + Search */}
      <main className="flex flex-col items-center justify-center px-4 pt-20 pb-32">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-3">
          Find your perfect stay
        </h1>
        <p className="text-gray-500 text-lg text-center mb-10">
          Unlock exclusive hotel deals worldwide
        </p>

        <form
          onSubmit={handleSearch}
          className="w-full max-w-3xl bg-white border border-gray-200 rounded-2xl shadow-lg p-4 flex flex-col md:flex-row gap-3"
        >
          {/* Destination */}
          <div className="flex-1 flex flex-col gap-1 px-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Destination
            </label>
            <input
              type="text"
              placeholder="City or hotel name"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
              required
            />
          </div>

          <div className="hidden md:block w-px bg-gray-200 self-stretch" />

          {/* Check-in */}
          <div className="flex flex-col gap-1 px-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Check-in
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="text-sm text-gray-900 outline-none bg-transparent"
              required
            />
          </div>

          <div className="hidden md:block w-px bg-gray-200 self-stretch" />

          {/* Check-out */}
          <div className="flex flex-col gap-1 px-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Check-out
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="text-sm text-gray-900 outline-none bg-transparent"
              required
            />
          </div>

          <div className="hidden md:block w-px bg-gray-200 self-stretch" />

          {/* Guests */}
          <div className="flex flex-col gap-1 px-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Guests
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="text-sm text-gray-900 outline-none bg-transparent"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
          >
            Search hotels
          </button>
        </form>
      </main>
    </div>
  );
}

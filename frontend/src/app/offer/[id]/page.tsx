"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function OfferPage() {
  const params  = useParams();
  const router  = useRouter();
  const offerId = params?.id as string;

  useEffect(() => {
    if (!offerId) return;
    loadAndRedirect();
  }, [offerId]);

  async function loadAndRedirect() {
    try {
      // Load offer
      const { data: offer, error: offerErr } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (offerErr || !offer) {
        router.push('/');
        return;
      }

      // Check not expired
      if (offer.status === 'expired' || new Date(offer.expires_at) < new Date()) {
        router.push('/?offer=expired');
        return;
      }

      // Load booking
      const { data: booking, error: bookingErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', offer.booking_id)
        .single();

      if (bookingErr || !booking) {
        router.push('/');
        return;
      }

      // Redirect to hotel page with all params pre-filled
      const hotelCode = booking.liteapi_hotel_id;
      const params = new URLSearchParams({
        checkIn:  booking.check_in,
        checkOut: booking.check_out,
        adults:   String(booking.num_adults || 2),
        rooms:    String(booking.num_rooms  || 1),
        offerId:  offerId,
        saving:   String(Math.round(offer.customer_saving)),
        newPrice: String(Math.round(offer.offer_price)),
        oldPrice: String(Math.round(offer.original_price)),
      });

      router.push(`/hotel/${hotelCode}?${params.toString()}`);

    } catch (e) {
      router.push('/');
    }
  }

  // Show loading while redirecting
  return (
    <div style={{ minHeight: "100vh", background: "#1447b8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 48, height: 48, border: "4px solid rgba(255,255,255,0.2)", borderTop: "4px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>Finding your deal...</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Taking you to the hotel page</div>
    </div>
  );
}

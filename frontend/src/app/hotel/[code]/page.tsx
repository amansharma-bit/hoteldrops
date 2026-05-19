<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>rebuq — Hotel Detail Preview</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; font-size: 15px; line-height: 1.6; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
.sora { font-family: 'Sora', sans-serif; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

/* NAV */
nav { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 0 40px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 200; }
.nav-logo { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 20px; color: #0f172a; text-decoration: none; }
.nav-links { display: flex; gap: 28px; list-style: none; }
.nav-links a { font-size: 14px; color: #64748b; text-decoration: none; font-weight: 500; }
.nav-links a.active { color: #1447b8; font-weight: 600; }
.nav-right { display: flex; gap: 12px; align-items: center; }
.btn-nav { background: #1447b8; color: #fff; border: none; border-radius: 8px; padding: 8px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; }

/* SEARCH BAR */
.search-bar { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 12px 40px; }
.search-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1.2fr 1.2fr 0.8fr auto; gap: 0; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.search-field { padding: 10px 16px; border-right: 1px solid #e2e8f0; }
.search-field:last-of-type { border-right: none; }
.search-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3px; }
.search-val { font-size: 14px; font-weight: 600; color: #0f172a; }
.search-btn { background: #1447b8; color: #fff; border: none; padding: 0 28px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 8px; }

/* BREADCRUMB */
.breadcrumb { max-width: 1200px; margin: 0 auto; padding: 12px 40px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; }
.breadcrumb a { color: #64748b; text-decoration: none; }
.breadcrumb span { color: #cbd5e1; }
.breadcrumb strong { color: #1e293b; font-weight: 500; }

/* MAIN */
.main { max-width: 1200px; margin: 0 auto; padding: 0 40px 80px; }
.hotel-header { margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
.hotel-name { font-family: 'Sora', sans-serif; font-size: 26px; font-weight: 800; color: #0f172a; }
.hotel-stars { color: #f59e0b; font-size: 18px; margin-left: 12px; }
.hotel-addr { font-size: 13.5px; color: #64748b; margin-top: 6px; display: flex; align-items: center; gap: 6px; }
.hotel-addr a { color: #1447b8; font-size: 13px; font-weight: 500; text-decoration: none; }
.icon-btns { display: flex; gap: 10px; }
.icon-btn { width: 40px; height: 40px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 17px; color: #64748b; }

/* PHOTO GRID */
.photo-grid { display: grid; grid-template-columns: 1.5fr 1fr; grid-template-rows: 220px 220px; gap: 8px; border-radius: 16px; overflow: hidden; margin-bottom: 24px; }
.photo-main { grid-row: 1/3; position: relative; overflow: hidden; cursor: pointer; }
.photo-main img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
.photo-main:hover img { transform: scale(1.03); }
.photo-sm { position: relative; overflow: hidden; cursor: pointer; }
.photo-sm img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
.photo-sm:hover img { transform: scale(1.03); }
.photo-more { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; }
.photo-more span { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; color: #fff; }

/* TABS */
.tabs { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; display: flex; overflow: hidden; margin-bottom: 20px; position: sticky; top: 62px; z-index: 100; }
.tab { flex: 1; padding: 14px; text-align: center; font-size: 13.5px; font-weight: 500; color: #64748b; cursor: pointer; border: none; background: none; font-family: inherit; border-bottom: 2px solid transparent; transition: all 0.2s; }
.tab.active { color: #1447b8; font-weight: 600; border-bottom-color: #1447b8; background: #eff6ff; }
.tab:hover:not(.active) { color: #0f172a; }

/* LAYOUT */
.content-grid { display: grid; grid-template-columns: 1fr 340px; gap: 28px; }
.card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 28px; margin-bottom: 20px; }
.card-title { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 20px; }

/* OVERVIEW */
.rating-badge { background: #1447b8; color: #fff; border-radius: 12px; width: 64px; height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
.rating-val { font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 800; line-height: 1; }
.rating-sub { font-size: 11px; opacity: 0.8; }
.rating-bars { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px 32px; margin-top: 20px; }
.bar-label { display: flex; justify-content: space-between; font-size: 13px; color: #1e293b; margin-bottom: 5px; font-weight: 500; }
.bar-track { height: 5px; background: #e2e8f0; border-radius: 100px; overflow: hidden; }
.bar-fill { height: 100%; background: #1447b8; border-radius: 100px; }

/* ROOMS TABLE */
.rooms-table { width: 100%; border-collapse: collapse; }
.rooms-table thead tr { background: #f8fafc; }
.rooms-table th { padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; text-align: left; border-bottom: 1.5px solid #e2e8f0; }
.rooms-table td { padding: 16px; font-size: 14px; color: #1e293b; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
.rooms-table tr:hover td { background: #fafbff; }
.rooms-table tr:last-child td { border-bottom: none; }
.room-name { font-family: 'Sora', sans-serif; font-weight: 700; color: #0f172a; font-size: 15px; margin-bottom: 4px; }
.room-meta { font-size: 12px; color: #64748b; }
.board-badge { display: inline-flex; align-items: center; gap: 5px; background: #f0fdf4; color: #166534; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 100px; }
.refund-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 100px; }
.refund-free { background: #f0fdf4; color: #166534; }
.refund-no { background: #fef2f2; color: #991b1b; }
.price-cell { text-align: right; white-space: nowrap; }
.price-was { font-size: 12px; color: #94a3b8; text-decoration: line-through; }
.price-now { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; }
.price-night { font-size: 11px; color: #64748b; font-weight: 400; }
.price-tax { font-size: 11px; color: #64748b; margin-top: 2px; }
.price-save { font-size: 12px; color: #16a34a; font-weight: 600; margin-top: 2px; }
.select-btn { background: #1447b8; color: #fff; border: none; border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; }
.select-btn.selected { background: #16a34a; }

/* REVIEWS */
.review-score { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.review-big { font-family: 'Sora', sans-serif; font-size: 48px; font-weight: 800; color: #0f172a; line-height: 1; }
.review-label { font-family: 'Sora', sans-serif; font-size: 20px; font-weight: 700; color: #0f172a; }
.review-count { font-size: 13px; color: #64748b; }
.review-filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.review-filter { border: 1.5px solid #e2e8f0; border-radius: 100px; padding: 6px 16px; font-size: 13px; font-weight: 500; cursor: pointer; background: #fff; color: #1e293b; font-family: inherit; }
.review-filter.active { background: #1447b8; color: #fff; border-color: #1447b8; }
.review-card { border-bottom: 1px solid #f1f5f9; padding: 20px 0; }
.review-card:last-child { border-bottom: none; }
.review-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; display: flex; align-items: center; gap: 10px; }
.review-score-pill { background: #0f172a; color: #fff; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
.review-text { font-size: 13.5px; color: #64748b; line-height: 1.65; margin-bottom: 8px; }
.review-meta { font-size: 12px; color: #94a3b8; }

/* FACILITIES */
.facility-groups { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px; }
.facility-group-title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.facility-item { font-size: 13.5px; color: #64748b; padding: 5px 0; display: flex; align-items: center; gap: 8px; }
.facility-item::before { content: "✓"; color: #1447b8; font-weight: 700; font-size: 12px; }

/* POLICIES */
.policy-row { display: grid; grid-template-columns: 200px 1fr; gap: 20px; padding: 16px 0; border-bottom: 1px solid #f1f5f9; align-items: flex-start; }
.policy-row:last-child { border-bottom: none; }
.policy-label { font-size: 14px; font-weight: 600; color: #0f172a; display: flex; align-items: center; gap: 8px; }
.policy-val { font-size: 13.5px; color: #64748b; line-height: 1.65; }

/* MAP */
.map-placeholder { background: #e8f0f8; border-radius: 12px; height: 240px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; position: relative; overflow: hidden; }
.map-placeholder img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
.nearby-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.nearby-item { display: flex; justify-content: space-between; padding: 9px 12px; background: #f8fafc; border-radius: 8px; font-size: 13px; }
.nearby-dist { font-weight: 700; color: #0f172a; }

/* SIMILAR HOTELS */
.similar-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.similar-card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; overflow: hidden; cursor: pointer; transition: transform 0.2s; }
.similar-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
.similar-img { height: 160px; overflow: hidden; position: relative; }
.similar-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.similar-off { position: absolute; top: 10px; left: 10px; background: #16a34a; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
.similar-body { padding: 14px 16px; }
.similar-name { font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
.similar-loc { font-size: 12px; color: #64748b; margin-bottom: 8px; }
.similar-rating { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.similar-score { background: #0f172a; color: #fff; font-size: 12px; font-weight: 700; padding: 2px 7px; border-radius: 5px; }
.similar-price { display: flex; align-items: baseline; gap: 8px; }
.similar-was { font-size: 12px; color: #94a3b8; text-decoration: line-through; }
.similar-now { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 800; color: #0f172a; }
.similar-night { font-size: 11px; color: #64748b; }
.similar-perks { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
.similar-perk { font-size: 11px; color: #16a34a; font-weight: 600; display: flex; align-items: center; gap: 3px; }

/* SIDEBAR */
.sidebar-card { background: #fff; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); position: sticky; top: 72px; }
.member-badge { display: inline-flex; align-items: center; gap: 6px; background: #16a34a; color: #fff; font-size: 11.5px; font-weight: 700; padding: 4px 12px; border-radius: 100px; margin-bottom: 14px; }
.sidebar-price { font-family: 'Sora', sans-serif; font-size: 34px; font-weight: 800; color: #0f172a; }
.sidebar-was { font-size: 15px; color: #94a3b8; text-decoration: line-through; margin-left: 10px; }
.sidebar-nights { font-size: 12.5px; color: #64748b; margin-bottom: 18px; }
.date-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.date-box { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; cursor: pointer; }
.date-box-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 3px; }
.date-box-val { font-size: 14px; font-weight: 600; color: #0f172a; }
.guest-box { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; cursor: pointer; }
.selected-room-box { background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; }
.book-btn { width: 100%; background: #1447b8; color: #fff; border: none; border-radius: 10px; padding: 15px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; margin-bottom: 10px; }
.perks { margin-top: 16px; }
.perk { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #16a34a; font-weight: 500; margin-bottom: 8px; }
.perk::before { content: "✓"; font-weight: 800; }
.track-box { border-top: 1px solid #e2e8f0; margin-top: 16px; padding-top: 16px; }
.track-title { font-size: 12px; font-weight: 700; color: #1447b8; margin-bottom: 6px; }
.track-btn { width: 100%; background: #eff6ff; color: #1447b8; border: 1px solid #bfdbfe; border-radius: 8px; padding: 9px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }

/* UPSELL */
.upsell { background: #1447b8; border-radius: 12px; padding: 24px 28px; margin-bottom: 20px; }
.upsell-title { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 6px; }
.upsell-text { font-size: 13px; color: rgba(255,255,255,0.75); line-height: 1.7; margin-bottom: 14px; }
.upsell-btn { background: #fff; color: #1447b8; border: none; padding: 10px 22px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }

/* FOOTER */
footer { background: #0f172a; padding: 40px 40px 28px; }
.footer-inner { max-width: 1200px; margin: 0 auto; }
.footer-top { display: flex; justify-content: space-between; margin-bottom: 32px; gap: 40px; }
.footer-logo { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 20px; color: #fff; margin-bottom: 10px; }
.footer-desc { font-size: 13px; color: #94a3b8; max-width: 240px; line-height: 1.6; }
.footer-cols { display: flex; gap: 48px; }
.footer-col h4 { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; margin-bottom: 12px; }
.footer-col a { display: block; font-size: 13.5px; color: #94a3b8; text-decoration: none; margin-bottom: 9px; }
.footer-bottom { border-top: 1px solid #1e293b; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
.footer-copy { font-size: 12.5px; color: #475569; }
.social-icons { display: flex; gap: 10px; }
.social-icon { width: 32px; height: 32px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; text-decoration: none; }
.social-icon svg { fill: #94a3b8; }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="/" class="nav-logo">rebuq<span style="color:#1447b8">.</span></a>
  <ul class="nav-links">
    <li><a href="#">How it works</a></li>
    <li><a href="#" class="active">Exclusive Member Deals</a></li>
  </ul>
  <div class="nav-right">
    <button style="font-size:14px;color:#0f172a;background:none;border:none;cursor:pointer;font-weight:500;font-family:inherit">Sign in</button>
    <button class="btn-nav">Check my booking</button>
  </div>
</nav>

<!-- SEARCH BAR -->
<div class="search-bar">
  <div class="search-inner">
    <div class="search-field">
      <div class="search-label">📍 Destination or Hotel</div>
      <div class="search-val">Atlantis The Palm, Dubai</div>
    </div>
    <div class="search-field">
      <div class="search-label">📅 Check-in</div>
      <div class="search-val">Thu, 14 Aug 2026</div>
    </div>
    <div class="search-field">
      <div class="search-label">📅 Check-out</div>
      <div class="search-val">Sun, 17 Aug 2026</div>
    </div>
    <div class="search-field">
      <div class="search-label">👤 Guests</div>
      <div class="search-val">2 Adults · 1 Room</div>
    </div>
    <button class="search-btn">🔍 Search</button>
  </div>
</div>

<!-- BREADCRUMB -->
<div class="breadcrumb">
  <a href="#">Hotels</a>
  <span>›</span>
  <a href="#">Dubai</a>
  <span>›</span>
  <strong>Atlantis The Palm</strong>
</div>

<div class="main">

  <!-- HOTEL HEADER -->
  <div class="hotel-header">
    <div>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <h1 class="hotel-name sora">Atlantis The Palm</h1>
        <span class="hotel-stars">★★★★★</span>
      </div>
      <div class="hotel-addr">
        📍 Crescent Rd, The Palm Jumeirah, Dubai, UAE
        <a href="#">Show on map</a>
      </div>
    </div>
    <div class="icon-btns">
      <button class="icon-btn">⬆</button>
      <button class="icon-btn">♡</button>
    </div>
  </div>

  <!-- PHOTO GRID -->
  <div class="photo-grid">
    <div class="photo-main">
      <img src="https://images.pexels.com/photos/33720952/pexels-photo-33720952.jpeg?auto=compress&cs=tinysrgb&w=900&fit=crop&h=600" alt="Atlantis The Palm" />
    </div>
    <div class="photo-sm">
      <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop" alt="" />
    </div>
    <div class="photo-sm">
      <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=85&fit=crop" alt="" />
      <div class="photo-more">
        <span>+18 Photos</span>
      </div>
    </div>
  </div>

  <!-- CONTENT GRID -->
  <div class="content-grid">

    <!-- LEFT -->
    <div>

      <!-- TABS -->
      <div class="tabs">
        <button class="tab active" onclick="setTab(this,'overview')">Overview</button>
        <button class="tab" onclick="setTab(this,'rooms')">Rooms</button>
        <button class="tab" onclick="setTab(this,'reviews')">Reviews</button>
        <button class="tab" onclick="setTab(this,'facilities')">Facilities</button>
        <button class="tab" onclick="setTab(this,'location')">Location</button>
        <button class="tab" onclick="setTab(this,'policies')">Policies</button>
      </div>

      <!-- OVERVIEW -->
      <div class="card" id="overview">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:18px">
          <div class="rating-badge">
            <div class="rating-val">9.1</div>
            <div class="rating-sub">/10</div>
          </div>
          <div>
            <div class="sora" style="font-size:20px;font-weight:700;color:#0f172a">Exceptional</div>
            <div style="font-size:13px;color:#64748b;margin-top:2px">Based on 2,341 verified guest reviews</div>
          </div>
        </div>
        <p style="font-size:14.5px;color:#64748b;line-height:1.75;margin-bottom:24px">
          Atlantis The Palm is a landmark luxury resort on the crescent of the Palm Jumeirah. Home to Aquaventure Waterpark, The Lost Chambers Aquarium, over 20 world-class restaurants, and a private beach, it offers an unmatched experience for families, couples, and discerning travellers alike. As a rebuq member, you unlock rates significantly below public OTA pricing.
        </p>

        <!-- Highlights -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px">
          <div style="background:#f8fafc;border-radius:10px;padding:16px;border:1px solid #e2e8f0">
            <div style="font-size:22px;margin-bottom:8px">🏖️</div>
            <div style="font-family:'Sora',sans-serif;font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px">Private Beach</div>
            <div style="font-size:12px;color:#64748b">700m of exclusive beachfront with full service</div>
          </div>
          <div style="background:#f8fafc;border-radius:10px;padding:16px;border:1px solid #e2e8f0">
            <div style="font-size:22px;margin-bottom:8px">🌊</div>
            <div style="font-family:'Sora',sans-serif;font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px">Aquaventure</div>
            <div style="font-size:12px;color:#64748b">Award-winning waterpark included for guests</div>
          </div>
          <div style="background:#f8fafc;border-radius:10px;padding:16px;border:1px solid #e2e8f0">
            <div style="font-size:22px;margin-bottom:8px">🍽️</div>
            <div style="font-family:'Sora',sans-serif;font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px">21 Restaurants</div>
            <div style="font-size:12px;color:#64748b">Nobu, Bread Street Kitchen & 19 more</div>
          </div>
        </div>

        <div class="rating-bars">
          <div><div class="bar-label"><span>Cleanliness</span><span style="font-weight:700;color:#0f172a">9.4</span></div><div class="bar-track"><div class="bar-fill" style="width:94%"></div></div></div>
          <div><div class="bar-label"><span>Service</span><span style="font-weight:700;color:#0f172a">9.2</span></div><div class="bar-track"><div class="bar-fill" style="width:92%"></div></div></div>
          <div><div class="bar-label"><span>Location</span><span style="font-weight:700;color:#0f172a">9.5</span></div><div class="bar-track"><div class="bar-fill" style="width:95%"></div></div></div>
          <div><div class="bar-label"><span>Amenities</span><span style="font-weight:700;color:#0f172a">9.6</span></div><div class="bar-track"><div class="bar-fill" style="width:96%"></div></div></div>
          <div><div class="bar-label"><span>Value</span><span style="font-weight:700;color:#0f172a">8.7</span></div><div class="bar-track"><div class="bar-fill" style="width:87%"></div></div></div>
          <div><div class="bar-label"><span>Comfort</span><span style="font-weight:700;color:#0f172a">9.3</span></div><div class="bar-track"><div class="bar-fill" style="width:93%"></div></div></div>
        </div>
      </div>

      <!-- ROOMS -->
      <div class="card" id="rooms">
        <div class="card-title">Select your room</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:16px;display:flex;gap:12px">
          <span style="background:#f0fdf4;color:#166534;font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px">Free Cancellation</span>
          <span style="background:#eff6ff;color:#1447b8;font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px">Free Breakfast</span>
        </div>

        <table class="rooms-table">
          <thead>
            <tr>
              <th style="width:28%">Room Type</th>
              <th style="width:20%">Board Basis</th>
              <th style="width:18%">Cancellation</th>
              <th style="width:22%;text-align:right">Price (incl. taxes)</th>
              <th style="width:12%"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="room-name">Deluxe King Room</div>
                <div class="room-meta">44 m² · King bed · Up to 2 adults</div>
                <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
                  <span style="background:#f8fafc;color:#64748b;font-size:11px;padding:2px 8px;border-radius:6px">Sea view</span>
                  <span style="background:#f8fafc;color:#64748b;font-size:11px;padding:2px 8px;border-radius:6px">Balcony</span>
                </div>
              </td>
              <td><span class="board-badge">🍳 Breakfast incl.</span></td>
              <td><span class="refund-badge refund-free">✓ Free cancel</span></td>
              <td class="price-cell">
                <div class="price-was">₹47,400</div>
                <div class="price-now">₹28,400 <span class="price-night">/night</span></div>
                <div class="price-tax">₹85,200 total · incl. taxes</div>
                <div class="price-save">Save ₹56,800</div>
              </td>
              <td><button class="select-btn selected">✓ Selected</button></td>
            </tr>
            <tr>
              <td>
                <div class="room-name">Premier Seaview Suite</div>
                <div class="room-meta">88 m² · King bed · Up to 3 adults</div>
                <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
                  <span style="background:#f8fafc;color:#64748b;font-size:11px;padding:2px 8px;border-radius:6px">Ocean view</span>
                  <span style="background:#f8fafc;color:#64748b;font-size:11px;padding:2px 8px;border-radius:6px">Living room</span>
                  <span style="background:#f8fafc;color:#64748b;font-size:11px;padding:2px 8px;border-radius:6px">Butler</span>
                </div>
              </td>
              <td><span class="board-badge">🍳 Breakfast incl.</span></td>
              <td><span class="refund-badge refund-free">✓ Free cancel</span></td>
              <td class="price-cell">
                <div class="price-was">₹72,000</div>
                <div class="price-now">₹52,000 <span class="price-night">/night</span></div>
                <div class="price-tax">₹1,56,000 total · incl. taxes</div>
                <div class="price-save">Save ₹60,000</div>
              </td>
              <td><button class="select-btn" onclick="selectRoom(this)">Select</button></td>
            </tr>
            <tr>
              <td>
                <div class="room-name">Deluxe King Room</div>
                <div class="room-meta">44 m² · King bed · Up to 2 adults</div>
                <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
                  <span style="background:#f8fafc;color:#64748b;font-size:11px;padding:2px 8px;border-radius:6px">Pool view</span>
                </div>
              </td>
              <td><span style="background:#f8fafc;color:#64748b;font-size:12px;font-weight:600;padding:3px 10px;border-radius:100px">Room only</span></td>
              <td><span class="refund-badge refund-no">✕ Non-refundable</span></td>
              <td class="price-cell">
                <div class="price-was">₹42,000</div>
                <div class="price-now">₹24,600 <span class="price-night">/night</span></div>
                <div class="price-tax">₹73,800 total · incl. taxes</div>
                <div class="price-save">Save ₹51,800</div>
              </td>
              <td><button class="select-btn" onclick="selectRoom(this)">Select</button></td>
            </tr>
            <tr>
              <td>
                <div class="room-name">Imperial Suite</div>
                <div class="room-meta">220 m² · King bed · Up to 4 adults</div>
                <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
                  <span style="background:#f8fafc;color:#64748b;font-size:11px;padding:2px 8px;border-radius:6px">Palm view</span>
                  <span style="background:#f8fafc;color:#64748b;font-size:11px;padding:2px 8px;border-radius:6px">Private pool</span>
                  <span style="background:#f8fafc;color:#64748b;font-size:11px;padding:2px 8px;border-radius:6px">Butler</span>
                </div>
              </td>
              <td><span class="board-badge">🍽️ Half board</span></td>
              <td><span class="refund-badge refund-free">✓ Free cancel</span></td>
              <td class="price-cell">
                <div class="price-was">₹1,80,000</div>
                <div class="price-now">₹1,24,000 <span class="price-night">/night</span></div>
                <div class="price-tax">₹3,72,000 total · incl. taxes</div>
                <div class="price-save">Save ₹1,68,000</div>
              </td>
              <td><button class="select-btn" onclick="selectRoom(this)">Select</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- REVIEWS -->
      <div class="card" id="reviews">
        <div class="card-title">Guest Reviews</div>
        <div class="review-score">
          <div class="review-big">9.1</div>
          <div>
            <div class="review-label">Exceptional</div>
            <div class="review-count">Based on 2,341 verified reviews</div>
          </div>
        </div>
        <div class="review-filters">
          <button class="review-filter active">All Reviews (2341)</button>
          <button class="review-filter">Couples (842)</button>
          <button class="review-filter">Family (614)</button>
          <button class="review-filter">Business (287)</button>
          <button class="review-filter">Solo (598)</button>
        </div>

        <div class="review-card">
          <div class="review-title">Absolutely incredible experience <span class="review-score-pill">10.0</span></div>
          <div class="review-text">The Aquaventure was a highlight for the kids and the private beach was stunning. Room service was prompt and the butler service for our suite was impeccable. Will definitely return.</div>
          <div class="review-meta">Priya M. · Family · India · April 2026</div>
        </div>
        <div class="review-card">
          <div class="review-title">Best hotel in Dubai, hands down <span class="review-score-pill">9.5</span></div>
          <div class="review-text">We celebrated our anniversary here and the hotel went above and beyond. The room was enormous, views were spectacular, and the breakfast spread was extraordinary. Worth every rupee.</div>
          <div class="review-meta">Rahul & Neha S. · Couple · Mumbai · March 2026</div>
        </div>
        <div class="review-card">
          <div class="review-title">Great for families <span class="review-score-pill">9.0</span></div>
          <div class="review-text">Kids loved the waterpark — they didn't want to leave! Check-in was smooth, staff were incredibly helpful with everything. Dining options are excellent with so much variety.</div>
          <div class="review-meta">Vikram T. · Family · Bengaluru · February 2026</div>
        </div>
        <button style="color:#1447b8;font-size:14px;font-weight:600;background:none;border:none;cursor:pointer;font-family:inherit;margin-top:8px">View all 2,341 reviews →</button>
      </div>

      <!-- FACILITIES -->
      <div class="card" id="facilities">
        <div class="card-title">Hotel Facilities</div>
        <div class="facility-groups">
          <div>
            <div class="facility-group-title">🏊 Pool & Beach</div>
            <div class="facility-item">Private beach access</div>
            <div class="facility-item">Aquaventure Waterpark</div>
            <div class="facility-item">Outdoor freshwater pool</div>
            <div class="facility-item">Infinity pool</div>
            <div class="facility-item">Kids pool</div>
          </div>
          <div>
            <div class="facility-group-title">🍽️ Dining</div>
            <div class="facility-item">21 restaurants & bars</div>
            <div class="facility-item">Nobu Dubai</div>
            <div class="facility-item">Bread Street Kitchen</div>
            <div class="facility-item">24-hour room service</div>
            <div class="facility-item">In-room dining</div>
          </div>
          <div>
            <div class="facility-group-title">💆 Wellness</div>
            <div class="facility-item">Spa & wellness centre</div>
            <div class="facility-item">Gym & fitness centre</div>
            <div class="facility-item">Sauna & steam room</div>
            <div class="facility-item">Yoga classes</div>
            <div class="facility-item">Massage treatments</div>
          </div>
          <div>
            <div class="facility-group-title">🛎️ Services</div>
            <div class="facility-item">24-hour concierge</div>
            <div class="facility-item">Butler service (suites)</div>
            <div class="facility-item">Airport transfer</div>
            <div class="facility-item">Valet parking</div>
            <div class="facility-item">Laundry service</div>
          </div>
          <div>
            <div class="facility-group-title">🌐 Connectivity</div>
            <div class="facility-item">Free high-speed WiFi</div>
            <div class="facility-item">Business centre</div>
            <div class="facility-item">Meeting rooms</div>
            <div class="facility-item">Multilingual staff</div>
          </div>
          <div>
            <div class="facility-group-title">👨‍👩‍👧 Family</div>
            <div class="facility-item">Kids club</div>
            <div class="facility-item">Babysitting service</div>
            <div class="facility-item">Kids menu</div>
            <div class="facility-item">Lost chambers aquarium</div>
            <div class="facility-item">Dolphin Bay</div>
          </div>
        </div>
      </div>

      <!-- POLICIES -->
      <div class="card" id="policies">
        <div class="card-title">Hotel Policies</div>
        <div class="policy-row">
          <div class="policy-label">🕐 Check-in</div>
          <div class="policy-val">From 3:00 PM · Early check-in available on request (subject to availability)</div>
        </div>
        <div class="policy-row">
          <div class="policy-label">🕐 Check-out</div>
          <div class="policy-val">Until 12:00 PM · Late check-out available on request</div>
        </div>
        <div class="policy-row">
          <div class="policy-label">👶 Children</div>
          <div class="policy-val">All children welcome · Infants (0–2) stay free · Children (3–12) share existing bedding free · Extra beds available at additional charge</div>
        </div>
        <div class="policy-row">
          <div class="policy-label">🐾 Pets</div>
          <div class="policy-val">Pets not allowed</div>
        </div>
        <div class="policy-row">
          <div class="policy-label">🚬 Smoking</div>
          <div class="policy-val">Non-smoking rooms available · Designated smoking areas</div>
        </div>
        <div class="policy-row">
          <div class="policy-label">📋 Property Info</div>
          <div class="policy-val">104 rooms · 18 floors · Distance to airport: 40 min · Free WiFi throughout · Valet parking: AED 50/day · Breakfast charge (if not included): AED 110</div>
        </div>
      </div>

      <!-- LOCATION -->
      <div class="card" id="location">
        <div class="card-title">Location</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:13.5px;color:#64748b">📍 Crescent Rd, The Palm Jumeirah, Dubai, UAE</span>
          <a href="https://maps.google.com" target="_blank" style="color:#1447b8;font-weight:500;font-size:13px;text-decoration:none;margin-left:auto">Open in Google Maps ↗</a>
        </div>
        <div class="map-placeholder">
          <img src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=85&fit=crop" alt="Map area" style="opacity:0.6" />
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#1447b8;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(0,0,0,0.3)">📍</div>
        </div>
        <div class="nearby-grid">
          <div class="nearby-item"><span style="color:#64748b">Dubai Mall</span><span class="nearby-dist">12 km</span></div>
          <div class="nearby-item"><span style="color:#64748b">Burj Khalifa</span><span class="nearby-dist">13 km</span></div>
          <div class="nearby-item"><span style="color:#64748b">DXB Airport</span><span class="nearby-dist">38 km</span></div>
          <div class="nearby-item"><span style="color:#64748b">Dubai Marina</span><span class="nearby-dist">4.2 km</span></div>
          <div class="nearby-item"><span style="color:#64748b">JBR Beach</span><span class="nearby-dist">5.1 km</span></div>
          <div class="nearby-item"><span style="color:#64748b">Mall of Emirates</span><span class="nearby-dist">9.8 km</span></div>
        </div>
      </div>

      <!-- UPSELL -->
      <div class="upsell">
        <div class="upsell-title">Already booked this hotel?</div>
        <div class="upsell-text">Upload your voucher and our AI watches the price 24/7. WhatsApp alert the moment it drops. Free to track — you only pay if we save you money.</div>
        <button class="upsell-btn">Upload voucher → Track price</button>
      </div>

      <!-- SIMILAR HOTELS -->
      <div style="margin-bottom:20px">
        <div class="sora" style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:20px">People also viewed</div>
        <div class="similar-grid">
          <div class="similar-card">
            <div class="similar-img">
              <img src="https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=600&fit=crop&h=400" alt="Burj Al Arab" />
              <span class="similar-off">↓ 12% off</span>
            </div>
            <div class="similar-body">
              <div class="similar-name">Burj Al Arab</div>
              <div class="similar-loc">📍 Dubai · 8.2 km from this hotel</div>
              <div class="similar-rating">
                <span class="similar-score">9.4</span>
                <span style="font-size:12px;color:#64748b;font-weight:600">Exceptional</span>
                <span style="font-size:12px;color:#94a3b8">· 1,812 ratings</span>
              </div>
              <div class="similar-price">
                <span class="similar-was">₹1,20,000</span>
                <span class="similar-now">₹84,000</span>
                <span class="similar-night">/night</span>
              </div>
              <div class="similar-perks">
                <span class="similar-perk">✓ Free WiFi</span>
                <span class="similar-perk">✓ Free Breakfast</span>
              </div>
            </div>
          </div>
          <div class="similar-card">
            <div class="similar-img">
              <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop" alt="Jumeirah Al Qasr" />
              <span class="similar-off">↓ 18% off</span>
            </div>
            <div class="similar-body">
              <div class="similar-name">Jumeirah Al Qasr</div>
              <div class="similar-loc">📍 Dubai · 12.4 km from this hotel</div>
              <div class="similar-rating">
                <span class="similar-score">9.1</span>
                <span style="font-size:12px;color:#64748b;font-weight:600">Exceptional</span>
                <span style="font-size:12px;color:#94a3b8">· 3,241 ratings</span>
              </div>
              <div class="similar-price">
                <span class="similar-was">₹44,000</span>
                <span class="similar-now">₹31,800</span>
                <span class="similar-night">/night</span>
              </div>
              <div class="similar-perks">
                <span class="similar-perk">✓ Free Cancellation</span>
                <span class="similar-perk">✓ Free WiFi</span>
              </div>
            </div>
          </div>
          <div class="similar-card">
            <div class="similar-img">
              <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop" alt="Address Downtown" />
              <span class="similar-off">↓ 14% off</span>
            </div>
            <div class="similar-body">
              <div class="similar-name">Address Downtown Dubai</div>
              <div class="similar-loc">📍 Dubai · 16.2 km from this hotel</div>
              <div class="similar-rating">
                <span class="similar-score">9.2</span>
                <span style="font-size:12px;color:#64748b;font-weight:600">Exceptional</span>
                <span style="font-size:12px;color:#94a3b8">· 5,614 ratings</span>
              </div>
              <div class="similar-price">
                <span class="similar-was">₹52,000</span>
                <span class="similar-now">₹37,400</span>
                <span class="similar-night">/night</span>
              </div>
              <div class="similar-perks">
                <span class="similar-perk">✓ Free Cancellation</span>
                <span class="similar-perk">✓ Burj view</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- SIDEBAR -->
    <div>
      <div class="sidebar-card">
        <div class="member-badge">
          <span style="width:6px;height:6px;background:#fff;border-radius:50%;display:inline-block"></span>
          Member price · Save up to 28%
        </div>
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:4px">
          <span class="sidebar-price">₹28,400</span>
          <span class="sidebar-was">₹47,400</span>
        </div>
        <div class="sidebar-nights">+ taxes included · per night · 3 nights · ₹85,200 total</div>

        <div class="date-grid">
          <div class="date-box">
            <div class="date-box-label">📅 Check-in</div>
            <div class="date-box-val">Thu, 14 Aug</div>
          </div>
          <div class="date-box">
            <div class="date-box-label">📅 Check-out</div>
            <div class="date-box-val">Sun, 17 Aug</div>
          </div>
        </div>

        <div class="guest-box">
          <div class="date-box-label">👤 Guests</div>
          <div class="date-box-val">2 Adults · 1 Room</div>
        </div>

        <div class="selected-room-box">
          <div style="font-size:11px;color:#1447b8;font-weight:700;margin-bottom:2px">Selected room</div>
          <div style="font-size:13px;color:#374151">Deluxe King Room · Breakfast incl.</div>
        </div>

        <button class="book-btn">Book Now →</button>
        <div style="text-align:center;font-size:12.5px;color:#64748b;margin-bottom:8px">No payment needed today</div>

        <div class="perks">
          <div class="perk">Free cancellation available</div>
          <div class="perk">Reserve now, pay at hotel</div>
          <div class="perk">Best member price guarantee</div>
        </div>

        <div class="track-box">
          <div class="track-title">💡 Already booked this hotel?</div>
          <div style="font-size:11.5px;color:#64748b;line-height:1.6;margin-bottom:10px">Upload your voucher — we watch the price 24/7 and WhatsApp you when it drops.</div>
          <button class="track-btn">Track price drops →</button>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div>
        <div class="footer-logo">rebuq<span style="color:#1447b8">.</span></div>
        <p class="footer-desc">AI-powered hotel price monitoring for Indian travelers. Never overpay for a hotel again.</p>
      </div>
      <div class="footer-cols">
        <div class="footer-col">
          <h4>Product</h4>
          <a href="#">How it works</a>
          <a href="#">Member Deals</a>
          <a href="#">Why rebuq</a>
          <a href="#">Check my booking</a>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <a href="#">About</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span class="footer-copy">© 2026 rebuq. All rights reserved. Powered by Claude AI · Anthropic</span>
      <div class="social-icons">
        <a href="#" class="social-icon">
          <svg width="14" height="14" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href="#" class="social-icon">
          <svg width="14" height="14" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
        <a href="#" class="social-icon">
          <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>

<script>
function setTab(btn, id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function selectRoom(btn) {
  document.querySelectorAll('.select-btn').forEach(b => { b.textContent = 'Select'; b.classList.remove('selected'); });
  btn.textContent = '✓ Selected';
  btn.classList.add('selected');
}
document.querySelectorAll('.review-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.review-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
</script>
</body>
</html>

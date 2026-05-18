<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>rebuq. — Homepage Preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
  .sora { font-family: 'Sora', sans-serif; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  /* NAV */
  nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255,255,255,0.95); backdrop-filter: blur(10px);
    border-bottom: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 40px; height: 60px;
  }
  .nav-logo { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 20px; color: #0f172a; text-decoration: none; }
  nav ul { display: flex; gap: 32px; list-style: none; }
  nav ul button { font-size: 14px; color: #64748b; background: none; border: none; cursor: pointer; font-weight: 500; font-family: inherit; }
  nav ul button.active { color: #1447b8; font-weight: 600; }
  .nav-right { display: flex; gap: 12px; align-items: center; }
  .btn-signin { font-size: 14px; color: #0f172a; background: none; border: none; cursor: pointer; font-weight: 500; font-family: inherit; padding: 8px 12px; border-radius: 8px; }
  .btn-cta { background: #1447b8; color: #fff; border: none; border-radius: 8px; padding: 9px 20px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }

  /* HERO */
  .hero { text-align: center; padding: 90px 24px 70px; background: linear-gradient(180deg, #f0f6ff 0%, #ffffff 100%); }
  .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: #e0edff; color: #1447b8; font-size: 12px; font-weight: 600; padding: 5px 14px; border-radius: 100px; margin-bottom: 28px; letter-spacing: 0.04em; text-transform: uppercase; }
  .hero h1 { font-family: 'Sora', sans-serif; font-size: 64px; font-weight: 800; line-height: 1.1; color: #0f172a; max-width: 760px; margin: 0 auto 20px; }
  .hero p { font-size: 17px; color: #64748b; max-width: 520px; margin: 0 auto 36px; line-height: 1.7; }
  .hero-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .btn-hero-primary { background: #1447b8; color: #fff; border: none; border-radius: 10px; padding: 14px 28px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .btn-hero-secondary { background: transparent; color: #0f172a; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 14px 28px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }

  /* CAROUSEL */
  .carousel-section { padding: 0 0 60px; }
  .carousel-header { text-align: center; padding: 20px 40px 24px; }
  .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #1447b8; margin-bottom: 14px; }
  .carousel-header h2 { font-family: 'Sora', sans-serif; font-size: 36px; font-weight: 800; color: #0f172a; line-height: 1.15; }
  .carousel-wrap { overflow: hidden; padding: 0 40px; }
  .carousel-track { display: flex; gap: 16px; transition: transform 0.4s cubic-bezier(.4,0,.2,1); }
  .hotel-card { flex: 0 0 240px; border-radius: 14px; overflow: hidden; position: relative; height: 200px; cursor: pointer; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
  .hotel-card img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
  .hotel-card:hover img { transform: scale(1.04); }
  .hotel-card .overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.62) 0%, transparent 60%); }
  .hotel-card .info { position: absolute; bottom: 14px; left: 14px; color: #fff; }
  .hotel-card .info .price { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; display: block; }
  .hotel-card .info .name { font-size: 12px; opacity: 0.85; }
  .hotel-card .pct { position: absolute; top: 12px; right: 12px; background: #16a34a; color: #fff; font-size: 13px; font-weight: 700; padding: 4px 10px; border-radius: 8px; }
  .carousel-nav { display: flex; justify-content: center; gap: 12px; margin-top: 20px; }
  .carousel-nav button { background: #f1f5f9; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .carousel-nav button:hover { background: #1447b8; color: #fff; }

  /* HOW IT WORKS */
  .how-section { padding: 80px 40px; max-width: 1100px; margin: 0 auto; }
  .how-section h2 { font-family: 'Sora', sans-serif; font-size: 46px; font-weight: 800; color: #0f172a; text-align: center; line-height: 1.15; }
  .how-section > p { font-size: 16px; color: #64748b; text-align: center; margin-top: 12px; }
  .steps-grid { display: grid; grid-template-columns: 200px 1fr; gap: 40px; margin-top: 60px; align-items: flex-start; }
  .step-tabs { display: flex; flex-direction: column; }
  .step-tab { padding: 16px 20px; cursor: pointer; border-left: 3px solid #e2e8f0; color: #64748b; font-weight: 600; font-size: 15px; background: none; border-top: none; border-right: none; border-bottom: none; font-family: inherit; text-align: left; }
  .step-tab.active { border-left-color: #1447b8; color: #1447b8; }
  .step-panel { background: #f8fafc; border-radius: 14px; padding: 32px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
  .step-ai-badge { display: inline-flex; align-items: center; gap: 5px; background: #e0edff; color: #1447b8; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px; margin-bottom: 12px; }
  .step-panel p { color: #64748b; font-size: 15px; margin-bottom: 24px; line-height: 1.7; }
  .tracker { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
  .tracker-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
  .live-dot { width: 7px; height: 7px; background: #16a34a; border-radius: 50%; display: inline-block; animation: pulse 1.5s infinite; margin-right: 5px; }
  .tracker-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  .tracker-row:last-child { border-bottom: none; }

  /* STATS */
  .stats-section { background: #f8fafc; padding: 80px 40px; }
  .stats-inner { max-width: 1100px; margin: 0 auto; }
  .stats-section h2 { font-family: 'Sora', sans-serif; font-size: 46px; font-weight: 800; color: #0f172a; text-align: center; line-height: 1.15; }
  .stats-section > .stats-inner > p { font-size: 16px; color: #64748b; text-align: center; margin-top: 12px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; margin-top: 48px; }
  .stat-card { background: #fff; border-radius: 14px; padding: 28px 24px; text-align: center; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
  .stat-card .val { font-family: 'Sora', sans-serif; font-size: 36px; font-weight: 800; color: #0f172a; }
  .stat-card .lbl { font-size: 13px; color: #64748b; margin-top: 6px; }

  /* TESTIMONIALS */
  .testi-section { background: #f8fafc; padding: 0 40px 80px; }
  .testi-inner { max-width: 1100px; margin: 0 auto; }
  .testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 32px; }
  .testi-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 24px; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
  .testi-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .testi-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #1447b8, #60a5fa); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px; flex-shrink: 0; }
  .testi-name { font-weight: 600; font-size: 14px; color: #0f172a; }
  .testi-role { font-size: 12px; color: #64748b; }
  .testi-saved { font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
  .testi-text { font-size: 13.5px; color: #64748b; line-height: 1.65; }
  .reviews-link { text-align: center; margin: 16px 0 0; }
  .reviews-link a { display: inline-flex; align-items: center; gap: 6px; color: #1447b8; font-size: 13px; font-weight: 600; text-decoration: none; border: 1.5px solid #c7d8f8; border-radius: 8px; padding: 7px 16px; transition: background 0.2s; }
  .reviews-link a:hover { background: #e0edff; }

  /* QUOTE BANNER */
  .quote-banner { background: #0f172a; padding: 70px 40px; text-align: center; }
  .quote-banner .quote-text { font-family: 'Sora', sans-serif; font-size: 38px; font-weight: 700; color: #fff; max-width: 720px; margin: 28px auto 20px; line-height: 1.25; }
  .quote-banner .quote-attr { font-size: 13px; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase; }

  /* FEATURES */
  .features-section { padding: 80px 40px; }
  .features-inner { max-width: 1100px; margin: 0 auto; }
  .features-section h2 { font-family: 'Sora', sans-serif; font-size: 46px; font-weight: 800; color: #0f172a; text-align: center; line-height: 1.15; }
  .feat-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; margin-top: 48px; }
  .feat-card { border-radius: 14px; padding: 28px; border: 1.5px solid #e2e8f0; background: #f8fafc; }
  .feat-card.wide { grid-column: 1/-1; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center; }
  .feat-card.full { grid-column: 1/-1; }
  .feat-badge { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 10px; border-radius: 100px; margin-bottom: 12px; }
  .feat-card h3 { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
  .feat-card p { font-size: 14px; color: #64748b; line-height: 1.65; }
  .feat-stat { font-family: 'Sora', sans-serif; font-size: 42px; font-weight: 800; color: #1447b8; margin-top: 16px; }
  .feat-stat-lbl { font-size: 13px; color: #64748b; }
  .feat-visual { background: #eff6ff; border-radius: 12px; padding: 28px; text-align: center; }
  .feat-visual .big { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 22px; color: #1447b8; }
  .feat-visual .sub { font-size: 13px; color: #64748b; margin-top: 6px; }

  /* FAQ */
  .faq-section { background: #f8fafc; padding: 80px 40px; }
  .faq-inner { max-width: 700px; margin: 0 auto; }
  .faq-section h2 { font-family: 'Sora', sans-serif; font-size: 36px; font-weight: 800; color: #0f172a; }
  .faq-list { margin-top: 36px; }
  .faq-item { background: #fff; border-radius: 12px; margin-bottom: 12px; border: 1.5px solid #e2e8f0; overflow: hidden; }
  .faq-q { width: 100%; padding: 20px 24px; font-weight: 600; font-size: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; color: #0f172a; background: none; border: none; font-family: inherit; text-align: left; }
  .faq-icon { font-size: 20px; color: #64748b; transition: transform 0.25s; flex-shrink: 0; }
  .faq-a { padding: 0 24px 20px; font-size: 14.5px; color: #64748b; line-height: 1.7; display: none; }
  .faq-a.open { display: block; }

  /* CTA BOTTOM */
  .cta-bottom { background: linear-gradient(135deg, #1d4ed8 0%, #1447b8 100%); padding: 80px 40px; text-align: center; }
  .cta-bottom h2 { font-family: 'Sora', sans-serif; font-size: 46px; font-weight: 800; color: #fff; max-width: 600px; margin: 24px auto 16px; line-height: 1.15; }
  .cta-bottom p { font-size: 16px; color: rgba(255,255,255,0.75); max-width: 480px; margin: 0 auto 36px; }
  .cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .btn-cta-white { background: #fff; color: #1447b8; border: none; border-radius: 10px; padding: 13px 26px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .btn-cta-outline { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,0.5); border-radius: 10px; padding: 13px 26px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .cta-pills { display: flex; gap: 24px; justify-content: center; margin-top: 28px; flex-wrap: wrap; }
  .cta-pill { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.75); font-size: 13px; }

  /* FOOTER */
  footer { background: #0f172a; padding: 48px 40px 32px; }
  .footer-inner { max-width: 1100px; margin: 0 auto; }
  .footer-top { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px; flex-wrap: wrap; }
  .footer-logo { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 20px; color: #fff; margin-bottom: 10px; }
  .footer-desc { font-size: 13.5px; color: #94a3b8; max-width: 260px; line-height: 1.6; }
  .footer-cols { display: flex; gap: 48px; }
  .footer-col h4 { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; margin-bottom: 14px; }
  .footer-col a { display: block; font-size: 14px; color: #94a3b8; text-decoration: none; margin-bottom: 10px; }
  .footer-col a:hover { color: #fff; }
  .footer-bottom { border-top: 1px solid #1e293b; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; }
  .footer-copy { font-size: 13px; color: #475569; }
  .social-icons { display: flex; gap: 10px; align-items: center; }
  .social-icon { width: 34px; height: 34px; border-radius: 50%; background: #1e293b; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: background 0.2s; }
  .social-icon:hover { background: #1447b8; }
  .social-icon svg { width: 16px; height: 16px; fill: #94a3b8; }
  .social-icon:hover svg { fill: #fff; }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="/" class="nav-logo">rebuq<span style="color:#1447b8">.</span></a>
  <ul>
    <li><button onclick="document.getElementById('how').scrollIntoView({behavior:'smooth'})">How it works</button></li>
    <li><button class="active">Exclusive Member Deals</button></li>
  </ul>
  <div class="nav-right">
    <button class="btn-signin">Sign in</button>
    <button class="btn-cta">Check my booking</button>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-badge">✦ AI-Powered · Watches 24×7</div>
  <h1 class="sora">Your hotel price just dropped. <span style="color:#1447b8">Did you notice?</span></h1>
  <p>Booked a hotel? rebuq watches the price 24/7 after you pay. When it drops, we alert you instantly — you rebook and pocket the difference. Free to check.</p>
  <div class="hero-btns">
    <button class="btn-hero-primary">Check my booking — it's free</button>
    <button class="btn-hero-secondary">▶ See how it works</button>
  </div>
</section>

<!-- HOTEL CAROUSEL -->
<div class="carousel-section">
  <div class="carousel-header">
    <p class="eyebrow">Real savings · Verified drops</p>
    <h2 class="sora">rebuq members saved on these hotels</h2>
  </div>
  <div class="carousel-wrap">
    <div class="carousel-track" id="carouselTrack">
      <div class="hotel-card">
        <img src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=85&fit=crop" alt="Atlantis The Palm, Dubai" />
        <div class="overlay"></div>
        <div class="info"><span class="price">₹22,400</span><span class="name">Atlantis The Palm, Dubai</span></div>
        <div class="pct">↓19%</div>
      </div>
      <div class="hotel-card">
        <img src="https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=85&fit=crop" alt="Park Hyatt Maldives" />
        <div class="overlay"></div>
        <div class="info"><span class="price">₹31,600</span><span class="name">Park Hyatt, Maldives</span></div>
        <div class="pct">↓20%</div>
      </div>
      <div class="hotel-card">
        <img src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=85&fit=crop" alt="Four Seasons Bali" />
        <div class="overlay"></div>
        <div class="info"><span class="price">₹18,200</span><span class="name">Four Seasons, Bali</span></div>
        <div class="pct">↓22%</div>
      </div>
      <div class="hotel-card">
        <img src="https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=85&fit=crop" alt="Capella Bangkok" />
        <div class="overlay"></div>
        <div class="info"><span class="price">₹17,400</span><span class="name">Capella, Bangkok</span></div>
        <div class="pct">↓28%</div>
      </div>
      <div class="hotel-card">
        <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop" alt="Taj Palace New Delhi" />
        <div class="overlay"></div>
        <div class="info"><span class="price">₹14,800</span><span class="name">Taj Palace, New Delhi</span></div>
        <div class="pct">↓16%</div>
      </div>
      <div class="hotel-card">
        <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=85&fit=crop" alt="W Bali Seminyak" />
        <div class="overlay"></div>
        <div class="info"><span class="price">₹21,000</span><span class="name">W Hotel, Bali Seminyak</span></div>
        <div class="pct">↓18%</div>
      </div>
      <div class="hotel-card">
        <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop" alt="Burj Al Arab Dubai" />
        <div class="overlay"></div>
        <div class="info"><span class="price">₹48,000</span><span class="name">Burj Al Arab, Dubai</span></div>
        <div class="pct">↓12%</div>
      </div>
      <div class="hotel-card">
        <img src="https://images.unsplash.com/photo-1551882547-ff40c4fe1fa7?w=600&q=85&fit=crop" alt="Shangri-La Singapore" />
        <div class="overlay"></div>
        <div class="info"><span class="price">₹19,500</span><span class="name">Shangri-La, Singapore</span></div>
        <div class="pct">↓23%</div>
      </div>
      <div class="hotel-card">
        <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=85&fit=crop" alt="Ritz-Carlton Langkawi" />
        <div class="overlay"></div>
        <div class="info"><span class="price">₹26,200</span><span class="name">Ritz-Carlton, Langkawi</span></div>
        <div class="pct">↓21%</div>
      </div>
      <div class="hotel-card">
        <img src="https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=85&fit=crop" alt="Anantara Phuket" />
        <div class="overlay"></div>
        <div class="info"><span class="price">₹16,900</span><span class="name">Anantara Villas, Phuket</span></div>
        <div class="pct">↓25%</div>
      </div>
    </div>
  </div>
  <div class="carousel-nav">
    <button onclick="scrollCarousel(-1)" aria-label="Previous">‹</button>
    <button onclick="scrollCarousel(1)" aria-label="Next">›</button>
  </div>
</div>

<!-- HOW IT WORKS -->
<div id="how" style="padding: 80px 40px; max-width: 1100px; margin: 0 auto;">
  <p class="eyebrow" style="text-align:center">How it works</p>
  <h2 class="sora" style="font-size:46px;font-weight:800;color:#0f172a;text-align:center;line-height:1.15">Three steps. Zero effort.</h2>
  <p style="font-size:16px;color:#64748b;text-align:center;margin-top:12px">Upload once. We watch forever. You save when the price drops.</p>
  <div class="steps-grid">
    <div class="step-tabs">
      <button class="step-tab active" onclick="setStep(0,this)">Upload</button>
      <button class="step-tab" onclick="setStep(1,this)">Watch</button>
      <button class="step-tab" onclick="setStep(2,this)">Save</button>
    </div>
    <div class="step-panel">
      <div class="step-ai-badge">✦ AI-powered</div>
      <p id="stepText">Upload your hotel booking confirmation — any PDF, screenshot or email. Our AI reads the hotel, dates, and price in seconds. No manual entry needed.</p>
      <div class="tracker">
        <div class="tracker-head">
          <span>Live Price Tracker</span>
          <span style="color:#16a34a;display:flex;align-items:center;gap:5px"><span class="live-dot"></span>Monitoring</span>
        </div>
        <div class="tracker-row">
          <span style="color:#64748b">MakeMyTrip</span>
          <span style="text-decoration:line-through;color:#94a3b8;font-size:13px">₹41,200</span>
          <span style="font-weight:700;color:#0f172a">₹41,000</span>
          <span style="background:#f1f5f9;color:#64748b;font-size:12px;padding:2px 8px;border-radius:6px">—</span>
        </div>
        <div class="tracker-row">
          <span style="color:#64748b">Booking.com</span>
          <span style="text-decoration:line-through;color:#94a3b8;font-size:13px">₹41,200</span>
          <span style="font-weight:700;color:#0f172a">₹39,400</span>
          <span style="background:#dcfce7;color:#16a34a;font-size:12px;font-weight:700;padding:2px 8px;border-radius:6px">↓₹1,800</span>
        </div>
        <div class="tracker-row">
          <span style="color:#64748b">Agoda</span>
          <span style="text-decoration:line-through;color:#94a3b8;font-size:13px">₹53,300</span>
          <span style="font-weight:700;color:#0f172a">₹53,300</span>
          <span style="background:#f1f5f9;color:#64748b;font-size:12px;padding:2px 8px;border-radius:6px">—</span>
        </div>
      </div>
      <button style="background:#1447b8;color:#fff;border:none;border-radius:8px;padding:11px 22px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:20px">Start for free</button>
    </div>
  </div>
</div>

<!-- STATS -->
<div id="results" style="background:#f8fafc;padding:80px 40px;">
  <div style="max-width:1100px;margin:0 auto;">
    <p class="eyebrow" style="text-align:center">Real Results</p>
    <h2 class="sora" style="font-size:46px;font-weight:800;color:#0f172a;text-align:center;line-height:1.15">₹18 crore saved. And counting.</h2>
    <p style="font-size:16px;color:#64748b;text-align:center;margin-top:12px">12,000+ Indian travelers are already saving on their hotel bookings.</p>
    <div class="stats-grid">
      <div class="stat-card"><div class="val sora">₹18Cr+</div><div class="lbl">Total saved by travelers</div></div>
      <div class="stat-card"><div class="val sora">12,000+</div><div class="lbl">Indian travelers saving</div></div>
      <div class="stat-card"><div class="val sora">28%</div><div class="lbl">Average price drop caught</div></div>
      <div class="stat-card"><div class="val sora">₹24,000</div><div class="lbl">Average saving per booking</div></div>
    </div>

    <!-- TESTIMONIALS inside stats bg -->
    <div style="margin-top:32px">
      <div class="testi-grid">
        <div class="testi-card">
          <div class="testi-head">
            <div class="testi-avatar">PS</div>
            <div><div class="testi-name">Priya Sharma</div><div class="testi-role">Product Manager, Bengaluru</div></div>
          </div>
          <div class="testi-saved">₹24,000</div>
          <div class="testi-text">"Booked a resort in Maldives and completely forgot about it. rebuq caught a ₹24,000 drop 3 weeks later. The WhatsApp alert was so clear — I rebooked in 10 minutes."</div>
        </div>
        <div class="testi-card">
          <div class="testi-head">
            <div class="testi-avatar">RM</div>
            <div><div class="testi-name">Rahul Mehta</div><div class="testi-role">Startup Founder, Mumbai</div></div>
          </div>
          <div class="testi-saved">₹80,000+</div>
          <div class="testi-text">"I travel every month for work. rebuq has saved me over ₹80,000 this year alone. It's the smartest thing I've added to my travel routine."</div>
        </div>
        <div class="testi-card">
          <div class="testi-head">
            <div class="testi-avatar">AK</div>
            <div><div class="testi-name">Ananya Krishnan</div><div class="testi-role">Travel Blogger, Chennai</div></div>
          </div>
          <div class="testi-saved">₹22,400</div>
          <div class="testi-text">"Found a ₹22,400 drop in 4 hours — that's how fast rebuq caught a sudden drop in my Dubai booking. This should be mandatory for every traveler."</div>
        </div>
      </div>
      <div class="reviews-link" style="margin-top:20px">
        <a href="https://g.page/r/rebuq/review" target="_blank">
          <svg viewBox="0 0 24 24" width="16" height="16" style="flex-shrink:0"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          See all Google Reviews ↗
        </a>
      </div>
    </div>
  </div>
</div>

<!-- QUOTE BANNER -->
<div class="quote-banner">
  <div style="display:flex;justify-content:center;margin-bottom:28px">
    <div style="width:40px;height:40px;border-radius:50%;border:3px solid #0f172a;background:linear-gradient(135deg,#93c5fd,#2563eb);margin:0 -4px"></div>
    <div style="width:40px;height:40px;border-radius:50%;border:3px solid #0f172a;background:linear-gradient(135deg,#6ee7b7,#2563eb);margin:0 -4px"></div>
    <div style="width:40px;height:40px;border-radius:50%;border:3px solid #0f172a;background:linear-gradient(135deg,#fca5a5,#f97316);margin:0 -4px"></div>
  </div>
  <div class="quote-text">"This should be mandatory for every Indian traveler who books hotels online."</div>
  <div class="quote-attr">— Ananya Krishnan · Travel Blogger, Chennai</div>
</div>

<!-- FEATURES / WHY REBUQ -->
<div id="why" class="features-section">
  <div class="features-inner">
    <p class="eyebrow" style="text-align:center">Why rebuq</p>
    <h2 class="sora" style="text-align:center">Built for travelers who hate leaving money on the table.</h2>
    <div class="feat-grid">
      <div class="feat-card wide">
        <div>
          <span class="feat-badge" style="background:#e0edff;color:#1447b8">Continuous</span>
          <h3>AI that never sleeps</h3>
          <p>Our monitoring AI checks your hotel price every 6 hours — through the night, through weekends. It has found drops as close as the night before check-in.</p>
          <div class="feat-stat">+4,200</div>
          <div class="feat-stat-lbl">Price drops found this month alone</div>
        </div>
        <div class="feat-visual">
          <div class="big">24/7 Watching</div>
          <div class="sub">Every 6 hours. Day &amp; night.</div>
        </div>
      </div>
      <div class="feat-card">
        <span class="feat-badge" style="background:#dcfce7;color:#166534">Instant</span>
        <h3>WhatsApp alerts</h3>
        <p>The moment we find a drop, you get a WhatsApp message with a direct rebooking link — no app to install.</p>
      </div>
      <div class="feat-card">
        <span class="feat-badge" style="background:#fee2e2;color:#991b1b">Full Coverage</span>
        <h3>All major OTAs</h3>
        <p>MakeMyTrip, Booking.com, Agoda, Goibibo, Hotels.com — we watch them all so you don't have to.</p>
      </div>
      <div class="feat-card">
        <span class="feat-badge" style="background:#fef9c3;color:#854d0e">Zero Risk</span>
        <h3>Zero-risk pricing</h3>
        <p>Free to check. We take a small success fee only if we actually save you money. If price doesn't drop, you pay nothing.</p>
      </div>
      <div class="feat-card">
        <span class="feat-badge" style="background:#f3e8ff;color:#7c3aed">Fast · 6hr avg</span>
        <h3>Catches drops fast</h3>
        <p>Average time to find a significant price drop: under 6 hours. Some drops are caught within the hour.</p>
      </div>
      <div class="feat-card full">
        <span class="feat-badge" style="background:#f3e8ff;color:#7c3aed">Privacy-first</span>
        <h3>Your booking data stays private</h3>
        <p>We only need the hotel name, dates, and price from your confirmation. We never access your payment details, passport information, or OTA login. Your data is encrypted and never sold.</p>
      </div>
    </div>
  </div>
</div>

<!-- FAQ -->
<div class="faq-section">
  <div class="faq-inner">
    <p class="eyebrow">FAQ</p>
    <h2 class="sora">Common questions</h2>
    <div class="faq-list">
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">Is rebuq really free to check? <span class="faq-icon">+</span></button>
        <div class="faq-a open">Yes — uploading your booking and letting rebuq monitor it is completely free. We only charge a small success fee when we actually save you money. If the price doesn't drop, you pay nothing.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">Which OTAs and hotel chains do you support? <span class="faq-icon">+</span></button>
        <div class="faq-a">We support MakeMyTrip, Booking.com, Agoda, Goibibo, Expedia, Hotels.com, and over 50 direct hotel websites. We're constantly adding new sources.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">How do I rebook once you find a drop? <span class="faq-icon">+</span></button>
        <div class="faq-a">We send you a WhatsApp alert with a direct link to the lower-priced booking. Cancel your old booking (most are free to cancel), rebook at the new rate, and pocket the difference. The whole process usually takes under 10 minutes.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" onclick="toggleFaq(this)">What if I have a non-refundable booking? <span class="faq-icon">+</span></button>
        <div class="faq-a">We still monitor non-refundable bookings in case the hotel itself offers a price adjustment or the OTA runs a special promotion. However, the primary benefit is for refundable rates.</div>
      </div>
    </div>
  </div>
</div>

<!-- CTA BOTTOM -->
<div class="cta-bottom">
  <div style="display:inline-block;background:rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:4px 14px;border-radius:100px">Free to check</div>
  <h2 class="sora">Your next hotel booking could cost less. Let's find out.</h2>
  <p>Upload your booking confirmation in 30 seconds. We watch and alert you the moment it drops. You pay only if we save you money.</p>
  <div class="cta-btns">
    <button class="btn-cta-white">Upload my booking now ↗</button>
    <button class="btn-cta-outline">▶ See how it works</button>
  </div>
  <div class="cta-pills">
    <span class="cta-pill"><span style="color:#fff;font-weight:700">✓</span> Free to check</span>
    <span class="cta-pill"><span style="color:#fff;font-weight:700">✓</span> No app needed</span>
    <span class="cta-pill"><span style="color:#fff;font-weight:700">✓</span> Pay only if you save</span>
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
          <a href="#">Results</a>
          <a href="#">Why rebuq</a>
          <a href="#">Exclusive Member Deals</a>
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
        <!-- X / Twitter -->
        <a href="#" class="social-icon" title="X (Twitter)">
          <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <!-- LinkedIn -->
        <a href="#" class="social-icon" title="LinkedIn">
          <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
        <!-- Instagram -->
        <a href="#" class="social-icon" title="Instagram">
          <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>

<script>
  // Carousel
  let carouselPos = 0;
  const cardWidth = 256; // 240px card + 16px gap
  const totalCards = 10;
  const visibleCards = Math.floor(window.innerWidth / cardWidth);
  const maxPos = totalCards - visibleCards;

  function scrollCarousel(dir) {
    carouselPos = Math.max(0, Math.min(maxPos, carouselPos + dir));
    document.getElementById('carouselTrack').style.transform = 'translateX(-' + (carouselPos * cardWidth) + 'px)';
  }

  // How it works tabs
  const stepTexts = [
    "Upload your hotel booking confirmation — any PDF, screenshot or email. Our AI reads the hotel, dates, and price in seconds. No manual entry needed.",
    "rebuq's AI engine checks your hotel price every 6 hours — day and night. We track flash sales, last-minute drops, and OTA-specific discounts you'd never catch manually.",
    "The moment we find a drop, you get a WhatsApp alert with a direct rebooking link. Cancel your old booking, rebook at the new rate, pocket the difference."
  ];

  function setStep(i, btn) {
    document.querySelectorAll('.step-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('stepText').textContent = stepTexts[i];
  }

  // FAQ
  function toggleFaq(btn) {
    const answer = btn.nextElementSibling;
    const icon = btn.querySelector('.faq-icon');
    const isOpen = answer.classList.contains('open');
    document.querySelectorAll('.faq-a').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.faq-icon').forEach(ic => { ic.style.transform = 'none'; });
    if (!isOpen) {
      answer.classList.add('open');
      icon.style.transform = 'rotate(45deg)';
    }
  }
</script>
</body>
</html>

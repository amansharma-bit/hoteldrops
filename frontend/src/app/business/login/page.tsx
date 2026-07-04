<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Business Sign In — rebuq</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: { navy: '#0F172A', blue: '#1447b8', gold: '#FCD34D', slate: '#64748B' },
        fontFamily: {
          display: ['Sora', 'sans-serif'],
          body: ['Inter', 'sans-serif'],
        },
      },
    },
  }
</script>
<style>
  body { font-family: 'Inter', sans-serif; }
  :focus-visible { outline: 2px solid #FCD34D; outline-offset: 2px; }

  .panel-bg {
    background: linear-gradient(155deg, #0b1440 0%, #12379b 30%, #1447b8 70%, #2e5fe0 100%);
  }

  @keyframes riseIn { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
  .rise-in { animation: riseIn 0.6s cubic-bezier(0.16,1,0.3,1) both; }
  .rise-1 { animation-delay: .05s; } .rise-2 { animation-delay: .15s; }
  @media (prefers-reduced-motion: reduce) { .rise-in { animation: none; } }

  .eye-btn { cursor: pointer; }
</style>
</head>
<body class="antialiased">

  <div class="min-h-screen grid lg:grid-cols-2">

    <!-- LEFT: brand panel -->
    <div class="panel-bg relative flex flex-col justify-between px-10 lg:px-14 py-12 min-h-[320px] lg:min-h-screen">
      <div class="rise-in rise-1">
        <a href="business-landing.html" class="flex items-baseline gap-2 mb-1">
          <span class="font-display font-extrabold text-2xl text-white">rebuq<span class="text-gold">.</span></span>
        </a>
        <p class="font-body text-xs font-semibold tracking-widest text-white/50 uppercase mb-14">Business Console</p>

        <h1 class="font-display font-extrabold text-4xl lg:text-[2.6rem] leading-[1.12] text-white mb-6 max-w-md">
          Track every booking.<br>Catch every drop.<br>Keep the margin.
        </h1>
        <p class="font-body text-white/70 leading-relaxed max-w-sm mb-10">
          The rebuq Business console — see every booking that's been automatically
          rebooked, exactly how much you saved, and what needs your attention.
        </p>

        <ul class="space-y-4">
          <li class="flex items-center gap-3 text-white/80 font-body text-sm">
            <svg class="w-4 h-4 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2h-2"/></svg>
            Live rebooking dashboard
          </li>
          <li class="flex items-center gap-3 text-white/80 font-body text-sm">
            <svg class="w-4 h-4 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4"/></svg>
            Per-client margin tracking
          </li>
          <li class="flex items-center gap-3 text-white/80 font-body text-sm">
            <svg class="w-4 h-4 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Real-time price drop alerts
          </li>
          <li class="flex items-center gap-3 text-white/80 font-body text-sm">
            <svg class="w-4 h-4 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            Secure, API-key gated access
          </li>
        </ul>
      </div>

      <p class="font-body text-xs text-white/40 rise-in rise-1">© 2026 rebuq. Business partners only.</p>
    </div>

    <!-- RIGHT: form -->
    <div class="flex items-center justify-center px-6 py-16 bg-white">
      <div class="w-full max-w-sm rise-in rise-2">

        <div class="flex items-center gap-2 mb-1">
          <h2 class="font-display font-extrabold text-2xl text-navy">Business Sign In</h2>
          <span class="w-1.5 h-1.5 rounded-full bg-gold"></span>
        </div>
        <p class="font-body text-sm text-slate-500 mb-8">rebuq business console</p>

        <form class="space-y-5" onsubmit="return false;">
          <div>
            <label for="email" class="block font-body text-sm font-semibold text-navy mb-2">Company Email</label>
            <input id="email" type="email" required placeholder="you@company.com"
              class="w-full border border-slate-200 rounded-lg px-4 py-3 font-body text-sm text-navy placeholder-slate-400 focus:border-blue outline-none transition-colors" />
          </div>

          <div>
            <label for="password" class="block font-body text-sm font-semibold text-navy mb-2">Password</label>
            <div class="relative">
              <input id="password" type="password" required placeholder="••••••••••"
                class="w-full border border-slate-200 rounded-lg px-4 py-3 pr-11 font-body text-sm text-navy placeholder-slate-400 focus:border-blue outline-none transition-colors" />
              <button type="button" onclick="toggleField('password')" aria-label="Show password"
                class="eye-btn absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </button>
            </div>
          </div>

          <div>
            <label for="apikey" class="block font-body text-sm font-semibold text-navy mb-2">GRN API Key</label>
            <div class="relative">
              <input id="apikey" type="password" required placeholder="GRN-XXXX-XXXX"
                class="w-full border border-slate-200 rounded-lg px-4 py-3 pr-11 font-body text-sm text-navy placeholder-slate-400 focus:border-blue outline-none transition-colors" />
              <button type="button" onclick="toggleField('apikey')" aria-label="Show API key"
                class="eye-btn absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </button>
            </div>
            <p class="font-body text-xs text-slate-400 mt-2">Used only to read your booking book. Never shared.</p>
          </div>

          <button type="submit"
            class="w-full font-body font-semibold text-sm py-3.5 rounded-lg bg-blue text-white hover:bg-blue/90 transition-colors mt-2">
            Access Business Console →
          </button>
        </form>

        <div class="flex items-center justify-between mt-8">
          <a href="business-landing.html" class="font-body text-sm text-slate-500 hover:text-navy transition-colors">← Back to home</a>
          <a href="mailto:business@rebuq.com" class="font-body text-sm font-medium text-blue hover:text-blue/80 transition-colors">Request access →</a>
        </div>
      </div>
    </div>

  </div>

  <script>
    function toggleField(id) {
      const el = document.getElementById(id);
      el.type = el.type === 'password' ? 'text' : 'password';
    }
  </script>

</body>
</html>

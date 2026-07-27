export const metadata = {
  title: 'rebuq — coming soon',
  description: 'Something worth waiting for is on the way.',
};

// Fonts are loaded with a plain <link> inside the component to keep this page
// fully self-contained and independent of the rest of the app's setup.
export default function ComingSoon() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=Archivo:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: `:root{
    --bg:#0A1B3D;          /* deep sapphire navy */
    --bg2:#0F275A;
    --blue:#0F52BA;        /* rebuq sapphire */
    --blue-soft:#3D6FD1;
    --yellow:#FCD34D;      /* the dot */
    --ink:#EAF0FF;
    --muted:#8FA3C8;
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;height:100%}
  body{
    font-family:'Archivo',system-ui,sans-serif;
    background:var(--bg);
    color:var(--ink);
    min-height:100vh;
    overflow:hidden;
    -webkit-font-smoothing:antialiased;
    position:relative;
  }

  /* Ambient depth: a soft radial wash sitting under the orbs */
  .wash{
    position:fixed; inset:0; z-index:0;
    background:
      radial-gradient(60% 55% at 22% 30%, rgba(61,111,209,0.22), transparent 70%),
      radial-gradient(55% 55% at 82% 68%, rgba(15,82,186,0.30), transparent 72%),
      linear-gradient(160deg, var(--bg) 0%, var(--bg2) 100%);
  }

  /* Drifting orbs — the ambient signature. Blurred, slow, unhurried. */
  .orbs{position:fixed; inset:0; z-index:1; overflow:hidden;}
  .orb{
    position:absolute; border-radius:50%;
    filter:blur(2px);
    opacity:0.9;
    background:radial-gradient(circle at 32% 28%, var(--blue-soft), var(--blue) 55%, #0A337A 100%);
    box-shadow:0 40px 120px rgba(6,20,50,0.5);
    will-change:transform;
  }
  .o1{width:190px;height:190px;top:12%;left:9%;  animation:drift1 22s ease-in-out infinite;}
  .o2{width:120px;height:120px;top:26%;left:20%; animation:drift2 18s ease-in-out infinite;}
  .o3{width:150px;height:150px;top:16%;left:4%;  opacity:0.7; animation:drift3 26s ease-in-out infinite;}
  .o4{width:230px;height:230px;top:52%;right:12%;animation:drift1 28s ease-in-out infinite reverse;}
  .o5{width:150px;height:150px;top:64%;right:6%; animation:drift2 20s ease-in-out infinite;}
  .o6{width:90px; height:90px; top:74%;left:16%; opacity:0.6; animation:drift3 24s ease-in-out infinite;}

  @keyframes drift1{0%,100%{transform:translate(0,0)}50%{transform:translate(24px,-30px)}}
  @keyframes drift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-20px,26px)}}
  @keyframes drift3{0%,100%{transform:translate(0,0)}50%{transform:translate(16px,20px)}}

  /* Top bar: just the wordmark, quiet and left-aligned */
  header{
    position:relative; z-index:3;
    display:flex; align-items:center; justify-content:space-between;
    padding:30px 40px;
  }
  .brand{
    font-family:'Plus Jakarta Sans',sans-serif;
    font-weight:800; font-size:26px; letter-spacing:-1.2px;
    color:#fff; display:inline-flex; align-items:baseline; gap:2px;
    text-decoration:none;
  }
  .brand .dot{color:var(--yellow)}
  .say{
    font-size:13px; color:var(--muted); text-decoration:none;
    letter-spacing:0.2px; transition:color .2s;
  }
  .say:hover{color:var(--ink)}

  /* Centre stage */
  main{
    position:relative; z-index:2;
    min-height:calc(100vh - 88px);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    text-align:center; padding:0 24px;
    margin-top:-40px;
  }
  .eyebrow{
    font-size:15px; color:var(--muted); letter-spacing:0.3px;
    margin:0 0 22px; font-weight:400;
    opacity:0; transform:translateY(10px);
    animation:rise .9s ease .1s forwards;
  }
  h1{
    font-family:'Plus Jakarta Sans',sans-serif;
    font-weight:500;
    font-size:clamp(44px, 11vw, 130px);
    letter-spacing:clamp(2px, 1.2vw, 14px);
    line-height:1;
    margin:0;
    color:#fff;
    text-transform:uppercase;
    opacity:0; transform:translateY(16px);
    animation:rise 1s ease .25s forwards;
  }
  h1 .b{color:var(--yellow); font-weight:700;}
  .sub{
    margin:30px 0 0;
    font-size:15px; color:var(--muted); max-width:440px; line-height:1.6;
    opacity:0; transform:translateY(10px);
    animation:rise 1s ease .5s forwards;
  }

  /* A single thin rule with a yellow tick — the one accent */
  .rule{
    margin-top:38px; width:180px; height:1px;
    background:linear-gradient(90deg, transparent, rgba(143,163,200,.4), transparent);
    position:relative;
    opacity:0; animation:fade 1.2s ease .7s forwards;
  }
  .rule::after{
    content:""; position:absolute; left:50%; top:50%;
    width:6px; height:6px; border-radius:50%;
    background:var(--yellow); transform:translate(-50%,-50%);
    box-shadow:0 0 12px rgba(252,211,77,.7);
  }

  @keyframes rise{to{opacity:1; transform:translateY(0)}}
  @keyframes fade{to{opacity:1}}

  footer{
    position:fixed; bottom:22px; left:0; right:0; z-index:3;
    text-align:center; font-size:12px; color:rgba(143,163,200,.6);
    letter-spacing:0.3px;
  }

  @media (max-width:520px){
    header{padding:22px 22px}
    .brand{font-size:22px}
    main{margin-top:-24px}
  }

  @media (prefers-reduced-motion:reduce){
    .orb{animation:none}
    .eyebrow,h1,.sub,.rule{animation:none; opacity:1; transform:none}
  }` }} />
      <div dangerouslySetInnerHTML={{ __html: `<div class="wash"></div>
  <div class="orbs" aria-hidden="true">
    <div class="orb o1"></div>
    <div class="orb o2"></div>
    <div class="orb o3"></div>
    <div class="orb o4"></div>
    <div class="orb o5"></div>
    <div class="orb o6"></div>
  </div>

  <header>
    <a class="brand" href="/">rebuq<span class="dot">.</span></a>
    <a class="say" href="mailto:hello@rebuq.com">Say hello</a>
  </header>

  <main>
    <p class="eyebrow">Something worth waiting for is on the way</p>
    <h1>Coming&nbsp;<span class="b">soon</span></h1>
    <p class="sub">We're putting the finishing touches on rebuq. Back shortly.</p>
    <div class="rule" aria-hidden="true"></div>
  </main>

  <footer>© rebuq</footer>` }} />
    </>
  );
}

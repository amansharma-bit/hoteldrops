'use client';

import { useState, useEffect } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';
import { authenticatedFetch } from '../../../lib/supabase-client';

const API_BASE = 'https://hoteldrops-production-7e5a.up.railway.app';

const BLUE  = '#0093FF';
const NAVY  = '#0F172A';
const SLATE = '#64748B';
const MUTED = '#94A3B8';
const LINE  = '#E7ECF3';
const BG    = '#F6F8FB';
const GREEN = '#16A34A';
const RED   = '#DC2626';
const AMBER = '#D97706';
const GOLD  = '#F5B833';

const DISPLAY = "'Archivo','Plus Jakarta Sans',sans-serif";
const BODY    = "'Plus Jakarta Sans',sans-serif";

function fmtDate(d: string | null, withYear = false) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
}
function fmtTime(d: string | null) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function usdShort(n: number | null | undefined) {
  if (n == null) return '—';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + Math.round(n);
}

// ─── SHARED DROPDOWN HELPERS (same as all other pages) ───────────────────────
const ddBtn = (active = false, activeColor = BLUE): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between',
  gap: 10, border: `1px solid ${active ? activeColor : LINE}`, borderRadius: 11,
  padding: '9px 14px', fontSize: 13.5, fontWeight: 600, background: '#fff',
  color: active ? activeColor : NAVY, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
});
const ddMenu: React.CSSProperties = {
  position: 'absolute', top: '112%', left: 0, zIndex: 31, background: '#fff',
  border: `1px solid ${LINE}`, borderRadius: 12,
  boxShadow: '0 12px 30px -12px rgba(16,24,40,.25)', padding: 6, minWidth: 200,
};
const ddItem = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
  border: 'none', background: active ? '#EAF6FF' : 'transparent',
  color: active ? BLUE : NAVY, fontSize: 13.5, fontWeight: 600,
  padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
});
function Chevron() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>;
}
function CalIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}

// ─── CALENDAR PICKER (same as repricing + searches pages) ─────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WDAYS  = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function CalendarPicker({ from, to, onApply, onClose }: { from: string; to: string; onApply: (f: string, t: string) => void; onClose: () => void }) {
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const [selFrom, setSelFrom] = useState(from || '');
  const [selTo,   setSelTo]   = useState(to   || '');
  const [stage,   setStage]   = useState<'from'|'to'>(from ? 'to' : 'from');
  const [hovered, setHovered] = useState('');
  const initDate = selFrom ? new Date(selFrom + 'T00:00:00') : new Date();
  const [viewYear,  setViewYear]  = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  function ds(y: number, m: number, d: number) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
  function prevMonth() { if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); }
  function nextMonth() { if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); }

  function handleDay(d: string) {
    if (stage==='from') {
      setSelFrom(d); setSelTo(''); setStage('to');
      const nd=new Date(d+'T00:00:00');
      if(nd.getMonth()===11){setViewMonth(0);setViewYear(nd.getFullYear()+1);}
      else{setViewMonth(nd.getMonth()+1);setViewYear(nd.getFullYear());}
    } else {
      if(d<=selFrom){setSelFrom(d);setSelTo('');setStage('to');const nd=new Date(d+'T00:00:00');if(nd.getMonth()===11){setViewMonth(0);setViewYear(nd.getFullYear()+1);}else{setViewMonth(nd.getMonth()+1);setViewYear(nd.getFullYear());}}
      else{setSelTo(d);setStage('from');}
    }
  }
  function resetSelection(){setSelFrom('');setSelTo('');setStage('from');const n=new Date();setViewMonth(n.getMonth());setViewYear(n.getFullYear());}

  const first=new Date(viewYear,viewMonth,1).getDay();
  const total=new Date(viewYear,viewMonth+1,0).getDate();
  const cells:(number|null)[]=[...Array(first).fill(null),...Array.from({length:total},(_,i)=>i+1)];
  const inRange=(d:string)=>{const end=selTo||(stage==='to'?hovered:'');return selFrom&&end&&d>selFrom&&d<end;};

  return (
    <div style={{background:'#fff',border:`1px solid ${LINE}`,borderRadius:16,boxShadow:'0 20px 50px -20px rgba(16,24,40,.32)',padding:'18px 16px',width:304,userSelect:'none'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',color:stage==='from'?BLUE:SLATE}}>{stage==='from'?'① Pick start date':'② Pick end date'}</div>
        {(selFrom||selTo)&&<button onClick={resetSelection} style={{border:'none',background:'#F1F5F9',borderRadius:6,padding:'3px 8px',fontSize:11,fontWeight:600,color:SLATE,cursor:'pointer',fontFamily:'inherit'}}>Reset</button>}
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <button onClick={prevMonth} style={{border:'none',background:'transparent',cursor:'pointer',padding:'4px 10px',fontSize:18,color:SLATE,lineHeight:1}}>‹</button>
        <span style={{fontFamily:DISPLAY,fontWeight:800,fontSize:14,color:NAVY}}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{border:'none',background:'transparent',cursor:'pointer',padding:'4px 10px',fontSize:18,color:SLATE,lineHeight:1}}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:2}}>
        {WDAYS.map(d=><div key={d} style={{textAlign:'center',fontSize:10.5,fontWeight:700,color:MUTED,padding:'2px 0'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1}}>
        {cells.map((day,i)=>{
          if(!day)return<div key={`e${i}`}/>;
          const d=ds(viewYear,viewMonth,day);
          const isF=d===selFrom,isT=d===selTo,inR=Boolean(inRange(d)),past=d<todayStr;
          return(
            <button key={d} disabled={past} onClick={()=>!past&&handleDay(d)}
              onMouseEnter={()=>stage==='to'&&!past&&setHovered(d)} onMouseLeave={()=>setHovered('')}
              style={{border:'none',borderRadius:(isF||isT)?'50%':inR?0:'50%',padding:'6px 0',fontSize:12.5,fontWeight:(isF||isT)?700:400,background:(isF||isT)?BLUE:inR?'#DBEAFE':'transparent',color:(isF||isT)?'#fff':past?'#CBD5E1':inR?BLUE:NAVY,cursor:past?'not-allowed':'pointer',outline:'none',textAlign:'center'}}>
              {day}
            </button>
          );
        })}
      </div>
      <div style={{marginTop:12,padding:'9px 12px',background:'#F6F8FB',borderRadius:9,fontSize:12.5,color:SLATE,display:'flex',justifyContent:'space-between'}}>
        <span>From: <strong style={{color:selFrom?NAVY:MUTED}}>{selFrom?fmtDate(selFrom,true):'—'}</strong></span>
        <span>To: <strong style={{color:selTo?NAVY:MUTED}}>{selTo?fmtDate(selTo,true):'—'}</strong></span>
      </div>
      <div style={{display:'flex',gap:8,marginTop:10}}>
        <button onClick={onClose} style={{flex:1,border:`1px solid ${LINE}`,borderRadius:9,padding:'8px',fontSize:13,fontWeight:600,background:'#fff',color:SLATE,cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
        <button onClick={()=>selFrom&&selTo&&onApply(selFrom,selTo)} disabled={!selFrom||!selTo}
          style={{flex:1,border:'none',borderRadius:9,padding:'8px',fontSize:13,fontWeight:700,background:selFrom&&selTo?BLUE:'#E2E8F0',color:selFrom&&selTo?'#fff':MUTED,cursor:selFrom&&selTo?'pointer':'not-allowed',fontFamily:'inherit'}}>Apply</button>
      </div>
    </div>
  );
}

// ─── DATE RANGE DROPDOWN ──────────────────────────────────────────────────────
function DateRangeDropdown({ customFrom, customTo, open, setOpen, onApply, onClear }: any) {
  const [showCal, setShowCal] = useState(false);
  const hasRange = customFrom || customTo;
  const label = hasRange ? `${customFrom?fmtDate(customFrom):'…'} → ${customTo?fmtDate(customTo):'…'}` : 'Any date';
  return (
    <div style={{position:'relative'}}>
      <button onClick={()=>{setOpen(!open);setShowCal(false);}} style={{...ddBtn(!!hasRange),minWidth:148}}>
        <span style={{display:'inline-flex',alignItems:'center',gap:7}}><CalIcon/>{label}</span><Chevron/>
      </button>
      {open&&(<>
        <div onClick={()=>{setOpen(false);setShowCal(false);}} style={{position:'fixed',inset:0,zIndex:30}}/>
        <div style={{position:'absolute',top:'112%',left:0,zIndex:31}} onClick={e=>e.stopPropagation()}>
          {!showCal?(
            <div style={ddMenu}>
              <button onClick={()=>setShowCal(true)} style={ddItem(!!hasRange)}><CalIcon/>Pick date range…</button>
              {hasRange&&<><div style={{borderTop:`1px solid ${LINE}`,margin:'4px 6px'}}/><button onClick={()=>{onClear();setOpen(false);}} style={ddItem(false)}>Clear date filter</button></>}
            </div>
          ):(
            <CalendarPicker from={customFrom} to={customTo}
              onApply={(f,t)=>{onApply(f,t);setShowCal(false);setOpen(false);}}
              onClose={()=>setShowCal(false)}/>
          )}
        </div>
      </>)}
    </div>
  );
}

// ─── STATUS DROPDOWN ──────────────────────────────────────────────────────────
const STATUS_OPTS = [
  { value: 'all',        label: 'All attempts',  dot: null  },
  { value: 'successful', label: 'Successful',     dot: GREEN },
  { value: 'errors',     label: 'Errors',         dot: RED   },
];
function StatusDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = STATUS_OPTS.find(o=>o.value===value) || STATUS_OPTS[0];
  return (
    <div style={{position:'relative'}}>
      <button onClick={()=>setOpen(!open)} style={ddBtn(value!=='all', cur.dot||BLUE)}>
        <span style={{display:'inline-flex',alignItems:'center',gap:7}}>
          {cur.dot&&<span style={{width:7,height:7,borderRadius:'50%',background:cur.dot,flexShrink:0}}/>}
          {cur.label}
        </span><Chevron/>
      </button>
      {open&&(<>
        <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:30}}/>
        <div style={ddMenu}>
          {STATUS_OPTS.map(({value:v,label:l,dot})=>(
            <button key={v} onClick={()=>{onChange(v);setOpen(false);}} style={ddItem(value===v)}>
              {dot?<span style={{width:7,height:7,borderRadius:'50%',background:dot,flexShrink:0}}/>:<span style={{width:7}}/>}
              {l}
            </button>
          ))}
        </div>
      </>)}
    </div>
  );
}

// ─── SAVING SIZE DROPDOWN ─────────────────────────────────────────────────────
const SAVING_OPTS = [
  { value: 'any',     label: 'Any saving'   },
  { value: '0-50',    label: 'Under $50'    },
  { value: '50-100',  label: '$50 – $100'   },
  { value: '100-500', label: '$100 – $500'  },
  { value: '500+',    label: 'Above $500'   },
];
function SavingDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const label = SAVING_OPTS.find(o=>o.value===value)?.label || 'Any saving';
  return (
    <div style={{position:'relative'}}>
      <button onClick={()=>setOpen(!open)} style={ddBtn(value!=='any')}><span>{label}</span><Chevron/></button>
      {open&&(<>
        <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:30}}/>
        <div style={ddMenu}>
          {SAVING_OPTS.map(({value:v,label:l})=>(
            <button key={v} onClick={()=>{onChange(v);setOpen(false);}} style={ddItem(value===v)}>{l}</button>
          ))}
        </div>
      </>)}
    </div>
  );
}

// ─── STAT CARD — Dashboard style ─────────────────────────────────────────────
function StatCard({ label, value, sub, fill, pct, loading }: { label: string; value: string; sub: string; fill: string; pct?: number; loading: boolean }) {
  return (
    <div style={{background:'#fff',border:`1px solid ${LINE}`,borderRadius:16,padding:'20px 22px',boxShadow:'0 1px 2px rgba(16,24,40,.03)'}}>
      <div style={{fontSize:11.5,fontWeight:700,letterSpacing:'0.8px',textTransform:'uppercase',color:SLATE}}>{label}</div>
      <div style={{fontFamily:DISPLAY,fontSize:34,fontWeight:800,letterSpacing:'-1px',color:NAVY,margin:'8px 0 4px'}}>{loading?'—':value}</div>
      <div style={{fontSize:13,color:MUTED,fontWeight:500}}>{sub}</div>
      {pct!==undefined&&(
        <div style={{height:6,borderRadius:99,background:'#F1F3F8',marginTop:14,overflow:'hidden'}}>
          <div style={{height:'100%',width:loading?'0%':`${Math.min(100,pct)}%`,background:fill,borderRadius:99,transition:'width 1s cubic-bezier(.2,.7,.3,1)'}}/>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function RebookingsPage() {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [data,    setData]    = useState<any>(null);
  const [page,    setPage]    = useState(1);

  // Filters
  const [search,     setSearch]     = useState('');
  const [searchQ,    setSearchQ]    = useState('');
  const [status,     setStatus]     = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');
  const [dateOpen,   setDateOpen]   = useState(false);
  const [saving,     setSaving]     = useState('any');

  // Debounce search
  useEffect(() => {
    const id = setTimeout(()=>{setSearchQ(search.trim());setPage(1);},350);
    return ()=>clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    const params = new URLSearchParams({ page: String(page), status });
    if (searchQ)    params.set('q',      searchQ);
    if (customFrom) params.set('from',   customFrom);
    if (customTo)   params.set('to',     customTo);
    if (saving !== 'any') params.set('saving', saving);
    params.set('_t', Date.now().toString());
    authenticatedFetch(`${API_BASE}/api/live-search/repricing/rebookings?${params}`)
      .then((r: Response) => r.json())
      .then((d: any) => { if (!cancelled) { d.error ? setError(d.error) : setData(d); } })
      .catch((e: any) => { if (!cancelled) setError('Could not load rebookings: ' + e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, searchQ, status, customFrom, customTo, saving]);

  const rows    = data?.rows   || [];
  const counts  = data?.counts || { successful: 0, errors: 0, all: 0 };
  const stats   = data?.stats  || {};
  const hasMore = data?.hasMore ?? false;
  const hasActiveFilter = search || status !== 'all' || customFrom || customTo || saving !== 'any';

  function clearAll() { setSearch(''); setSearchQ(''); setStatus('all'); setCustomFrom(''); setCustomTo(''); setSaving('any'); setPage(1); }

  const convPct = stats.conversionPct ?? 0;
  const avgSaving = stats.avgSavingUsd ? `$${stats.avgSavingUsd.toLocaleString()}` : '—';
  const totalSaved = stats.totalSavedUsd != null ? usdShort(stats.totalSavedUsd) : '—';

  return (
    <BusinessSidebarWrapper>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{minHeight:'100vh',background:BG,fontFamily:BODY}}>
        {/* Header */}
        <div style={{padding:'32px 40px 0'}}>
          <h1 style={{fontFamily:DISPLAY,fontSize:32,fontWeight:800,letterSpacing:'-0.7px',color:NAVY,margin:0}}>Rebookings</h1>
          <p style={{fontSize:14.5,color:SLATE,marginTop:4,marginBottom:0}}>Every rebooking completed — original price, rebooked price, and what it saved.</p>
        </div>

        {error&&<div style={{margin:'14px 40px 0',background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:11,padding:'11px 15px',fontSize:13,color:RED}}>{error}</div>}

        {/* ── Stat cards — Dashboard style, 5 cards ── */}
        <div style={{padding:'24px 40px 0',display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
          <StatCard label="Total saved" value={totalSaved} sub="gross margin captured" fill={GREEN} pct={100} loading={loading} />
          <StatCard label="Successful" value={String(counts.successful)} sub="rebookings completed" fill={GREEN} pct={counts.all ? Math.round((counts.successful/counts.all)*100) : 0} loading={loading} />
          <StatCard label="Errors" value={String(counts.errors)} sub="attempts that need review" fill={RED} pct={counts.all ? Math.round((counts.errors/counts.all)*100) : 0} loading={loading} />
          <StatCard label="Avg saving" value={avgSaving} sub="per successful rebook" fill={BLUE} loading={loading} />
          <StatCard label="Conversion" value={`${convPct}%`} sub="rebooked ÷ checks run" fill={BLUE} pct={convPct} loading={loading} />
        </div>

        {/* ── Filter bar ── */}
        <div style={{padding:'20px 40px 0',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          {/* Search */}
          <div style={{position:'relative',flex:'0 1 300px',minWidth:180}}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'){setSearchQ(search.trim());setPage(1);}}}
              placeholder="Search hotel, city or booking ID…"
              style={{width:'100%',border:`1px solid ${LINE}`,borderRadius:11,padding:'9px 12px 9px 34px',fontSize:13.5,color:NAVY,background:'#fff',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SLATE} strokeWidth={2} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)'}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
          </div>

          <StatusDropdown value={status} onChange={v=>{setStatus(v);setPage(1);}}/>
          <DateRangeDropdown customFrom={customFrom} customTo={customTo} open={dateOpen} setOpen={setDateOpen}
            onApply={(f:string,t:string)=>{setCustomFrom(f);setCustomTo(t);setPage(1);}}
            onClear={()=>{setCustomFrom('');setCustomTo('');setPage(1);}}/>
          <SavingDropdown value={saving} onChange={v=>{setSaving(v);setPage(1);}}/>

          {hasActiveFilter&&(
            <button onClick={clearAll} style={{border:'none',background:'transparent',color:SLATE,fontSize:13,fontWeight:600,cursor:'pointer',textDecoration:'underline',textUnderlineOffset:3,padding:'9px 4px'}}>Clear</button>
          )}
          <div style={{flex:1}}/>
          <span style={{fontSize:13,color:MUTED}}>{loading?'Loading…':`${(data?.total??0).toLocaleString()} attempts`}</span>
        </div>

        {/* ── Table ── */}
        <div style={{padding:'16px 40px 48px'}}>
          <div style={{background:'#fff',border:`1px solid ${LINE}`,borderRadius:16,overflow:'hidden',boxShadow:'0 1px 3px rgba(16,24,40,.04)'}}>
            {/* Headers */}
            <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.6fr) 110px 114px 114px 110px 130px 130px',gap:14,padding:'12px 24px',borderBottom:`1px solid ${LINE}`,background:'#FAFBFD'}}>
              {['Booking','Check-in','Original','Rebooked','Saved','Status','When'].map((h,i)=>(
                <div key={i} style={{fontSize:10.5,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:MUTED,textAlign:(i>=2&&i<=4)?'right':'left'}}>{h}</div>
              ))}
            </div>

            {loading?(
              <div style={{padding:'50px 0',textAlign:'center',color:MUTED,fontSize:14}}>Loading…</div>
            ):rows.length===0?(
              <div style={{padding:'64px 32px',textAlign:'center'}}>
                <div style={{width:52,height:52,borderRadius:'50%',background:'#DCFCE7',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div style={{fontFamily:DISPLAY,fontSize:17,fontWeight:700,color:NAVY,marginBottom:8}}>No rebookings yet</div>
                <div style={{fontSize:13.5,color:SLATE,maxWidth:420,margin:'0 auto',lineHeight:1.6}}>
                  When a price check finds a genuine saving and it&apos;s rebooked, it appears here with original price, rebooked price, and margin captured.
                </div>
              </div>
            ):(
              <div style={{animation:'fadeIn 0.2s ease'}}>
                {rows.map((r:any)=>{
                  const success = r.status==='confirmed'||r.status==='success';
                  const pending = r.status==='awaiting_cancel'||r.status==='booked';
                  const chipBg  = success?'#DCFCE7':pending?'#DBEAFE':r.status==='needs_review'?'#FEF3C7':'#FEF2F2';
                  const chipFg  = success?GREEN:pending?BLUE:r.status==='needs_review'?AMBER:RED;
                  const chipLabel = success?'Completed':pending?'Pending cancel':r.status==='needs_review'?'Needs review':r.status;
                  return(
                    <div key={r.id} style={{display:'grid',gridTemplateColumns:'minmax(0,1.6fr) 110px 114px 114px 110px 130px 130px',gap:14,padding:'16px 24px',alignItems:'center',borderBottom:`1px solid ${LINE}`,transition:'background 0.12s'}}>
                      {/* Booking */}
                      <div style={{minWidth:0}}>
                        <div style={{fontFamily:DISPLAY,fontSize:14.5,fontWeight:700,color:NAVY,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.hotel||r.bookingId}</div>
                        <div style={{fontSize:12,color:SLATE,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{[r.city,r.room].filter(Boolean).join(' · ')||'—'}</div>
                        <div style={{fontSize:10,color:MUTED,marginTop:1,fontFamily:'monospace',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.bookingId}</div>
                      </div>
                      {/* Check-in */}
                      <div style={{fontSize:13,color:NAVY}}>{fmtDate(r.checkin)}</div>
                      {/* Original */}
                      <div style={{textAlign:'right',fontFamily:DISPLAY,fontSize:14,fontWeight:700,color:NAVY}}>{r.originalUsd!=null?`$${r.originalUsd.toLocaleString()}`:'—'}</div>
                      {/* Rebooked */}
                      <div style={{textAlign:'right',fontFamily:DISPLAY,fontSize:14,fontWeight:700,color:NAVY}}>{r.rebookedUsd!=null?`$${r.rebookedUsd.toLocaleString()}`:'—'}</div>
                      {/* Saved */}
                      <div style={{textAlign:'right',fontFamily:DISPLAY,fontSize:14,fontWeight:700,color:r.savedUsd>0?GREEN:MUTED}}>
                        {r.savedUsd!=null&&r.savedUsd>0?`−$${Math.round(r.savedUsd).toLocaleString()}`:'—'}
                      </div>
                      {/* Status chip */}
                      <div>
                        <span style={{fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,background:chipBg,color:chipFg,whiteSpace:'nowrap'}}>{chipLabel}</span>
                        {r.failureStage&&<div style={{fontSize:10.5,color:MUTED,marginTop:3}}>{r.failureStage}</div>}
                      </div>
                      {/* When */}
                      <div style={{fontSize:12,color:SLATE}}>{fmtTime(r.createdAt)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!loading&&rows.length>0&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:14}}>
              <span style={{fontSize:13,color:SLATE}}>Page {page} · {(data?.total??0).toLocaleString()} attempts</span>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  style={{border:`1px solid ${LINE}`,borderRadius:9,padding:'7px 16px',fontSize:13,fontWeight:600,background:'#fff',color:page===1?'#CBD5E1':NAVY,cursor:page===1?'not-allowed':'pointer'}}>Previous</button>
                <button onClick={()=>setPage(p=>p+1)} disabled={!hasMore}
                  style={{border:'none',borderRadius:9,padding:'7px 16px',fontSize:13,fontWeight:600,background:!hasMore?'#E2E8F0':BLUE,color:!hasMore?MUTED:'#fff',cursor:!hasMore?'not-allowed':'pointer'}}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

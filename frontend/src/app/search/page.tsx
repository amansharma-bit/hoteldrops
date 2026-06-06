"use client";

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const API = "https://hoteldrops-production-7e5a.up.railway.app/api/hotels";
const MAPBOX_TOKEN = "pk.eyJ1Ijoib21zYWlyYW0wMSIsImEiOiJjbXB4bngxdWwwMWI2MnBzZ3p2dGM3bW5rIn0.8qCkSAodMjGVg6qhiCZHzw";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const B = "#1447b8";
const NAVY = "#0f172a";
const YELLOW = "#FCD34D";

// ── Destination list with flags ───────────────────────────────────────────────
const DESTINATIONS: { label: string; key: string; flag: string; country: string; city: string }[] = [
  { label:"Dubai", key:"dubai", flag:"🇦🇪", country:"AE", city:"Dubai" },
  { label:"Abu Dhabi", key:"abu dhabi", flag:"🇦🇪", country:"AE", city:"Abu Dhabi" },
  { label:"Sharjah", key:"sharjah", flag:"🇦🇪", country:"AE", city:"Sharjah" },
  { label:"New Delhi", key:"new delhi", flag:"🇮🇳", country:"IN", city:"New Delhi" },
  { label:"Mumbai", key:"mumbai", flag:"🇮🇳", country:"IN", city:"Mumbai" },
  { label:"Goa", key:"goa", flag:"🇮🇳", country:"IN", city:"Goa" },
  { label:"Bangalore", key:"bangalore", flag:"🇮🇳", country:"IN", city:"Bangalore" },
  { label:"Chennai", key:"chennai", flag:"🇮🇳", country:"IN", city:"Chennai" },
  { label:"Kolkata", key:"kolkata", flag:"🇮🇳", country:"IN", city:"Kolkata" },
  { label:"Hyderabad", key:"hyderabad", flag:"🇮🇳", country:"IN", city:"Hyderabad" },
  { label:"Jaipur", key:"jaipur", flag:"🇮🇳", country:"IN", city:"Jaipur" },
  { label:"Kochi", key:"kochi", flag:"🇮🇳", country:"IN", city:"Kochi" },
  { label:"Agra", key:"agra", flag:"🇮🇳", country:"IN", city:"Agra" },
  { label:"Singapore", key:"singapore", flag:"🇸🇬", country:"SG", city:"Singapore" },
  { label:"Bangkok", key:"bangkok", flag:"🇹🇭", country:"TH", city:"Bangkok" },
  { label:"Phuket", key:"phuket", flag:"🇹🇭", country:"TH", city:"Phuket" },
  { label:"Bali", key:"bali", flag:"🇮🇩", country:"ID", city:"Bali" },
  { label:"Kuala Lumpur", key:"kuala lumpur", flag:"🇲🇾", country:"MY", city:"Kuala Lumpur" },
  { label:"London", key:"london", flag:"🇬🇧", country:"GB", city:"London" },
  { label:"Paris", key:"paris", flag:"🇫🇷", country:"FR", city:"Paris" },
  { label:"Rome", key:"rome", flag:"🇮🇹", country:"IT", city:"Rome" },
  { label:"Barcelona", key:"barcelona", flag:"🇪🇸", country:"ES", city:"Barcelona" },
  { label:"Amsterdam", key:"amsterdam", flag:"🇳🇱", country:"NL", city:"Amsterdam" },
  { label:"Istanbul", key:"istanbul", flag:"🇹🇷", country:"TR", city:"Istanbul" },
  { label:"Tokyo", key:"tokyo", flag:"🇯🇵", country:"JP", city:"Tokyo" },
  { label:"Hong Kong", key:"hong kong", flag:"🇭🇰", country:"HK", city:"Hong Kong" },
  { label:"Seoul", key:"seoul", flag:"🇰🇷", country:"KR", city:"Seoul" },
  { label:"Sydney", key:"sydney", flag:"🇦🇺", country:"AU", city:"Sydney" },
  { label:"New York", key:"new york", flag:"🇺🇸", country:"US", city:"New York" },
  { label:"Doha", key:"doha", flag:"🇶🇦", country:"QA", city:"Doha" },
  { label:"Riyadh", key:"riyadh", flag:"🇸🇦", country:"SA", city:"Riyadh" },
  { label:"Muscat", key:"muscat", flag:"🇴🇲", country:"OM", city:"Muscat" },
  { label:"Maldives", key:"maldives", flag:"🇲🇻", country:"MV", city:"Male" },
  { label:"Cairo", key:"cairo", flag:"🇪🇬", country:"EG", city:"Cairo" },
];

// ── Dubai area bounding boxes ─────────────────────────────────────────────────
const DUBAI_AREAS: [string, number, number, number, number][] = [
  ["Palm Jumeirah",       25.095, 25.130, 55.117, 55.165],
  ["Dubai Marina",        25.065, 25.095, 55.130, 55.160],
  ["JBR",                 25.073, 25.090, 55.120, 55.138],
  ["Downtown Dubai",      25.185, 25.202, 55.270, 55.295],
  ["Business Bay",        25.173, 25.192, 55.280, 55.310],
  ["DIFC",                25.205, 25.220, 55.270, 55.285],
  ["Deira",               25.255, 25.290, 55.295, 55.340],
  ["Bur Dubai",           25.230, 25.260, 55.280, 55.320],
  ["Sheikh Zayed Road",   25.200, 25.230, 55.260, 55.285],
  ["Al Barsha",           25.095, 25.130, 55.165, 55.210],
  ["Jumeirah",            25.155, 25.205, 55.215, 55.265],
  ["Dubai Creek Harbour", 25.195, 25.225, 55.330, 55.365],
  ["City Walk",           25.195, 25.215, 55.245, 55.270],
  ["Dubai Hills",         25.115, 25.155, 55.220, 55.270],
  ["Al Jadaf",            25.215, 25.240, 55.330, 55.360],
  ["Festival City",       25.220, 25.250, 55.350, 55.385],
  ["Al Qusais",           25.250, 25.285, 55.355, 55.400],
  ["Jebel Ali",           24.970, 25.040, 55.040, 55.120],
];

function getAreaFromCoords(lat?: number|null, lng?: number|null): string|null {
  if (!lat||!lng) return null;
  for (const [name,minLat,maxLat,minLng,maxLng] of DUBAI_AREAS) {
    if (lat>=minLat&&lat<=maxLat&&lng>=minLng&&lng<=maxLng) return name;
  }
  return null;
}

const PRIORITY_AMENITIES = ["Swimming Pool","Fitness Centre","Restaurant","Free WiFi"];
const TOP_FACILITIES = ["Swimming Pool","Room Service","Fitness Centre","On-site Dining","Spa","Parking","Free WiFi","Airport Shuttle","Business Centre","Kids Club"];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(()=>{ const c=()=>setIsMobile(window.innerWidth<768); c(); window.addEventListener("resize",c); return()=>window.removeEventListener("resize",c); },[]);
  return isMobile;
}

function formatINR(n: number) { return "₹"+Math.round(n).toLocaleString("en-IN"); }
function formatDate(s: string) { if(!s)return""; const d=new Date(s+"T00:00:00"); return d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}); }
function formatDateShort(s: string) { if(!s)return""; const d=new Date(s+"T00:00:00"); return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"}); }
function toDateStr(y:number,m:number,d:number){return`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
function getDaysInMonth(y:number,m:number){return new Date(y,m+1,0).getDate();}
function getFirstDow(y:number,m:number){return new Date(y,m,1).getDay();}
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOWS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function codeToNum(code:string|number):number{if(typeof code==="number")return code;let h=0;for(let i=0;i<code.length;i++){h=((h<<5)-h)+code.charCodeAt(i);h|=0;}return Math.abs(h);}

// SVG Icons
const IconBreakfast=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
const IconBell=()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;

interface Hotel{code:string|number;name:string;stars:number|null;minRate:number;currency:string;imageUrl?:string;address?:string;chain?:string;rating?:number|null;latitude?:number|null;longitude?:number|null;amenities?:string[];isRefundable?:boolean|null;hasBreakfast?:boolean;lowestPriceINR?:number;}
interface GuestState{rooms:number;adults:number;children:number;childAges:number[];}

const FALLBACK_IMGS=["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=85&fit=crop","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=85&fit=crop","https://images.unsplash.com/photo-1551882547-ff40c4fe1fa7?w=600&q=85&fit=crop","https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=85&fit=crop","https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=85&fit=crop","https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=85&fit=crop"];

// ── FiltersPanel — top-level component ───────────────────────────────────────
interface FiltersPanelProps{destination:string;areaOptions:string[];filterLocation:string;setFilterLocation:(v:string)=>void;filterPriceMin:number|null;filterPriceMax:number|null;setPriceRange:(min:number|null,max:number|null)=>void;filterRefundable:boolean;setFilterRefundable:(v:boolean)=>void;filterBreakfast:boolean;setFilterBreakfast:(v:boolean)=>void;filterRating:number|null;setFilterRating:(v:number|null)=>void;filterStars:number[];setFilterStars:(v:number[])=>void;filterFacilities:string[];setFilterFacilities:(v:string[])=>void;hasActiveFilters:boolean;clearAllFilters:()=>void;onHotelSearch:(v:string)=>void;}

function FiltersPanel({areaOptions,filterLocation,setFilterLocation,filterPriceMin,filterPriceMax,setPriceRange,filterRefundable,setFilterRefundable,filterBreakfast,setFilterBreakfast,filterRating,setFilterRating,filterStars,setFilterStars,filterFacilities,setFilterFacilities,hasActiveFilters,clearAllFilters,onHotelSearch}:FiltersPanelProps){
  const [showMore,setShowMore]=useState(false);
  const [sv,setSv]=useState("");
  const CB=({active,onClick}:{active:boolean;onClick:()=>void})=><div onClick={onClick} style={{width:16,height:16,border:`1.5px solid ${active?B:"#e2e8f0"}`,borderRadius:4,background:active?B:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}}>{active&&<svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}</div>;
  const RB=({active,onClick}:{active:boolean;onClick:()=>void})=><div onClick={onClick} style={{width:16,height:16,border:`1.5px solid ${active?B:"#e2e8f0"}`,borderRadius:"50%",background:active?B:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer"}}>{active&&<div style={{width:6,height:6,borderRadius:"50%",background:"#fff"}}/>}</div>;
  const Row=({children,onClick}:{children:React.ReactNode;onClick:()=>void})=><div onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,cursor:"pointer"}}>{children}</div>;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,border:"1.5px solid #e2e8f0",borderRadius:8,padding:"8px 12px",marginBottom:16}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Search by hotel name" value={sv} onChange={e=>{setSv(e.target.value);onHotelSearch(e.target.value);}} style={{border:"none",outline:"none",fontFamily:"inherit",fontSize:13,color:NAVY,background:"transparent",width:"100%"}}/>
        {sv&&<button onClick={()=>{setSv("");onHotelSearch("");}} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16,padding:0}}>×</button>}
      </div>
      {areaOptions.length>0&&<div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>Location</div>{areaOptions.map(a=><Row key={a} onClick={()=>setFilterLocation(filterLocation===a?"":a)}><CB active={filterLocation===a} onClick={()=>setFilterLocation(filterLocation===a?"":a)}/><span style={{fontSize:13,color:"#1e293b"}}>{a}</span></Row>)}</div>}
      <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>Price per night</div>{([{label:"Under ₹5,000",min:null,max:5000},{label:"₹5,000 – ₹10,000",min:5000,max:10000},{label:"₹10,000 – ₹20,000",min:10000,max:20000},{label:"₹20,000 – ₹40,000",min:20000,max:40000},{label:"₹40,000+",min:40000,max:null}] as {label:string;min:number|null;max:number|null}[]).map(({label,min,max})=>{const a=filterPriceMin===min&&filterPriceMax===max;return<Row key={label} onClick={()=>a?setPriceRange(null,null):setPriceRange(min,max)}><CB active={a} onClick={()=>a?setPriceRange(null,null):setPriceRange(min,max)}/><span style={{fontSize:13,color:"#1e293b"}}>{label}</span></Row>;})}</div>
      <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>Suggested</div>{[{label:"Free Cancellation",active:filterRefundable,toggle:()=>setFilterRefundable(!filterRefundable)},{label:"Breakfast Included",active:filterBreakfast,toggle:()=>setFilterBreakfast(!filterBreakfast)},{label:"Rating 9+",active:filterRating===9,toggle:()=>setFilterRating(filterRating===9?null:9)}].map(({label,active,toggle})=><Row key={label} onClick={toggle}><CB active={active} onClick={toggle}/><span style={{fontSize:13,color:"#1e293b"}}>{label}</span></Row>)}</div>
      <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>Star category</div>{[5,4,3,2,1].map(s=>{const a=filterStars.includes(s);return<Row key={s} onClick={()=>setFilterStars(a?filterStars.filter(x=>x!==s):[...filterStars,s])}><CB active={a} onClick={()=>setFilterStars(a?filterStars.filter(x=>x!==s):[...filterStars,s])}/><span style={{color:"#f59e0b",fontSize:13}}>{"★".repeat(s)}</span><span style={{fontSize:13,color:"#1e293b"}}>{s} Star</span></Row>;})}</div>
      <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>User rating</div>{[{label:"Exceptional 9+",min:9},{label:"Excellent 8+",min:8},{label:"Very Good 7+",min:7}].map(({label,min})=><Row key={label} onClick={()=>setFilterRating(filterRating===min?null:min)}><RB active={filterRating===min} onClick={()=>setFilterRating(filterRating===min?null:min)}/><span style={{fontSize:13,color:"#1e293b"}}>{label}</span></Row>)}</div>
      <div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:NAVY,marginBottom:10}}>Facilities</div>{(showMore?TOP_FACILITIES:TOP_FACILITIES.slice(0,6)).map(label=>{const a=filterFacilities.includes(label);return<Row key={label} onClick={()=>setFilterFacilities(a?filterFacilities.filter(f=>f!==label):[...filterFacilities,label])}><CB active={a} onClick={()=>setFilterFacilities(a?filterFacilities.filter(f=>f!==label):[...filterFacilities,label])}/><span style={{fontSize:13,color:"#1e293b"}}>{label}</span></Row>;})}
        <button onClick={()=>setShowMore(!showMore)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:B,fontWeight:600,fontFamily:"inherit",padding:"4px 0"}}>{showMore?"Show less":"View more"}</button>
      </div>
      {hasActiveFilters&&<button onClick={clearAllFilters} style={{width:"100%",background:"#fef3c7",color:"#92400e",border:"none",borderRadius:8,padding:10,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Clear all filters</button>}
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function CalendarScreen({checkIn,checkOut,onSelect,onClose}:{checkIn:string;checkOut:string;onSelect:(ci:string,co:string)=>void;onClose:()=>void;}){
  const today=new Date();const[mode,setMode]=useState<"checkin"|"checkout">(checkIn?"checkout":"checkin");const[ci,setCi]=useState(checkIn);const[co,setCo]=useState(checkOut);
  const todayStr=toDateStr(today.getFullYear(),today.getMonth(),today.getDate());
  const handleDay=(ds:string)=>{if(mode==="checkin"){setCi(ds);setCo("");setMode("checkout");}else{if(ds<=ci)return;setCo(ds);}};
  const renderMonth=(year:number,month:number)=>{const days=getDaysInMonth(year,month);const firstDow=getFirstDow(year,month);return(<div key={`${year}-${month}`} style={{marginBottom:32}}><div style={{fontWeight:700,fontSize:16,color:NAVY,textAlign:"center",marginBottom:16}}>{MONTHS[month]} {year}</div><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>{DOWS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"#94a3b8",paddingBottom:8}}>{d}</div>)}{Array.from({length:firstDow}).map((_,i)=><div key={`e${i}`}/>)}{Array.from({length:days}).map((_,i)=>{const day=i+1;const ds=toDateStr(year,month,day);const isDisabled=ds<todayStr;let bg="transparent",clr=isDisabled?"#cbd5e1":NAVY,br="50%",fw=400;if(ds===ci&&!!co){bg=B;clr="#fff";br="50% 0 0 50%";fw=700;}else if(ds===co){bg=B;clr="#fff";br="0 50% 50% 0";fw=700;}else if(ds===ci&&!co){bg=B;clr="#fff";br="50%";fw=700;}else if(ci&&co&&ds>ci&&ds<co){bg="#dbeafe";clr=B;br="0";}else if(ds===todayStr)clr=B;return<div key={day} onClick={()=>!isDisabled&&handleDay(ds)} style={{height:38,display:"flex",alignItems:"center",justifyContent:"center",background:bg,color:clr,borderRadius:br,fontWeight:fw,fontSize:14,cursor:isDisabled?"not-allowed":"pointer",opacity:isDisabled?0.35:1}}>{day}</div>;})}</div></div>);};
  return(<div style={{position:"fixed",inset:0,background:"#fff",zIndex:9999,display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",gap:16,padding:"16px 20px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:24,color:NAVY}}>←</button><div style={{fontWeight:700,fontSize:17,color:NAVY}}>{mode==="checkin"?"Select Check-in":"Select Check-out"}</div></div>
    <div style={{flex:1,overflowY:"auto",padding:"20px 20px 0"}}>{Array.from({length:12}).map((_,i)=>{const dm=new Date(today.getFullYear(),today.getMonth()+i);return renderMonth(dm.getFullYear(),dm.getMonth());})}</div>
    <div style={{borderTop:"1px solid #e2e8f0",padding:"14px 20px 32px",background:"#fff",flexShrink:0}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div style={{border:`2px solid ${mode==="checkin"?B:"#e2e8f0"}`,borderRadius:10,padding:"10px 14px"}}><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Check-in</div><div style={{fontSize:14,fontWeight:600,color:ci?NAVY:"#94a3b8"}}>{ci?formatDate(ci):"Select"}</div></div>
        <div style={{border:`2px solid ${mode==="checkout"?B:"#e2e8f0"}`,borderRadius:10,padding:"10px 14px"}}><div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Check-out</div><div style={{fontSize:14,fontWeight:600,color:co?NAVY:"#94a3b8"}}>{co?formatDate(co):"Select"}</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:10}}>
        <button onClick={()=>{setCi("");setCo("");setMode("checkin");}} style={{background:"#fef3c7",color:"#92400e",border:"none",borderRadius:12,padding:14,fontSize:15,fontWeight:600,cursor:"pointer"}}>Clear</button>
        <button onClick={()=>{if(ci&&co){onSelect(ci,co);onClose();}}} style={{background:ci&&co?YELLOW:"#e2e8f0",color:ci&&co?"#1a1a1a":"#94a3b8",border:"none",borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:ci&&co?"pointer":"default"}}>Select</button>
      </div>
    </div>
  </div>);
}

// ── Guests Screen ─────────────────────────────────────────────────────────────
function GuestsScreen({guests,onSelect,onClose}:{guests:GuestState;onSelect:(g:GuestState)=>void;onClose:()=>void;}){
  const[g,setG]=useState(guests);
  const upd=(key:"rooms"|"adults"|"children",val:number)=>setG(prev=>{const n={...prev,[key]:val};if(key==="children"){const ages=[...prev.childAges];if(val>ages.length){while(ages.length<val)ages.push(5);}else ages.splice(val);n.childAges=ages;}return n;});
  return(<div style={{position:"fixed",inset:0,background:"#fff",zIndex:9999,display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",gap:16,padding:"16px 20px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:24,color:NAVY}}>←</button><div style={{fontWeight:700,fontSize:17,color:NAVY}}>Rooms & Guests</div></div>
    <div style={{flex:1,padding:"0 20px",overflowY:"auto"}}>
      {([["Rooms","Min 1","rooms",1,4],["Adults","13+ years","adults",1,16],["Children","0–12 years","children",0,8]] as [string,string,"rooms"|"adults"|"children",number,number][]).map(([label,sub,key,min,max])=>(
        <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 0",borderBottom:"1px solid #f1f5f9"}}>
          <div><div style={{fontSize:17,fontWeight:600,color:NAVY}}>{label}</div><div style={{fontSize:13,color:"#94a3b8"}}>{sub}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:18}}>
            <button disabled={g[key]<=min} onClick={()=>upd(key,Math.max(min,g[key]-1))} style={{width:40,height:40,borderRadius:8,border:"1.5px solid #cbd5e1",background:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:g[key]<=min?0.3:1}}>−</button>
            <span style={{fontSize:18,fontWeight:700,color:NAVY,minWidth:28,textAlign:"center"}}>{g[key]}</span>
            <button disabled={g[key]>=max} onClick={()=>upd(key,Math.min(max,g[key]+1))} style={{width:40,height:40,borderRadius:8,border:"1.5px solid #cbd5e1",background:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:g[key]>=max?0.3:1}}>+</button>
          </div>
        </div>
      ))}
      {g.children>0&&<div style={{padding:"16px 0"}}><div style={{fontSize:14,fontWeight:600,color:NAVY,marginBottom:12}}>Age of children at check-in</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{Array.from({length:g.children}).map((_,idx)=><div key={idx}><div style={{fontSize:12,color:"#94a3b8",marginBottom:4}}>Child {idx+1}</div><select value={g.childAges[idx]??5} onChange={e=>setG(prev=>{const ages=[...prev.childAges];ages[idx]=parseInt(e.target.value);return{...prev,childAges:ages};})} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"10px 12px",fontSize:14,fontFamily:"inherit",color:NAVY,background:"#fff"}}>{Array.from({length:13},(_,a)=><option key={a} value={a}>{a===0?"Under 1":`${a} year${a>1?"s":""}`}</option>)}</select></div>)}</div></div>}
    </div>
    <div style={{borderTop:"1px solid #e2e8f0",padding:"16px 20px 32px",background:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
      <div><div style={{fontSize:15,fontWeight:700,color:NAVY}}>{g.rooms} Room{g.rooms>1?"s":""}</div><div style={{fontSize:13,color:"#64748b"}}>{g.adults} Adult{g.adults>1?"s":""}{g.children>0?`, ${g.children} Child${g.children>1?"ren":""}`:""}</div></div>
      <button onClick={()=>{onSelect(g);onClose();}} style={{background:YELLOW,color:"#1a1a1a",border:"none",borderRadius:12,padding:"14px 28px",fontSize:16,fontWeight:700,cursor:"pointer"}}>Select</button>
    </div>
  </div>);
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({onClose}:{onClose:()=>void}){
  const[loading,setLoading]=useState(false);
  const handleGoogle=async()=>{setLoading(true);const{error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.href}});if(error){setLoading(false);alert("Sign in failed.");}};
  return(<><div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:8888}}/><div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#fff",borderRadius:20,zIndex:9999,width:"min(480px,92vw)",padding:"40px 36px"}}>
    <div style={{textAlign:"center",marginBottom:28}}><div style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:22,color:NAVY,marginBottom:8}}>rebuq<span style={{color:B}}>.</span></div><div style={{fontSize:20,fontWeight:700,color:NAVY,marginBottom:8}}>Sign in to see member rates</div><div style={{fontSize:14,color:"#64748b",lineHeight:1.6}}>Members get exclusive hotel rates up to 40% below OTA prices.</div></div>
    <button onClick={handleGoogle} disabled={loading} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:12,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"14px 20px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:NAVY,marginBottom:12}}>
      {loading?<div style={{width:20,height:20,border:"2px solid #e2e8f0",borderTop:`2px solid ${B}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
      {loading?"Signing in...":"Continue with Google"}
    </button>
    <div style={{textAlign:"center",fontSize:12,color:"#94a3b8"}}>Free forever · No credit card required</div>
  </div></>);
}

// ── Bottom Sheet ──────────────────────────────────────────────────────────────
function BottomSheet({title,onClose,children,onClear}:{title:string;onClose:()=>void;children:React.ReactNode;onClear?:()=>void;}){
  return(<><div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:8888}}/><div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderRadius:"20px 20px 0 0",zIndex:9999,maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px 14px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#94a3b8"}}>×</button><div style={{fontWeight:700,fontSize:17,color:NAVY}}>{title}</div><div style={{width:20}}/></div>
    <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>{children}</div>
    <div style={{padding:"14px 20px 32px",borderTop:"1px solid #f1f5f9",display:"grid",gridTemplateColumns:"1fr 2fr",gap:10,flexShrink:0}}>
      <button onClick={onClear||onClose} style={{background:"#fef3c7",color:"#92400e",border:"none",borderRadius:12,padding:14,fontSize:15,fontWeight:600,cursor:"pointer"}}>Clear</button>
      <button onClick={onClose} style={{background:B,color:"#fff",border:"none",borderRadius:12,padding:14,fontSize:15,fontWeight:700,cursor:"pointer"}}>Show results</button>
    </div>
  </div></>);
}

// ── Map View ──────────────────────────────────────────────────────────────────
function MapView({hotels,checkIn,checkOut,filterProps,onClose,onHotelClick,isMobile}:{hotels:Hotel[];checkIn:string;checkOut:string;filterProps:FiltersPanelProps;onClose:()=>void;onHotelClick:(h:Hotel)=>void;isMobile:boolean;}){
  const mapRef=useRef<HTMLDivElement>(null);
  const mapInstanceRef=useRef<any>(null);
  const markersRef=useRef<{el:HTMLElement;hotel:Hotel;pinDiv:HTMLElement}[]>([]);
  const listRef=useRef<HTMLDivElement>(null);
  const[selectedHotel,setSelectedHotel]=useState<Hotel|null>(null);
  const[openChip,setOpenChip]=useState<string|null>(null);
  const chipRef=useRef<HTMLDivElement>(null);
  const NIGHTS=checkIn&&checkOut?Math.max(1,Math.round((new Date(checkOut).getTime()-new Date(checkIn).getTime())/86400000)):1;
  const hotelsWithCoords=hotels.filter(h=>h.latitude&&h.longitude);

  useEffect(()=>{const handler=(e:MouseEvent)=>{if(chipRef.current&&!chipRef.current.contains(e.target as Node))setOpenChip(null);};document.addEventListener("mousedown",handler);return()=>document.removeEventListener("mousedown",handler);},[]);

  const selectHotel=(hotel:Hotel)=>{
    setSelectedHotel(hotel);
    markersRef.current.forEach(({pinDiv})=>{pinDiv.style.background="#fff";pinDiv.style.color=NAVY;pinDiv.style.transform="scale(1)";});
    const found=markersRef.current.find(m=>String(m.hotel.code)===String(hotel.code));
    if(found){found.pinDiv.style.background=YELLOW;found.pinDiv.style.color=NAVY;found.pinDiv.style.transform="scale(1.15)";}
    if(hotel.latitude&&hotel.longitude&&mapInstanceRef.current)mapInstanceRef.current.flyTo({center:[hotel.longitude,hotel.latitude],zoom:14,speed:1.5});
    if(listRef.current){const card=listRef.current.querySelector(`[data-hotel="${hotel.code}"]`) as HTMLElement;if(card)card.scrollIntoView({behavior:"smooth",block:"nearest"});}
  };

  useEffect(()=>{
    if(!mapRef.current)return;
    const initMap=()=>{
      const mapboxgl=(window as any).mapboxgl;if(!mapboxgl)return;
      mapboxgl.accessToken=MAPBOX_TOKEN;
      const cLng=hotelsWithCoords.length>0?hotelsWithCoords.reduce((s,h)=>s+(h.longitude||0),0)/hotelsWithCoords.length:55.2708;
      const cLat=hotelsWithCoords.length>0?hotelsWithCoords.reduce((s,h)=>s+(h.latitude||0),0)/hotelsWithCoords.length:25.2048;
      const map=new mapboxgl.Map({container:mapRef.current,style:"mapbox://styles/mapbox/streets-v12",center:[cLng,cLat],zoom:11});
      mapInstanceRef.current=map;
      const addMarkers=()=>{hotelsWithCoords.forEach(hotel=>{const price=Math.round((hotel.lowestPriceINR||hotel.minRate||0)/NIGHTS);if(!price)return;const el=document.createElement("div");const pinDiv=document.createElement("div");pinDiv.style.cssText=`background:#fff;color:${NAVY};padding:5px 10px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.18);border:1.5px solid #e2e8f0;cursor:pointer;transition:all 0.15s;`;pinDiv.textContent=`₹${price.toLocaleString("en-IN")}`;el.appendChild(pinDiv);el.addEventListener("click",()=>selectHotel(hotel));new mapboxgl.Marker({element:el,anchor:"bottom"}).setLngLat([hotel.longitude!,hotel.latitude!]).addTo(map);markersRef.current.push({el,hotel,pinDiv});});};
      if(map.loaded())addMarkers();else map.on("load",addMarkers);
    };
    if(!document.querySelector('link[href*="mapbox-gl"]')){const l=document.createElement("link");l.rel="stylesheet";l.href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";document.head.appendChild(l);}
    if((window as any).mapboxgl){initMap();return()=>{if(mapInstanceRef.current)mapInstanceRef.current.remove();};}
    const s=document.createElement("script");s.src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";s.onload=initMap;document.head.appendChild(s);
    return()=>{if(mapInstanceRef.current)mapInstanceRef.current.remove();};
  },[]);

  const handleMapSearch=(q:string)=>{markersRef.current.forEach(({el,hotel})=>{el.style.display=!q||hotel.name.toLowerCase().includes(q.toLowerCase())?"block":"none";});if(q&&mapInstanceRef.current){const h=hotelsWithCoords.find(h=>h.name.toLowerCase().includes(q.toLowerCase()));if(h)mapInstanceRef.current.flyTo({center:[h.longitude!,h.latitude!],zoom:14,speed:1.5});}};

  // Mobile: fullscreen
  if(isMobile)return(
    <div style={{position:"fixed",inset:0,zIndex:8000,display:"flex",flexDirection:"column"}}>
      <div style={{position:"absolute",top:12,right:12,zIndex:10}}><button onClick={onClose} style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:NAVY,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>✕ Close map</button></div>
      <div ref={mapRef} style={{width:"100%",height:"100%"}}/>
      {selectedHotel&&<div style={{position:"absolute",bottom:20,left:16,right:16,background:"#fff",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",overflow:"hidden",zIndex:10,display:"flex"}}>
        <img src={selectedHotel.imageUrl||FALLBACK_IMGS[0]} alt={selectedHotel.name} style={{width:90,height:90,objectFit:"cover",flexShrink:0}}/>
        <div style={{padding:"10px 12px",flex:1}}><div style={{fontWeight:700,fontSize:13,color:NAVY,marginBottom:2}}>{selectedHotel.name}</div><div style={{fontSize:18,fontWeight:800,color:NAVY}}>{formatINR(Math.round((selectedHotel.lowestPriceINR||selectedHotel.minRate||0)/NIGHTS))}</div><div style={{fontSize:11,color:"#64748b"}}>per night</div></div>
        <button onClick={()=>onHotelClick(selectedHotel)} style={{background:B,color:"#fff",border:"none",padding:"0 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View</button>
      </div>}
    </div>
  );

  // Desktop: split with inline filter chips in top bar
  const ChipDropdown=({id,label,children}:{id:string;label:string;children:React.ReactNode})=>{
    const isOpen=openChip===id;
    return(
      <div style={{position:"relative"}}>
        <button onClick={()=>setOpenChip(isOpen?null:id)} style={{display:"flex",alignItems:"center",gap:6,background:isOpen?"#eff6ff":"#fff",border:`1.5px solid ${isOpen?B:"#e2e8f0"}`,borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",color:isOpen?B:NAVY,whiteSpace:"nowrap"}}>
          {label} <span style={{fontSize:10}}>▼</span>
        </button>
        {isOpen&&<div style={{position:"absolute",top:"calc(100% + 6px)",left:0,minWidth:220,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.16)",zIndex:100,padding:14,maxHeight:320,overflowY:"auto"}}>{children}</div>}
      </div>
    );
  };

  const CB=({active,onClick,label}:{active:boolean;onClick:()=>void;label:string})=>(
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",cursor:"pointer"}}>
      <div style={{width:15,height:15,border:`1.5px solid ${active?B:"#e2e8f0"}`,borderRadius:3,background:active?B:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{active&&<svg width="9" height="9" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}</div>
      <span style={{fontSize:13,color:"#1e293b"}}>{label}</span>
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,zIndex:8000,display:"flex",flexDirection:"column"}}>
      {/* Top bar with inline filter chips */}
      <div ref={chipRef} style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"10px 20px",display:"flex",alignItems:"center",gap:10,flexShrink:0,flexWrap:"nowrap",overflowX:"auto"}}>
        <div style={{fontSize:14,fontWeight:700,color:NAVY,whiteSpace:"nowrap",marginRight:4}}>{hotelsWithCoords.length} hotels</div>

        {/* Location chip */}
        {filterProps.areaOptions.length>0&&<ChipDropdown id="loc" label={filterProps.filterLocation||"Location"}>
          {filterProps.areaOptions.map(a=><CB key={a} active={filterProps.filterLocation===a} onClick={()=>{filterProps.setFilterLocation(filterProps.filterLocation===a?"":a);setOpenChip(null);}} label={a}/>)}
        </ChipDropdown>}

        {/* Price chip */}
        <ChipDropdown id="price" label={filterProps.filterPriceMax||filterProps.filterPriceMin?"Price ✓":"Price"}>
          {([{label:"Under ₹5,000",min:null,max:5000},{label:"₹5,000–₹10,000",min:5000,max:10000},{label:"₹10,000–₹20,000",min:10000,max:20000},{label:"₹20,000–₹40,000",min:20000,max:40000},{label:"₹40,000+",min:40000,max:null}] as {label:string;min:number|null;max:number|null}[]).map(({label,min,max})=>{const a=filterProps.filterPriceMin===min&&filterProps.filterPriceMax===max;return<CB key={label} active={a} onClick={()=>{a?filterProps.setPriceRange(null,null):filterProps.setPriceRange(min,max);setOpenChip(null);}} label={label}/>;})}</ChipDropdown>

        {/* Stars chip */}
        <ChipDropdown id="stars" label={filterProps.filterStars.length>0?`Stars ✓`:"Stars"}>
          {[5,4,3,2,1].map(s=>{const a=filterProps.filterStars.includes(s);return<CB key={s} active={a} onClick={()=>filterProps.setFilterStars(a?filterProps.filterStars.filter(x=>x!==s):[...filterProps.filterStars,s])} label={`${"★".repeat(s)} ${s} Star`}/>;})}</ChipDropdown>

        {/* Rating chip */}
        <ChipDropdown id="rating" label={filterProps.filterRating?`Rating ${filterProps.filterRating}+`:"Rating"}>
          {[{label:"Exceptional 9+",min:9},{label:"Excellent 8+",min:8},{label:"Very Good 7+",min:7}].map(({label,min})=><CB key={min} active={filterProps.filterRating===min} onClick={()=>{filterProps.setFilterRating(filterProps.filterRating===min?null:min);setOpenChip(null);}} label={label}/>)}</ChipDropdown>

        {/* Toggle chips */}
        <button onClick={()=>filterProps.setFilterRefundable(!filterProps.filterRefundable)} style={{display:"flex",alignItems:"center",gap:6,background:filterProps.filterRefundable?"#dcfce7":"#fff",border:`1.5px solid ${filterProps.filterRefundable?"#16a34a":"#e2e8f0"}`,borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",color:filterProps.filterRefundable?"#16a34a":NAVY,whiteSpace:"nowrap"}}>
          {filterProps.filterRefundable&&"✓ "}Free cancel
        </button>
        <button onClick={()=>filterProps.setFilterBreakfast(!filterProps.filterBreakfast)} style={{display:"flex",alignItems:"center",gap:6,background:filterProps.filterBreakfast?YELLOW:"#fff",border:`1.5px solid ${filterProps.filterBreakfast?"#d97706":"#e2e8f0"}`,borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",color:filterProps.filterBreakfast?"#92400e":NAVY,whiteSpace:"nowrap"}}>
          {filterProps.filterBreakfast&&"✓ "}Breakfast
        </button>

        <div style={{flex:1}}/>
        <button onClick={onClose} style={{background:NAVY,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>✕ Close map</button>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* Left: hotel list */}
        <div style={{width:360,flexShrink:0,display:"flex",flexDirection:"column",background:"#f8fafc",borderRight:"1px solid #e2e8f0"}}>
          <div style={{padding:"10px 12px",borderBottom:"1px solid #e2e8f0",background:"#fff",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"8px 12px"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search hotel on map..." onChange={e=>handleMapSearch(e.target.value)} style={{border:"none",outline:"none",fontFamily:"inherit",fontSize:13,color:NAVY,background:"transparent",width:"100%"}}/>
            </div>
          </div>
          <div ref={listRef} style={{flex:1,overflowY:"auto",padding:10}}>
            {hotels.map((hotel,idx)=>{
              const price=Math.round((hotel.lowestPriceINR||hotel.minRate||0)/NIGHTS);
              const rating=hotel.rating||[9.1,8.9,9.4,9.3,8.7,9.0,8.8,9.2][codeToNum(hotel.code)%8];
              const isSelected=selectedHotel?.code===hotel.code;
              return(
                <div key={String(hotel.code)} data-hotel={hotel.code} onClick={()=>selectHotel(hotel)}
                  style={{background:"#fff",borderRadius:12,border:`1.5px solid ${isSelected?B:"#e2e8f0"}`,marginBottom:8,overflow:"hidden",cursor:"pointer",display:"flex",minHeight:96,transition:"border-color 0.15s"}}>
                  <img src={hotel.imageUrl||FALLBACK_IMGS[idx%FALLBACK_IMGS.length]} alt={hotel.name} style={{width:96,height:96,objectFit:"cover",flexShrink:0}} onError={e=>{(e.target as HTMLImageElement).src=FALLBACK_IMGS[idx%FALLBACK_IMGS.length];}}/>
                  <div style={{padding:"10px 12px",flex:1,minWidth:0,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                    <div style={{fontSize:13,fontWeight:700,color:NAVY,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{hotel.name}</div>
                    <div style={{fontSize:12,color:"#f59e0b"}}>{hotel.stars?"★".repeat(hotel.stars):""}</div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{background:rating>=9?B:"#0369a1",color:"#fff",fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:4}}>{rating.toFixed(1)}</span>
                      {hotel.isRefundable&&<span style={{fontSize:10,color:"#16a34a",background:"#dcfce7",padding:"1px 6px",borderRadius:3}}>✓ Free cancel</span>}
                    </div>
                    <div style={{fontSize:15,fontWeight:800,color:NAVY}}>{price>0?formatINR(price):"—"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: map */}
        <div style={{flex:1,position:"relative"}}>
          <div ref={mapRef} style={{width:"100%",height:"100%"}}/>
          {selectedHotel&&(
            <div style={{position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)",width:"min(320px,90%)",background:"#fff",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",overflow:"hidden",zIndex:10}}>
              <button onClick={()=>{setSelectedHotel(null);markersRef.current.forEach(({pinDiv})=>{pinDiv.style.background="#fff";pinDiv.style.color=NAVY;pinDiv.style.transform="scale(1)";});}} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.5)",color:"#fff",border:"none",borderRadius:"50%",width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1}}>×</button>
              <img src={selectedHotel.imageUrl||FALLBACK_IMGS[0]} alt={selectedHotel.name} style={{width:"100%",height:130,objectFit:"cover",display:"block"}}/>
              <div style={{padding:"12px 14px"}}>
                <div style={{fontWeight:700,fontSize:14,color:NAVY,marginBottom:6}}>{selectedHotel.name}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div><div style={{fontSize:18,fontWeight:800,color:NAVY}}>{formatINR(Math.round((selectedHotel.lowestPriceINR||selectedHotel.minRate||0)/NIGHTS))}</div><div style={{fontSize:11,color:"#64748b"}}>per night</div></div>
                  <button onClick={()=>onHotelClick(selectedHotel)} style={{background:B,color:"#fff",border:"none",borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>View Hotel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage(){
  return(<Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#64748b"}}>Loading…</div>}><SearchResults/></Suspense>);
}

function SearchResults(){
  const searchParams=useSearchParams();const router=useRouter();const isMobile=useIsMobile();const today=new Date();
  const[destination,setDestination]=useState((searchParams.get("destination")||"Dubai").split(",")[0].trim());
  const[checkIn,setCheckIn]=useState(searchParams.get("checkIn")||"");
  const[checkOut,setCheckOut]=useState(searchParams.get("checkOut")||"");
  const[guests,setGuests]=useState<GuestState>({rooms:parseInt(searchParams.get("rooms")||"1"),adults:parseInt(searchParams.get("adults")||"2"),children:parseInt(searchParams.get("children")||"0"),childAges:[]});
  const[hotels,setHotels]=useState<Hotel[]>([]);
  const[loading,setLoading]=useState(true);const[error,setError]=useState<string|null>(null);
  const[user,setUser]=useState<{name:string}|null>(null);const[showAuthModal,setShowAuthModal]=useState(false);
  const[showMap,setShowMap]=useState(false);const[favorites,setFavorites]=useState<Set<string|number>>(new Set());
  const[sortBy,setSortBy]=useState("popularity");const[page,setPage]=useState(1);
  const[showCal,setShowCal]=useState(false);const[showGuests,setShowGuests]=useState(false);
  const[mobileSheet,setMobileSheet]=useState<"filter"|"sort"|null>(null);
  const[desktopCalOpen,setDesktopCalOpen]=useState(false);const[desktopCalMode,setDesktopCalMode]=useState<"checkin"|"checkout">("checkin");
  const[desktopCalOffset,setDesktopCalOffset]=useState(0);const[desktopGuestOpen,setDesktopGuestOpen]=useState(false);
  // Destination autocomplete
  const[destInput,setDestInput]=useState(destination);const[destSuggestions,setDestSuggestions]=useState<typeof DESTINATIONS>([]);const[showDestDrop,setShowDestDrop]=useState(false);
  const destRef=useRef<HTMLDivElement>(null);const desktopCalRef=useRef<HTMLDivElement>(null);const desktopGuestRef=useRef<HTMLDivElement>(null);

  // Filter state
  const[filterStars,setFilterStars]=useState<number[]>([]);const[filterBreakfast,setFilterBreakfast]=useState(false);const[filterRefundable,setFilterRefundable]=useState(false);const[filterRating,setFilterRating]=useState<number|null>(null);const[filterPriceMin,setFilterPriceMin]=useState<number|null>(null);const[filterPriceMax,setFilterPriceMax]=useState<number|null>(null);const[filterFacilities,setFilterFacilities]=useState<string[]>([]);const[filterLocation,setFilterLocation]=useState("");const[hotelSearch,setHotelSearch]=useState("");

  useEffect(()=>{supabase.auth.getUser().then(({data})=>{if(data.user){const m=data.user.user_metadata;setUser({name:m?.full_name||m?.name||data.user.email?.split("@")[0]||"Member"});}});supabase.auth.onAuthStateChange((_,session)=>{if(session?.user){const m=session.user.user_metadata;setUser({name:m?.full_name||m?.name||session.user.email?.split("@")[0]||"Member"});setShowAuthModal(false);}});},[]);

  useEffect(()=>{const handler=(e:MouseEvent)=>{if(desktopCalRef.current&&!desktopCalRef.current.contains(e.target as Node))setDesktopCalOpen(false);if(desktopGuestRef.current&&!desktopGuestRef.current.contains(e.target as Node))setDesktopGuestOpen(false);if(destRef.current&&!destRef.current.contains(e.target as Node))setShowDestDrop(false);};document.addEventListener("mousedown",handler);return()=>document.removeEventListener("mousedown",handler);},[]);

  const handleDestInput=(val:string)=>{setDestInput(val);if(val.length>=1){const q=val.toLowerCase();setDestSuggestions(DESTINATIONS.filter(d=>d.label.toLowerCase().includes(q)||d.key.includes(q)));setShowDestDrop(true);}else{setDestSuggestions([]);setShowDestDrop(false);}};
  const selectDest=(d:typeof DESTINATIONS[0])=>{setDestInput(d.label);setDestination(d.label);setShowDestDrop(false);};

  const fetchHotels=useCallback(async(dest?:string,ci?:string,co?:string,g?:GuestState)=>{
    const d=dest||destination,c1=ci||checkIn,c2=co||checkOut,gs=g||guests;
    if(!c1||!c2){setLoading(false);setError("Please select check-in and check-out dates.");return;}
    setLoading(true);setError(null);setPage(1);
    try{const res=await fetch(`${API}/search?destination=${encodeURIComponent(d)}&checkIn=${c1}&checkOut=${c2}&adults=${gs.adults}&children=${gs.children}&rooms=${gs.rooms}`,{cache:"no-store"});const data=await res.json();if(data.hotels?.hotels)setHotels(data.hotels.hotels);else setError(data.error||"No hotels found.");}catch{setError("Could not connect to server.");}
    setLoading(false);
  },[destination,checkIn,checkOut,guests]);

  useEffect(()=>{fetchHotels();},[]);

  const NIGHTS=checkIn&&checkOut?Math.max(1,Math.round((new Date(checkOut).getTime()-new Date(checkIn).getTime())/86400000)):1;
  const priceINR=(h:Hotel)=>Math.round(parseFloat(String(h.lowestPriceINR||h.minRate||0))/NIGHTS);
  const getRating=(code:string|number)=>[9.1,8.9,9.4,9.3,8.7,9.0,8.8,9.2][codeToNum(code)%8];
  const getRatingLabel=(r:number)=>r>=9?"Exceptional":r>=8.5?"Excellent":"Very Good";
  const getDiscount=(code:string|number)=>[15,12,10,8,20,18,14,22][codeToNum(code)%8];
  const getImg=(hotel:Hotel,idx:number)=>hotel.imageUrl||FALLBACK_IMGS[idx%FALLBACK_IMGS.length];
  const guestSummary=(g:GuestState)=>`${g.rooms} Room${g.rooms>1?"s":""} · ${g.adults} Adult${g.adults>1?"s":""}${g.children>0?` · ${g.children} Child${g.children>1?"ren":""}` :""}`;
  const getCardAmenities=(hotel:Hotel)=>PRIORITY_AMENITIES.filter(p=>(hotel.amenities||[]).some(a=>a.toLowerCase().includes(p.toLowerCase())));

  const areaOptions=useMemo(()=>{const found=new Set<string>();hotels.forEach(h=>{const a=getAreaFromCoords(h.latitude,h.longitude);if(a)found.add(a);});return DUBAI_AREAS.map(([n])=>n).filter(n=>found.has(n));},[hotels]);
  const clearAllFilters=()=>{setFilterStars([]);setFilterBreakfast(false);setFilterRefundable(false);setFilterRating(null);setFilterPriceMax(null);setFilterPriceMin(null);setFilterFacilities([]);setFilterLocation("");setHotelSearch("");};
  const hasActiveFilters=filterStars.length>0||filterBreakfast||filterRefundable||filterRating!==null||filterPriceMax!==null||filterPriceMin!==null||filterFacilities.length>0||!!filterLocation||!!hotelSearch;

  const filteredHotels=useMemo(()=>hotels.filter(h=>{const price=priceINR(h);if(hotelSearch&&!h.name.toLowerCase().includes(hotelSearch.toLowerCase()))return false;if(filterStars.length>0&&!filterStars.includes(h.stars||0))return false;if(filterBreakfast&&!h.hasBreakfast)return false;if(filterRefundable&&h.isRefundable!==true)return false;if(filterRating!==null){const r=h.rating||getRating(h.code);if(r<filterRating)return false;}if(filterPriceMin!==null&&price<filterPriceMin)return false;if(filterPriceMax!==null&&price>filterPriceMax)return false;if(filterFacilities.length>0){const am=(h.amenities||[]).map(a=>a.toLowerCase());if(!filterFacilities.every(f=>am.some(a=>a.includes(f.toLowerCase()))))return false;}if(filterLocation){const area=getAreaFromCoords(h.latitude,h.longitude);if(area!==filterLocation)return false;}return true;}),[hotels,hotelSearch,filterStars,filterBreakfast,filterRefundable,filterRating,filterPriceMin,filterPriceMax,filterFacilities,filterLocation]);

  const sortedHotels=useMemo(()=>[...filteredHotels].sort((a,b)=>{if(sortBy==="price-low")return priceINR(a)-priceINR(b);if(sortBy==="price-high")return priceINR(b)-priceINR(a);if(sortBy==="rating")return(b.rating||getRating(b.code))-(a.rating||getRating(a.code));if(sortBy==="stars")return(b.stars||0)-(a.stars||0);return 0;}),[filteredHotels,sortBy]);

  const perPage=10;const paginatedHotels=sortedHotels.slice((page-1)*perPage,page*perPage);const totalPages=Math.ceil(sortedHotels.length/perPage);

  const filterProps:FiltersPanelProps={destination,areaOptions,filterLocation,setFilterLocation,filterPriceMin,filterPriceMax,setPriceRange:(min,max)=>{setFilterPriceMin(min);setFilterPriceMax(max);},filterRefundable,setFilterRefundable,filterBreakfast,setFilterBreakfast,filterRating,setFilterRating,filterStars,setFilterStars,filterFacilities,setFilterFacilities,hasActiveFilters,clearAllFilters,onHotelSearch:setHotelSearch};

  const handleSearch=()=>{if(!user){setShowAuthModal(true);return;}const d=destInput.trim()||destination;setDestination(d);fetchHotels(d,checkIn,checkOut,guests);const p=new URLSearchParams({destination:d,checkIn,checkOut,adults:String(guests.adults),rooms:String(guests.rooms),children:String(guests.children)});router.replace(`/search?${p.toString()}`);};
  const handleHotelClick=(hotel:Hotel)=>{if(!user){setShowAuthModal(true);return;}router.push(`/hotel/${hotel.code}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests.adults}&rooms=${guests.rooms}&children=${guests.children}`);};

  const desktopDayClick=(ds:string)=>{if(desktopCalMode==="checkin"){setCheckIn(ds);setCheckOut("");setDesktopCalMode("checkout");}else{if(ds<=checkIn)return;setCheckOut(ds);setDesktopCalOpen(false);}};
  const renderDesktopMonth=(year:number,month:number)=>{const todayStr=toDateStr(today.getFullYear(),today.getMonth(),today.getDate());const days=getDaysInMonth(year,month);const firstDow=getFirstDow(year,month);return(<div key={`${year}-${month}`} style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:NAVY,textAlign:"center",marginBottom:12}}>{MONTHS[month]} {year}</div><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>{DOWS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"#94a3b8",paddingBottom:6}}>{d}</div>)}{Array.from({length:firstDow}).map((_,i)=><div key={`e${i}`}/>)}{Array.from({length:days}).map((_,i)=>{const day=i+1;const ds=toDateStr(year,month,day);const isDisabled=ds<todayStr;let bg="transparent",clr=isDisabled?"#cbd5e1":NAVY,br="50%",fw=400;if(ds===checkIn&&!!checkOut){bg=B;clr="#fff";br="50% 0 0 50%";fw=700;}else if(ds===checkOut){bg=B;clr="#fff";br="0 50% 50% 0";fw=700;}else if(ds===checkIn&&!checkOut){bg=B;clr="#fff";br="50%";fw=700;}else if(checkIn&&checkOut&&ds>checkIn&&ds<checkOut){bg="#dbeafe";clr=B;br="0";}else if(ds===todayStr)clr=B;return<div key={day} onClick={()=>!isDisabled&&desktopDayClick(ds)} style={{height:34,display:"flex",alignItems:"center",justifyContent:"center",background:bg,color:clr,borderRadius:br,fontWeight:fw,fontSize:13,cursor:isDisabled?"not-allowed":"pointer",opacity:isDisabled?0.35:1}}>{day}</div>;})}</div></div>);};
  const d1=new Date(today.getFullYear(),today.getMonth()+desktopCalOffset);
  const d2=new Date(today.getFullYear(),today.getMonth()+desktopCalOffset+1);

  return(
    <div style={{fontFamily:"'Inter',sans-serif",background:"#f8fafc",color:"#1e293b",minHeight:"100vh"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}.sora{font-family:'Sora',sans-serif;}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.hcard{background:#fff;border-radius:12px;border:1.5px solid #e2e8f0;margin-bottom:16px;display:grid;grid-template-columns:260px 1fr;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.07);transition:box-shadow .2s,transform .2s;cursor:pointer;min-height:210px;animation:fadeIn 0.3s ease;}.hcard:hover{box-shadow:0 8px 32px rgba(0,0,0,0.12);transform:translateY(-2px);}.hcard-img{position:relative;width:260px;min-height:210px;overflow:hidden;flex-shrink:0;}.hcard-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}.hcard-m{background:#fff;border-radius:16px;overflow:hidden;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);cursor:pointer;animation:fadeIn 0.3s ease;}.sfd{cursor:pointer;transition:background 0.15s;}.sfd:hover{background:rgba(0,0,0,0.02);}.pgb{width:38px;height:38px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;color:${NAVY};font-size:14px;cursor:pointer;font-family:inherit;transition:all .2s;display:flex;align-items:center;justify-content:center;}.pgb:hover{border-color:${B};color:${B};}.pgb.on{background:${B};color:#fff;border-color:${B};}.btb{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:none;border:none;cursor:pointer;font-family:inherit;font-size:12px;color:${NAVY};font-weight:500;padding:8px 0;}`}</style>

      {showAuthModal&&<AuthModal onClose={()=>setShowAuthModal(false)}/>}
      {showMap&&<MapView hotels={filteredHotels.length>0?filteredHotels:hotels} checkIn={checkIn} checkOut={checkOut} filterProps={filterProps} onClose={()=>setShowMap(false)} onHotelClick={h=>{setShowMap(false);handleHotelClick(h);}} isMobile={isMobile}/>}
      {isMobile&&showCal&&<CalendarScreen checkIn={checkIn} checkOut={checkOut} onSelect={(ci,co)=>{setCheckIn(ci);setCheckOut(co);}} onClose={()=>setShowCal(false)}/>}
      {isMobile&&showGuests&&<GuestsScreen guests={guests} onSelect={setGuests} onClose={()=>setShowGuests(false)}/>}
      {isMobile&&mobileSheet==="filter"&&<BottomSheet title="Filters" onClose={()=>setMobileSheet(null)} onClear={clearAllFilters}><FiltersPanel {...filterProps}/></BottomSheet>}
      {isMobile&&mobileSheet==="sort"&&<BottomSheet title="Sort by" onClose={()=>setMobileSheet(null)}>{[{val:"popularity",label:"Popularity"},{val:"price-low",label:"Price: Low to High"},{val:"price-high",label:"Price: High to Low"},{val:"rating",label:"User Rating"},{val:"stars",label:"Star Rating"}].map(opt=><div key={opt.val} onClick={()=>{setSortBy(opt.val);setMobileSheet(null);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",borderBottom:"1px solid #f8fafc",cursor:"pointer"}}><span style={{fontSize:16,fontWeight:500,color:NAVY}}>{opt.label}</span><div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${sortBy===opt.val?B:"#e2e8f0"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>{sortBy===opt.val&&<div style={{width:10,height:10,borderRadius:"50%",background:B}}/>}</div></div>)}</BottomSheet>}

      <nav style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:isMobile?"0 20px":"0 32px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:300}}>
        <a href="/" style={{fontFamily:"'Sora',sans-serif",fontWeight:800,fontSize:20,color:NAVY,textDecoration:"none"}}>rebuq<span style={{color:B}}>.</span></a>
        {!isMobile&&<div style={{display:"flex",gap:24,alignItems:"center"}}><a href="/search-hotels" style={{fontSize:14,color:B,textDecoration:"none",fontWeight:600}}>Exclusive Member Deals</a>{user?<div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>window.location.href="/dashboard"}><div style={{width:32,height:32,borderRadius:"50%",background:B,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>{user.name[0].toUpperCase()}</div><span style={{fontSize:14,fontWeight:600,color:NAVY}}>{user.name.split(" ")[0]}</span></div>:<button onClick={()=>setShowAuthModal(true)} style={{background:B,color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Sign in</button>}</div>}
      </nav>

      {isMobile&&<div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"10px 16px",position:"sticky",top:60,zIndex:200,display:"flex",alignItems:"center",gap:10}}><button onClick={()=>router.back()} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#64748b",flexShrink:0}}>←</button><div style={{flex:1,background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:100,padding:"10px 16px",display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setShowCal(true)}><div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:700,color:NAVY,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{destination}</div><div style={{fontSize:12,color:"#64748b",whiteSpace:"nowrap"}}>{checkIn&&checkOut?`${formatDateShort(checkIn)} – ${formatDateShort(checkOut)}`:"Select dates"} · {guestSummary(guests)}</div></div></div></div>}

      {!isMobile&&<div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"10px 32px",position:"sticky",top:60,zIndex:200}}>
        <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1.3fr auto",alignItems:"stretch",height:64,overflow:"visible",position:"relative",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
          {/* Destination with autocomplete */}
          <div ref={destRef} className="sfd" style={{padding:"0 20px",borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column",justifyContent:"center",borderRadius:"12px 0 0 12px",position:"relative"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Destination</div>
            <input value={destInput} onChange={e=>handleDestInput(e.target.value)} onFocus={()=>{if(destInput.length>=1)setShowDestDrop(true);}} onKeyDown={e=>{if(e.key==="Enter"){setShowDestDrop(false);handleSearch();}}} placeholder="City or destination" style={{border:"none",outline:"none",fontFamily:"inherit",fontSize:15,fontWeight:600,color:NAVY,background:"transparent",padding:0,width:"100%"}}/>
            {showDestDrop&&destSuggestions.length>0&&<div style={{position:"absolute",top:"calc(100% + 10px)",left:0,width:"100%",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,0.14)",zIndex:9999,maxHeight:280,overflowY:"auto"}}>
              {destSuggestions.map(d=><div key={d.key} onClick={()=>selectDest(d)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer",borderBottom:"1px solid #f8fafc",transition:"background 0.1s"}} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="#fff")}>
                <span style={{fontSize:20}}>{d.flag}</span>
                <div><div style={{fontSize:14,fontWeight:600,color:NAVY}}>{d.label}</div><div style={{fontSize:12,color:"#94a3b8"}}>{d.country}</div></div>
              </div>)}
            </div>}
          </div>
          <div className="sfd" style={{padding:"0 18px",borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column",justifyContent:"center",background:desktopCalOpen&&desktopCalMode==="checkin"?"#f0f7ff":"transparent"}} onClick={()=>{setDesktopCalMode("checkin");setDesktopCalOpen(true);setDesktopCalOffset(0);}}>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Check-in</div>
            <div style={{fontSize:14,fontWeight:checkIn?600:400,color:checkIn?NAVY:"#94a3b8"}}>{checkIn?formatDate(checkIn):"Add date"}</div>
          </div>
          <div className="sfd" style={{padding:"0 18px",borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column",justifyContent:"center",background:desktopCalOpen&&desktopCalMode==="checkout"?"#f0f7ff":"transparent"}} onClick={()=>{setDesktopCalMode("checkout");setDesktopCalOpen(true);setDesktopCalOffset(0);}}>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Check-out</div>
            <div style={{fontSize:14,fontWeight:checkOut?600:400,color:checkOut?NAVY:"#94a3b8"}}>{checkOut?formatDate(checkOut):"Add date"}</div>
          </div>
          <div ref={desktopGuestRef} className="sfd" style={{padding:"0 18px",display:"flex",flexDirection:"column",justifyContent:"center",position:"relative"}} onClick={()=>setDesktopGuestOpen(!desktopGuestOpen)}>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>Rooms & Guests</div>
            <div style={{fontSize:14,fontWeight:600,color:NAVY}}>{guestSummary(guests)} <span style={{fontSize:9,color:"#94a3b8"}}>▼</span></div>
            {desktopGuestOpen&&<div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:"calc(100% + 10px)",right:0,width:340,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.14)",zIndex:9999,padding:18}}>
              {([["Rooms","1+","rooms",1,4],["Adults","13+","adults",1,16],["Children","0–12","children",0,8]] as [string,string,"rooms"|"adults"|"children",number,number][]).map(([label,sub,key,mn,mx])=><div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}><div><div style={{fontSize:14,fontWeight:600,color:NAVY}}>{label}</div><div style={{fontSize:12,color:"#94a3b8"}}>Age {sub}</div></div><div style={{display:"flex",alignItems:"center",gap:12}}><button disabled={guests[key]<=mn} onClick={e=>{e.stopPropagation();setGuests(prev=>{const n={...prev,[key]:Math.max(mn,prev[key]-1)};if(key==="children")n.childAges=n.childAges.slice(0,n.children);return n;});}} style={{width:32,height:32,borderRadius:6,border:"1.5px solid #cbd5e1",background:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:guests[key]<=mn?0.3:1}}>−</button><span style={{fontSize:15,fontWeight:700,color:NAVY,minWidth:20,textAlign:"center"}}>{guests[key]}</span><button disabled={guests[key]>=mx} onClick={e=>{e.stopPropagation();setGuests(prev=>{const n={...prev,[key]:Math.min(mx,prev[key]+1)};if(key==="children"){n.childAges=[...n.childAges];while(n.childAges.length<n.children)n.childAges.push(5);}return n;});}} style={{width:32,height:32,borderRadius:6,border:"1.5px solid #cbd5e1",background:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:guests[key]>=mx?0.3:1}}>+</button></div></div>)}
              {guests.children>0&&<div style={{padding:"12px 0",borderBottom:"1px solid #f1f5f9"}}><div style={{fontSize:13,color:"#64748b",marginBottom:8}}>Age of children</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{Array.from({length:guests.children}).map((_,idx)=><div key={idx}><div style={{fontSize:11,color:"#94a3b8",marginBottom:3}}>Child {idx+1}</div><select value={guests.childAges[idx]??5} onChange={e=>{e.stopPropagation();setGuests(prev=>{const ages=[...prev.childAges];ages[idx]=parseInt(e.target.value);return{...prev,childAges:ages};});}} style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:6,padding:"6px 8px",fontSize:13,fontFamily:"inherit",color:NAVY,background:"#fff"}}>{Array.from({length:13},(_,a)=><option key={a} value={a}>{a===0?"Under 1":`${a} yr`}</option>)}</select></div>)}</div></div>}
              <button onClick={()=>setDesktopGuestOpen(false)} style={{width:"100%",background:B,color:"#fff",border:"none",borderRadius:10,padding:10,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:12}}>Done</button>
            </div>}
          </div>
          <button onClick={handleSearch} style={{background:YELLOW,color:"#1a1a1a",border:"none",padding:"0 28px",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit",borderRadius:"0 12px 12px 0",display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search
          </button>
          {desktopCalOpen&&<div ref={desktopCalRef} onClick={e=>e.stopPropagation()} style={{position:"absolute",top:"calc(100% + 10px)",left:"28%",width:620,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:14,boxShadow:"0 8px 40px rgba(0,0,0,0.16)",zIndex:9999,padding:22}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
              <button onClick={()=>setDesktopCalOffset(p=>Math.max(0,p-1))} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:16,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>‹</button>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,flex:1}}>{renderDesktopMonth(d1.getFullYear(),d1.getMonth())}{renderDesktopMonth(d2.getFullYear(),d2.getMonth())}</div>
              <button onClick={()=>setDesktopCalOffset(p=>p+1)} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:16,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>›</button>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #f1f5f9",paddingTop:12,marginTop:8}}>
              <div style={{fontSize:13,color:"#64748b"}}>{checkIn&&checkOut&&<span style={{color:"#16a34a",fontWeight:600}}>✓ {formatDate(checkIn)} → {formatDate(checkOut)}</span>}</div>
              <button onClick={()=>{setCheckIn("");setCheckOut("");}} style={{background:"none",border:"none",fontSize:13,color:"#94a3b8",cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
            </div>
          </div>}
        </div>
      </div>}

      <div style={{padding:isMobile?"16px 16px 100px":"20px 32px 60px"}}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"268px 1fr",gap:22}}>
          {!isMobile&&<div style={{minWidth:0}}>
            <div style={{borderRadius:12,overflow:"hidden",marginBottom:16,border:"1.5px solid #e2e8f0",cursor:"pointer",position:"relative"}} onClick={()=>setShowMap(true)}>
              <img src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${hotels.find(h=>h.longitude&&h.latitude)?`${hotels.find(h=>h.longitude&&h.latitude)!.longitude},${hotels.find(h=>h.longitude&&h.latitude)!.latitude},11`:"55.2708,25.2048,11"}/268x140?access_token=${MAPBOX_TOKEN}`} alt="Map" style={{width:"100%",height:140,objectFit:"cover",display:"block"}} onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
              <div style={{position:"absolute",top:0,left:0,right:0,bottom:28,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{background:"rgba(255,255,255,0.92)",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:700,color:NAVY,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>🗺️ {hotels.filter(h=>h.latitude&&h.longitude).length} hotels on map</div></div>
              <div style={{padding:"9px 14px",background:"#fff",textAlign:"center",color:B,fontSize:13,fontWeight:700,borderTop:"1px solid #e2e8f0"}}>📍 Explore on Map</div>
            </div>
            <div style={{background:"#fff",borderRadius:12,border:"1.5px solid #e2e8f0",padding:18}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><div className="sora" style={{fontSize:16,fontWeight:700,color:NAVY}}>Filters</div>{hasActiveFilters&&<button onClick={clearAllFilters} style={{background:"none",border:"none",fontSize:12,color:B,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Clear all</button>}</div>
              <FiltersPanel {...filterProps}/>
            </div>
          </div>}

          <div style={{minWidth:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div><span className="sora" style={{fontSize:isMobile?18:22,fontWeight:800,color:NAVY}}>Hotels in {destination}</span>{!loading&&<span style={{fontSize:13,color:"#64748b",marginLeft:8}}>{sortedHotels.length} properties found</span>}</div>
              {!isMobile&&<select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{border:"1.5px solid #e2e8f0",borderRadius:8,padding:"7px 12px",fontSize:13,fontFamily:"inherit",color:NAVY,background:"#fff",cursor:"pointer",outline:"none"}}><option value="popularity">Sort by: Popularity</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="rating">User Rating</option><option value="stars">Star Rating</option></select>}
            </div>

            {loading&&<div style={{textAlign:"center",padding:"60px 0"}}><div style={{width:36,height:36,border:"3px solid #bfdbfe",borderTop:`3px solid ${B}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/><div style={{fontSize:14,color:"#64748b"}}>Finding the best hotels in {destination}…</div></div>}
            {error&&!loading&&<div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,marginBottom:12}}>🏨</div><div style={{fontSize:15,fontWeight:600,color:NAVY,marginBottom:6}}>{error}</div><button onClick={()=>router.push("/search-hotels")} style={{background:B,color:"#fff",border:"none",padding:"10px 24px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:600,marginTop:16}}>← Back to search</button></div>}

            {!user&&!loading&&hotels.length>0&&<div style={{position:"relative"}}>
              <div style={{filter:"blur(4px)",pointerEvents:"none",userSelect:"none"}}>{paginatedHotels.slice(0,2).map((hotel,idx)=><div key={String(hotel.code)} className="hcard"><div className="hcard-img"><img src={getImg(hotel,idx)} alt={hotel.name}/></div><div style={{padding:"18px 22px"}}><div className="sora" style={{fontSize:17,fontWeight:700,color:NAVY}}>{hotel.name}</div><div style={{fontSize:24,fontWeight:800,color:NAVY,marginTop:8}}>{priceINR(hotel)>0?formatINR(priceINR(hotel)):"Price on request"}</div></div></div>)}</div>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(248,250,252,0.7)",backdropFilter:"blur(2px)",borderRadius:12}}>
                <div onClick={()=>setShowAuthModal(true)} style={{background:"#fff",borderRadius:20,padding:"32px 36px",textAlign:"center",boxShadow:"0 16px 48px rgba(0,0,0,0.15)",cursor:"pointer",maxWidth:380,width:"90%"}}>
                  <div style={{fontSize:36,marginBottom:12}}>🔒</div><div className="sora" style={{fontSize:20,fontWeight:800,color:NAVY,marginBottom:8}}>Sign in to see member rates</div>
                  <div style={{fontSize:14,color:"#64748b",marginBottom:20,lineHeight:1.6}}>{hotels.length} hotels found in {destination}. Sign in free to unlock exclusive rates.</div>
                  <button style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:12,padding:"13px 20px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:NAVY}}>
                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google — it&apos;s free
                  </button>
                </div>
              </div>
            </div>}

            {!loading&&!error&&user&&paginatedHotels.map((hotel,idx)=>{
              const rating=hotel.rating||getRating(hotel.code);const discount=getDiscount(hotel.code);const price=priceINR(hotel);const wasPrice=price>0?Math.round(price*(1+discount/100)):0;const globalIdx=(page-1)*perPage+idx;const cardAmenities=getCardAmenities(hotel);const area=getAreaFromCoords(hotel.latitude,hotel.longitude);
              return isMobile?(
                <div key={String(hotel.code)} className="hcard-m" onClick={()=>handleHotelClick(hotel)}>
                  <div style={{position:"relative",height:200}}>
                    <img src={getImg(hotel,globalIdx)} alt={hotel.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>{(e.target as HTMLImageElement).src=FALLBACK_IMGS[globalIdx%FALLBACK_IMGS.length];}}/>
                    {/* No heart icon — removed */}
                    <div style={{position:"absolute",top:12,left:12,background:"rgba(255,255,255,0.95)",color:NAVY,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:6}}>↗ Trending</div>
                  </div>
                  <div style={{padding:"14px 16px 16px"}}>
                    <div className="sora" style={{fontSize:16,fontWeight:700,color:NAVY,marginBottom:3}}>{hotel.name}</div>
                    <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>{hotel.stars?<span style={{color:"#f59e0b"}}>{"★".repeat(hotel.stars)}</span>:null}{area?` · ${area}`:hotel.address?` · ${hotel.address}`:""}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                      <span style={{background:rating>=9?B:"#0369a1",color:"#fff",fontSize:12,fontWeight:700,padding:"3px 8px",borderRadius:6}}>{rating.toFixed(1)}</span>
                      <span style={{fontSize:13,fontWeight:600,color:NAVY}}>{getRatingLabel(rating)}</span>
                      {hotel.isRefundable!=null&&<span style={{fontSize:11,fontWeight:600,color:hotel.isRefundable?"#16a34a":"#dc2626",background:hotel.isRefundable?"#dcfce7":"#fee2e2",padding:"2px 7px",borderRadius:5}}>{hotel.isRefundable?"✓ Refundable":"Non-refundable"}</span>}
                      {/* Breakfast yellow pill */}
                      {hotel.hasBreakfast&&<span style={{display:"flex",alignItems:"center",gap:4,background:YELLOW,color:"#1a1a1a",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:5}}><IconBreakfast/> Breakfast</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
                      <div>{price>0?(<><div style={{fontSize:12,color:"#94a3b8",textDecoration:"line-through"}}>{formatINR(wasPrice)}</div><div className="sora" style={{fontSize:22,fontWeight:800,color:NAVY}}>{formatINR(price)}</div><div style={{fontSize:11,color:"#64748b"}}>+ taxes · per night</div></>):<div style={{fontSize:13,color:"#64748b"}}>Price on request</div>}</div>
                      <button style={{background:B,color:"#fff",border:"none",borderRadius:10,padding:"11px 20px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Book Now</button>
                    </div>
                    <button onClick={e=>{e.stopPropagation();router.push("/upload");}} style={{marginTop:10,width:"100%",background:"#eff6ff",color:B,border:`1px solid #bfdbfe`,borderRadius:8,padding:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><IconBell/> Track price drop</button>
                  </div>
                </div>
              ):(
                <div key={String(hotel.code)} className="hcard" onClick={()=>handleHotelClick(hotel)}>
                  <div className="hcard-img">
                    <img src={getImg(hotel,globalIdx)} alt={hotel.name} onError={e=>{(e.target as HTMLImageElement).src=FALLBACK_IMGS[globalIdx%FALLBACK_IMGS.length];}}/>
                    {/* Only Trending badge on image — no heart, no breakfast */}
                    <div style={{position:"absolute",top:10,left:10,background:"rgba(255,255,255,0.95)",color:NAVY,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:6}}>↗ Trending</div>
                  </div>
                  <div style={{padding:"18px 20px 18px 22px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                        <div style={{flex:1}}>
                          <div className="sora" style={{fontSize:17,fontWeight:700,color:NAVY,marginBottom:4}}>{hotel.name}{hotel.stars?<span style={{color:"#f59e0b",fontSize:12,marginLeft:6}}>{"★".repeat(hotel.stars)}</span>:null}</div>
                          <div style={{fontSize:12.5,color:"#64748b",marginBottom:8}}>📍 {area||hotel.address||destination}</div>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                            <span style={{background:rating>=9?B:"#0369a1",color:"#fff",fontSize:12.5,fontWeight:700,padding:"3px 8px",borderRadius:6}}>{rating.toFixed(1)}</span>
                            <span style={{fontSize:13,fontWeight:600,color:NAVY}}>{getRatingLabel(rating)}</span>
                            {hotel.isRefundable!=null&&<span style={{fontSize:11,fontWeight:600,color:hotel.isRefundable?"#16a34a":"#dc2626",background:hotel.isRefundable?"#dcfce7":"#fee2e2",padding:"2px 7px",borderRadius:5}}>{hotel.isRefundable?"✓ Free Cancellation":"Non-refundable"}</span>}
                            {/* Breakfast yellow pill in card body */}
                            {hotel.hasBreakfast&&<span style={{display:"flex",alignItems:"center",gap:4,background:YELLOW,color:"#1a1a1a",fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:5}}><IconBreakfast/> Breakfast</span>}
                          </div>
                          {/* Priority amenities — max 4 */}
                          {cardAmenities.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"4px 14px",marginBottom:8}}>{cardAmenities.map((a,i)=><span key={i} style={{fontSize:12.5,color:"#475569"}}>• {a}</span>)}</div>}
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          {price>0?(<><div style={{background:"#dcfce7",color:"#16a34a",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:100,marginBottom:4,display:"inline-block"}}>{discount}% off</div><div style={{fontSize:12,color:"#64748b",textDecoration:"line-through"}}>{formatINR(wasPrice)}</div><div className="sora" style={{fontSize:24,fontWeight:800,color:NAVY}}>{formatINR(price)}</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>+ taxes · per night</div></>):<div style={{fontSize:13,color:"#64748b"}}>Price on request</div>}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
                      <button onClick={e=>{e.stopPropagation();router.push("/upload");}} style={{display:"flex",alignItems:"center",gap:6,background:"#eff6ff",color:B,border:`1px solid #bfdbfe`,borderRadius:8,padding:"8px 14px",fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}><IconBell/> Track price</button>
                      <button style={{background:B,color:"#fff",border:"none",borderRadius:10,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Book Now</button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading&&!error&&totalPages>1&&<div style={{display:"flex",justifyContent:"center",gap:6,marginTop:24}}>{page>1&&<button className="pgb" onClick={()=>{setPage(p=>p-1);window.scrollTo({top:0,behavior:"smooth"});}}>‹</button>}{Array.from({length:Math.min(totalPages,5)},(_,i)=>{const p=Math.max(1,page-2)+i;if(p>totalPages)return null;return<button key={p} className={`pgb${page===p?" on":""}`} onClick={()=>{setPage(p);window.scrollTo({top:0,behavior:"smooth"});}}>{p}</button>;})} {page<totalPages&&<button className="pgb" onClick={()=>{setPage(p=>Math.min(p+1,totalPages));window.scrollTo({top:0,behavior:"smooth"});}}>›</button>}</div>}
          </div>
        </div>
      </div>

      {isMobile&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #e2e8f0",display:"flex",zIndex:400,paddingBottom:"env(safe-area-inset-bottom)"}}>
        <button className="btb" onClick={()=>setMobileSheet("filter")}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={mobileSheet==="filter"?B:"#64748b"} strokeWidth="2"><path d="M3 4h18M7 8h10M11 12h2M13 16h-2"/></svg><span style={{color:mobileSheet==="filter"?B:"#64748b"}}>Filter</span></button>
        <button className="btb" onClick={()=>setShowMap(true)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span style={{color:"#64748b"}}>Map</span></button>
        <button className="btb" onClick={()=>setMobileSheet("sort")}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={mobileSheet==="sort"?B:"#64748b"} strokeWidth="2"><path d="M3 6h18M7 12h10M11 18h2"/></svg><span style={{color:mobileSheet==="sort"?B:"#64748b"}}>Sort</span></button>
        {!user&&<button className="btb" onClick={()=>setShowAuthModal(true)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span style={{color:B,fontWeight:700}}>Sign in</span></button>}
      </div>}
    </div>
  );
}

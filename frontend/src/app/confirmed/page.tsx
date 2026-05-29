Skip to content
Deployments
6ScFLnR7F

Deployment
Logs
Resources
Source
Open Graph
Deployment Details
Build Failed
Command "npm run build" exited with 1
Created
github/amansharma-bit
amansharma-bit
6m ago
Status
Error
Latest
Duration
22s
5m ago
Environment
Production
Domains
hoteldrops-git-main-amansharma-bits-projects.vercel.app
hoteldrops-30f8ixy55-amansharma-bits-projects.vercel.app
Source
main
1904054
Update page.tsx

Deployment Settings
3 Recommendations
Build Logs
22s
43 lines
Find in logs
⌘F
19:16:19.694 
19:16:19.695 
   We detected TypeScript in your project and reconfigured your tsconfig.json file for you. Strict-mode is set to false by default.
19:16:19.695 
   The following mandatory changes were made to your tsconfig.json:
19:16:19.696 
19:16:19.696 
   	- esModuleInterop was set to true (requirement for SWC / babel)
19:16:19.696 
19:16:27.284 
Failed to compile.
19:16:27.285 
19:16:27.285 
./src/app/checkout/page.tsx:307:51
19:16:27.285 
Type error: Cannot find name 'isMobile'.
19:16:27.285 
19:16:27.285 
  305 |       </div>
19:16:27.285 
  306 |       {/* FOOTER */}
19:16:27.285 
> 307 |       <footer style={{ background: NAVY, padding: isMobile ? "40px 20px 24px" : "48px 40px 32px" }}>
19:16:27.286 
      |                                                   ^
19:16:27.287 
  308 |         <div style={{ maxWidth: 1100, margin: "0 auto" }}>
19:16:27.287 
  309 |           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 40, gap: 40, flexWrap: "wrap" as const, flexDirection: isMobile ? "column" : "row" }}>
19:16:27.287 
  310 |             <div>
19:16:27.360 
Error: Command "npm run build" exited with 1
Deployment Summary
Deployment Checks
Assigning Custom Domains
Runtime Logs

View and debug runtime logs & errors

Observability

Monitor app health & performance

Speed Insights

Not Enabled
Performance metrics from real users

Web Analytics

Not Enabled
Analyze visitors & traffic in real-time

hoteldrops – Deployment Overview – Vercel

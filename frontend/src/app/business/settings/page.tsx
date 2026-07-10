'use client';

import { useState } from 'react';
import BusinessSidebarWrapper from '../BusinessSidebarWrapper';

export default function SettingsPage() {
  const [name, setName] = useState('Deepak Narula');
  const [email, setEmail] = useState('deepak.narula@grnconnect.com');
  const [company, setCompany] = useState('GRN Connect');

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [priceDropAlerts, setPriceDropAlerts] = useState(false);

  const [saved, setSaved] = useState(false);

  function handleSave() {
    // NOTE: This currently only updates local state — nothing is persisted
    // to a database yet. To make these settings actually save across
    // sessions, this needs a Supabase table (e.g. `user_settings`) and a
    // real save call here, similar to how the Reports page was connected.
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <BusinessSidebarWrapper>
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: '#0F172A' }}>
            Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your account, notifications, and integrations.</p>
        </div>

        <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">
          {/* PROFILE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="font-bold text-sm mb-1" style={{ fontFamily: 'Sora, sans-serif', color: '#0F172A' }}>
              Profile
            </p>
            <p className="text-xs text-slate-400 mb-5">Your account details, shown across the dashboard.</p>

            <div className="space-y-4">
              <Field label="Name" value={name} onChange={setName} />
              <Field label="Email" value={email} onChange={setEmail} type="email" />
              <Field label="Company" value={company} onChange={setCompany} />
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="font-bold text-sm mb-1" style={{ fontFamily: 'Sora, sans-serif', color: '#0F172A' }}>
              Notifications
            </p>
            <p className="text-xs text-slate-400 mb-5">Choose what you want to be notified about.</p>

            <div className="space-y-1">
              <Toggle
                label="Email alerts"
                sub="Get notified by email for important account activity."
                checked={emailAlerts}
                onChange={setEmailAlerts}
              />
              <Toggle
                label="Weekly digest"
                sub="A summary of the week's key numbers, every Monday."
                checked={weeklyDigest}
                onChange={setWeeklyDigest}
              />
              <Toggle
                label="Price drop alerts"
                sub="Notify me immediately when a significant price drop is caught."
                checked={priceDropAlerts}
                onChange={setPriceDropAlerts}
              />
            </div>
          </div>

          {/* INTEGRATIONS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="font-bold text-sm mb-1" style={{ fontFamily: 'Sora, sans-serif', color: '#0F172A' }}>
              Integrations
            </p>
            <p className="text-xs text-slate-400 mb-5">Connections powering your live data.</p>

            <div className="space-y-3">
              <IntegrationRow
                name="GRN API"
                status="Not Connected"
                statusColor="#DC2626"
                statusBg="#FEF2F2"
                detail="Pending API key access from GRN. Once live, Dashboard and Bookings will show real-time data."
              />
              <IntegrationRow
                name="Supabase"
                status="Connected"
                statusColor="#16A34A"
                statusBg="#F0FDF4"
                detail="Powering the Analytics page — GRN market data, updated as new batches are imported."
              />
            </div>
          </div>

          {/* SAVE */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity"
              style={{ background: '#1447b8' }}
            >
              Save changes
            </button>
            {saved && <span className="text-sm font-medium" style={{ color: '#16A34A' }}>Saved (locally — see note below)</span>}
          </div>

          <div className="rounded-xl p-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <p className="text-xs" style={{ color: '#92400E' }}>
              These settings currently save to this page only, not to a database — refreshing will reset them.
              Let your engineer know if you want these to persist permanently across sessions.
            </p>
          </div>
        </div>
      </div>
    </BusinessSidebarWrapper>
  );
}

function Field({
  label, value, onChange, type = 'text',
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
        style={{ color: '#0F172A' }}
      />
    </div>
  );
}

function Toggle({
  label, sub, checked, onChange,
}: { label: string; sub: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
      <div className="pr-6">
        <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="flex-shrink-0 w-11 h-6 rounded-full relative transition-colors"
        style={{ background: checked ? '#1447b8' : '#CBD5E1' }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  );
}

function IntegrationRow({
  name, status, statusColor, statusBg, detail,
}: { name: string; status: string; statusColor: string; statusBg: string; detail: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-b-0">
      <div>
        <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{name}</p>
        <p className="text-xs text-slate-400 mt-0.5 max-w-md">{detail}</p>
      </div>
      <span
        className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ color: statusColor, background: statusBg }}
      >
        {status}
      </span>
    </div>
  );
}

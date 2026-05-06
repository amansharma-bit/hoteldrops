'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, ArrowRight, X, Phone } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ExtractedData {
  hotel_name: string
  hotel_city: string
  check_in: string
  check_out: string
  room_type: string
  original_price: number
  num_adults: number
  num_rooms: number
}

export default function UploadPage() {
  const [file, setFile]           = useState<File | null>(null)
  const [step, setStep]           = useState<1|2|3>(1)
  const [loading, setLoading]     = useState(false)
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [phone, setPhone]         = useState('')
  const [email, setEmail]         = useState('')
  const [bookingId, setBookingId] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (f) {
      setFile(f)
      toast.success('Voucher uploaded! Click "Extract Details" to continue.')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  // Step 1 → 2: Extract details from voucher
  async function extractDetails() {
    if (!file) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('voucher', file)
      const res = await fetch('/api/bookings/extract', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExtracted(data.extracted)
      setStep(2)
      toast.success('Details extracted successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to read voucher. Please fill in details manually.')
      // Even on error, move to step 2 with empty form
      setExtracted({ hotel_name:'', hotel_city:'', check_in:'', check_out:'', room_type:'', original_price:0, num_adults:2, num_rooms:1 })
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  // Step 2 → 3: Submit booking for tracking
  async function submitBooking() {
    if (!extracted) return
    if (!phone || phone.length < 10) { toast.error('Please enter a valid WhatsApp number'); return }
    if (!email) { toast.error('Please enter your email'); return }
    if (!extracted.hotel_name) { toast.error('Hotel name is required'); return }
    if (!extracted.original_price || extracted.original_price <= 0) { toast.error('Please enter the price you paid'); return }

    setLoading(true)
    try {
      const formData = new FormData()
      if (file) formData.append('voucher', file)
      formData.append('data', JSON.stringify({ ...extracted, phone, email }))

      const res = await fetch('/api/bookings/create', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBookingId(data.bookingId)
      setStep(3)
      toast.success('Booking submitted! We\'re now tracking the price.')
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">HD</span>
          </div>
          <span className="font-extrabold text-xl text-gray-900">HotelDrops</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          View Dashboard →
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[
            { n: 1, label: 'Upload Voucher' },
            { n: 2, label: 'Confirm Details' },
            { n: 3, label: 'Tracking Started!' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 text-sm font-600 transition-colors ${step >= s.n ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-700 transition-colors ${step > s.n ? 'bg-green-500 text-white' : step === s.n ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </div>
              {i < 2 && <div className={`w-8 h-0.5 transition-colors ${step > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* ---- STEP 1: Upload ---- */}
        {step === 1 && (
          <div className="card animate-slide-up">
            <h1 className="text-2xl font-800 text-gray-900 mb-2">Upload your hotel voucher</h1>
            <p className="text-gray-500 text-sm mb-6">Upload your booking confirmation PDF or screenshot. We'll automatically read the details.</p>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              } ${file ? 'border-green-400 bg-green-50' : ''}`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  <div>
                    <p className="font-600 text-green-700">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(0)} KB · Ready to extract</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-600 text-gray-800">
                      {isDragActive ? 'Drop it here!' : 'Drag & drop your voucher'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">PDF, PNG, JPG up to 10MB</p>
                  </div>
                  <button className="btn-primary text-sm px-6 py-2.5">Browse file</button>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-start gap-2">
              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Works with Booking.com, MakeMyTrip, Expedia, Agoda, Yatra and most hotel confirmation emails. Your data is encrypted and never shared.
              </p>
            </div>

            <button
              onClick={extractDetails}
              disabled={!file || loading}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2 text-base py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Reading your voucher...
                </>
              ) : (
                <>
                  Extract Details
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ---- STEP 2: Confirm details ---- */}
        {step === 2 && extracted && (
          <div className="card animate-slide-up">
            <h1 className="text-2xl font-800 text-gray-900 mb-2">Confirm booking details</h1>
            <p className="text-gray-500 text-sm mb-6">We've read your voucher. Please verify and correct if needed.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-700 text-gray-500 uppercase tracking-wide block mb-1.5">Hotel Name *</label>
                  <input className="input-field" value={extracted.hotel_name} onChange={e => setExtracted({...extracted, hotel_name: e.target.value})} placeholder="e.g. Taj Mahal Palace" />
                </div>
                <div>
                  <label className="text-xs font-700 text-gray-500 uppercase tracking-wide block mb-1.5">City *</label>
                  <input className="input-field" value={extracted.hotel_city} onChange={e => setExtracted({...extracted, hotel_city: e.target.value})} placeholder="e.g. Mumbai" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-700 text-gray-500 uppercase tracking-wide block mb-1.5">Check-in *</label>
                  <input className="input-field" type="date" value={extracted.check_in} onChange={e => setExtracted({...extracted, check_in: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-700 text-gray-500 uppercase tracking-wide block mb-1.5">Check-out *</label>
                  <input className="input-field" type="date" value={extracted.check_out} onChange={e => setExtracted({...extracted, check_out: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-700 text-gray-500 uppercase tracking-wide block mb-1.5">Room Type</label>
                  <input className="input-field" value={extracted.room_type} onChange={e => setExtracted({...extracted, room_type: e.target.value})} placeholder="e.g. Deluxe Double" />
                </div>
                <div>
                  <label className="text-xs font-700 text-gray-500 uppercase tracking-wide block mb-1.5">Total Price Paid (₹) *</label>
                  <input className="input-field" type="number" value={extracted.original_price || ''} onChange={e => setExtracted({...extracted, original_price: parseFloat(e.target.value)})} placeholder="e.g. 18500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-700 text-gray-500 uppercase tracking-wide block mb-1.5">Adults</label>
                  <select className="input-field" value={extracted.num_adults} onChange={e => setExtracted({...extracted, num_adults: parseInt(e.target.value)})}>
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-700 text-gray-500 uppercase tracking-wide block mb-1.5">Rooms</label>
                  <select className="input-field" value={extracted.num_rooms} onChange={e => setExtracted({...extracted, num_rooms: parseInt(e.target.value)})}>
                    {[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-2">
                <p className="text-xs font-700 text-gray-500 uppercase tracking-wide mb-3">Alert Preferences</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-700 text-gray-500 uppercase tracking-wide block mb-1.5">
                      <Phone className="w-3 h-3 inline mr-1" />WhatsApp Number *
                    </label>
                    <div className="flex">
                      <span className="input-field w-16 rounded-r-none border-r-0 text-gray-500 bg-gray-100 flex items-center justify-center text-sm">+91</span>
                      <input className="input-field rounded-l-none flex-1" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" maxLength={10} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-700 text-gray-500 uppercase tracking-wide block mb-1.5">Email *</label>
                    <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="btn-secondary px-6">
                ← Back
              </button>
              <button
                onClick={submitBooking}
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3.5"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Starting tracker...
                  </>
                ) : (
                  <>
                    Start Tracking My Price
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ---- STEP 3: Success ---- */}
        {step === 3 && (
          <div className="card animate-slide-up text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-800 text-gray-900 mb-3">We're on it! 🎉</h1>
            <p className="text-gray-500 mb-2">Your booking is now being tracked 24/7.</p>
            <p className="text-sm text-gray-400 mb-8">
              We'll WhatsApp and email you the moment we find a lower price for <span className="font-600 text-gray-600">{extracted?.hotel_name}</span>.
            </p>

            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-600 text-green-800 mb-2">What happens next:</p>
              <div className="space-y-2">
                {[
                  'Bot checks the price every 6 hours',
                  'Price drops → you get a WhatsApp alert instantly',
                  'You reply YES → we handle the rebooking',
                  'You save money, we earn a small commission',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-green-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="btn-primary flex-1 flex items-center justify-center gap-2">
                View My Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/upload" className="btn-secondary flex-1 flex items-center justify-center gap-2"
                onClick={() => { setStep(1); setFile(null); setExtracted(null); }}>
                Track Another Booking
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

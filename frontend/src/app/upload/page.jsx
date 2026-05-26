'use client'

import { useState, useRef } from 'react'
import Alert from '@/components/Alert'
import ProcessingAlert from '@/components/ProcessingAlert'
import FieldError from '@/components/FieldError'
import { ALERTS } from '@/lib/alerts'

export default function VoucherUploadPage() {
  const [uploadState, setUploadState] = useState(null)
  const [extracted,   setExtracted]   = useState(null)
  const [manualMode,  setManualMode]  = useState(false)
  const [formData,    setFormData]    = useState({
    hotelName: '', city: '', checkinDate: '', checkoutDate: '',
    roomType: '', adults: 1, children: [], amountPaid: '',
    currency: 'INR', otaName: '', bookingRef: '',
    cancelPolicy: '', cancelDeadline: '', cancelPenalty: 0,
    whatsapp: '', email: '',
  })
  const [errors,   setErrors]   = useState({})
  const [baseRate, setBaseRate] = useState('')
  const [taxes,    setTaxes]    = useState('')
  const fileRef = useRef()

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowed.includes(file.type)) { setUploadState('wrong_file_type'); return }
    if (file.size > 10 * 1024 * 1024) { setUploadState('file_too_large'); return }
    setUploadState('processing')
    try {
      const fd = new FormData()
      fd.append('voucher', file)
      const res  = await fetch('/api/upload-voucher', { method: 'POST', body: fd })
      const data = await res.json()
      switch (data.status) {
        case 'success':
          setExtracted(data.booking)
          setFormData(prev => ({ ...prev, ...data.booking }))
          setUploadState('success')
          break
        case 'blurred':
        case 'unreadable':
          setUploadState('blurred')
          break
        case 'no_price':
          setExtracted(data.booking)
          setFormData(prev => ({ ...prev, ...data.booking }))
          setUploadState('no_price')
          break
        case 'pay_at_hotel':
          setExtracted(data.booking)
          setFormData(prev => ({ ...prev, ...data.booking }))
          setUploadState('pay_at_hotel')
          break
        case 'taxes_separate':
          setExtracted(data.booking)
          setBaseRate(data.baseRate)
          setTaxes(data.taxes)
          setFormData(prev => ({ ...prev, ...data.booking, amountPaid: String(data.total) }))
          setUploadState('taxes_separate')
          break
        case 'non_refundable':   setUploadState('non_refundable');  break
        case 'partial_refund':   setUploadState('partial_refund');  break
        case 'duplicate':        setUploadState('duplicate');       break
        case 'checkin_passed':   setUploadState('checkin_passed');  break
        case 'too_far_out':
          setExtracted(data.booking)
          setFormData(prev => ({ ...prev, ...data.booking }))
          setUploadState('too_far_out')
          break
        case 'within_24h':
          setExtracted(data.booking)
          setFormData(prev => ({ ...prev, ...data.booking }))
          setUploadState('within_24h')
          break
        case 'hotel_not_found':
          setExtracted(data.booking)
          setFormData(prev => ({ ...prev, ...data.booking }))
          setUploadState('hotel_not_found')
          break
        default: setUploadState('error')
      }
    } catch (err) {
      console.error(err)
      setUploadState('error')
    }
  }

  function validate() {
    const errs = {}
    if (!formData.hotelName.trim())  errs.hotelName   = ALERTS.FIELD_ERRORS.HOTEL_NAME
    if (!formData.city.trim())       errs.city        = ALERTS.FIELD_ERRORS.CITY
    if (!formData.checkinDate)       errs.checkinDate = ALERTS.FIELD_ERRORS.CHECKIN_REQUIRED
    if (!formData.checkoutDate)      errs.checkoutDate= ALERTS.FIELD_ERRORS.CHECKOUT
    if (!formData.roomType.trim())   errs.roomType    = ALERTS.FIELD_ERRORS.ROOM_TYPE
    if (!formData.adults || formData.adults < 1) errs.adults = ALERTS.FIELD_ERRORS.ADULTS
    if (!formData.amountPaid)        errs.amountPaid  = ALERTS.FIELD_ERRORS.AMOUNT_REQUIRED
    if (isNaN(Number(formData.amountPaid))) errs.amountPaid = ALERTS.FIELD_ERRORS.AMOUNT_INVALID
    if (!formData.currency)          errs.currency    = ALERTS.FIELD_ERRORS.CURRENCY
    if (!formData.cancelPolicy)      errs.cancelPolicy= ALERTS.FIELD_ERRORS.CANCEL_POLICY
    if (!formData.whatsapp)          errs.whatsapp    = ALERTS.FIELD_ERRORS.WHATSAPP
    if (!formData.email)             errs.email       = ALERTS.FIELD_ERRORS.EMAIL
    if (formData.checkinDate) {
      const today = new Date(); today.setHours(0,0,0,0)
      if (new Date(formData.checkinDate) < today) errs.checkinDate = ALERTS.FIELD_ERRORS.CHECKIN_PAST
    }
    if (formData.checkinDate && formData.checkoutDate) {
      if (new Date(formData.checkoutDate) <= new Date(formData.checkinDate))
        errs.checkoutDate = ALERTS.FIELD_ERRORS.CHECKOUT
    }
    if (formData.cancelPolicy === 'free' && !formData.cancelDeadline)
      errs.cancelDeadline = ALERTS.FIELD_ERRORS.CANCEL_DEADLINE
    if (formData.cancelDeadline && formData.checkinDate) {
      if (new Date(formData.cancelDeadline) >= new Date(formData.checkinDate))
        errs.cancelDeadline = ALERTS.FIELD_ERRORS.CANCEL_DEADLINE_DATE
    }
    const childAges = formData.children || []
    if (childAges.some(age => age === '' || age === null))
      errs.children = ALERTS.FIELD_ERRORS.CHILDREN_AGES
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    try {
      const res  = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        window.location.href = `/dashboard/booking/${data.bookingId}`
      } else {
        setUploadState('error')
      }
    } catch { setUploadState('error') }
  }

  function addChild() {
    setFormData(prev => ({ ...prev, children: [...(prev.children||[]), ''] }))
  }
  function updateChildAge(idx, val) {
    const ages = [...(formData.children||[])]; ages[idx] = val
    setFormData(prev => ({ ...prev, children: ages }))
  }
  function removeChild(idx) {
    setFormData(prev => ({ ...prev, children: (prev.children||[]).filter((_,i) => i !== idx) }))
  }
  function field(key, val) {
    setFormData(prev => ({ ...prev, [key]: val }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload your hotel voucher</h1>
      <p className="text-gray-500 text-sm mb-8">Upload your confirmation and we'll start monitoring the price.</p>

      {!manualMode && uploadState !== 'success' && (
        <div
          className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center mb-6 cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
          <div className="text-4xl mb-3">📎</div>
          <p className="font-semibold text-gray-700 mb-1">Drop your voucher here or tap to upload</p>
          <p className="text-sm text-gray-400">PDF, JPG or PNG — max 10MB</p>
        </div>
      )}

      <div className="mb-6 space-y-3">
        {uploadState === 'processing' && <ProcessingAlert />}
        {uploadState === 'success' && <Alert {...ALERTS.VOUCHER.SUCCESS} actions={[{ label: 'Review details →', onClick: () => {} }]} />}
        {uploadState === 'blurred' && <Alert {...ALERTS.VOUCHER.BLURRED} actions={[
          { label: 'Try again', onClick: () => { setUploadState(null); fileRef.current?.click() } },
          { label: 'Enter manually', variant: 'secondary', onClick: () => setManualMode(true) },
        ]} />}
        {uploadState === 'no_price' && <Alert {...ALERTS.VOUCHER.NO_PRICE} actions={[{ label: 'Add amount →', onClick: () => setManualMode(true) }]} />}
        {uploadState === 'pay_at_hotel' && <Alert {...ALERTS.VOUCHER.PAY_AT_HOTEL} actions={[{ label: 'Add expected amount →', onClick: () => setManualMode(true) }]} />}
        {uploadState === 'taxes_separate' && <Alert {...ALERTS.VOUCHER.TAXES_SEPARATE}
          sub={`Base rate: ${formData.currency} ${baseRate}  +  Taxes: ${formData.currency} ${taxes}  =  Total: ${formData.currency} ${Number(baseRate)+Number(taxes)}`}
          actions={[
            { label: 'Confirm total →', onClick: () => setUploadState('success') },
            { label: 'Edit amount', variant: 'secondary', onClick: () => setManualMode(true) },
          ]} />}
        {uploadState === 'non_refundable' && <Alert {...ALERTS.VOUCHER.NON_REFUNDABLE} actions={[{ label: 'Upload a different booking', variant: 'secondary', onClick: () => { setUploadState(null); fileRef.current?.click() } }]} />}
        {uploadState === 'partial_refund' && <Alert {...ALERTS.VOUCHER.PARTIAL_REFUND} actions={[{ label: 'Contact support', variant: 'secondary', onClick: () => window.location.href='mailto:help@rebuq.com' }]} />}
        {uploadState === 'duplicate' && <Alert {...ALERTS.VOUCHER.DUPLICATE} actions={[{ label: 'View existing booking →', onClick: () => window.location.href='/dashboard' }]} />}
        {uploadState === 'checkin_passed' && <Alert {...ALERTS.VOUCHER.CHECKIN_PASSED} actions={[{ label: 'Upload a new booking →', onClick: () => setUploadState(null) }]} />}
        {uploadState === 'too_far_out' && <Alert {...ALERTS.VOUCHER.TOO_FAR_OUT} />}
        {uploadState === 'within_24h' && <Alert {...ALERTS.VOUCHER.WITHIN_24H} />}
        {uploadState === 'hotel_not_found' && <Alert {...ALERTS.VOUCHER.HOTEL_NOT_FOUND} />}
        {uploadState === 'wrong_file_type' && <Alert {...ALERTS.VOUCHER.WRONG_FILE_TYPE} actions={[
          { label: 'Upload again', onClick: () => { setUploadState(null); fileRef.current?.click() } },
          { label: 'Enter manually', variant: 'secondary', onClick: () => setManualMode(true) },
        ]} />}
        {uploadState === 'file_too_large' && <Alert {...ALERTS.VOUCHER.FILE_TOO_LARGE} actions={[{ label: 'Upload again', onClick: () => { setUploadState(null); fileRef.current?.click() } }]} />}
        {uploadState === 'error' && <Alert {...ALERTS.SYSTEM.GENERIC_ERROR} actions={[
          { label: 'Try again', onClick: () => setUploadState(null) },
          { label: 'Contact support', variant: 'ghost', onClick: () => window.location.href='mailto:help@rebuq.com' },
        ]} />}
      </div>

      {(manualMode || uploadState === 'success' || uploadState === 'too_far_out' || uploadState === 'within_24h' || uploadState === 'hotel_not_found') && (
        <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 text-base">Booking details</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Hotel name *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={formData.hotelName} onChange={e=>field('hotelName',e.target.value)} placeholder="e.g. Atlantis The Palm" />
            <FieldError message={errors.hotelName} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">City / Country *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={formData.city} onChange={e=>field('city',e.target.value)} placeholder="e.g. Dubai, UAE" />
            <FieldError message={errors.city} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Check-in *</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={formData.checkinDate} onChange={e=>field('checkinDate',e.target.value)} />
              <FieldError message={errors.checkinDate} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Check-out *</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={formData.checkoutDate} onChange={e=>field('checkoutDate',e.target.value)} />
              <FieldError message={errors.checkoutDate} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Room type *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={formData.roomType} onChange={e=>field('roomType',e.target.value)} placeholder="e.g. Deluxe Ocean View" />
            <FieldError message={errors.roomType} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Number of adults *</label>
            <input type="number" min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={formData.adults} onChange={e=>field('adults',Number(e.target.value))} />
            <FieldError message={errors.adults} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Children</label>
            {(formData.children||[]).map((age,i)=>(
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input type="number" min="0" max="17" placeholder="Age" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24" value={age} onChange={e=>updateChildAge(i,e.target.value)} />
                <span className="text-xs text-gray-400">years old</span>
                <button type="button" onClick={()=>removeChild(i)} className="text-red-400 text-sm hover:text-red-600">Remove</button>
              </div>
            ))}
            <FieldError message={errors.children} />
            <button type="button" onClick={addChild} className="text-blue-600 text-sm font-medium mt-1">+ Add child</button>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Amount paid *</label>
            <div className="flex gap-2">
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-28" value={formData.currency} onChange={e=>field('currency',e.target.value)}>
                {['INR','USD','AED','GBP','EUR','SGD','THB','IDR','MYR','JPY','AUD','CAD','HKD'].map(c=>(
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input type="number" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={formData.amountPaid} onChange={e=>field('amountPaid',e.target.value)} placeholder="40000" />
            </div>
            <FieldError message={errors.amountPaid} />
            <FieldError message={errors.currency} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Booked on</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={formData.otaName} onChange={e=>field('otaName',e.target.value)}>
                <option value="">Select OTA</option>
                {['MakeMyTrip','Booking.com','Expedia','Goibibo','Agoda','Hotels.com','Cleartrip','EaseMyTrip','Other'].map(o=>(
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Booking reference</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={formData.bookingRef} onChange={e=>field('bookingRef',e.target.value)} placeholder="e.g. MMT123456" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Cancellation policy *</label>
            <div className="flex flex-wrap gap-2">
              {[['free','✅ Free cancellation'],['partial','⚠️ Partial refund'],['non_refundable','✕ Non-refundable'],['not_sure','? Not sure']].map(([val,label])=>(
                <button key={val} type="button"
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${formData.cancelPolicy===val?'bg-blue-700 text-white border-blue-700':'bg-white text-gray-700 border-gray-200 hover:border-blue-400'}`}
                  onClick={()=>field('cancelPolicy',val)}>{label}</button>
              ))}
            </div>
            <FieldError message={errors.cancelPolicy} />
          </div>
          {formData.cancelPolicy === 'free' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Free cancellation deadline *</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={formData.cancelDeadline} onChange={e=>field('cancelDeadline',e.target.value)} />
              <FieldError message={errors.cancelDeadline} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">WhatsApp number *</label>
              <div className="flex">
                <span className="border border-r-0 border-gray-200 rounded-l-lg px-3 py-2 text-sm text-gray-400 bg-gray-50">+91</span>
                <input type="tel" className="flex-1 border border-gray-200 rounded-r-lg px-3 py-2 text-sm" value={formData.whatsapp} onChange={e=>field('whatsapp',e.target.value)} placeholder="9876543210" />
              </div>
              <FieldError message={errors.whatsapp} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
              <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={formData.email} onChange={e=>field('email',e.target.value)} placeholder="you@email.com" />
              <FieldError message={errors.email} />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm hover:bg-blue-800 transition-colors">
            Start tracking my price →
          </button>
        </form>
      )}
    </div>
  )
}

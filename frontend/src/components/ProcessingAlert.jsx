// components/ProcessingAlert.jsx
// Shown during OCR / file processing

export default function ProcessingAlert({ message = "Analysing your voucher...", sub = "This usually takes a few seconds." }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-700 rounded-full animate-spin flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-blue-900">{message}</p>
        {sub && <p className="text-xs text-blue-700 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

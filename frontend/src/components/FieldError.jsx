// components/FieldError.jsx
// Inline field-level validation error
// Usage: <FieldError message="Please enter a valid email." />

export default function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1 font-medium">
      <span>⚠</span>
      <span>{message}</span>
    </p>
  )
}

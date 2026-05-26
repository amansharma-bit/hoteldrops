// components/Alert.jsx
// Reusable alert component for all rebuq UI messages
// Usage: <Alert type="warning" title="..." body="..." badge="..." actions={[...]} />

export default function Alert({ type = 'info', icon, title, body, sub, badge, actions = [], className = '' }) {
  const variants = {
    success: {
      wrapper: 'bg-green-50 border border-green-200',
      title:   'text-green-900',
      body:    'text-green-800',
      sub:     'text-green-700',
      badge:   'bg-green-700 text-white',
      icon:    icon || '✅',
    },
    warning: {
      wrapper: 'bg-amber-50 border border-amber-200',
      title:   'text-amber-900',
      body:    'text-amber-800',
      sub:     'text-amber-700',
      badge:   'bg-amber-700 text-white',
      icon:    icon || '⚠️',
    },
    error: {
      wrapper: 'bg-red-50 border border-red-200',
      title:   'text-red-900',
      body:    'text-red-800',
      sub:     'text-red-700',
      badge:   'bg-red-700 text-white',
      icon:    icon || '✕',
    },
    info: {
      wrapper: 'bg-blue-50 border border-blue-200',
      title:   'text-blue-900',
      body:    'text-blue-800',
      sub:     'text-blue-700',
      badge:   'bg-blue-700 text-white',
      icon:    icon || 'ℹ️',
    },
    neutral: {
      wrapper: 'bg-gray-100 border border-gray-200',
      title:   'text-gray-900',
      body:    'text-gray-700',
      sub:     'text-gray-500',
      badge:   'bg-gray-600 text-white',
      icon:    icon || '•',
    },
  }

  const v = variants[type] || variants.info

  return (
    <div className={`relative rounded-xl p-4 flex gap-3 items-start ${v.wrapper} ${className}`}>
      <span className="text-xl flex-shrink-0 mt-0.5 w-7 text-center">{v.icon}</span>
      <div className="flex-1 min-w-0">
        {badge && (
          <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${v.badge}`}>
            {badge}
          </span>
        )}
        {title && <p className={`font-semibold text-sm mb-1 ${v.title}`}>{title}</p>}
        {body && <p className={`text-sm leading-relaxed ${v.body}`}>{body}</p>}
        {sub && <p className={`text-xs mt-1.5 leading-relaxed ${v.sub}`}>{sub}</p>}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {actions.map((action, i) => (
              <button key={i} onClick={action.onClick}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 ${
                  action.variant === 'secondary' ? 'bg-white border border-gray-200 text-gray-700'
                  : action.variant === 'ghost' ? 'bg-transparent border border-current text-blue-700'
                  : 'bg-blue-700 text-white'
                }`}>
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

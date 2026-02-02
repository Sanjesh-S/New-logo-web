'use client'

import { useState, useCallback } from 'react'

export type TextQuestionValidation = 'imei' | 'serial' | 'none'

function validateImei(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return 'Enter IMEI number'
  if (digits.length !== 15) return 'IMEI must be exactly 15 digits'
  return null
}

function validateSerial(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length === 0) return 'Enter serial number'
  if (trimmed.length < 4) return 'Serial number must be at least 4 characters'
  if (trimmed.length > 30) return 'Serial number must be 30 characters or less'
  if (!/^[a-zA-Z0-9\-]+$/.test(trimmed)) return 'Use only letters, numbers, and hyphens'
  return null
}

interface TextQuestionProps {
  question: string
  helperText?: string
  questionId: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  validation?: TextQuestionValidation
  maxLength?: number
}

export default function TextQuestion({
  question,
  helperText,
  questionId,
  value = '',
  onChange,
  placeholder = '',
  validation = 'none',
  maxLength = 50,
}: TextQuestionProps) {
  const [touched, setTouched] = useState(false)

  const getError = useCallback((): string | null => {
    if (!value.trim()) return touched ? (validation === 'imei' ? 'Enter IMEI number' : 'Enter serial number') : null
    if (validation === 'imei') return validateImei(value)
    if (validation === 'serial') return validateSerial(value)
    return null
  }, [value, validation, touched])

  const error = getError()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (validation === 'imei') {
      // Allow only digits, spaces, dashes while typing; store digits only for submission
      const digits = v.replace(/\D/g, '')
      onChange(digits.slice(0, 15))
    } else {
      onChange(v)
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <label htmlFor={questionId} className="block text-lg font-semibold text-brand-blue-900 mb-1">
          {question}
        </label>
        {helperText && (
          <p className="text-sm text-gray-600 mb-2">{helperText}</p>
        )}
      </div>
      <input
        id={questionId}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        maxLength={validation === 'imei' ? 15 : maxLength}
        inputMode={validation === 'imei' ? 'numeric' : 'text'}
        autoComplete="off"
        className={`w-full py-3 px-4 rounded-xl border-2 text-brand-blue-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-lime/30 transition-all ${
          error ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-brand-lime'
        }`}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

export { validateImei, validateSerial }

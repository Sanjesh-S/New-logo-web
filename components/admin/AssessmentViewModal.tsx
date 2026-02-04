'use client'

import { Fragment, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { ASSESSMENT_GROUPS, getAssessmentLabel, formatAnswerValue } from '@/lib/utils/assessmentLabels'
import { getValuation } from '@/lib/firebase/database'

interface AssessmentViewModalProps {
  isOpen: boolean
  onClose: () => void
  assessmentAnswers: Record<string, unknown> | null | undefined
  /** When pickup has no assessment data, fetch from linked valuation by ID */
  valuationId?: string | null
  orderId?: string
  productName?: string
}

export default function AssessmentViewModal({
  isOpen,
  onClose,
  assessmentAnswers,
  valuationId,
  orderId,
  productName,
}: AssessmentViewModalProps) {
  const [fetchedFromValuation, setFetchedFromValuation] = useState<Record<string, unknown> | null>(null)
  const [loadingValuation, setLoadingValuation] = useState(false)

  const hasPickupAnswers = assessmentAnswers && Object.keys(assessmentAnswers).length > 0
  // Merge pickup answers with valuation answers (valuation takes precedence for completeness)
  const answers = { ...(fetchedFromValuation || {}), ...(assessmentAnswers || {}) }
  const keys = Object.keys(answers).filter((k) => answers[k] != null && answers[k] !== '')

  useEffect(() => {
    if (!isOpen) {
      setFetchedFromValuation(null)
      return
    }
    // Always try to fetch from valuation if valuationId exists, even if we have some pickup answers
    // This ensures we get the most complete assessment data
    if (!valuationId) {
      setFetchedFromValuation(null)
      return
    }
    let cancelled = false
    setLoadingValuation(true)
    setFetchedFromValuation(null)
    getValuation(valuationId)
      .then((valuation) => {
        if (cancelled) return
        const valAnswers = (valuation as any)?.answers
        if (valAnswers && typeof valAnswers === 'object' && Object.keys(valAnswers).length > 0) {
          setFetchedFromValuation(valAnswers as Record<string, unknown>)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingValuation(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, valuationId])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true" role="dialog">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Assessment details</h2>
                {orderId && <p className="text-sm text-gray-500 font-mono mt-0.5">{orderId}</p>}
                {productName && <p className="text-sm text-gray-600 mt-0.5">{productName}</p>}
                {fetchedFromValuation && keys.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {hasPickupAnswers ? 'Includes data from linked valuation' : 'Loaded from linked valuation'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
              {loadingValuation ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-blue-200 border-t-brand-blue-600" />
                  <span className="ml-3 text-sm text-gray-500">Loading assessment from valuation…</span>
                </div>
              ) : keys.length === 0 ? (
                <p className="text-gray-500 text-sm">No assessment data for this request.</p>
              ) : (
                <dl className="space-y-6">
                  {Object.entries(ASSESSMENT_GROUPS).map(([groupName, groupKeys]) => {
                    const present = groupKeys.filter((k) => keys.includes(k))
                    if (present.length === 0) return null
                    return (
                      <Fragment key={groupName}>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-brand-blue-600 border-b border-gray-100 pb-1">
                          {groupName}
                        </dt>
                        <dd className="space-y-2">
                          {present.map((key) => (
                            <div key={key} className="flex justify-between gap-4 text-sm">
                              <span className="text-gray-600">{getAssessmentLabel(key)}</span>
                              <span className="font-medium text-gray-900 text-right max-w-[60%]">
                                {formatAnswerValue(answers[key])}
                              </span>
                            </div>
                          ))}
                        </dd>
                      </Fragment>
                    )
                  })}
                  {/* Any keys not in groups */}
                  {(() => {
                    const grouped = Object.values(ASSESSMENT_GROUPS).flat()
                    const other = keys.filter((k) => !grouped.includes(k))
                    if (other.length === 0) return null
                    return (
                      <>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-brand-blue-600 border-b border-gray-100 pb-1">
                          Other
                        </dt>
                        <dd className="space-y-2">
                          {other.map((key) => (
                            <div key={key} className="flex justify-between gap-4 text-sm">
                              <span className="text-gray-600">{getAssessmentLabel(key)}</span>
                              <span className="font-medium text-gray-900 text-right max-w-[60%]">
                                {formatAnswerValue(answers[key])}
                              </span>
                            </div>
                          ))}
                        </dd>
                      </>
                    )
                  })()}
                </dl>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

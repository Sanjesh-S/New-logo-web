'use client'

import { ReactElement, cloneElement } from 'react'
import YesNoQuestion from './YesNoQuestion'

interface YesNoQuestionProps {
  question: string
  helperText?: string
  questionId: string
  value?: string
  onChange: (value: string) => void
  index?: number
}

interface YesNoQuestionGroupProps {
  children: ReactElement<YesNoQuestionProps>[]
}

/**
 * Wrapper component that adds staggered animations to multiple YesNoQuestion components
 */
export default function YesNoQuestionGroup({ children }: YesNoQuestionGroupProps) {
  return (
    <div className="space-y-6">
      {children.map((child, index) =>
        cloneElement(child, { key: child.props.questionId, index })
      )}
    </div>
  )
}

'use client'

import { ReactElement, cloneElement } from 'react'
import YesNoQuestion from './YesNoQuestion'

interface YesNoQuestionGroupProps {
  children: ReactElement<typeof YesNoQuestion>[]
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

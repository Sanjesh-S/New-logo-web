import { useEffect, useRef } from 'react'

/**
 * Hook to trap focus within a modal or dialog
 * @param isActive - Whether the focus trap should be active
 * @param containerRef - Ref to the container element that should trap focus
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement>) {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ')

      return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => {
          // Filter out hidden elements
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && style.visibility !== 'hidden'
        }
      )
    }

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return

    // Focus the first element
    const firstElement = focusableElements[0]
    firstElement.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)

      if (e.shiftKey) {
        // Shift + Tab: move to previous element
        if (currentIndex === 0) {
          e.preventDefault()
          focusableElements[focusableElements.length - 1].focus()
        }
      } else {
        // Tab: move to next element
        if (currentIndex === focusableElements.length - 1) {
          e.preventDefault()
          focusableElements[0].focus()
        }
      }
    }

    // Handle Escape key to close modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Find close button and click it
        const closeButton = container.querySelector<HTMLButtonElement>('[aria-label*="close" i], [aria-label*="Close" i]')
        if (closeButton) {
          closeButton.click()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleEscape)

      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [isActive, containerRef])
}

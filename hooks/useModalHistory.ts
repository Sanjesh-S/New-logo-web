import { useEffect, useRef } from 'react'

/**
 * Hook to manage browser history for modals
 * When a modal opens, it pushes a history state
 * When browser back button is pressed, it closes the modal
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Function to call when modal should close (via browser back)
 * @param modalId - Unique identifier for the modal (used in URL hash)
 */
export function useModalHistory(isOpen: boolean, onClose: () => void, modalId: string = 'modal') {
  const historyPushedRef = useRef(false)
  const isInitialMountRef = useRef(true)
  const onCloseRef = useRef(onClose)

  // Keep onClose ref updated
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    // Skip on initial mount to avoid pushing history on page load
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      if (isOpen) {
        // If modal is already open on mount, push history
        const currentUrl = window.location.href
        const urlWithHash = `${currentUrl.split('#')[0]}#${modalId}`
        window.history.pushState({ modal: modalId }, '', urlWithHash)
        historyPushedRef.current = true
      }
      return
    }

    if (isOpen && !historyPushedRef.current) {
      // Push a new history state when modal opens
      const currentUrl = window.location.href
      const urlWithHash = `${currentUrl.split('#')[0]}#${modalId}`
      window.history.pushState({ modal: modalId }, '', urlWithHash)
      historyPushedRef.current = true
    } else if (!isOpen && historyPushedRef.current) {
      // Remove hash from URL when modal closes programmatically
      const currentUrl = window.location.href
      const urlWithoutHash = currentUrl.split('#')[0]
      if (window.location.hash === `#${modalId}`) {
        window.history.replaceState(null, '', urlWithoutHash)
      }
      historyPushedRef.current = false
    }
  }, [isOpen, modalId])

  useEffect(() => {
    // Handle browser back/forward button
    const handlePopState = (event: PopStateEvent) => {
      // Check if we had pushed a history state for this modal
      if (historyPushedRef.current) {
        const currentHash = window.location.hash
        // If hash is removed or changed, close the modal
        if (currentHash !== `#${modalId}`) {
          historyPushedRef.current = false
          onCloseRef.current()
        }
      }
    }

    // Handle hash change (when user manually changes URL hash)
    const handleHashChange = () => {
      if (isOpen && historyPushedRef.current) {
        const currentHash = window.location.hash
        if (currentHash !== `#${modalId}`) {
          historyPushedRef.current = false
          onCloseRef.current()
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [isOpen, modalId])
}

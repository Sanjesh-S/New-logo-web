'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { User, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/lib/firebase/auth'
import { getAssetPath } from '@/lib/utils'
import OTPLogin from './OTPLogin'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/#trade-in', label: 'Trade In' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#faq', label: 'FAQ' },
]

const STAFF_PORTALS: Record<string, { label: string; path: string }> = {
  superadmin: { label: 'Admin Panel', path: '/admin/products' },
  manager: { label: 'Admin Panel', path: '/admin/products' },
  qc_team: { label: 'QC Dashboard', path: '/qc' },
  showroom_staff: { label: 'Showroom Portal', path: '/showroom' },
  pickup_agent: { label: 'Pickup Portal', path: '/pickup-agent' },
}

export default function Navigation() {
  const { user, isAuthenticated } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [staffRole, setStaffRole] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const checkStaffRole = useCallback(async () => {
    if (!user) { setStaffRole(null); return }
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/auth/staff-sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.synced && data.isActive) {
          setStaffRole(data.role)
          return
        }
      }
    } catch {}
    setStaffRole(null)
  }, [user])

  useEffect(() => {
    if (isAuthenticated) {
      checkStaffRole()
    } else {
      setStaffRole(null)
    }
  }, [isAuthenticated, checkStaffRole])

  const handleLogout = async () => {
    try {
      await signOut()
      setShowUserMenu(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Shared handler for anchor link navigation
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, closeMobileMenu = false) => {
    e.preventDefault()
    if (closeMobileMenu) {
      setMobileMenuOpen(false)
    }
    
    const anchorId = href.split('#')[1]
    
    if (pathname === '/') {
      // On homepage, just scroll to the element
      const element = document.getElementById(anchorId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      // On other pages, navigate to homepage with anchor
      startTransition(() => {
        router.push(href)
      })
    }
  }

  // Render navigation link (shared logic for desktop and mobile)
  const renderNavLink = (link: typeof navLinks[0], isMobile = false) => {
    const isAnchorLink = link.href.includes('#')
    const baseClasses = isMobile
      ? "block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors text-base"
      : "text-gray-700 hover:text-brand-blue-900 transition-colors font-medium text-[15px] md:text-base"
    
    if (isAnchorLink) {
      return (
        <a
          key={link.href}
          href={link.href}
          onClick={(e) => handleAnchorClick(e, link.href, isMobile)}
          className={`${baseClasses} cursor-pointer`}
        >
          {link.label}
        </a>
      )
    }
    
    return (
      <Link
        key={link.href}
        href={link.href}
        prefetch={true}
        onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
        className={baseClasses}
      >
        {link.label}
      </Link>
    )
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20 md:h-24">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <img
                src={getAssetPath("/images/worthyten-logo.svg")}
                alt="WorthyTen"
                className="h-[3.75rem] sm:h-[4.25rem] md:h-[4.5rem] lg:h-[5.25rem] xl:h-[6rem] w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => renderNavLink(link, false))}

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>{user?.phoneNumber?.slice(-4) || 'User'}</span>
                  </button>

                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
                    >
                      <div className="p-2">
                        <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200">
                          {user?.phoneNumber}
                        </div>
                        {staffRole && STAFF_PORTALS[staffRole] && (
                          <Link
                            href={STAFF_PORTALS[staffRole].path}
                            onClick={() => setShowUserMenu(false)}
                            className="block w-full px-4 py-2 text-left text-sm text-brand-blue-900 font-medium hover:bg-blue-50 flex items-center gap-2 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            {STAFF_PORTALS[staffRole].label}
                          </Link>
                        )}
                        <Link
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="px-6 py-2.5 bg-brand-lime text-white rounded-lg font-semibold hover:bg-brand-lime-500 transition-all shadow-md hover:shadow-lg"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => renderNavLink(link, true))}

                <div className="pt-2 border-t border-gray-200">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="px-4 py-2 text-sm text-gray-600">
                        Logged in as {user?.phoneNumber}
                      </div>
                      {staffRole && STAFF_PORTALS[staffRole] && (
                        <Link
                          href={STAFF_PORTALS[staffRole].path}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full px-4 py-3 text-left text-brand-blue-900 hover:bg-blue-50 rounded-lg flex items-center gap-2 font-semibold"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          {STAFF_PORTALS[staffRole].label}
                        </Link>
                      )}
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 font-medium"
                      >
                        <User className="w-5 h-5" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                        className="w-full px-4 py-3 text-left text-red-600 hover:bg-gray-50 rounded-lg flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowLogin(true)
                        setMobileMenuOpen(false)
                      }}
                      className="w-full px-4 py-3 bg-brand-lime text-white rounded-lg font-semibold text-center"
                    >
                      Login
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {showLogin && (
        <OTPLogin
          onSuccess={() => {
            setShowLogin(false)
          }}
          onClose={() => setShowLogin(false)}
        />
      )}
    </>
  )
}

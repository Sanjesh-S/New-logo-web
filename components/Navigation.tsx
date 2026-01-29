'use client'

import { useState } from 'react'
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

export default function Navigation() {
  const { user, isAuthenticated } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      setShowUserMenu(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img
                src={getAssetPath("/images/worthyten-logo.svg")}
                alt="WorthyTen"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isAnchorLink = link.href.includes('#')
                const anchorId = isAnchorLink ? link.href.split('#')[1] : null
                
                if (isAnchorLink) {
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault()
                        // If we're on the homepage, just scroll
                        if (pathname === '/') {
                          const element = document.getElementById(anchorId!)
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        } else {
                          // Navigate to homepage with anchor
                          router.push(link.href)
                        }
                      }}
                      className="text-gray-700 hover:text-brand-blue-900 transition-colors font-medium cursor-pointer"
                    >
                      {link.label}
                    </a>
                  )
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-700 hover:text-brand-blue-900 transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                )
              })}

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
                  className="px-6 py-2.5 bg-brand-lime text-brand-blue-900 rounded-lg font-semibold hover:bg-brand-lime-400 transition-all shadow-md hover:shadow-lg"
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
                {navLinks.map((link) => {
                  const isAnchorLink = link.href.includes('#')
                  const anchorId = isAnchorLink ? link.href.split('#')[1] : null
                  
                  if (isAnchorLink) {
                    return (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={(e) => {
                          e.preventDefault()
                          setMobileMenuOpen(false)
                          // If we're on the homepage, just scroll
                          if (pathname === '/') {
                            const element = document.getElementById(anchorId!)
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                          } else {
                            // Navigate to homepage with anchor
                            router.push(link.href)
                          }
                        }}
                        className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors cursor-pointer"
                      >
                        {link.label}
                      </a>
                    )
                  }
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                    >
                      {link.label}
                    </Link>
                  )
                })}

                <div className="pt-2 border-t border-gray-200">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="px-4 py-2 text-sm text-gray-600">
                        Logged in as {user?.phoneNumber}
                      </div>
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
                      className="w-full px-4 py-3 bg-brand-lime text-brand-blue-900 rounded-lg font-semibold text-center"
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

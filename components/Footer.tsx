'use client'

import Link from 'next/link'
import { Phone, Mail, MapPin, Instagram, Facebook, MessageCircle } from 'lucide-react'
import { getAssetPath } from '@/lib/utils'

const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '#trade-in', label: 'Trade In' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#faq', label: 'FAQ' },
]

const categories = [
    { href: '/brands?category=cameras', label: 'Cameras & DSLR' },
    { href: '/brands?category=phones', label: 'Phones' },
    { href: '/brands?category=laptops', label: 'Laptops' },
    { href: '/brands?category=tablets', label: 'Tablets' },
]

const policies = [
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms-conditions', label: 'Terms & Conditions' },
    { href: '/warranty', label: 'Warranty Policy' },
    { href: '/return-refund-cancellation-policy', label: 'Return / Refund / Cancellation Policy' },
]

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-white text-gray-900">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8">
                    {/* Company Info */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="inline-block mb-4">
                            <img
                                src={getAssetPath("/images/worthyten-logo-footer.png")}
                                alt="WorthyTen"
                                className="h-32 w-auto object-contain max-w-[280px]"
                            />
                        </Link>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                            India's Trusted Platform for Trading your Cameras, Phones, and Gadgets. Get Instant Pickup and Same day Payment.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            <a
                                href="https://api.whatsapp.com/send/?phone=919843010705"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-100 hover:bg-brand-blue-900 rounded-lg flex items-center justify-center transition-colors"
                                aria-label="WhatsApp"
                            >
                                <MessageCircle className="w-5 h-5 text-blue-600 hover:text-green-600 transition-colors" />
                            </a>
                            <a
                                href="https://www.instagram.com/worthytenofficial/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-100 hover:bg-brand-blue-900 rounded-lg flex items-center justify-center transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5 text-blue-600 hover:text-green-600 transition-colors" />
                            </a>
                            <a
                                href="https://facebook.com/worthyten"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-100 hover:bg-brand-blue-900 rounded-lg flex items-center justify-center transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-5 h-5 text-blue-600 hover:text-green-600 transition-colors" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-brand-blue-900">Quick Links</h3>
                        <ul className="space-y-2">
                            {quickLinks.map((link) => {
                                if (link.href.startsWith('#')) {
                                    return (
                                        <li key={link.href}>
                                            <a
                                                href={link.href}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    const element = document.querySelector(link.href)
                                                    if (element) {
                                                        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                                    }
                                                }}
                                                className="text-gray-600 hover:text-brand-blue-900 transition-colors text-sm cursor-pointer"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    )
                                }
                                return (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-gray-600 hover:text-brand-blue-900 transition-colors text-sm"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-brand-blue-900">Categories</h3>
                        <ul className="space-y-2">
                            {categories.map((link, index) => {
                                if (link.href.startsWith('#')) {
                                    return (
                                        <li key={`category-${index}-${link.label}`}>
                                            <a
                                                href={link.href}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    const element = document.querySelector(link.href)
                                                    if (element) {
                                                        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                                    }
                                                }}
                                                className="text-gray-600 hover:text-brand-blue-900 transition-colors text-sm cursor-pointer"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    )
                                }
                                return (
                                    <li key={`category-${index}-${link.label}`}>
                                        <Link
                                            href={link.href}
                                            className="text-gray-600 hover:text-brand-blue-900 transition-colors text-sm"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    {/* Policy */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-brand-blue-900">Policy</h3>
                        <ul className="space-y-2">
                            {policies.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-600 hover:text-brand-blue-900 transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-brand-blue-900">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <Phone className="w-4 h-4 mt-0.5 text-brand-blue-900 flex-shrink-0" />
                                <div>
                                    <a href="tel:+919843010746" className="text-brand-blue-900 hover:text-brand-blue-700 transition-colors text-sm font-semibold">
                                        9843010746
                                    </a>
                                    <p className="text-gray-500 text-xs mt-1">10AM - 6PM (Mon-Fri)</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Mail className="w-4 h-4 mt-0.5 text-brand-blue-900 flex-shrink-0" />
                                <a href="mailto:office@worthyten.com" className="text-gray-700 hover:text-brand-blue-900 transition-colors text-sm">
                                    office@worthyten.com
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 mt-0.5 text-brand-blue-900 flex-shrink-0" />
                                <span className="text-gray-700 text-sm">
                                    Peelamedu, Coimbatore, Tamil Nadu 641004
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-center items-center text-sm text-gray-600">
                        <p>© {currentYear} WorthyTen. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

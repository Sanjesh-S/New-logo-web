'use client'

import Link from 'next/link'
import { Phone, Mail, MapPin, Instagram, Facebook, MessageCircle } from 'lucide-react'
import { getAssetPath } from '@/lib/utils'

const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '/trade-in', label: 'Trade In' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#faq', label: 'FAQ' },
]

const categories = [
    { href: '/trade-in?category=cameras', label: 'Cameras & DSLR' },
    { href: '/trade-in?category=phones', label: 'Phones' },
    { href: '/trade-in?category=laptops', label: 'Laptops' },
    { href: '/trade-in?category=tablets', label: 'Tablets' },
]

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-white text-gray-900">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Company Info */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="inline-block mb-4">
                            <img
                                src={getAssetPath("/images/worthyten-logo-footer.png")}
                                alt="WorthyTen"
                                className="h-20 w-auto object-contain"
                            />
                        </Link>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                            India's trusted platform for trading your cameras, phones, and gadgets. Get instant pickup and same day payment.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            <a
                                href="https://wa.me/919999999999"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-100 hover:bg-brand-blue-900 rounded-lg flex items-center justify-center transition-colors"
                                aria-label="WhatsApp"
                            >
                                <MessageCircle className="w-5 h-5 text-gray-700" />
                            </a>
                            <a
                                href="https://instagram.com/worthyten"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-100 hover:bg-brand-blue-900 rounded-lg flex items-center justify-center transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5 text-gray-700" />
                            </a>
                            <a
                                href="https://facebook.com/worthyten"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-100 hover:bg-brand-blue-900 rounded-lg flex items-center justify-center transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-5 h-5 text-gray-700" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-brand-blue-900">Quick Links</h3>
                        <ul className="space-y-2">
                            {quickLinks.map((link) => (
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

                    {/* Categories */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-brand-blue-900">Categories</h3>
                        <ul className="space-y-2">
                            {categories.map((link) => (
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
                                    Avinashi Rd, opp. to SMS HOTEL, Peelamedu, Masakalipalayam, Coimbatore, Tamil Nadu 641004
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600">
                        <p>© {currentYear} WorthyTen. All rights reserved.</p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/privacy-policy" className="hover:text-brand-blue-900 transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/terms-conditions" className="hover:text-brand-blue-900 transition-colors">
                                Terms & Conditions
                            </Link>
                            <Link href="/warranty" className="hover:text-brand-blue-900 transition-colors">
                                Warranty Policy
                            </Link>
                            <Link href="/return-refund-cancellation-policy" className="hover:text-brand-blue-900 transition-colors">
                                Return / Refund Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

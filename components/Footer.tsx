'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin, Instagram, Facebook, MessageCircle } from 'lucide-react'

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
        <footer className="bg-brand-blue-900 text-white">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Company Info */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="inline-block mb-4">
                            <div className="bg-white rounded-lg p-2 inline-block">
                                <Image
                                    src="/images/worthyten-logo.svg"
                                    alt="WorthyTEN"
                                    width={150}
                                    height={60}
                                    className="h-10 w-auto object-contain"
                                />
                            </div>
                        </Link>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4">
                            India's trusted platform for trading in your cameras, phones, and gadgets. Get instant quotes and same-day payment.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            <a
                                href="https://wa.me/919999999999"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-white/10 hover:bg-brand-lime rounded-lg flex items-center justify-center transition-colors"
                                aria-label="WhatsApp"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </a>
                            <a
                                href="https://instagram.com/worthyten"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-white/10 hover:bg-brand-lime rounded-lg flex items-center justify-center transition-colors"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href="https://facebook.com/worthyten"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-white/10 hover:bg-brand-lime rounded-lg flex items-center justify-center transition-colors"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-brand-lime">Quick Links</h3>
                        <ul className="space-y-2">
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-300 hover:text-white transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-brand-lime">Categories</h3>
                        <ul className="space-y-2">
                            {categories.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-300 hover:text-white transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-brand-lime">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <Phone className="w-4 h-4 mt-0.5 text-brand-lime flex-shrink-0" />
                                <a href="tel:+919999999999" className="text-gray-300 hover:text-white transition-colors text-sm">
                                    +91 99999 99999
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <Mail className="w-4 h-4 mt-0.5 text-brand-lime flex-shrink-0" />
                                <a href="mailto:hello@worthyten.com" className="text-gray-300 hover:text-white transition-colors text-sm">
                                    hello@worthyten.com
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 mt-0.5 text-brand-lime flex-shrink-0" />
                                <span className="text-gray-300 text-sm">
                                    New Delhi, India
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-400">
                        <p>© {currentYear} WorthyTEN. All rights reserved.</p>
                        <div className="flex gap-4">
                            <Link href="/privacy" className="hover:text-white transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="hover:text-white transition-colors">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

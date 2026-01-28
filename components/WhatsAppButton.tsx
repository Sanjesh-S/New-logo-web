'use client'

import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

export default function WhatsAppButton() {
    return (
        <motion.a
            href="https://wa.me/919843010705?text=Hi!%20I%20want%20to%20trade%20in%20my%20device."
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200 }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-brand-lime to-brand-blue-500 hover:from-brand-lime-400 hover:to-brand-blue-600 rounded-full shadow-lg flex items-center justify-center transition-all group"
            aria-label="Chat on WhatsApp"
        >
            <MessageCircle className="w-7 h-7 text-white" />

            {/* Pulse animation */}
            <span className="absolute w-full h-full rounded-full bg-gradient-to-br from-brand-lime to-brand-blue-500 animate-ping opacity-30" />

            {/* Tooltip */}
            <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Chat with us!
            </span>
        </motion.a>
    )
}

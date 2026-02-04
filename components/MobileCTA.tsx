'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function MobileCTA() {
    const pathname = usePathname()
    const router = useRouter()

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        
        if (pathname === '/') {
            // On homepage, scroll to the element
            const element = document.getElementById('trade-in')
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        } else {
            // On other pages, navigate to homepage with anchor
            router.push('/#trade-in')
        }
    }

    return (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4"
        >
            <a 
              href="/#trade-in" 
              onClick={handleClick}
              className="block w-full py-4 bg-brand-lime text-brand-blue-900 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-brand-lime-400 transition-colors"
            >
                Get Instant Quote
                <ArrowRight className="w-5 h-5" />
            </a>
        </motion.div>
    )
}

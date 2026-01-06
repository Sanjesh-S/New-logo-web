'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
    {
        question: 'How does the trade-in process work?',
        answer: 'It\'s simple! Select your device, answer a few questions about its condition, get an instant quote, and schedule a free doorstep pickup. Once we verify the device, you get paid the same day.',
    },
    {
        question: 'How quickly will I receive my payment?',
        answer: 'We offer same-day payment! Once our team picks up and verifies your device, payment is processed immediately via bank transfer or UPI.',
    },
    {
        question: 'Is doorstep pickup really free?',
        answer: 'Yes, absolutely! We offer free doorstep pickup across all major cities in India. No hidden charges or deductions.',
    },
    {
        question: 'What if my device has some issues?',
        answer: 'No problem! We accept devices in all conditions - working, minor issues, or even damaged. Our valuation system accounts for the condition and gives you a fair price.',
    },
    {
        question: 'How do you determine the price of my device?',
        answer: 'We use real-time market data and consider factors like brand, model, age, condition, and accessories included. Our pricing is transparent with no hidden deductions.',
    },
    {
        question: 'Can I trade in multiple devices at once?',
        answer: 'Yes! You can trade in as many devices as you want in a single transaction. We\'ll evaluate each one and provide a combined quote.',
    },
]

function FAQItem({ question, answer, isOpen, onClick }: {
    question: string
    answer: string
    isOpen: boolean
    onClick: () => void
}) {
    return (
        <motion.div
            initial={false}
            className="border-b border-gray-200 last:border-b-0"
        >
            <button
                onClick={onClick}
                className="w-full py-5 px-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
                <span className="font-semibold text-brand-blue-900 pr-4">{question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section id="faq" className="py-16 md:py-24 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-lime/20 rounded-2xl mb-6">
                        <HelpCircle className="w-8 h-8 text-brand-lime" />
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-blue-900 mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-gray-600">
                        Got questions? We've got answers.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                >
                    {faqs.map((faq, index) => (
                        <FAQItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openIndex === index}
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        />
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-8"
                >
                    <p className="text-gray-600">
                        Still have questions?{' '}
                        <a
                            href="https://wa.me/919999999999"
                            className="text-brand-lime font-semibold hover:underline"
                        >
                            Chat with us on WhatsApp
                        </a>
                    </p>
                </motion.div>
            </div>
        </section>
    )
}

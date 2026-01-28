'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
    {
        question: 'What documents are needed to sell an old camera or phone?',
        answer: 'You must submit the original purchase invoice, the warranty card, and any of your government-issued ID. These documents are mandatory to verify ownership and establish the seller\'s identity.',
    },
    {
        question: 'What should I do if my pickup is delayed?',
        answer: 'Please contact our support team directly 9843010746, if your pickup does not arrive on time. We will immediately coordinate with our logistics team to resolve the delay.',
    },
    {
        question: 'Do you offer delivery to all locations?',
        answer: 'Yes, we provide secure delivery services to all locations across Tamil Nadu. We ensure your device reaches your doorstep safely, no matter where you are in the state.',
    },
    {
        question: 'Do you offer pickup services in all locations?',
        answer: 'We provide convenient doorstep pickup services throughout Tamil Nadu. Our team can collect your device from any location in the state to make the process easy for you.',
    },
    {
        question: 'Why should I choose to buy from WorthyTen?',
        answer: 'At WorthyTen, you get premium-quality devices at the most affordable prices. We ensure you receive high-end technology that fits your budget without compromising on quality.',
    },
    {
        question: 'How do I cancel my pickup or order?',
        answer: 'To cancel a scheduled pickup or an order, please call our support team directly 9843010746. They will process your request immediately and guide you through the cancellation steps.',
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
                        Need Clarity? We are Here!!
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
                            href="https://wa.me/919843010705"
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

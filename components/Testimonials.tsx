'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
    {
        id: 1,
        name: 'Rahul Sharma',
        location: 'New Delhi',
        rating: 5,
        text: 'Sold my Canon 5D Mark IV here. Got the best price and payment was instant. Highly recommend WorthyTEN!',
        device: 'Canon EOS 5D Mark IV',
        amount: '₹85,000',
    },
    {
        id: 2,
        name: 'Priya Patel',
        location: 'Mumbai',
        rating: 5,
        text: 'Very professional service. They picked up my iPhone from doorstep and the payment was done same day. Amazing experience!',
        device: 'iPhone 13 Pro',
        amount: '₹42,000',
    },
    {
        id: 3,
        name: 'Arun Kumar',
        location: 'Bangalore',
        rating: 5,
        text: 'Traded in my old laptop for a great price. The process was smooth and transparent. Will definitely use again.',
        device: 'MacBook Pro 2020',
        amount: '₹68,000',
    },
    {
        id: 4,
        name: 'Sneha Reddy',
        location: 'Hyderabad',
        rating: 5,
        text: 'Quick evaluation, fair pricing, and no hidden charges. This is how trade-in should work!',
        device: 'Sony A7 III',
        amount: '₹95,000',
    },
]

export default function Testimonials() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [autoPlay, setAutoPlay] = useState(true)

    useEffect(() => {
        if (!autoPlay) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [autoPlay])

    const next = () => {
        setAutoPlay(false)
        setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }

    const prev = () => {
        setAutoPlay(false)
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    }

    return (
        <section className="py-16 md:py-24 bg-gradient-to-br from-brand-blue-900 to-brand-blue-950 text-white overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        What Our Customers Say
                    </h2>
                    <p className="text-lg text-gray-300">
                        Join thousands of happy customers who traded with us
                    </p>
                </motion.div>

                <div className="relative">
                    {/* Navigation Buttons */}
                    <button
                        onClick={prev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                        aria-label="Previous testimonial"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                        aria-label="Next testimonial"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Testimonial Cards */}
                    <div className="overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-12 max-w-3xl mx-auto"
                            >
                                <Quote className="w-12 h-12 text-brand-lime mb-6 opacity-50" />

                                <p className="text-xl md:text-2xl leading-relaxed mb-8">
                                    "{testimonials[currentIndex].text}"
                                </p>

                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <div className="flex items-center gap-1 mb-2">
                                            {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                                                <Star key={i} className="w-5 h-5 fill-brand-lime text-brand-lime" />
                                            ))}
                                        </div>
                                        <p className="font-semibold text-lg">{testimonials[currentIndex].name}</p>
                                        <p className="text-gray-400 text-sm">{testimonials[currentIndex].location}</p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">Sold</p>
                                        <p className="font-semibold">{testimonials[currentIndex].device}</p>
                                        <p className="text-brand-lime font-bold text-xl">{testimonials[currentIndex].amount}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-2 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setAutoPlay(false)
                                    setCurrentIndex(index)
                                }}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'w-8 bg-brand-lime' : 'bg-white/30'
                                    }`}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

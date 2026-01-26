'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Quote, MapPin } from 'lucide-react'

const testimonials = [
    {
        id: 1,
        name: 'Rajesh Kumar',
        location: 'Chennai, TN',
        rating: 5,
        text: 'Sold my Canon 5D Mark IV here. Got the best price and payment was instant. Highly recommend WorthyTen!',
        device: 'Canon EOS 5D Mark IV',
        amount: '₹85,000',
    },
    {
        id: 2,
        name: 'Priya Lakshmi',
        location: 'Coimbatore, TN',
        rating: 5,
        text: 'Very professional service. They picked up my iPhone from doorstep and the payment was done same day. Amazing experience!',
        device: 'iPhone 13 Pro',
        amount: '₹42,000',
    },
    {
        id: 3,
        name: 'Arun Kumar',
        location: 'Madurai, TN',
        rating: 5,
        text: 'Traded in my old laptop for a great price. The process was smooth and transparent. Will definitely use again.',
        device: 'MacBook Pro 2020',
        amount: '₹68,000',
    },
    {
        id: 4,
        name: 'Sneha Devi',
        location: 'Trichy, TN',
        rating: 5,
        text: 'Quick evaluation, fair pricing, and no hidden charges. This is how trade-in should work!',
        device: 'Sony A7 III',
        amount: '₹95,000',
    },
    {
        id: 5,
        name: 'Karthik Subramanian',
        location: 'Salem, TN',
        rating: 5,
        text: 'Excellent service! The team was very helpful and the entire process was hassle-free. Got a great deal for my camera.',
        device: 'Nikon D850',
        amount: '₹1,20,000',
    },
    {
        id: 6,
        name: 'Meera Venkatesh',
        location: 'Erode, TN',
        rating: 5,
        text: 'Best trade-in experience ever! Transparent pricing and same-day payment. Highly satisfied!',
        device: 'iPhone 14 Pro Max',
        amount: '₹55,000',
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

    const goToSlide = (index: number) => {
        setAutoPlay(false)
        setCurrentIndex(index)
    }

    return (
        <section className="py-16 md:py-24 bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-950 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-lime/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-blue-500/10 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 md:mb-16"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-block mb-4"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white font-semibold text-sm border border-white/20">
                            <Star className="w-4 h-4 text-brand-lime fill-brand-lime" />
                            Customer Reviews
                        </span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                        What Our Customers Say
                    </h2>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                        Join thousands of happy customers from Tamil Nadu who traded with us
                    </p>
                </motion.div>

                <div className="relative">
                    {/* Navigation Buttons */}
                    <button
                        onClick={prev}
                        className="absolute left-0 md:-left-4 lg:-left-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110 border border-white/20 shadow-lg"
                        aria-label="Previous testimonial"
                    >
                        <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-0 md:-right-4 lg:-right-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110 border border-white/20 shadow-lg"
                        aria-label="Next testimonial"
                    >
                        <ChevronRight className="w-6 h-6 md:w-7 md:h-7" />
                    </button>

                    {/* Testimonial Cards */}
                    <div className="overflow-hidden px-8 md:px-12 lg:px-16">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                                transition={{ duration: 0.4, type: 'spring' }}
                                className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-10 lg:p-12 max-w-4xl mx-auto border-2 border-white/20 shadow-2xl hover:border-brand-lime/50 transition-all"
                            >
                                {/* Quote icon */}
                                <div className="flex items-start justify-between mb-6">
                                    <Quote className="w-12 h-12 md:w-16 md:h-16 text-brand-lime opacity-60" />
                                    <div className="flex items-center gap-1">
                                        {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 md:w-6 md:h-6 fill-brand-lime text-brand-lime" />
                                        ))}
                                    </div>
                                </div>

                                {/* Review text */}
                                <p className="text-lg md:text-xl lg:text-2xl leading-relaxed mb-8 md:mb-10 font-light">
                                    "{testimonials[currentIndex].text}"
                                </p>

                                {/* Customer info and device */}
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-6 border-t border-white/20">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-brand-lime to-brand-blue-500 flex items-center justify-center font-bold text-lg md:text-xl shadow-lg">
                                                {testimonials[currentIndex].name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-lg md:text-xl">{testimonials[currentIndex].name}</p>
                                                <div className="flex items-center gap-1 text-gray-300 text-sm md:text-base">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{testimonials[currentIndex].location}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left md:text-right bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                                        <p className="text-xs md:text-sm text-gray-400 mb-1">Sold</p>
                                        <p className="font-semibold text-base md:text-lg mb-2">{testimonials[currentIndex].device}</p>
                                        <p className="text-brand-lime font-bold text-2xl md:text-3xl">{testimonials[currentIndex].amount}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-2 md:gap-3 mt-8 md:mt-12">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                onMouseEnter={() => setAutoPlay(false)}
                                className={`h-2 md:h-3 rounded-full transition-all duration-300 ${
                                    index === currentIndex 
                                        ? 'w-8 md:w-12 bg-brand-lime shadow-lg shadow-brand-lime/50' 
                                        : 'w-2 md:w-3 bg-white/30 hover:bg-white/50'
                                }`}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Testimonial counter */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mt-6 md:mt-8"
                    >
                        <p className="text-sm md:text-base text-gray-400">
                            {currentIndex + 1} of {testimonials.length} reviews
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

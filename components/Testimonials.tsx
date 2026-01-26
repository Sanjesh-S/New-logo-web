'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote, MapPin } from 'lucide-react'

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

    return (
        <section className="py-12 md:py-16 bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-950 text-white relative overflow-hidden">
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
                    className="text-center mb-8 md:mb-10"
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
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">
                        What Our Customers Say
                    </h2>
                    <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
                        Join thousands of happy customers from Tamil Nadu who traded with us
                    </p>
                </motion.div>

                <div className="relative">
                    {/* Testimonial Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={testimonial.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:border-brand-lime/50 transition-all hover:shadow-xl"
                            >
                                {/* Rating and Quote */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-1">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-brand-lime text-brand-lime" />
                                        ))}
                                    </div>
                                    <Quote className="w-6 h-6 text-brand-lime opacity-40" />
                                </div>

                                {/* Review text */}
                                <p className="text-sm md:text-base text-gray-200 leading-relaxed mb-4 line-clamp-3">
                                    "{testimonial.text}"
                                </p>

                                {/* Customer info */}
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-lime to-brand-blue-500 flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-white truncate">{testimonial.name}</p>
                                        <div className="flex items-center gap-1 text-gray-300 text-xs">
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate">{testimonial.location}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Device and amount */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-400 mb-1">Sold</p>
                                        <p className="font-medium text-xs text-white truncate">{testimonial.device}</p>
                                    </div>
                                    <p className="text-brand-lime font-bold text-lg ml-2">{testimonial.amount}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

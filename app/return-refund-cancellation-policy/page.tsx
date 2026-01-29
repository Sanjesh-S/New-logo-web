import { Metadata } from 'next'
import { Phone, RotateCcw, CreditCard, XCircle, Truck, Mail, CheckCircle, AlertTriangle, Clock, Video } from 'lucide-react'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Return / Refund / Cancellation Policy - WorthyTen',
  description: 'Return, Refund, and Cancellation Policy for WorthyTen purchases.',
}

export default function ReturnRefundCancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-900 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-lime/20 rounded-2xl mb-6">
              <RotateCcw className="w-10 h-10 text-brand-lime" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Return / Refund / Cancellation Policy</h1>
            <p className="text-xl text-gray-200">Understanding your rights and our policies for hassle-free transactions.</p>
          </div>
        </div>
      </div>

      <div className="pt-12 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Customer Support Card */}
          <div className="bg-gradient-to-br from-brand-lime/10 to-brand-blue-50 border-2 border-brand-lime/30 rounded-2xl p-6 mb-12 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-brand-lime rounded-xl flex items-center justify-center">
                <Phone className="w-7 h-7 text-brand-blue-900" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-brand-blue-900 mb-1">Need Help?</h2>
                <p className="text-gray-700 mb-2">Our customer support team is here for you</p>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div>
                    <p className="text-sm text-gray-600">Available Hours</p>
                    <p className="text-brand-blue-900 font-semibold">10AM - 6PM (Monday-Friday)</p>
                  </div>
                  <a 
                    href="tel:+919843010705" 
                    className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-900 text-white rounded-lg font-semibold hover:bg-brand-blue-800 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    9843010705
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <Clock className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="font-bold text-brand-blue-900 mb-1">48 Hours</h3>
              <p className="text-gray-600 text-sm">Return Window for Defective Items</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                <XCircle className="w-6 h-6 text-orange-700" />
              </div>
              <h3 className="font-bold text-brand-blue-900 mb-1">24 Hours</h3>
              <p className="text-gray-600 text-sm">Cancellation Window (5% fee)</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <Truck className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="font-bold text-brand-blue-900 mb-1">3-7 Days</h3>
              <p className="text-gray-600 text-sm">Standard Shipping Time</p>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            
            {/* Return Policy */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900">Return Policy</h2>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  The return policy covers only received defective and damaged products of online purchases. To be eligible for a return:
                </p>
                
                {/* Video Proof Requirement */}
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Video className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-amber-800 mb-1">Important: Video Proof Required</h3>
                      <p className="text-amber-700 text-sm">The customer must take a video of unboxing as proof for the replacement. The customer is entitled to return the item within 48 hours and share the video of unboxing.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">Your item must be unused and in the same condition that you received it.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">It must also be in the original packaging.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">After the verification, the replacement product will be sent, or the customer will have to visit the nearest store to get the replacement.</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-gray-700 font-medium">
                    <span className="text-brand-blue-900">Note:</span> To complete your return, we require a receipt or proof of purchase.
                  </p>
                </div>
              </div>
            </section>

            {/* Refund Policy */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900">Refund Policy</h2>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  If the product sold by Worthyten is found to be faulty or develops a fault within the warranty period:
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-brand-lime/20 rounded-full flex items-center justify-center">
                      <span className="text-brand-blue-900 font-bold text-sm">1</span>
                    </div>
                    <p className="text-gray-700">First, we endeavor to repair the product.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-brand-lime/20 rounded-full flex items-center justify-center">
                      <span className="text-brand-blue-900 font-bold text-sm">2</span>
                    </div>
                    <p className="text-gray-700">If we are unable to repair the product, we will offer a replacement/refund provided the fault is covered under warranty.</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h3 className="font-semibold text-brand-blue-900 mb-2">Refund Calculation</h3>
                  <p className="text-gray-700">
                    The refund processed would be to <strong>Current or Original Value (whichever is lower)</strong> as per company policy and condition of the item refund.
                  </p>
                </div>
              </div>
            </section>

            {/* Cancellation Policy */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-orange-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900">Cancellation Policy</h2>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">Within 24 Hours</span>
                    </div>
                    <p className="text-green-700 text-sm">Cancellation available with 5% fee.</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-red-800">After 24 Hours</span>
                    </div>
                    <p className="text-red-700 text-sm">Order cancellation is not available.</p>
                  </div>
                </div>
                
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-700">
                      <strong>Important:</strong> We offer the option of cancellation within 24 hours of placing an order. You will be charged 5% when you cancel an order.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping Time */}
            <section className="bg-gradient-to-br from-brand-blue-50 to-brand-lime/10 rounded-xl shadow-md p-8 border-2 border-brand-blue-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-900 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Shipping Time</h2>
                  <div className="bg-white rounded-lg p-4 border border-brand-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-brand-blue-900">3-7</div>
                      <div>
                        <p className="font-semibold text-brand-blue-900">Working Days</p>
                        <p className="text-gray-600 text-sm">Standard delivery time for all orders</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section className="bg-gradient-to-br from-brand-blue-900 to-brand-blue-800 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">Need Assistance?</h2>
                  <p className="text-gray-200 leading-relaxed mb-4">
                    If you have any questions about our Return, Refund, or Cancellation policies, please contact us:
                  </p>
                  <a 
                    href="mailto:office@worthyten.com" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-lime text-brand-blue-900 rounded-lg font-semibold hover:bg-brand-lime-400 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    office@worthyten.com
                  </a>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}

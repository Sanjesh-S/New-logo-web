import { Metadata } from 'next'
import { Phone } from 'lucide-react'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Return / Refund / Cancellation Policy - WorthyTen',
  description: 'Return, Refund, and Cancellation Policy for WorthyTen purchases.',
}

export default function ReturnRefundCancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-brand-blue-900 mb-8">Return / Refund / Cancellation Policy</h1>

          {/* Customer Support Info */}
          <div className="bg-brand-lime/10 border-l-4 border-brand-lime p-4 mb-8 rounded">
            <div className="flex items-center gap-3 mb-2">
              <Phone className="w-5 h-5 text-brand-blue-900" />
              <h2 className="text-xl font-bold text-brand-blue-900">Customer Support</h2>
            </div>
            <p className="text-brand-blue-900 font-semibold mb-1">10AM To 6PM (Monday-Friday)</p>
            <a href="tel:+919843010705" className="text-brand-blue-600 hover:text-brand-blue-800 text-lg font-semibold">
              9843010705
            </a>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <p className="text-gray-700 leading-relaxed mb-4">
                The return policy covers only received defective and damaged products of online purchases (the customer must take a video of unboxing as proof for the replacement). The customer is entitled to return the item within 48 hours and share the video of unboxing. To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging. After the verification, the replacement product will be sent, or the customer will have to visit the nearest store to get the replacement.
              </p>
              <p className="text-gray-700 leading-relaxed">
                To Complete Your Return, We Require A Receipt Or Proof Of Purchase.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Refund Policy:</h2>
              <p className="text-gray-700 leading-relaxed">
                If the product sold by Worthyten is found to be faulty or develops a fault within the warranty period, first we endeavor to repair the product. However, if we are unable to repair the product, we will offer a replacement/refund provided the fault is covered under warranty. The Refund Processed Would Be To Current Or Original Value (Whichever Is Lower) As Per Company Policy And Condition Of The Item Refund
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Cancellation Policy:</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We Offer The Option Of Cancellation, Within 24 Hours Of Placing An Order, You Will Be Charged 5% When You Cancel An Order.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Order cancellation is not available after 24 hours of placing an order.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">SHIPPING TIME</h2>
              <p className="text-gray-700 leading-relaxed">
                Minimum 3 To 7 Working Days.
              </p>
            </section>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

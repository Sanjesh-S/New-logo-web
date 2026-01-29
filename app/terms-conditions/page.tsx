import { Metadata } from 'next'
import { Phone, FileText, ShieldCheck, ShoppingBag, Package, AlertTriangle, Scale, Mail, CheckCircle, XCircle } from 'lucide-react'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Terms & Conditions - WorthyTen',
  description: 'Terms and Conditions for using WorthyTen platform for trading in devices.',
}

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-900 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-lime/20 rounded-2xl mb-6">
              <FileText className="w-10 h-10 text-brand-lime" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms & Conditions</h1>
            <p className="text-xl text-gray-200">Please read these terms carefully before using our services.</p>
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

          {/* Content Sections */}
          <div className="space-y-8">
            
            {/* Indemnity */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-red-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900">Indemnity</h2>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">I agree to <strong>defend, indemnify, and hold harmless</strong> WorthyTen, its employees, directors, officers, agents, and their successors and assigns from any claims, liabilities, damages, losses, costs, and expenses, including attorney's fees, arising from: A). My access to or use of the services. B). My violation of these Terms & Conditions.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                  <div className="text-gray-700">
                    <p className="mb-2">Any infringement by me or a third party using my account, including but not limited to:</p>
                    <ul className="ml-4 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-brand-lime">•</span>
                        <span>Breach of warranties, representations, or undertakings.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-lime">•</span>
                        <span>Non-fulfillment of obligations under this agreement.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand-lime">•</span>
                        <span>Violation of applicable laws or regulations, including intellectual property rights, statutory dues, taxes, libel, defamation, privacy rights, or service disruptions affecting other users.</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">I agree <strong>not to settle any claims</strong> without the prior written consent of WorthyTen. WorthyTen will make reasonable efforts to notify me of any such claim, action, or proceeding upon becoming aware of it.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">This <strong>defense and indemnification obligation will remain in effect</strong> even after the termination, modification, or expiration of these terms and my use of the service and platform.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">The Terms of Use shall be governed and interpreted by the laws of India. I agree that any disputes or claims shall be heard and resolved exclusively in the courts located in Coimbatore.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">I hereby release WorthyTen from any losses, claims, or damages related to the data stored, enclosed, or used in conjunction with the device and its associated media.</p>
                </div>
              </div>
            </section>

            {/* Selling Products */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-lime/20 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-brand-lime" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900">Selling Products at WorthyTen</h2>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  "Worthyten and its associates reserve the right to cancel any order or not fulfill the same at their sole discretion. All initial quotes are pending our evaluation of your gadget, and no binding offer is made until we have had a chance to inspect the gadget. We reserve the right to change our quote at any time.",
                  "WorthyTen and its associates reserve the right, at their sole discretion, to decline the purchase of any or all items in the order.",
                  "WorthyTen and its associates reserve the right, at their sole discretion, to limit the number of purchases honored for any customer, regardless of the quantity committed at the time of order placement.",
                  "Please ensure that you are the legal owner of the goods you wish to sell, as ownership will be transferred to Worthy Ten Recommerce Pvt Ltd once the goods are bought. Once a transaction has taken place, then it cannot be reversed. You understand once a device is sold by you via Worthy Ten, in no scenario can this device be returned to you.",
                  "You certify that you are the legal owner of the gadget that you want to sell.",
                  "You certify that the product(s) are not involved in any forgery, theft, snatching, finance (EMI), or any criminal offense.",
                  "Prices on the website are subject to change without any notice. Prices offered may be changed once the tester verifies that the grade of the item selected in the order does not match the actual condition of the item as per Worthy Ten grading criteria. The decision of the worthy ten in grading the item will be final.",
                  "If you receive a quote through our website, app, or an affiliate, but upon inspection, your gadget is found to be (A) a different model than originally quoted, (B) missing any parts, or (C) in a different condition than stated, we reserve the right to revise our offer accordingly.",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
                
                {/* Mandatory Documents */}
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <h3 className="font-semibold text-brand-blue-900 mb-3">Mandatory Documents for Selling Gadgets:</h3>
                  <ol className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-brand-blue-900">1.</span>
                      <span className="text-gray-700">Self-attested, government-approved ID proof of the gadget's owner.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-brand-blue-900">2.</span>
                      <span className="text-gray-700">Self-attested Indemnity Bond (if required, as provided by us).</span>
                    </li>
                  </ol>
                </div>

                {[
                  "It is your responsibility to wipe, clean, and delete all data from the gadget before selling it to WorthyTen. You confirm that all data on the device will be erased before handing it over.",
                  "Additionally, you acknowledge that if any data remains accessible due to technical reasons, WorthyTen shall not be held responsible. You also agree not to request data retrieval from WorthyTen under any circumstances.",
                  "You acknowledge that WorthyTen does not accept products distributed as gifts through state-sponsored or NGO-funded programs.",
                  "We reserve the right to modify this agreement at any time without giving you prior notice. Your use of our website/app, any of our tools and services, or following any such modification constitutes your agreement to follow and be bound by the Agreement as modified. Terms and conditions modifying the Agreement are effective immediately upon publication.",
                  "WorthyTen reserves the right to cancel any transaction that is deemed suspicious or fraudulent at the organization's own discretion.",
                  "Once the product is purchased from the customer, WorthyTen has the authority to upgrade or degrade the grade of the product under any circumstances.",
                  "WorthyTen Recommerce Private Limited purchases this product solely as a buy/sell/exchange trader for pre-owned goods. WorthyTen is not responsible for nor aware of any forgery, misuse, theft, fraud, outstanding finance (EMI), or any other criminal activity related to this product.",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Buying Products */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900">Buying Products from WorthyTen</h2>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  "All products are pre-owned/lightly used/refurbished.",
                  "Each product purchased is sold subject to its product description, which sets out additional specific conditions related to that product, including, without limitation, terms and conditions concerning estimated delivery dates and times, warranties, after-sales service, and guarantees.",
                  "Please note, however, that all product descriptions and images are for display purposes only and do not represent the finished product. Any accessories listed will be for mint condition items only and are not included in good condition, poor condition, discounted, or budget items.",
                  "Box Contents May Vary Additional downloadable content listed on the box may not be included. The grade category doesn't depend on the shutter count of the camera. We cannot ensure the exact shutter count of each camera every time.",
                  "We will take all reasonable care to ensure that all details, descriptions, and prices of products appearing on the website are correct at the time when the relevant information was entered into the system. Although we aim to keep the website as up-to-date as possible, the information, including product descriptions, appearing on this website at a particular time may not always reflect the position exactly at the moment you place an order.",
                  "All prices are inclusive of GST tax invoice for second-hand goods sold, and the buyers shall not be eligible to claim any input tax credit thereon.",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
                
                {/* Important Notice */}
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800">Important Notice</span>
                  </div>
                  <p className="text-red-700">No cash/card refund shall be made under any circumstances.</p>
                </div>
              </div>
            </section>

            {/* Condition of Items */}
            <section className="bg-gradient-to-br from-brand-blue-50 to-brand-lime/10 rounded-xl shadow-md p-8 border-2 border-brand-blue-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-900 rounded-lg flex items-center justify-center">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900">Condition of Items - Grading System</h2>
                  <p className="text-gray-600 mt-2">We categorize products based on their condition. For Cameras, Lenses and Accessories, we use the following grades:</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                    <span className="text-xl font-bold text-green-700">A</span>
                  </div>
                  <h3 className="text-lg font-bold text-brand-blue-900 mb-2">Grade A - Mint</h3>
                  <p className="text-gray-600 text-sm">Product in Mint Condition with All Original Accessories.</p>
                </div>
                <div className="bg-white rounded-xl p-6 border-2 border-yellow-200 shadow-sm">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-4">
                    <span className="text-xl font-bold text-yellow-700">B</span>
                  </div>
                  <h3 className="text-lg font-bold text-brand-blue-900 mb-2">Grade B - Good</h3>
                  <p className="text-gray-600 text-sm">Product in Good Condition with All Essential Accessories.</p>
                </div>
                <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-sm">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                    <span className="text-xl font-bold text-orange-700">C</span>
                  </div>
                  <h3 className="text-lg font-bold text-brand-blue-900 mb-2">Grade C - Working</h3>
                  <p className="text-gray-600 text-sm">Product in Working Condition with All Essential Accessories.</p>
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
                  <h2 className="text-2xl font-bold mb-4">Questions About Our Terms?</h2>
                  <p className="text-gray-200 leading-relaxed mb-4">
                    If you have any questions about these Terms & Conditions, please contact us:
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

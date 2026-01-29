import { Metadata } from 'next'
import { Phone, Shield, Clock, AlertTriangle, FileText, Wrench, Mail, CheckCircle, XCircle, Info } from 'lucide-react'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Warranty Policy - WorthyTen',
  description: 'Warranty Policy and Terms & Conditions for WorthyTen products.',
}

export default function WarrantyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-900 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-lime/20 rounded-2xl mb-6">
              <Shield className="w-10 h-10 text-brand-lime" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Warranty Policy</h1>
            <p className="text-xl text-gray-200">Your purchase is protected. Learn about our comprehensive warranty coverage.</p>
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
                <h2 className="text-xl font-bold text-brand-blue-900 mb-1">Warranty Support</h2>
                <p className="text-gray-700 mb-2">Our support team is ready to assist with warranty claims</p>
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

          {/* Warranty Period Cards */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-brand-blue-900 text-center mb-6">Warranty Periods by Grade</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 border-2 border-green-300 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">BEST</div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-2xl font-bold text-green-700">A</span>
                </div>
                <h3 className="text-xl font-bold text-brand-blue-900 mb-2">Grade A</h3>
                <p className="text-3xl font-bold text-green-600 mb-2">1 Year</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700"><strong>6 Months</strong> Full Coverage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700"><strong>6 Months</strong> Parts Only*</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border-2 border-yellow-300 shadow-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                  <span className="text-2xl font-bold text-yellow-700">B</span>
                </div>
                <h3 className="text-xl font-bold text-brand-blue-900 mb-2">Grade B</h3>
                <p className="text-3xl font-bold text-yellow-600 mb-2">1 Year</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-gray-700"><strong>3 Months</strong> Full Coverage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-gray-700"><strong>9 Months</strong> Parts Only*</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border-2 border-orange-300 shadow-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <span className="text-2xl font-bold text-orange-700">C</span>
                </div>
                <h3 className="text-xl font-bold text-brand-blue-900 mb-2">Grade C</h3>
                <p className="text-3xl font-bold text-orange-600 mb-2">1 Year</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-700"><strong>1 Month</strong> Full Coverage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-700"><strong>11 Months</strong> Parts Only*</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-600 text-sm mt-4">
              * Full Free of Labour Cost, Only Spare Parts incur Fees during Parts Only period.
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            
            {/* General Terms */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-lime/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-brand-lime" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900">General Warranty Terms</h2>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 font-medium">
                    Warranty will be provided only for products sold by WorthyTen Authorized Dealer/Reseller/Online Reseller.
                  </p>
                </div>

                {[
                  "The Warranty is valid only for the Specific Device Repaired and the Original Customer. It is not Transferable across devices or if the device is sold or handed over to another individual.",
                  "Each Product will be provided with a Warranty Card. The Warranty Period will differ according to the Grade of the Product. To check the exact warranty for the product bought, check the description in the bill.",
                  "Warranty Service valid only on WorthyTen authorized service centers. In case of delivery, shipping charges will be charged.",
                  "Warranty confirmation would be done through Serial Number, Tracing System, or online warranty.",
                  "Customer must provide Proof of Purchase (Invoice) including Warranty Card to avail the warranty of the product.",
                  "Warranty does not cover for Replaced products.",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* What's NOT Covered */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900">What's NOT Covered</h2>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-brand-blue-900 mb-3">Accessories & Consumables:</h3>
                  <p className="text-gray-700">
                    Bag, Strap, USB Cable, AV Cable, Lens Cap, Fungus, Dust, Battery Leakage, Flash Tube, Display Vignette, etc.
                  </p>
                  <p className="text-gray-600 text-sm mt-2 italic">
                    Note: Battery and Charger will be provided with one-time replacement warranty within 7 days for Cameras Only.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    "Physical Damage",
                    "Fire or Water Damage",
                    "Electrical Disturbances",
                    "Liquid Damage",
                    "Rooting/Jailbreaking Damage",
                    "Software Issues (unrelated to repair)",
                    "Tampering with Internal Hardware",
                    "Customer Self-Repair Attempts",
                    "Mishandling of Product",
                    "New Damages (unrelated to original repair)",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Repair & Replacement */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-purple-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900">Repair & Replacement Policy</h2>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  If the product sold by us is found to be faulty or develops a fault within the Warranty Period:
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-brand-lime/20 rounded-full flex items-center justify-center">
                      <span className="text-brand-blue-900 font-bold text-sm">1</span>
                    </div>
                    <p className="text-gray-700">First, we endeavor to <strong>repair</strong> the product.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-brand-lime/20 rounded-full flex items-center justify-center">
                      <span className="text-brand-blue-900 font-bold text-sm">2</span>
                    </div>
                    <p className="text-gray-700">If we are unable to repair, we will offer a <strong>1000-days Valid Voucher</strong> provided the fault is covered under warranty.</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h3 className="font-semibold text-brand-blue-900 mb-2">Voucher Value Calculation</h3>
                  <p className="text-gray-700">
                    The voucher processed would be to <strong>Current or Original Value (whichever is lower)</strong> as per company policy and condition of the item return.
                  </p>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-amber-800 mb-1">Repair Timeline</h3>
                      <p className="text-amber-700 text-sm">
                        In WorthyTen Warranty Period, repairs can take up to <strong>90 Working Days</strong>. However, we always endeavor to get your product repaired within a reasonable timeframe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Important Notes */}
            <section className="bg-gradient-to-br from-brand-blue-50 to-brand-lime/10 rounded-xl shadow-md p-8 border-2 border-brand-blue-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-900 rounded-lg flex items-center justify-center">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900">Important Information</h2>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-brand-blue-200">
                  <h3 className="font-bold text-brand-blue-900 mb-2">Tax Information</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700"><strong>ALL PRICES ARE INCLUSIVE OF GST</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Tax invoice for second-hand goods sold. Buyers shall not be eligible to claim any input tax credit thereon.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-4 border border-brand-blue-200">
                  <h3 className="font-bold text-brand-blue-900 mb-2">Data Responsibility</h3>
                  <p className="text-gray-700">
                    WorthyTen is not responsible for any loss of data occurring as a result of the repair. Customers are advised to <strong>back up all data prior</strong> to the repair attempt.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-brand-blue-200">
                  <h3 className="font-bold text-brand-blue-900 mb-2">Policy Updates</h3>
                  <p className="text-gray-700">
                    Worthyten reserves the right to modify or update the Terms and Conditions of our Warranty Policy at any time without prior notice. We will work only according to the updated Warranty Policy. For updated T&C, check our website www.worthyten.com.
                  </p>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800">No Refund Policy</span>
                  </div>
                  <p className="text-red-700">No Cash/Card Refund shall be made under any circumstances.</p>
                </div>

                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <p className="text-gray-700 font-medium">
                    All Disputes are covered under <strong>Coimbatore Jurisdiction Only</strong>.
                  </p>
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
                  <h2 className="text-2xl font-bold mb-4">Need Warranty Support?</h2>
                  <p className="text-gray-200 leading-relaxed mb-4">
                    If you have any questions about our Warranty Policy or need to make a claim, please contact us:
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

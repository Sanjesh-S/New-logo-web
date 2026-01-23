import { Metadata } from 'next'
import { Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Warranty Policy - WorthyTEN',
  description: 'Warranty Policy and Terms & Conditions for WorthyTEN products.',
}

export default function WarrantyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-brand-blue-900 mb-8">Warranty Policy</h1>

          {/* Customer Support Info */}
          <div className="bg-brand-lime/10 border-l-4 border-brand-lime p-4 mb-8 rounded">
            <div className="flex items-center gap-3 mb-2">
              <Phone className="w-5 h-5 text-brand-blue-900" />
              <h2 className="text-xl font-bold text-brand-blue-900">Customer Support</h2>
            </div>
            <p className="text-brand-blue-900 font-semibold mb-1">10AM To 6PM (Monday-Friday)</p>
            <a href="tel:+919843010746" className="text-brand-blue-600 hover:text-brand-blue-800 text-lg font-semibold">
              9843010746
            </a>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Terms & Conditions and Warranty Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                (Annexure(i)) Warranty will be Provided only for the Products which are sold by WorthyTen Authorized Dealer/ Reseller/ Online Reseller.
              </p>
            </section>

            <section className="mb-8">
              <ul className="list-disc pl-6 space-y-3 text-gray-700">
                <li>The Warranty is valid only for the Specific Device Repaired and the Original Customer. It is not Transferable across devices or if the device is sold or handed over to another individual.</li>
                <li>Each Products will be provided with a Warranty Card. The Warranty Period will be differ According to the Grade of the Product. To Check the Exact Warranty for the Product Brought Check Description in Bill.</li>
                <li>The Warranty Does not cover Accessories and Consumables. Bag, Strap, USB Cable and AV Cable, Lens Cap, Fungus, Dust, Battery Leakage, Flash Tube, Display Vignette Etc. Battery and Charger will be provided with one time Replacement Warranty within 7 days for Cameras Only</li>
                <li>If the Product is sold by the US is found to, be faulty or develops a fault within Warranty Period first, endeavour to Repair the product. however, if we are unable to Repair the Product, We will Offer a 1000days Valid Voucher Provided the Fault is Covered Under Warranty. The Voucher Processed Would be to current or Original Value (whichever is Lower) as per Company Policy and Condition of the item Return.</li>
                <li>Warranty Service valid only on WorthyTen authorized service centers. In case of delivery, shipping charges will be charged.</li>
                <li>Warranty confirmation would be done through Serial Number, Tracing System either online warranty.</li>
                <li><strong>ALL PRICES ARE INCLUSIVE OF GST</strong></li>
                <li><strong>TAX INVOICE FOR SECOND-HAND GOODS SOLD AND THE BUYERS SHALL NOT BE ELIGIBLE TO CLAIM ANY INPUT TAX CREDIT THEREON</strong></li>
                <li>Each Products will be provided with a Warranty Card. The Warranty Period will be differ According to the Grade of the Product as follows:
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li><strong>Grade A Warranty Period 1 Year</strong> (6 Months* + 6 Months**)</li>
                    <li><strong>Grade B Warranty Period 1 Year</strong> (3 Months* + 9 Months**)</li>
                    <li><strong>Grade C Warranty Period 1 Year</strong> (1 Month* + 11 Months**)</li>
                  </ul>
                  <p className="mt-2 text-sm text-gray-600">
                    (* Months- Covers T & C Under Worthy Ten Warranty Policy. ** Months- Full Free of Labour Cost, Only Spare Parts incur Fees.)
                  </p>
                </li>
                <li>No Cash/Card Refund shall be made under any circumstances.</li>
                <li>Warranty does not cover for Replaced products.</li>
                <li>Customer must provide Proof of Purchase(Invoice) including Warranty Card to avail the warranty of the product.</li>
                <li><strong>Please Note:</strong> – In WorthyTen Warranty Period Repairs can take up to 90 Working Days, For Support Call-9843010746 (10.00am-6.00pm, Monday-Friday). However, we always endeavour to get your Product Repaired within reasonable time frame.</li>
                <li>For Brand warranty Period Repair timing will be Decided by the Brand service center only.</li>
                <li>The WorthyTen Warranty does not cover Physical Damage, Fire, Water damage and Electrical Disturbances, Liquid damage or any damage caused by Rooting Jailbreaking a device and only covers software faults arising in the course of normal use.</li>
                <li>Software issues unrelated to the repair, Tampering with internal hardware does not include within warranty.</li>
                <li>Mishandling of Product may not cover under warranty like Keeping the battery in the Product for long time when not in use which cause vignette Display etc.</li>
                <li>Damage resulting from attempted customer Self-Repairs. New damages unrelated to the Original Repair does not Cover Under Warranty.</li>
                <li>WorthyTen is not Responsible for any loss of Data Occurring as a Result of the repair – Customers are advised to back up all data prior to the Repair Attempt.</li>
                <li>Worthyten Reserves the Right to Modify or Update the Terms and Conditions of our Warranty Policy at any time without Prior Notice and We will work only according to the updated Warranty Policy. For Updated T&C of our Warranty Policy Check out our website www.worthyten.com.</li>
                <li>This T&C of our Warranty Policy Applicable for both Online and Direct Customers. For Online Customers, Online Declaration Form will be collected for Products Buyed at WorthyTen, Read T&C Before Submitting the Online Declaration form.</li>
                <li>All Disputes are covered under Coimbatore Jurisdiction Only.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

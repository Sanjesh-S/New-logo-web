import { Metadata } from 'next'
import { Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms & Conditions - WorthyTEN',
  description: 'Terms and Conditions for using WorthyTEN platform for trading in devices.',
}

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-brand-blue-900 mb-8">Terms & Conditions</h1>

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
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Indemnity</h2>
              <ul className="list-disc pl-6 space-y-3 text-gray-700">
                <li>I agree to <strong>defend, indemnify, and hold harmless</strong> WorthyTen, its employees, directors, officers, agents, and their successors and assigns from any claims, liabilities, damages, losses, costs, and expenses, including attorney's fees, arising from: A). My access to or use of the services. B). My violation of these Terms & Conditions.</li>
                <li>Any infringement by me or a third party using my account, including but not limited to:
                  <ul className="list-circle pl-6 mt-2 space-y-1">
                    <li>Breach of warranties, representations, or undertakings.</li>
                    <li>Non-fulfillment of obligations under this agreement.</li>
                    <li>Violation of applicable laws or regulations, including intellectual property rights, statutory dues, taxes, libel, defamation, privacy rights, or service disruptions affecting other users.</li>
                  </ul>
                </li>
                <li>I agree <strong>not to settle any claims</strong> without the prior written consent of WorthyTen. WorthyTen will make reasonable efforts to notify me of any such claim, action, or proceeding upon becoming aware of it.</li>
                <li>This <strong>defense and indemnification obligation will remain in effect</strong> even after the termination, modification, or expiration of these terms and my use of the service and platform.</li>
                <li>The Terms of Use shall be governed and interpreted by the laws of India. I agree that any disputes or claims shall be heard and resolved exclusively in the courts located in Coimbatore.</li>
                <li>I hereby release WorthyTen from any losses, claims, or damages related to the data stored, enclosed, or used in conjunction with the device and its associated media.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Selling products at WorthyTen:</h2>
              <ul className="list-disc pl-6 space-y-3 text-gray-700">
                <li>Worthyten and its associates reserve the right to cancel any order or not fulfill the same at their sole discretion. All initial quotes are pending our evaluation of your gadget, and no binding offer is made until we have had a chance to inspect the gadget. We reserve the right to change our quote at any time.</li>
                <li>WorthyTen and its associates reserve the right, at their sole discretion, to decline the purchase of any or all items in the order.</li>
                <li>WorthyTen and its associates reserve the right, at their sole discretion, to limit the number of purchases honored for any customer, regardless of the quantity committed at the time of order placement.</li>
                <li>Please ensure that you are the legal owner of the goods you wish to sell, as ownership will be transferred to Worthy Ten Recommerce Pvt Ltd once the goods are bought. Once a transaction has taken place, then it cannot be reversed. You understand once a device is sold by you via Worthy Ten, in no scenario can this device be returned to you.</li>
                <li>You certify that you are the legal owner of the gadget that you want to sell.</li>
                <li>You certify that the product(s) are not involved in any forgery, theft, snatching, finance (EMI), or any criminal offense.</li>
                <li>Prices on the website are subject to change without any notice. Prices offered may be changed once the tester verifies that the grade of the item selected in the order does not match the actual condition of the item as per Worthy Ten grading criteria. The decision of the worthy ten in grading the item will be final.</li>
                <li>If you receive a quote through our website, app, or an affiliate, but upon inspection, your gadget is found to be (A) a different model than originally quoted, (B) missing any parts, or (C) in a different condition than stated, we reserve the right to revise our offer accordingly.</li>
                <li>All gadgets sold must be accompanied by the following mandatory documents:
                  <ol className="list-decimal pl-6 mt-2 space-y-1">
                    <li>Self-attested, government-approved ID proof of the gadget's owner.</li>
                    <li>Self-attested Indemnity Bond (if required, as provided by us).</li>
                  </ol>
                </li>
                <li>It is your responsibility to wipe, clean, and delete all data from the gadget before selling it to WorthyTen. You confirm that all data on the device will be erased before handing it over.</li>
                <li>Additionally, you acknowledge that if any data remains accessible due to technical reasons, WorthyTen shall not be held responsible. You also agree not to request data retrieval from WorthyTen under any circumstances.</li>
                <li>You acknowledge that WorthyTen does not accept products distributed as gifts through state-sponsored or NGO-funded programs.</li>
                <li>We reserve the right to modify this agreement at any time without giving you prior notice. Your use of our website/app, any of our tools and services, or following any such modification constitutes your agreement to follow and be bound by the Agreement as modified. Terms and conditions modifying the Agreement are effective immediately upon publication.</li>
                <li>WorthyTen reserves the right to cancel any transaction that is deemed suspicious or fraudulent at the organization's own discretion.</li>
                <li>Once the product is purchased from the customer, WorthyTen has the authority to upgrade or degrade the grade of the product under any circumstances.</li>
                <li>WorthyTen Recommerce Private Limited purchases this product solely as a buy/sell/exchange trader for pre-owned goods. WorthyTen is not responsible for nor aware of any forgery, misuse, theft, fraud, outstanding finance (EMI), or any other criminal activity related to this product.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Buying products from Worthy Ten:</h2>
              <ul className="list-disc pl-6 space-y-3 text-gray-700">
                <li>All products are pre-owned/lightly used/refurbished.</li>
                <li>Each product purchased is sold subject to its product description, which sets out additional specific conditions related to that product, including, without limitation, terms and conditions concerning estimated delivery dates and times, warranties, after-sales service, and guarantees.</li>
                <li>Please note, however, that all product descriptions and images are for display purposes only and do not represent the finished product. Any accessories listed will be for mint condition items only and are not included in good condition, poor condition, discounted, or budget items.</li>
                <li>Box Contents May Vary Additional downloadable content listed on the box may not be included. The grade category doesn't depend on the shutter count of the camera. We cannot ensure the exact shutter count of each camera every time.</li>
                <li>We will take all reasonable care to ensure that all details, descriptions, and prices of products appearing on the website are correct at the time when the relevant information was entered into the system. Although we aim to keep the website as up-to-date as possible, the information, including product descriptions, appearing on this website at a particular time may not always reflect the position exactly at the moment you place an order.</li>
                <li>All prices are inclusive of GST tax invoice for second-hand goods sold, and the buyers shall not be eligible to claim any input tax credit thereon.</li>
                <li>No cash/card refund shall be made under any circumstances.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Condition Of Items</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We will charge you more depending on the condition of our products. For Cameras, Lenses And Accessories Etc., We Break This Down Into Grades:
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-brand-blue-900 mb-2">Grade-A-Mint—Product</h3>
                  <p className="text-gray-700">In Mint Condition With All Original Accessories.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-brand-blue-900 mb-2">Grade B-Good—Product</h3>
                  <p className="text-gray-700">In Good Condition With All Essential Accessories.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-brand-blue-900 mb-2">Grade-C-Working—Product</h3>
                  <p className="text-gray-700">In Working Condition With All Essential Accessories.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

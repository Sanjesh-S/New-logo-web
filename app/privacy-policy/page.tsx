import { Metadata } from 'next'
import { Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy - WorthyTEN',
  description: 'Privacy Policy for WorthyTEN - Learn how we collect, use, and protect your personal data.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-brand-blue-900 mb-8">Privacy Policy</h1>

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
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Who are we?</h2>
              <p className="text-gray-700 leading-relaxed">
                Worthyten, a company having its registered office at Avinashi Rd, opp. to SMS HOTEL, Peelamedu, Masakalipalayam, Coimbatore, Tamil Nadu 641004, We takes the security of your personal data very seriously and is committed to protecting and respecting the privacy of the users of our Worthyten Website and App (the "Platform").
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">What is this privacy notice for?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This privacy notice, along with our Terms and Conditions, outlines our data collection, sharing practices, and the ways in which we protect your personal data in accordance with data protection laws and your privacy rights. Please read it carefully.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This Statement applies to Personal Data processed by Worthyten when you:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Visit this website (worthyten.com) or any other Worthyten websites referencing this Statement (collectively, "Website").</li>
                <li>Use, download, access, any of our internet-based offerings, including mobile platforms, software, or applications (collectively, "Services").</li>
                <li>Visit Worthyten's branded social media sites.</li>
                <li>Receive communications from us, including emails, phone calls, or other electronic messages.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Data We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect information directly from you through forms you complete or Services you access. This includes:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Name, Contact details, Email ID, Device Details</li>
                <li>Communications with Worthyten personnel.</li>
                <li>Content you post on our social media sites.</li>
                <li>Information provided on the Website, such as questionnaires or feedback forms.</li>
                <li>Information when you subscribe to SMS services.</li>
                <li>Information when you create your account, log-in credentials, and preferences for the Services.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4 mb-4">
                We also collect information indirectly via your use of the Services, such as:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Information on your use of the Services or Website via web logs, IP addresses, device details, browser types, domain names, and other anonymous statistical data.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Additionally, we collect Personal Data from other sources such as public records, vendors, data suppliers, commercially available marketing lists, social networks, news outlets, and related media. This data typically includes business contact information, names, contact information, job titles, IP addresses, and social media profiles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Use of Personal Data</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Worthyten uses your Personal Data for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Administering our Website and providing Services.</li>
                <li>User registration.</li>
                <li>Support requests.</li>
                <li>Compliance, security, and functionality of Website and Services.</li>
                <li>Improving Website and Services, developing offerings.</li>
                <li>Marketing communications and advertisements.</li>
                <li>Payments.</li>
                <li>Legal obligations.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Tracking Users' Use of the Platform</h2>
              <p className="text-gray-700 leading-relaxed">
                We use various tools to assess how you use and interact with the Platform, including cookies, web beacons, and behavioral targeting/re-targeting. This data, often collected automatically, includes your IP address, device details, browser information, location, and connection details. More information can be found in our Cookies Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Disclosure of Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Worthyten may share Personal Data with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Contracted service providers.</li>
                <li>Your employer.</li>
                <li>Parties involved in mergers or acquisitions.</li>
                <li>Data analytics providers.</li>
                <li>Public forums.</li>
                <li>Friends and acquaintances.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Using Your Data in Accordance with Data Protection Law</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We rely on the following legal bases for processing your personal data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Consent.</li>
                <li>Legitimate interests.</li>
                <li>Compliance with legal obligations.</li>
                <li>Substantial public interest.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Retention Period</h2>
              <p className="text-gray-700 leading-relaxed">
                Personal data is retained as long as necessary for the processing purpose for which it was collected and any other permissible, related purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Location of Processing</h2>
              <p className="text-gray-700 leading-relaxed">
                Worthyten operates solely from India and processes your Personal Data there. Some service providers may process Personal Data outside your jurisdiction, potentially in countries without an adequacy decision by the European Commission or your local legislature.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Minors</h2>
              <p className="text-gray-700 leading-relaxed">
                Worthyten's Services are intended for business clients and not directed at minors. Persons under 18 may use the Platform only under supervision and with prior consent of a parent or guardian. We do not knowingly collect Personal Data from children under 18. If you believe your child has provided us with Personal Data, please contact us to delete such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Security of Personal Information</h2>
              <p className="text-gray-700 leading-relaxed">
                All information you provide is stored securely and accessed only by those who need it to provide products or services. We have implemented commercially reasonable safeguards in compliance with data protection laws. While we strive to protect your personal data, no security system is impenetrable, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">How We May Contact You</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Service communications:</strong> Regarding transactions you initiate with us.</li>
                <li><strong>Marketing communications and editorial newsletters:</strong> With your permission, we may send you offers and updates. You can unsubscribe at any time.</li>
                <li><strong>Customer feedback:</strong> To gather feedback on your experience with Worthyten.</li>
                <li><strong>Query or complaint responses:</strong> To address your queries or complaints.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Rights and Obligations with Respect to Your Data</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the following rights under data protection laws:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Right to access personal data.</li>
                <li>Right to rectify inaccurate personal data.</li>
                <li>Right to erase personal data.</li>
                <li>Right to restrict processing of personal data.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, contact us using the details provided in the Contact Information section. We will respond within one month.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                For any questions or to exercise your data protection rights, please contact us at <a href="mailto:office@worthyten.com" className="text-brand-blue-600 hover:underline">office@worthyten.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

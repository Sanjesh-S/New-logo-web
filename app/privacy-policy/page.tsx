import { Metadata } from 'next'
import { Phone, Shield, Lock, Eye, FileText, Users, Mail, CheckCircle } from 'lucide-react'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Privacy Policy - WorthyTen',
  description: 'Privacy Policy for WorthyTen - Learn how we collect, use, and protect your personal data.',
}

export default function PrivacyPolicyPage() {
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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-xl text-gray-200">Your privacy matters to us. Learn how we protect your data.</p>
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
                    href="tel:+919843010746" 
                    className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-900 text-white rounded-lg font-semibold hover:bg-brand-blue-800 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    9843010746
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            
            {/* Who are we */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand-blue-900" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Who are we?</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Worthyten, a company having its registered office at Peelamedu, Coimbatore, Tamil Nadu 641004, We takes the security of your personal data very seriously and is committed to protecting and respecting the privacy of the users of our Worthyten Website and App (the "Platform").
                  </p>
                </div>
              </div>
            </section>

            {/* What is this privacy notice for */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-lime/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-brand-lime" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">What is this privacy notice for?</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    This privacy notice, along with our Terms and Conditions, outlines our data collection, sharing practices, and the ways in which we protect your personal data in accordance with data protection laws and your privacy rights. Please read it carefully.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    This Statement applies to Personal Data processed by Worthyten when you:
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                      <span>Visit this website (worthyten.com) or any other Worthyten websites referencing this Statement (collectively, "Website").</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                      <span>Use, download, access, any of our internet-based offerings, including mobile platforms, software, or applications (collectively, "Services").</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                      <span>Visit Worthyten's branded social media sites.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                      <span>Receive communications from us, including emails, phone calls, or other electronic messages.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data We Collect */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Data We Collect</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We collect information directly from you through forms you complete or Services you access. This includes:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 mb-6">
                    {[
                      'Name, Contact details, Email ID, Device Details',
                      'Communications with Worthyten personnel',
                      'Content you post on our social media sites',
                      'Information provided on the Website, such as questionnaires or feedback forms',
                      'Information when you subscribe to SMS services',
                      'Information when you create your account, log-in credentials, and preferences for the Services'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We also collect information indirectly via your use of the Services, such as:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">
                      Information on your use of the Services or Website via web logs, IP addresses, device details, browser types, domain names, and other anonymous statistical data.
                    </p>
                  </div>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    Additionally, we collect Personal Data from other sources such as public records, vendors, data suppliers, commercially available marketing lists, social networks, news outlets, and related media. This data typically includes business contact information, names, contact information, job titles, IP addresses, and social media profiles.
                  </p>
                </div>
              </div>
            </section>

            {/* Use of Personal Data */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Use of Personal Data</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Worthyten uses your Personal Data for the following purposes:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      'Administering our Website and providing Services',
                      'User registration',
                      'Support requests',
                      'Compliance, security, and functionality of Website and Services',
                      'Improving Website and Services, developing offerings',
                      'Marketing communications and advertisements',
                      'Payments',
                      'Legal obligations'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Tracking Users' Use */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-orange-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Tracking Users' Use of the Platform</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We use various tools to assess how you use and interact with the Platform, including cookies, web beacons, and behavioral targeting/re-targeting. This data, often collected automatically, includes your IP address, device details, browser information, location, and connection details. More information can be found in our Cookies Policy.
                  </p>
                </div>
              </div>
            </section>

            {/* Disclosure */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-red-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Disclosure of Your Information</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Worthyten may share Personal Data with:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      'Contracted service providers',
                      'Your employer',
                      'Parties involved in mergers or acquisitions',
                      'Data analytics providers',
                      'Public forums',
                      'Friends and acquaintances'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Data Protection Law */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-700" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Using Your Data in Accordance with Data Protection Law</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We rely on the following legal bases for processing your personal data:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      'Consent',
                      'Legitimate interests',
                      'Compliance with legal obligations',
                      'Substantial public interest'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Retention Period */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Retention Period</h2>
              <p className="text-gray-700 leading-relaxed">
                Personal data is retained as long as necessary for the processing purpose for which it was collected and any other permissible, related purposes.
              </p>
            </section>

            {/* Location of Processing */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Location of Processing</h2>
              <p className="text-gray-700 leading-relaxed">
                Worthyten operates solely from India and processes your Personal Data there. Some service providers may process Personal Data outside your jurisdiction, potentially in countries without an adequacy decision by the European Commission or your local legislature.
              </p>
            </section>

            {/* Minors */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Minors</h2>
              <p className="text-gray-700 leading-relaxed">
                Worthyten's Services are intended for business clients and not directed at minors. Persons under 18 may use the Platform only under supervision and with prior consent of a parent or guardian. We do not knowingly collect Personal Data from children under 18. If you believe your child has provided us with Personal Data, please contact us to delete such information.
              </p>
            </section>

            {/* Security */}
            <section className="bg-gradient-to-br from-brand-blue-50 to-brand-lime/10 rounded-xl shadow-md p-8 border-2 border-brand-blue-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-900 rounded-lg flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Security of Personal Information</h2>
                  <p className="text-gray-700 leading-relaxed">
                    All information you provide is stored securely and accessed only by those who need it to provide products or services. We have implemented commercially reasonable safeguards in compliance with data protection laws. While we strive to protect your personal data, no security system is impenetrable, and we cannot guarantee absolute security.
                  </p>
                </div>
              </div>
            </section>

            {/* How We May Contact You */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">How We May Contact You</h2>
              <div className="space-y-3">
                {[
                  { title: 'Service communications', desc: 'Regarding transactions you initiate with us.' },
                  { title: 'Marketing communications and editorial newsletters', desc: 'With your permission, we may send you offers and updates. You can unsubscribe at any time.' },
                  { title: 'Customer feedback', desc: 'To gather feedback on your experience with Worthyten.' },
                  { title: 'Query or complaint responses', desc: 'To address your queries or complaints.' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-brand-blue-900 mb-1">{item.title}</h3>
                    <p className="text-gray-700 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Rights */}
            <section className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-brand-blue-900 mb-4">Rights and Obligations with Respect to Your Data</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the following rights under data protection laws:
              </p>
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                {[
                  'Right to access personal data',
                  'Right to rectify inaccurate personal data',
                  'Right to erase personal data',
                  'Right to restrict processing of personal data'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-brand-lime flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                To exercise these rights, contact us using the details provided in the Contact Information section. We will respond within one month.
              </p>
            </section>

            {/* Contact Information */}
            <section className="bg-gradient-to-br from-brand-blue-900 to-brand-blue-800 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
                  <p className="text-gray-200 leading-relaxed mb-4">
                    For any questions or to exercise your data protection rights, please contact us at:
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

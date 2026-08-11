"use client";

import { useState } from "react";
import type { Metadata } from "next";

// DEMO VERSION — reviewed by legal counsel required before final launch (DPDP Act 2023).
const lastUpdated = "August 2026";

const EN_CONTENT = (
  <div className="prose prose-gray max-w-none">
    <p>
      CompuTrain (&ldquo;We&rdquo;, &ldquo;Our&rdquo;, &ldquo;Us&rdquo;) respects your
      privacy. This Privacy Policy describes how we collect, use, and protect your
      personal information when you use our website and services, in accordance with
      India&apos;s Digital Personal Data Protection (DPDP) Act 2023 and other applicable laws.
    </p>

    <h2>1. Information We Collect</h2>
    <p>We may collect the following personal data:</p>
    <ul>
      <li><strong>Contact information:</strong> Name, phone number, email address.</li>
      <li><strong>Academic data:</strong> Course interest, center preference, roll numbers, certificate numbers, exam results.</li>
      <li><strong>Financial data:</strong> Fee payment records, installment schedules (no card or bank details are stored on our servers).</li>
      <li><strong>Usage data:</strong> Pages visited, search queries, device type, IP address (for security and analytics).</li>
      <li><strong>Communication data:</strong> Messages submitted via enquiry, contact, or support forms.</li>
    </ul>

    <h2>2. Purpose of Processing and Consent</h2>
    <p>
      Under the DPDP Act 2023, we process your data only for specific, lawful purposes
      for which you have given consent at the point of collection:
    </p>
    <ul>
      <li>Responding to enquiries and facilitating center admissions.</li>
      <li>Providing certificate issuance and public verification services.</li>
      <li>Processing fee payments and maintaining financial records as required by law.</li>
      <li>Sending transactional notices (results, fee reminders, OTPs) — these are service messages and do not require separate consent.</li>
      <li>Sending promotional or marketing communications — only with your explicit opt-in consent, which you may withdraw at any time.</li>
      <li>Improving our platform through aggregated, anonymised analytics.</li>
    </ul>
    <p>
      For users under 18 years of age, we obtain verifiable consent from a parent or
      guardian before collecting or processing personal data.
    </p>

    <h2>3. Data Sharing</h2>
    <p>We do not sell your personal data. We may share it only with:</p>
    <ul>
      <li><strong>Franchise centers:</strong> To process your enquiry or admission at the relevant center.</li>
      <li><strong>Service providers:</strong> Hosting, SMS, email, and analytics providers who are contractually bound to process data only as instructed.</li>
      <li><strong>Payment processors:</strong> Razorpay or other licensed payment aggregators, in accordance with RBI guidelines, to process transactions.</li>
      <li><strong>Legal authorities:</strong> When required by a court order, government directive, or to protect our lawful rights.</li>
    </ul>

    <h2>4. Data Retention</h2>
    <ul>
      <li><strong>Certificate records:</strong> Retained permanently for lifetime verification.</li>
      <li><strong>Financial records:</strong> Retained for 7 years as required by Indian tax and accounting law.</li>
      <li><strong>Student PII:</strong> Retained for the duration of enrollment and up to 3 years thereafter, unless you request earlier erasure.</li>
      <li><strong>OTP and session data:</strong> Deleted within 30 days.</li>
      <li><strong>Marketing consent records:</strong> Retained for 3 years after consent withdrawal.</li>
    </ul>

    <h2>5. Your Rights under DPDP Act 2023</h2>
    <p>You have the right to:</p>
    <ul>
      <li><strong>Access:</strong> Obtain a copy of the personal data we hold about you.</li>
      <li><strong>Correction:</strong> Request that inaccurate or incomplete data be corrected.</li>
      <li><strong>Erasure:</strong> Request deletion of your data (subject to legal retention obligations).</li>
      <li><strong>Grievance redressal:</strong> Raise a complaint with our Data Protection Officer.</li>
      <li><strong>Nominate:</strong> Nominate another person to exercise your rights in the event of death or incapacity.</li>
    </ul>
    <p>
      To exercise these rights, email:{" "}
      <a href="mailto:privacy@computrain.in">privacy@computrain.in</a>. We will respond within 30 days.
    </p>

    <h2>6. Cookies</h2>
    <p>
      We use essential cookies for site functionality and session management. Analytics
      cookies are placed only with your consent. We do not use advertising or
      cross-site tracking cookies on pages accessible to minors.
    </p>

    <h2>7. Security</h2>
    <p>
      We implement industry-standard safeguards including HTTPS, server-side
      authentication, encrypted storage of sensitive fields, and rate-limiting on
      all verification endpoints. In the event of a data breach affecting your rights,
      we will notify you as required by applicable law.
    </p>

    <h2>8. Changes to This Policy</h2>
    <p>
      We may update this policy periodically. Significant changes will be communicated
      via in-app notice or SMS to registered users. The &ldquo;Last updated&rdquo; date
      reflects the latest revision.
    </p>

    <h2>9. Contact / Data Protection Officer</h2>
    <p>
      Data Controller: CompuTrain, Head Office, New Delhi, India.{" "}
      <a href="mailto:privacy@computrain.in">privacy@computrain.in</a>
    </p>
  </div>
);

const HI_CONTENT = (
  <div className="prose prose-gray max-w-none" lang="hi">
    <p>
      CompuTrain (&ldquo;हम&rdquo;, &ldquo;हमारा&rdquo;) आपकी गोपनीयता का सम्मान करता है।
      यह गोपनीयता नीति बताती है कि जब आप हमारी वेबसाइट और सेवाओं का उपयोग करते हैं तो
      हम आपकी व्यक्तिगत जानकारी कैसे एकत्र, उपयोग और सुरक्षित करते हैं — भारत के
      डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम 2023 के अनुसार।
    </p>

    <h2>1. हम क्या जानकारी एकत्र करते हैं</h2>
    <ul>
      <li><strong>संपर्क जानकारी:</strong> नाम, फोन नंबर, ईमेल पता।</li>
      <li><strong>शैक्षणिक डेटा:</strong> कोर्स में रुचि, केंद्र वरीयता, रोल नंबर, प्रमाण-पत्र संख्या, परीक्षा परिणाम।</li>
      <li><strong>वित्तीय डेटा:</strong> शुल्क भुगतान रिकॉर्ड (कोई कार्ड या बैंक विवरण हमारे सर्वर पर संग्रहीत नहीं होता)।</li>
      <li><strong>उपयोग डेटा:</strong> देखे गए पृष्ठ, खोज प्रश्न, डिवाइस प्रकार, IP पता।</li>
    </ul>

    <h2>2. प्रयोजन और सहमति</h2>
    <ul>
      <li>आपकी पूछताछ का जवाब देने और प्रवेश में मदद करने के लिए।</li>
      <li>प्रमाण-पत्र जारी करने और सत्यापन सेवाएं प्रदान करने के लिए।</li>
      <li>शुल्क भुगतान संसाधित करने और कानूनी अभिलेख बनाए रखने के लिए।</li>
      <li>OTP, परिणाम और शुल्क अनुस्मारक जैसे लेन-देन संबंधी संदेश भेजने के लिए।</li>
      <li>आपकी स्पष्ट सहमति से प्रचार संचार भेजने के लिए।</li>
    </ul>
    <p>18 वर्ष से कम आयु के उपयोगकर्ताओं के लिए माता-पिता या अभिभावक की सत्यापित सहमति ली जाती है।</p>

    <h2>3. डेटा साझाकरण</h2>
    <p>
      हम आपका व्यक्तिगत डेटा नहीं बेचते। हम इसे केवल फ्रेंचाइज़ केंद्रों,
      सेवा प्रदाताओं, भुगतान प्रोसेसर और कानूनी आवश्यकता पर साझा कर सकते हैं।
    </p>

    <h2>4. डेटा प्रतिधारण</h2>
    <ul>
      <li><strong>प्रमाण-पत्र रिकॉर्ड:</strong> आजीवन सत्यापन के लिए स्थायी रूप से।</li>
      <li><strong>वित्तीय रिकॉर्ड:</strong> भारतीय कर कानून के अनुसार 7 वर्ष।</li>
      <li><strong>छात्र PII:</strong> नामांकन की अवधि और उसके बाद अधिकतम 3 वर्ष।</li>
    </ul>

    <h2>5. DPDP अधिनियम 2023 के तहत आपके अधिकार</h2>
    <p>आप अपना डेटा देख, सुधार, या हटाने का अनुरोध कर सकते हैं।</p>
    <p>
      संपर्क करें:{" "}
      <a href="mailto:privacy@computrain.in">privacy@computrain.in</a>
      {" "}— हम 30 दिनों के भीतर उत्तर देंगे।
    </p>

    <h2>6. सुरक्षा</h2>
    <p>
      हम HTTPS, सर्वर-साइड प्रमाणीकरण, एन्क्रिप्टेड स्टोरेज और रेट-लिमिटिंग सहित
      उद्योग-मानक सुरक्षा उपाय लागू करते हैं।
    </p>

    <h2>7. संपर्क / डेटा संरक्षण अधिकारी</h2>
    <p>
      CompuTrain, हेड ऑफ़िस, नई दिल्ली, भारत।{" "}
      <a href="mailto:privacy@computrain.in">privacy@computrain.in</a>
    </p>
  </div>
);

export default function PrivacyPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-3xl font-extrabold text-gray-900">Privacy Policy</h1>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm shrink-0">
          <button
            onClick={() => setLang("en")}
            className={`px-4 py-2 font-medium transition-colors ${lang === "en" ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("hi")}
            className={`px-4 py-2 font-medium transition-colors ${lang === "hi" ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            हिंदी
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-8">Last updated: {lastUpdated}</p>

      {lang === "en" ? EN_CONTENT : HI_CONTENT}
    </div>
  );
}

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Use",
  description: "Terms and conditions for using the CompuTrain platform.",
  path: "/legal/terms",
});

// DEMO VERSION — replace all placeholder text with lawyer-reviewed content before final launch.
const lastUpdated = "August 2026";
const companyName = "CompuTrain";
const contactEmail = "legal@computrain.in";
const grievanceOfficerCity = "New Delhi";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Use</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: {lastUpdated}</p>

      <div className="prose prose-gray max-w-none">
        <p>
          By accessing or using the {companyName} website and services, you agree to be
          bound by these Terms of Use. Please read them carefully before proceeding. If
          you do not agree, please discontinue use of the platform immediately.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          These Terms of Use constitute a legally binding agreement between you
          (&ldquo;User&rdquo;) and {companyName} (&ldquo;Company&rdquo;,
          &ldquo;We&rdquo;, &ldquo;Our&rdquo;). By accessing our website, submitting
          an enquiry, registering an account, or enrolling through any affiliated
          franchise center, you agree to comply with and be bound by these terms.
        </p>

        <h2>2. Description of Services</h2>
        <p>
          {companyName} operates a franchise network of authorised computer and
          vocational training centers across India. Our platform provides:
        </p>
        <ul>
          <li>Course and center information</li>
          <li>Online enquiry submission and admission workflows</li>
          <li>Student learning management, exam, and results access</li>
          <li>Digital certificate issuance and public verification</li>
          <li>Fee collection and installment tracking</li>
        </ul>
        <p>
          Actual training is conducted at independently operated franchise centers.
          {companyName} Head Office sets curriculum standards and quality benchmarks
          but does not directly deliver classroom instruction.
        </p>

        <h2>3. User Accounts and Eligibility</h2>
        <p>
          To access student or teacher features you must create an account using a
          valid Indian mobile number. You are responsible for keeping your login
          credentials confidential. You must be at least 13 years old to register;
          users under 18 require guardian consent as detailed in our Privacy Policy.
        </p>

        <h2>4. User Obligations</h2>
        <p>You agree to:</p>
        <ul>
          <li>Provide accurate, current information when registering or submitting enquiries.</li>
          <li>Use certificate verification services only for lawful purposes.</li>
          <li>Not attempt to circumvent, manipulate, or abuse the exam or verification system.</li>
          <li>Not reproduce, redistribute, or commercially exploit any content without written permission.</li>
          <li>Not upload, post, or transmit any content that is unlawful, harmful, or infringes third-party rights.</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          All content on this platform — including text, graphics, course materials,
          exam questions, certificates, and trademarks — is the property of{" "}
          {companyName} or its licensors and is protected under applicable Indian and
          international intellectual property laws. Unauthorised use is strictly prohibited.
        </p>

        <h2>6. Fees and Payments</h2>
        <p>
          Course fees are determined by the franchise center at the time of enrollment
          in accordance with {companyName} guidelines. Online payments are processed
          through a third-party payment gateway. In the event of a technical failure,
          please retain your payment reference and contact your center immediately.
          Refund terms are governed by our separate Refund Policy.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          To the extent permitted by applicable law, {companyName} shall not be liable
          for any direct, indirect, incidental, or consequential damages arising from
          your use of this platform. Individual franchise centers operate independently;{" "}
          {companyName} is not liable for their day-to-day operations, representations,
          or failures.
        </p>

        <h2>8. Disclaimer of Warranties</h2>
        <p>
          The platform and services are provided &ldquo;as is&rdquo; without warranties
          of any kind, express or implied. We do not guarantee uninterrupted availability,
          error-free operation, or the accuracy of third-party content.
        </p>

        <h2>9. Third-Party Links</h2>
        <p>
          Our platform may contain links to third-party websites. We are not responsible
          for the content, privacy practices, or terms of those sites.
        </p>

        <h2>10. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account if you violate these
          Terms or engage in conduct that is harmful to other users, the platform, or
          the Company.
        </p>

        <h2>11. Governing Law and Disputes</h2>
        <p>
          These Terms are governed by the laws of India. Any disputes shall be subject
          to the exclusive jurisdiction of courts in {grievanceOfficerCity}, India.
          We encourage attempting to resolve disputes informally by contacting us first.
        </p>

        <h2>12. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will update the
          &ldquo;Last updated&rdquo; date and, for material changes, notify registered
          users by SMS or in-app notice. Continued use constitutes acceptance.
        </p>

        <h2>13. Contact</h2>
        <p>
          Grievance Officer: {companyName}, Head Office, {grievanceOfficerCity}, India.{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
      </div>
    </div>
  );
}

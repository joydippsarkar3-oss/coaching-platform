import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Refund Policy",
  description: "CompuTrain refund and cancellation policy for course fees.",
  path: "/legal/refund",
});

// DEMO VERSION — confirm exact timelines and amounts with operations team before final launch.
const lastUpdated = "August 2026";
const companyName = "CompuTrain";
const grievanceEmail = "refunds@computrain.in";
const grievanceOfficerCity = "New Delhi";

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Refund Policy</h1>
      <p className="text-sm text-gray-500 mb-10">Last updated: {lastUpdated}</p>

      <div className="prose prose-gray max-w-none">
        <p>
          This Refund Policy applies to fees paid for courses offered through the{" "}
          {companyName} franchise network. Please read it carefully before making any
          payment. By enrolling, you confirm that you have read and understood this policy.
        </p>

        <h2>1. Fee Collection</h2>
        <p>
          Course fees are collected by the authorised franchise center at the time of
          enrollment, or in installments as agreed at admission. {companyName} Head
          Office may also collect fees directly via the online platform on behalf of
          the center, in accordance with RBI Payment Aggregator guidelines.
        </p>

        <h2>2. Cancellation Before Course Commencement</h2>
        <table>
          <thead>
            <tr>
              <th>Cancellation Notice</th>
              <th>Refund</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>More than 7 days before course start</td>
              <td>Full refund, less ₹500 administrative charge</td>
            </tr>
            <tr>
              <td>3–7 days before course start</td>
              <td>50% of fees paid</td>
            </tr>
            <tr>
              <td>Less than 3 days before course start</td>
              <td>No refund</td>
            </tr>
          </tbody>
        </table>

        <h2>3. Cancellation After Course Commencement</h2>
        <table>
          <thead>
            <tr>
              <th>Timing</th>
              <th>Refund</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Within first 7 days of course start</td>
              <td>25% of remaining fee (excluding materials provided)</td>
            </tr>
            <tr>
              <td>After 7 days of course start</td>
              <td>No refund</td>
            </tr>
          </tbody>
        </table>

        <h2>4. Center Closure or Course Discontinuation</h2>
        <p>
          If a franchise center closes or a course is discontinued before completion
          due to reasons within the center&apos;s control, students are entitled to a
          pro-rated refund for the uncompleted portion, or a no-cost transfer to the
          nearest authorised alternate center (subject to availability).
        </p>

        <h2>5. Non-Refundable Items</h2>
        <ul>
          <li>Registration and admission fees (charged separately)</li>
          <li>Examination fees once the examination has been conducted</li>
          <li>Certificate issuance charges after the certificate has been generated</li>
          <li>Study materials and kit once handed over to the student</li>
          <li>Payment gateway transaction charges (absorbed by the platform)</li>
        </ul>

        <h2>6. Online Payment Refunds</h2>
        <p>
          Refunds for payments made via UPI, card, or net banking will be credited to
          the original payment source within <strong>5–7 business days</strong> from
          approval. For cash payments, refunds are made in cash or by bank transfer to
          the student&apos;s account within 15 business days.
        </p>

        <h2>7. How to Request a Refund</h2>
        <ol>
          <li>Submit a written request to the center where you enrolled, or email <a href={`mailto:${grievanceEmail}`}>{grievanceEmail}</a>.</li>
          <li>Include your enrollment ID, payment receipt, reason for cancellation, and bank details (for NEFT refunds).</li>
          <li>The center or head office will acknowledge within 3 business days.</li>
          <li>Eligible refunds are processed within 15 business days of approval.</li>
        </ol>

        <h2>8. Escalation</h2>
        <p>
          If your refund request is unresolved after 15 business days, escalate to{" "}
          {companyName}&apos;s Grievance Officer at{" "}
          <a href={`mailto:${grievanceEmail}`}>{grievanceEmail}</a>. We will respond
          within 7 business days. Our decision on escalated disputes is final and binding.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          {companyName} reserves the right to modify this policy at any time.
          Changes take effect upon publication on this page. The &ldquo;Last
          updated&rdquo; date will reflect the most recent revision.
        </p>

        <h2>10. Contact</h2>
        <p>
          Grievance Officer: {companyName}, Head Office, {grievanceOfficerCity}, India.{" "}
          <a href={`mailto:${grievanceEmail}`}>{grievanceEmail}</a>
        </p>
      </div>
    </div>
  );
}

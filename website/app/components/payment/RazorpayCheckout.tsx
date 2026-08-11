'use client';

/**
 * RazorpayCheckout
 *
 * Loads Razorpay.js on first mount, then opens the standard Razorpay checkout
 * modal when the user clicks "Pay Now".
 *
 * Usage:
 *   <RazorpayCheckout
 *     orderId="order_XXXXXXXXXX"          // from POST /payments/orders
 *     amountPaise={150000}                // e.g. ₹1,500.00
 *     description="Course fee – Batch A"
 *     studentName="Ravi Kumar"
 *     studentEmail="ravi@example.com"
 *     studentPhone="9876543210"
 *     onSuccess={(response) => router.push('/fees/receipt')}
 *     onFailure={(err) => setError(err.description)}
 *   />
 *
 * Environment:
 *   NEXT_PUBLIC_RAZORPAY_KEY_ID — set in .env.local before going live
 *   Falls back to a clearly labelled "TEST MODE" badge when the key is absent.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata?: { order_id?: string; payment_id?: string };
}

export interface RazorpayCheckoutProps {
  /** Razorpay order ID returned by your backend POST /payments/orders */
  orderId: string;
  /** Amount in paise (integer). Must match what the backend order was created with. */
  amountPaise: number;
  description?: string;
  studentName?: string;
  studentEmail?: string;
  /** 10-digit Indian mobile number, no country code */
  studentPhone?: string;
  /** Called when payment succeeds. Use response to call your verify endpoint. */
  onSuccess: (response: RazorpayResponse) => void;
  /** Called when the user closes the modal or payment fails. */
  onFailure?: (error: RazorpayError) => void;
  /** Custom button label */
  label?: string;
  disabled?: boolean;
}

// ─── Razorpay SDK loader (idempotent) ────────────────────────────────────────

const RAZORPAY_SDK_URL = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpaySdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if ((window as any).Razorpay) return resolve();

    const existing = document.querySelector(`script[src="${RAZORPAY_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Razorpay SDK failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
    document.head.appendChild(script);
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RazorpayCheckout({
  orderId,
  amountPaise,
  description = 'Course fee',
  studentName,
  studentEmail,
  studentPhone,
  onSuccess,
  onFailure,
  label = 'Pay Now',
  disabled = false,
}: RazorpayCheckoutProps) {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '';
  const isTestMode = !keyId;

  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const rzpRef = useRef<any>(null);

  // Load SDK on mount
  useEffect(() => {
    loadRazorpaySdk()
      .then(() => setSdkReady(true))
      .catch((e) => setSdkError(e.message));
  }, []);

  const openCheckout = useCallback(() => {
    if (!sdkReady || !(window as any).Razorpay) {
      setSdkError('Payment SDK not ready. Please refresh and try again.');
      return;
    }

    setLoading(true);

    const options = {
      key: keyId || 'rzp_test_PLACEHOLDER',
      amount: amountPaise,
      currency: 'INR',
      order_id: orderId,
      name: 'CompuTrain',
      description,
      image: '/logo.png',
      prefill: {
        name: studentName ?? '',
        email: studentEmail ?? '',
        contact: studentPhone ? `+91${studentPhone}` : '',
      },
      theme: { color: '#4f46e5' },
      modal: {
        // Called when the user closes the modal without paying
        ondismiss: () => {
          setLoading(false);
          onFailure?.({
            code: 'MODAL_DISMISSED',
            description: 'Payment cancelled by user.',
            source: 'checkout',
            step: 'payment_initiation',
            reason: 'user_cancelled',
          });
        },
      },
      handler: (response: RazorpayResponse) => {
        setLoading(false);
        onSuccess(response);
      },
    };

    rzpRef.current = new (window as any).Razorpay(options);

    rzpRef.current.on('payment.failed', (data: { error: RazorpayError }) => {
      setLoading(false);
      onFailure?.(data.error);
    });

    rzpRef.current.open();
  }, [sdkReady, keyId, amountPaise, orderId, description, studentName, studentEmail, studentPhone, onSuccess, onFailure]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { rzpRef.current?.close?.(); };
  }, []);

  const amountRupees = (amountPaise / 100).toFixed(2);

  return (
    <div className="flex flex-col items-start gap-2">
      {isTestMode && (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-0.5 text-xs font-semibold text-yellow-800">
          <svg className="size-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          TEST MODE — add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.local
        </span>
      )}

      {sdkError && (
        <p className="text-sm text-red-600" role="alert">{sdkError}</p>
      )}

      <button
        type="button"
        onClick={openCheckout}
        disabled={disabled || loading || !!sdkError || !sdkReady}
        aria-busy={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
            </svg>
            Opening payment…
          </>
        ) : (
          <>
            <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 0 0 1 5.5v1h18v-1A1.5 1.5 0 0 0 17.5 4h-15ZM19 8.5H1v6A1.5 1.5 0 0 0 2.5 16h15a1.5 1.5 0 0 0 1.5-1.5v-6ZM3 13.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Zm4.75-.75a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5h-3.5Z" clipRule="evenodd" />
            </svg>
            {label} — ₹{amountRupees}
          </>
        )}
      </button>

      <p className="text-xs text-gray-400">
        Powered by Razorpay. UPI · Cards · Net Banking · Wallets.
      </p>
    </div>
  );
}

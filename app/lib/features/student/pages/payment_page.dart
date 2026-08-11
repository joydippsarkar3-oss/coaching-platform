import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/api/api_service.dart';
import '../../../core/api/models/api_models.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

/// Args passed via GoRouter extra: { enrollmentId, amountPaise, description }
class PaymentArgs {
  final String enrollmentId;
  final int amountPaise;
  final String description;

  const PaymentArgs({
    required this.enrollmentId,
    required this.amountPaise,
    required this.description,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

/// Full-screen Razorpay checkout via WebView.
///
/// Flow:
///   1. Call POST /payments/orders → get orderId + keyId
///   2. Load hosted checkout HTML that calls Razorpay.js
///   3. Listen for JS→Flutter postMessage on success/failure
///   4. On success: navigate to receipt; on failure: show snackbar + pop
///
/// To go live, set NEXT_PUBLIC_RAZORPAY_KEY_ID in website/.env.local.
/// The Flutter app itself does not need any Razorpay key.
class PaymentPage extends ConsumerStatefulWidget {
  final PaymentArgs args;

  const PaymentPage({super.key, required this.args});

  @override
  ConsumerState<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends ConsumerState<PaymentPage> {
  late final WebViewController _controller;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initCheckout();
  }

  Future<void> _initCheckout() async {
    try {
      final api = ref.read(apiServiceProvider);
      // POST /payments/orders → { orderId, keyId, amountPaise }
      final order = await api.createPaymentOrder(
        enrollmentId: widget.args.enrollmentId,
        amountPaise: widget.args.amountPaise,
        description: widget.args.description,
      );

      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..addJavaScriptChannel(
          'FlutterChannel',
          onMessageReceived: _onJsMessage,
        )
        ..loadHtmlString(_buildCheckoutHtml(order));

      if (mounted) setState(() => _loading = false);
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
      }
    }
  }

  void _onJsMessage(JavaScriptMessage message) {
    final raw = message.message;

    if (raw.startsWith('SUCCESS:')) {
      // Format: SUCCESS:{razorpay_payment_id}|{razorpay_order_id}|{razorpay_signature}
      final parts = raw.substring(8).split('|');
      if (parts.length == 3) {
        context.go('/student/fees/receipt', extra: {
          'paymentId': parts[0],
          'orderId': parts[1],
          'signature': parts[2],
        });
        return;
      }
    }

    if (raw.startsWith('FAILURE:')) {
      final desc = raw.substring(8);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Payment failed: $desc'),
          backgroundColor: Colors.red.shade700,
        ),
      );
      context.pop();
    }

    if (raw == 'DISMISSED') {
      context.pop();
    }
  }

  /// Inline HTML page that loads Razorpay.js and immediately opens the modal.
  String _buildCheckoutHtml(PaymentOrder order) {
    final amountRupees = (order.amountPaise / 100).toStringAsFixed(2);
    return '''
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Checkout</title>
  <style>
    body {
      margin: 0;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 360px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    h2 { color: #111; margin: 0 0 8px; }
    p  { color: #666; font-size: 14px; margin: 0 0 24px; }
    .amount { font-size: 32px; font-weight: 700; color: #4f46e5; margin: 0 0 8px; }
    button {
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 12px;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .note { font-size: 12px; color: #aaa; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>CompuTrain</h2>
    <p>${widget.args.description}</p>
    <div class="amount">₹$amountRupees</div>
    <p>UPI · Cards · Net Banking · Wallets</p>
    <button id="payBtn" onclick="openCheckout()">Pay Now</button>
    <div class="note">Secured by Razorpay</div>
  </div>

  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function openCheckout() {
      document.getElementById('payBtn').disabled = true;

      var options = {
        key:      '${order.keyId}',
        amount:   ${order.amountPaise},
        currency: 'INR',
        order_id: '${order.orderId}',
        name:     'CompuTrain',
        description: '${widget.args.description}',
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: function() {
            FlutterChannel.postMessage('DISMISSED');
          }
        },
        handler: function(response) {
          FlutterChannel.postMessage(
            'SUCCESS:' +
            response.razorpay_payment_id + '|' +
            response.razorpay_order_id   + '|' +
            response.razorpay_signature
          );
        }
      };

      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function(data) {
        document.getElementById('payBtn').disabled = false;
        FlutterChannel.postMessage('FAILURE:' + data.error.description);
      });

      rzp.open();
    }

    // Auto-open once the SDK is ready
    window.addEventListener('load', function() { openCheckout(); });
  </script>
</body>
</html>
''';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Secure Payment'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          tooltip: 'Cancel',
          onPressed: () => context.pop(),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Preparing checkout…'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              const Text(
                'Could not start payment',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              FilledButton.tonal(
                onPressed: () {
                  setState(() { _error = null; _loading = true; });
                  _initCheckout();
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return WebViewWidget(controller: _controller);
  }
}

import "dart:async";

import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/navigation/routes.dart";
import "../../../core/theme/app_theme.dart";

const _privacyNotice = """
Brand Training App — Privacy Notice

1. Data We Collect
We collect your name, mobile number, date of birth, and course enrollment details to provide educational services. We collect device identifiers for security and fraud prevention.

2. How We Use Your Data
Your data is used to manage your enrollment, deliver course content, process payments, issue certificates, and communicate about your progress. We do not sell your personal data to third parties.

3. Data Storage
Your data is stored on secure servers in India. Exam answers are temporarily stored on your device and synced when you are online. Cached course materials remain on your device until you clear app data.

4. Guardian Consent (Students Under 18)
If you are under 18 years of age, we require a parent or guardian to provide consent before you can use the app. We will contact your guardian at the mobile number you provide.

5. Your Rights
You have the right to access, correct, or request deletion of your personal data. Contact support@brand-training.example.com for any data requests.

6. Cookies and Analytics
The app uses analytics to improve performance and user experience. No advertising cookies are used.

7. Changes to This Notice
We will notify you of material changes to this privacy notice through the app.

8. Contact
For privacy concerns, contact: privacy@brand-training.example.com

By continuing, you confirm you have read and understood this notice.
""";

class ConsentPage extends ConsumerStatefulWidget {
  const ConsentPage({super.key});

  @override
  ConsumerState<ConsentPage> createState() => _ConsentPageState();
}

class _ConsentPageState extends ConsumerState<ConsentPage> {
  final _scrollCtrl = ScrollController();
  bool _scrolledToBottom = false;
  bool _showGuardianFlow = false;
  bool _consentSent = false;
  int _resendCountdown = 0;
  Timer? _resendTimer;

  final _guardianNameCtrl = TextEditingController();
  final _guardianPhoneCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollCtrl.removeListener(_onScroll);
    _scrollCtrl.dispose();
    _guardianNameCtrl.dispose();
    _guardianPhoneCtrl.dispose();
    _resendTimer?.cancel();
    super.dispose();
  }

  void _onScroll() {
    if (_scrolledToBottom) return;
    final pos = _scrollCtrl.position;
    if (pos.pixels >= pos.maxScrollExtent - 20) {
      setState(() => _scrolledToBottom = true);
    }
  }

  void _startResendTimer() {
    setState(() => _resendCountdown = 60);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_resendCountdown <= 1) {
        t.cancel();
        if (mounted) setState(() => _resendCountdown = 0);
      } else {
        setState(() => _resendCountdown--);
      }
    });
  }

  Future<void> _sendGuardianConsent() async {
    if (!_formKey.currentState!.validate()) return;
    // TODO: call API to send guardian consent request
    setState(() => _consentSent = true);
    _startResendTimer();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text("Privacy Notice")),
      body: SafeArea(
        child: Column(
          children: [
            // Privacy notice scroll area
            Expanded(
              child: SingleChildScrollView(
                controller: _scrollCtrl,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Privacy Notice",
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      "Please read carefully before proceeding",
                      style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: Text(
                        _privacyNotice,
                        style: const TextStyle(
                          fontSize: 13,
                          height: 1.6,
                          color: Color(0xFF374151),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Guardian flow toggle
                    OutlinedButton.icon(
                      onPressed: () =>
                          setState(() => _showGuardianFlow = !_showGuardianFlow),
                      icon: Icon(
                        _showGuardianFlow
                            ? Icons.expand_less
                            : Icons.family_restroom,
                      ),
                      label: const Text("I am under 18 — Guardian consent"),
                    ),

                    if (_showGuardianFlow) ...[
                      const SizedBox(height: 16),
                      _buildGuardianFlow(),
                    ],

                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),

            // Bottom CTA
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!_scrolledToBottom)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 8),
                      child: Text(
                        "Scroll to the bottom to enable",
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF9CA3AF),
                        ),
                      ),
                    ),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _scrolledToBottom && !_showGuardianFlow
                          ? () => context.go(Routes.studentHome)
                          : null,
                      child: const Text("I Agree & Continue"),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGuardianFlow() {
    if (_consentSent) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFBBF7D0)),
        ),
        child: Column(
          children: [
            const Icon(Icons.hourglass_top, color: AppTheme.successGreen),
            const SizedBox(height: 8),
            const Text(
              "Waiting for guardian approval…",
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Color(0xFF166534),
              ),
            ),
            const SizedBox(height: 12),
            _resendCountdown > 0
                ? Text(
                    "Resend in ${_resendCountdown}s",
                    style: const TextStyle(color: Color(0xFF6B7280)),
                  )
                : TextButton(
                    onPressed: _sendGuardianConsent,
                    child: const Text("Resend"),
                  ),
          ],
        ),
      );
    }

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            controller: _guardianNameCtrl,
            decoration: const InputDecoration(labelText: "Guardian full name"),
            validator: (v) =>
                (v == null || v.trim().isEmpty) ? "Enter guardian name" : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _guardianPhoneCtrl,
            keyboardType: TextInputType.phone,
            maxLength: 10,
            decoration: const InputDecoration(
              labelText: "Guardian mobile number",
              prefixText: "+91  ",
              counterText: "",
            ),
            validator: (v) =>
                (v == null || v.trim().length != 10) ? "Enter valid number" : null,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _sendGuardianConsent,
            child: const Text("Send Consent Request to Guardian"),
          ),
        ],
      ),
    );
  }
}

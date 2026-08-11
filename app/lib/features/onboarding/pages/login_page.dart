import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/auth/auth_notifier.dart";
import "../../../core/auth/auth_state.dart";
import "../../../core/auth/secure_storage.dart";
import "../../../core/navigation/routes.dart";
import "../../../core/theme/app_theme.dart";

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _phoneFocus = FocusNode();
  final _otpFocus = FocusNode();
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _otpSent = false;
  bool _canUseBiometric = false;

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    final storage = ref.read(secureStorageProvider);
    final enabled = await storage.getBiometricEnabled();
    final phone = await storage.getPhone();
    if (enabled && phone != null && mounted) {
      setState(() {
        _canUseBiometric = true;
        _phoneCtrl.text = phone;
      });
    }
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
    _phoneFocus.dispose();
    _otpFocus.dispose();
    super.dispose();
  }

  String? _validatePhone(String? v) {
    if (v == null || v.trim().length != 10) {
      return "Enter a valid 10-digit number";
    }
    return null;
  }

  String? _validateOtp(String? v) {
    if (v == null || v.trim().length != 6) {
      return "Enter the 6-digit OTP";
    }
    return null;
  }

  Future<void> _requestOtp() async {
    if (!_formKey.currentState!.validate()) return;
    await ref
        .read(authNotifierProvider.notifier)
        .requestOtp("+91${_phoneCtrl.text.trim()}");
  }

  Future<void> _verifyOtp() async {
    if (!_formKey.currentState!.validate()) return;
    await ref
        .read(authNotifierProvider.notifier)
        .verifyOtp("+91${_phoneCtrl.text.trim()}", _otpCtrl.text.trim());
  }

  Future<void> _biometricUnlock() async {
    final ok = await ref.read(authNotifierProvider.notifier).biometricUnlock();
    if (!ok || !mounted) return;
    // Biometric OK — attempt OTP flow starting with stored phone
    await _requestOtp();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);

    ref.listen(authNotifierProvider, (_, next) {
      if (!mounted) return;
      if (next.status == AuthStatus.otpSent && !_otpSent) {
        setState(() => _otpSent = true);
        _otpFocus.requestFocus();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("OTP sent to +91 ${_phoneCtrl.text.trim()}"),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      if (next.isAuthenticated) {
        context.go(
          next.isTeacher ? Routes.teacherToday : Routes.studentHome,
        );
      }
      if (next.status == AuthStatus.error && next.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage!),
            backgroundColor: AppTheme.errorRed,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    });

    final loading = authState.isLoading;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppTheme.brandBlue,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child:
                      const Icon(Icons.school, color: Colors.white, size: 36),
                ),
                const SizedBox(height: 24),
                const Text(
                  "Welcome Back",
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  "Enter your registered mobile number",
                  style: TextStyle(fontSize: 16, color: Color(0xFF6B7280)),
                ),
                const SizedBox(height: 32),

                // Phone field
                TextFormField(
                  controller: _phoneCtrl,
                  focusNode: _phoneFocus,
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  enabled: !_otpSent && !loading,
                  validator: _validatePhone,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(
                    prefixText: "+91  ",
                    labelText: "Mobile Number",
                    hintText: "10-digit mobile number",
                    counterText: "",
                  ),
                ),
                const SizedBox(height: 16),

                // OTP field (shown after requesting OTP)
                if (_otpSent) ...[
                  TextFormField(
                    controller: _otpCtrl,
                    focusNode: _otpFocus,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    enabled: !loading,
                    validator: _validateOtp,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      labelText: "OTP",
                      hintText: "6-digit OTP",
                      counterText: "",
                      // SMS Retriever API reads SMS automatically on device
                      // No manual copy needed; handled natively
                    ),
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: loading
                          ? null
                          : () {
                              setState(() => _otpSent = false);
                              _otpCtrl.clear();
                            },
                      child: const Text("Change Number"),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Primary CTA
                ElevatedButton(
                  onPressed: loading
                      ? null
                      : (_otpSent ? _verifyOtp : _requestOtp),
                  child: loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(_otpSent ? "Verify OTP" : "Get OTP"),
                ),

                // WhatsApp fallback
                if (!_otpSent) ...[
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: loading ? null : () {
                      // WhatsApp OTP fallback — same API, different channel flag
                      // TODO: call requestOtp with channel=whatsapp
                    },
                    icon: const Icon(Icons.message, size: 18),
                    label: const Text("Receive OTP on WhatsApp instead"),
                  ),
                ],

                // Biometric unlock for returning users
                if (_canUseBiometric && !_otpSent) ...[
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 8),
                  TextButton.icon(
                    onPressed: loading ? null : _biometricUnlock,
                    icon: const Icon(Icons.fingerprint),
                    label: const Text("Unlock with Biometric"),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

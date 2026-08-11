import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:qr_code_scanner/qr_code_scanner.dart";

import "../../../core/api/api_service.dart";
import "../../../core/auth/auth_notifier.dart";
import "../../../core/navigation/routes.dart";
import "../../../core/theme/app_theme.dart";

class LinkIdentityPage extends ConsumerStatefulWidget {
  const LinkIdentityPage({super.key});

  @override
  ConsumerState<LinkIdentityPage> createState() => _LinkIdentityPageState();
}

class _LinkIdentityPageState extends ConsumerState<LinkIdentityPage> {
  final _codeCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final _qrKey = GlobalKey(debugLabel: "QR");

  bool _scanning = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _linkCenter(String code) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ref.read(apiServiceProvider);
      await api.linkCenter(centerCode: code.trim());
      if (mounted) context.go(Routes.consent);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = "Could not link center. Check the code and try again.";
          _loading = false;
        });
      }
    }
  }

  void _onQrDetect(Barcode barcode) {
    final code = barcode.code;
    if (code != null && code.isNotEmpty) {
      setState(() => _scanning = false);
      _linkCenter(code);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: const Text("Join Your Center")),
      body: _scanning ? _buildScanner() : _buildForm(),
    );
  }

  Widget _buildForm() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              const Icon(Icons.business, size: 64, color: AppTheme.brandBlue),
              const SizedBox(height: 24),
              const Text(
                "Join Your Center",
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "Enter the center code given by your institute",
                style: TextStyle(fontSize: 15, color: Color(0xFF6B7280)),
              ),
              const SizedBox(height: 32),

              TextFormField(
                controller: _codeCtrl,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  labelText: "Center Code",
                  hintText: "e.g. BT-DL-001",
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? "Enter center code" : null,
              ),

              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  style: const TextStyle(color: AppTheme.errorRed, fontSize: 13),
                ),
              ],

              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _loading
                    ? null
                    : () {
                        if (_formKey.currentState!.validate()) {
                          _linkCenter(_codeCtrl.text);
                        }
                      },
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child:
                            CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text("Link Center"),
              ),

              const SizedBox(height: 16),

              OutlinedButton.icon(
                onPressed: _loading
                    ? null
                    : () => setState(() => _scanning = true),
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text("Scan QR Code"),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildScanner() {
    return Stack(
      children: [
        QRView(
          key: _qrKey,
          onQRViewCreated: (controller) {
            controller.scannedDataStream.listen(_onQrDetect);
          },
          overlay: QrScannerOverlayShape(
            borderColor: AppTheme.brandBlue,
            borderRadius: 12,
            borderLength: 30,
            borderWidth: 6,
            cutOutSize: MediaQuery.of(context).size.width * 0.7,
          ),
        ),
        SafeArea(
          child: Align(
            alignment: Alignment.topLeft,
            child: IconButton(
              onPressed: () => setState(() => _scanning = false),
              icon: const Icon(Icons.arrow_back, color: Colors.white),
            ),
          ),
        ),
        const Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: EdgeInsets.only(bottom: 48),
            child: Text(
              "Point at the center QR code",
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
          ),
        ),
      ],
    );
  }
}

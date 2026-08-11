import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:url_launcher/url_launcher.dart";

import "../../../core/api/api_service.dart";
import "../../../core/api/models/api_models.dart";
import "../../../core/theme/app_theme.dart";
import "../../../core/utils/date_utils.dart";
import "../../../core/utils/money_formatter.dart";
import "../../shared/widgets/empty_state.dart";
import "../../shared/widgets/loading_shimmer.dart";
import "../providers/student_providers.dart";

class FeesPage extends ConsumerWidget {
  const FeesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feesAsync = ref.watch(feeInstallmentsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Fees")),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(feeInstallmentsProvider),
        child: feesAsync.when(
          data: (fees) => fees.isEmpty
              ? const EmptyState(
                  message: "All fees up to date!",
                  icon: Icons.check_circle_outline,
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: fees.length,
                  itemBuilder: (ctx, i) => _InstallmentCard(
                    installment: fees[i],
                    onPayTap: () => _showPaymentSheet(ctx, ref, fees[i]),
                  ),
                ),
          loading: () => LoadingShimmer.list(count: 4, height: 96),
          error: (e, _) => EmptyState(
            message: "Could not load fees: $e",
            icon: Icons.error_outline,
          ),
        ),
      ),
    );
  }

  void _showPaymentSheet(
    BuildContext context,
    WidgetRef ref,
    FeeInstallment installment,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _PaymentBottomSheet(
        installment: installment,
        ref: ref,
      ),
    );
  }
}

class _InstallmentCard extends StatelessWidget {
  const _InstallmentCard({
    required this.installment,
    required this.onPayTap,
  });
  final FeeInstallment installment;
  final VoidCallback onPayTap;

  Color get _statusColor {
    switch (installment.status) {
      case "overdue":
        return AppTheme.feeOverdue;
      case "upcoming":
        return AppTheme.feePending;
      case "paid":
        return AppTheme.feePaid;
      default:
        return const Color(0xFF6B7280);
    }
  }

  String get _statusLabel {
    switch (installment.status) {
      case "overdue":
        return "Overdue";
      case "upcoming":
        return "Upcoming";
      case "paid":
        return "Paid";
      default:
        return installment.status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  installment.courseTitle,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: Color(0xFF111827),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _statusLabel,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: _statusColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                formatPaiseCompact(installment.amountPaise),
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                  color: Color(0xFF111827),
                ),
              ),
              const Spacer(),
              if (installment.isPaid)
                Text(
                  "Paid ${AppDateUtils.humanDate(installment.paidAt!)}",
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.feePaid,
                  ),
                )
              else
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      "Due ${AppDateUtils.humanDate(installment.dueDate)}",
                      style: TextStyle(
                        fontSize: 13,
                        color: _statusColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    ElevatedButton(
                      onPressed: onPayTap,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _statusColor,
                        minimumSize: const Size(80, 32),
                        padding:
                            const EdgeInsets.symmetric(horizontal: 14),
                        textStyle: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700),
                      ),
                      child: const Text("Pay Now"),
                    ),
                  ],
                ),
            ],
          ),
          if (installment.isPaid && installment.receiptUrl != null) ...[
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () =>
                  launchUrl(Uri.parse(installment.receiptUrl!)),
              icon: const Icon(Icons.download, size: 16),
              label: const Text("Download Receipt"),
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PaymentBottomSheet extends StatefulWidget {
  const _PaymentBottomSheet({
    required this.installment,
    required this.ref,
  });
  final FeeInstallment installment;
  final WidgetRef ref;

  @override
  State<_PaymentBottomSheet> createState() => _PaymentBottomSheetState();
}

class _PaymentBottomSheetState extends State<_PaymentBottomSheet> {
  int _tab = 0; // 0=UPI, 1=QR, 2=Gateway
  bool _loading = true;
  PaymentOptions? _options;

  @override
  void initState() {
    super.initState();
    _loadOptions();
  }

  Future<void> _loadOptions() async {
    try {
      final opts = await widget.ref
          .read(apiServiceProvider)
          .getPaymentOptions(widget.installment.id);
      if (mounted) {
        setState(() {
          _options = opts;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFD1D5DB),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            "Pay ${formatPaiseCompact(widget.installment.amountPaise)}",
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Color(0xFF111827),
            ),
          ),
          Text(
            widget.installment.courseTitle,
            style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
          ),
          const SizedBox(height: 20),

          if (_loading)
            const Center(
                child: Padding(
              padding: EdgeInsets.all(32),
              child: CircularProgressIndicator(),
            ))
          else if (_options == null)
            const Text("Could not load payment options. Try again.")
          else ...[
            // Tab selector
            Row(
              children: [
                _TabBtn(label: "UPI App", selected: _tab == 0, onTap: () => setState(() => _tab = 0)),
                const SizedBox(width: 8),
                _TabBtn(label: "QR Code", selected: _tab == 1, onTap: () => setState(() => _tab = 1)),
                const SizedBox(width: 8),
                _TabBtn(label: "Online", selected: _tab == 2, onTap: () => setState(() => _tab = 2)),
              ],
            ),
            const SizedBox(height: 20),

            if (_tab == 0) ...[
              ElevatedButton.icon(
                onPressed: () => launchUrl(Uri.parse(_options!.upiDeepLink)),
                icon: const Icon(Icons.payment),
                label: const Text("Pay via UPI App"),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  backgroundColor: const Color(0xFF5B21B6),
                ),
              ),
            ] else if (_tab == 1) ...[
              Center(
                child: Image.network(
                  _options!.qrImageUrl,
                  width: 200,
                  height: 200,
                  errorBuilder: (_, __, ___) =>
                      const Icon(Icons.qr_code, size: 120),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "Scan with any UPI app",
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF6B7280)),
              ),
            ] else ...[
              ElevatedButton.icon(
                onPressed: () => launchUrl(Uri.parse(_options!.gatewayUrl),
                    mode: LaunchMode.inAppBrowserView),
                icon: const Icon(Icons.language),
                label: const Text("Pay Online"),
                style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(52)),
              ),
            ],
          ],
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _TabBtn extends StatelessWidget {
  const _TabBtn({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected
                ? AppTheme.brandBlue
                : const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : const Color(0xFF374151),
            ),
          ),
        ),
      ),
    );
  }
}

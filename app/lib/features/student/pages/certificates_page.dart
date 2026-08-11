import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:share_plus/share_plus.dart";
import "package:url_launcher/url_launcher.dart";

import "../../../core/api/models/api_models.dart";
import "../../../core/theme/app_theme.dart";
import "../../../core/utils/date_utils.dart";
import "../../shared/widgets/empty_state.dart";
import "../../shared/widgets/loading_shimmer.dart";
import "../providers/student_providers.dart";
import "../widgets/certificate_card.dart";

class CertificatesPage extends ConsumerWidget {
  const CertificatesPage({super.key, this.certNo});
  final String? certNo;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final certsAsync = ref.watch(certificatesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Certificates")),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(certificatesProvider),
        child: certsAsync.when(
          data: (certs) => certs.isEmpty
              ? const EmptyState(
                  message: "No certificates yet",
                  icon: Icons.workspace_premium_outlined,
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: certs.length,
                  itemBuilder: (ctx, i) => CertificateCard(cert: certs[i]),
                ),
          loading: () => LoadingShimmer.list(count: 3, height: 120),
          error: (e, _) => EmptyState(
            message: "Could not load certificates: $e",
            icon: Icons.error_outline,
          ),
        ),
      ),
    );
  }
}

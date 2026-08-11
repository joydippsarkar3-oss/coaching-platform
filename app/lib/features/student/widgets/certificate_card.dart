import "package:flutter/material.dart";
import "package:share_plus/share_plus.dart";
import "package:url_launcher/url_launcher.dart";

import "../../../core/api/models/api_models.dart";
import "../../../core/theme/app_theme.dart";
import "../../../core/utils/date_utils.dart";

class CertificateCard extends StatelessWidget {
  const CertificateCard({super.key, required this.cert});
  final Certificate cert;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A5CFF), Color(0xFF6366F1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.workspace_premium, color: Colors.white, size: 28),
              const SizedBox(width: 8),
              const Text(
                "Certificate",
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const Spacer(),
              Text(
                "Issued ${AppDateUtils.formatDate(cert.issuedAt)}",
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            cert.courseTitle,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            cert.studentName,
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            "Cert No: ${cert.certNo}",
            style: const TextStyle(color: Colors.white54, fontSize: 12),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              if (cert.pdfUrl != null) ...[
                _CertBtn(
                  icon: Icons.download,
                  label: "Download",
                  onTap: () => launchUrl(Uri.parse(cert.pdfUrl!)),
                ),
                const SizedBox(width: 10),
              ],
              _CertBtn(
                icon: Icons.share,
                label: "Share",
                onTap: () => Share.share(
                  "My certificate: ${cert.verifyUrl}",
                  subject: "Certificate – ${cert.courseTitle}",
                ),
              ),
              const SizedBox(width: 10),
              _CertBtn(
                icon: Icons.verified,
                label: "Verify",
                onTap: () => launchUrl(Uri.parse(cert.verifyUrl)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CertBtn extends StatelessWidget {
  const _CertBtn({
    required this.icon,
    required this.label,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white, size: 14),
            const SizedBox(width: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

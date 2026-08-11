import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/api/api_service.dart';
import '../../../core/api/models/api_models.dart';
import '../../../core/utils/money_formatter.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/offline_banner.dart';

part 'placement_page.g.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Providers
// ─────────────────────────────────────────────────────────────────────────────

@riverpod
Future<List<JobListing>> jobListings(JobListingsRef ref) =>
    ref.watch(apiServiceProvider).getJobListings();

@riverpod
Future<List<JobApplication>> myApplications(MyApplicationsRef ref) =>
    ref.watch(apiServiceProvider).getMyApplications();

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

class PlacementPage extends ConsumerStatefulWidget {
  const PlacementPage({super.key});

  @override
  ConsumerState<PlacementPage> createState() => _PlacementPageState();
}

class _PlacementPageState extends ConsumerState<PlacementPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Placements'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Job Board'),
            Tab(text: 'My Applications'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: const [
          _JobBoardTab(),
          _ApplicationsTab(),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Board tab
// ─────────────────────────────────────────────────────────────────────────────

class _JobBoardTab extends ConsumerWidget {
  const _JobBoardTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(jobListingsProvider);

    return async.when(
      loading: () => const LoadingShimmer(),
      error: (e, _) => _ErrorRetry(
        message: 'Could not load jobs',
        onRetry: () => ref.invalidate(jobListingsProvider),
      ),
      data: (jobs) {
        if (jobs.isEmpty) {
          return const EmptyState(
            icon: Icons.work_outline,
            message: 'No jobs posted yet.\nCheck back soon — your center will post openings here.',
          );
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(jobListingsProvider),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: jobs.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (ctx, i) => _JobCard(job: jobs[i]),
          ),
        );
      },
    );
  }
}

class _JobCard extends ConsumerWidget {
  const _JobCard({required this.job});
  final JobListing job;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    String? salaryLabel;
    if (job.salaryMinPaise != null && job.salaryMaxPaise != null) {
      final min = MoneyFormatter.formatShort(job.salaryMinPaise!);
      final max = MoneyFormatter.formatShort(job.salaryMaxPaise!);
      salaryLabel = '$min – $max / month';
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: colors.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(job.title,
                      style: textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold)),
                ),
                if (job.openings > 1)
                  _Badge('${job.openings} openings', colors.primary),
              ],
            ),
            const SizedBox(height: 4),
            Text(job.employerName,
                style: textTheme.bodyMedium
                    ?.copyWith(color: colors.primary)),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 14),
                const SizedBox(width: 4),
                Text(job.location, style: textTheme.bodySmall),
                if (salaryLabel != null) ...[
                  const SizedBox(width: 12),
                  const Icon(Icons.currency_rupee, size: 14),
                  Text(salaryLabel, style: textTheme.bodySmall),
                ],
              ],
            ),
            if (job.skills.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: job.skills
                    .map((s) => _Badge(s, colors.secondaryContainer,
                        textColor: colors.onSecondaryContainer))
                    .toList(),
              ),
            ],
            if (job.description != null) ...[
              const SizedBox(height: 8),
              Text(
                job.description!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: textTheme.bodySmall
                    ?.copyWith(color: colors.onSurfaceVariant),
              ),
            ],
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: job.isExpired
                    ? null
                    : () => _confirmApply(context, ref, job),
                child: Text(job.isExpired ? 'Closed' : 'Apply Now'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmApply(
      BuildContext context, WidgetRef ref, JobListing job) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Application'),
        content: Text(
            'Apply for "${job.title}" at ${job.employerName}?\n\n'
            'Your profile will be shared with the employer.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Apply')),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      await ref.read(apiServiceProvider).applyToJob(job.id);
      ref.invalidate(myApplicationsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Application submitted!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to apply: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// My Applications tab
// ─────────────────────────────────────────────────────────────────────────────

class _ApplicationsTab extends ConsumerWidget {
  const _ApplicationsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myApplicationsProvider);

    return async.when(
      loading: () => const LoadingShimmer(),
      error: (e, _) => _ErrorRetry(
        message: 'Could not load applications',
        onRetry: () => ref.invalidate(myApplicationsProvider),
      ),
      data: (apps) {
        if (apps.isEmpty) {
          return const EmptyState(
            icon: Icons.send_outlined,
            message: 'No applications yet.\nBrowse the Job Board and apply to open positions.',
          );
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(myApplicationsProvider),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: apps.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (ctx, i) => _ApplicationTile(app: apps[i]),
          ),
        );
      },
    );
  }
}

class _ApplicationTile extends StatelessWidget {
  const _ApplicationTile({required this.app});
  final JobApplication app;

  static const _statusColors = <String, Color>{
    'APPLIED': Colors.blue,
    'SHORTLISTED': Colors.orange,
    'INTERVIEW': Colors.purple,
    'PLACED': Colors.green,
    'REJECTED': Colors.red,
  };

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColors[app.status] ?? Colors.grey;
    final textTheme = Theme.of(context).textTheme;
    final colors = Theme.of(context).colorScheme;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: colors.outlineVariant),
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Text(app.jobTitle,
            style: textTheme.titleSmall
                ?.copyWith(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 2),
            Text(app.employerName,
                style: textTheme.bodySmall
                    ?.copyWith(color: colors.onSurfaceVariant)),
            const SizedBox(height: 4),
            Text(
              'Applied ${_formatDate(app.appliedAt)}',
              style: textTheme.bodySmall
                  ?.copyWith(color: colors.onSurfaceVariant),
            ),
          ],
        ),
        trailing: _Badge(
          app.status,
          statusColor.withOpacity(0.15),
          textColor: statusColor,
        ),
      ),
    );
  }

  String _formatDate(DateTime d) {
    final now = DateTime.now();
    final diff = now.difference(d).inDays;
    if (diff == 0) return 'today';
    if (diff == 1) return 'yesterday';
    if (diff < 30) return '$diff days ago';
    return '${d.day}/${d.month}/${d.year}';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

class _Badge extends StatelessWidget {
  const _Badge(this.label, this.bg, {this.textColor});
  final String label;
  final Color bg;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: textColor ?? Theme.of(context).colorScheme.onPrimary,
        ),
      ),
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  const _ErrorRetry({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 12),
          Text(message),
          const SizedBox(height: 16),
          FilledButton.tonal(
              onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}

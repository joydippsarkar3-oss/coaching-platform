import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_service.dart';
import '../../../core/api/models/api_models.dart';
import '../../../core/theme/app_theme.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../../shared/widgets/empty_state.dart';
import '../providers/teacher_providers.dart';

// ── helpers ───────────────────────────────────────────────────────────────────

const _kDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

bool _isToday(int dayOfWeek) => DateTime.now().weekday == dayOfWeek;

// ── T7 Teacher Schedule / Profile ─────────────────────────────────────────────

class TeacherSchedulePage extends ConsumerStatefulWidget {
  const TeacherSchedulePage({super.key});

  @override
  ConsumerState<TeacherSchedulePage> createState() =>
      _TeacherSchedulePageState();
}

class _TeacherSchedulePageState extends ConsumerState<TeacherSchedulePage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text('Schedule & Profile'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.calendar_today_outlined), text: 'Schedule'),
            Tab(icon: Icon(Icons.person_outline), text: 'Profile'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _ScheduleTab(),
          _ProfileTab(),
        ],
      ),
    );
  }
}

// ── Schedule Tab ──────────────────────────────────────────────────────────────

class _ScheduleTab extends ConsumerWidget {
  const _ScheduleTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheduleAsync = ref.watch(teacherScheduleProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(teacherScheduleProvider),
      child: scheduleAsync.when(
        loading: () => LoadingShimmer.list(count: 5, height: 80),
        error: (e, _) => _RetryWidget(
          message: 'Could not load schedule',
          onRetry: () => ref.invalidate(teacherScheduleProvider),
        ),
        data: (entries) => entries.isEmpty
            ? const EmptyState(
                icon: Icons.event_busy_outlined,
                message: 'No classes scheduled',
              )
            : _WeeklyGrid(entries: entries),
      ),
    );
  }
}

class _WeeklyGrid extends StatelessWidget {
  const _WeeklyGrid({required this.entries});
  final List<ScheduleEntry> entries;

  @override
  Widget build(BuildContext context) {
    final Map<int, List<ScheduleEntry>> byDay = {};
    for (final e in entries) {
      byDay.putIfAbsent(e.dayOfWeek, () => []).add(e);
    }
    for (final list in byDay.values) {
      list.sort((a, b) => a.startTime.compareTo(b.startTime));
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Row(
            children: List.generate(5, (i) {
              final today = _isToday(i + 1);
              return Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  decoration: BoxDecoration(
                    color: today
                        ? AppTheme.brandBlue
                        : const Color(0xFFE5E7EB),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    _kDays[i],
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color:
                          today ? Colors.white : const Color(0xFF374151),
                    ),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 8),
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: List.generate(5, (i) {
                final day = i + 1;
                final dayEntries = byDay[day] ?? [];
                final today = _isToday(day);
                return Expanded(
                  child: Column(
                    children: dayEntries.isEmpty
                        ? [
                            Container(
                              margin: const EdgeInsets.symmetric(
                                  horizontal: 2, vertical: 2),
                              height: 60,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ]
                        : dayEntries
                            .map((e) => _ClassCard(entry: e, highlight: today))
                            .toList(),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Class Card ────────────────────────────────────────────────────────────────

class _ClassCard extends StatelessWidget {
  const _ClassCard({required this.entry, required this.highlight});
  final ScheduleEntry entry;
  final bool highlight;

  Color get _statusColor {
    switch (entry.attendanceStatus) {
      case 'taken':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  void _showDetail(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _ClassDetailSheet(entry: entry),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showDetail(context),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 2),
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: highlight
              ? AppTheme.brandBlue.withOpacity(0.12)
              : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: highlight
                ? AppTheme.brandBlue.withOpacity(0.4)
                : const Color(0xFFE5E7EB),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              entry.batchName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: highlight
                    ? AppTheme.brandBlue
                    : const Color(0xFF111827),
              ),
            ),
            Text(
              entry.courseTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 9,
                color: Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              '${entry.startTime}–${entry.endTime}',
              style: const TextStyle(fontSize: 9, color: Color(0xFF6B7280)),
            ),
            if (entry.room.isNotEmpty)
              Text(
                entry.room,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 9, color: Color(0xFF9CA3AF)),
              ),
            const SizedBox(height: 2),
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: _statusColor,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Class Detail Sheet ────────────────────────────────────────────────────────

class _ClassDetailSheet extends StatelessWidget {
  const _ClassDetailSheet({required this.entry});
  final ScheduleEntry entry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            entry.batchName,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            entry.courseTitle,
            style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
          ),
          const Divider(height: 24),
          _DetailRow(
              icon: Icons.access_time_outlined,
              label: '${entry.startTime} – ${entry.endTime}'),
          _DetailRow(icon: Icons.room_outlined, label: entry.room),
          _DetailRow(
              icon: Icons.people_outline,
              label: '${entry.studentCount} students'),
          _DetailRow(
            icon: Icons.check_circle_outline,
            label: 'Attendance: ${entry.attendanceStatus}',
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.brandBlue),
          const SizedBox(width: 10),
          Expanded(
            child: Text(label, style: const TextStyle(fontSize: 14)),
          ),
        ],
      ),
    );
  }
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(teacherProfileProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(teacherProfileProvider),
      child: profileAsync.when(
        loading: () => LoadingShimmer.list(count: 6, height: 60),
        error: (e, _) => _RetryWidget(
          message: 'Could not load profile',
          onRetry: () => ref.invalidate(teacherProfileProvider),
        ),
        data: (profile) => _ProfileBody(profile: profile),
      ),
    );
  }
}

class _ProfileBody extends ConsumerWidget {
  const _ProfileBody({required this.profile});
  final TeacherProfile profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Avatar + name block
        Center(
          child: Column(
            children: [
              CircleAvatar(
                radius: 44,
                backgroundColor: AppTheme.brandBlue.withOpacity(0.12),
                backgroundImage: profile.avatarUrl != null
                    ? NetworkImage(profile.avatarUrl!)
                    : null,
                child: profile.avatarUrl == null
                    ? Text(
                        profile.name.isNotEmpty
                            ? profile.name[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.brandBlue,
                        ),
                      )
                    : null,
              ),
              const SizedBox(height: 12),
              Text(
                profile.name,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                profile.qualification,
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF6B7280),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Joined ${profile.joiningDate.toLocal().toString().substring(0, 10)}',
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF9CA3AF),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Stats row
        Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Row(
            children: [
              _StatCell(
                  value: '${profile.totalStudents}', label: 'Students'),
              _StatCell(
                  value: '${profile.totalBatches}', label: 'Batches'),
              _StatCell(
                  value: '${profile.certificatesIssued}',
                  label: 'Certificates'),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Bio
        if (profile.bio != null && profile.bio!.isNotEmpty) ...[
          const Text(
            'About',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            profile.bio!,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF374151),
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Subjects taught
        if (profile.subjectsTaught.isNotEmpty) ...[
          const Text(
            'Subjects Taught',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: profile.subjectsTaught
                .map(
                  (s) => Chip(
                    label: Text(s, style: const TextStyle(fontSize: 12)),
                    backgroundColor: AppTheme.brandBlue.withOpacity(0.08),
                    side: BorderSide(
                        color: AppTheme.brandBlue.withOpacity(0.25)),
                    padding: EdgeInsets.zero,
                    visualDensity: VisualDensity.compact,
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 16),
        ],

        // Edit Profile button
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => _showEditSheet(context, ref, profile),
            icon: const Icon(Icons.edit_outlined, size: 18),
            label: const Text('Edit Profile'),
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  void _showEditSheet(
      BuildContext context, WidgetRef ref, TeacherProfile profile) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _EditProfileSheet(
        profile: profile,
        onSaved: () => ref.invalidate(teacherProfileProvider),
      ),
    );
  }
}

class _StatCell extends StatelessWidget {
  const _StatCell({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppTheme.brandBlue,
            ),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }
}

// ── Edit Profile Sheet ────────────────────────────────────────────────────────

class _EditProfileSheet extends ConsumerStatefulWidget {
  const _EditProfileSheet({required this.profile, required this.onSaved});
  final TeacherProfile profile;
  final VoidCallback onSaved;

  @override
  ConsumerState<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends ConsumerState<_EditProfileSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _bioCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _qualCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _bioCtrl = TextEditingController(text: widget.profile.bio ?? '');
    _phoneCtrl = TextEditingController(text: widget.profile.phone);
    _qualCtrl =
        TextEditingController(text: widget.profile.qualification);
  }

  @override
  void dispose() {
    _bioCtrl.dispose();
    _phoneCtrl.dispose();
    _qualCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Edit Profile',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Phone',
                border: OutlineInputBorder(),
              ),
              validator: (v) =>
                  (v == null || v.isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _qualCtrl,
              decoration: const InputDecoration(
                labelText: 'Qualification',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _bioCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Bio',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Save'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ref.read(apiServiceProvider).updateTeacherProfile({
        'phone': _phoneCtrl.text.trim(),
        'qualification': _qualCtrl.text.trim(),
        'bio': _bioCtrl.text.trim(),
      });
      widget.onSaved();
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}

// ── Retry Widget ──────────────────────────────────────────────────────────────

class _RetryWidget extends StatelessWidget {
  const _RetryWidget({required this.message, required this.onRetry});
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
          Text(message,
              style: const TextStyle(fontSize: 15, color: Color(0xFF374151))),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh, size: 16),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

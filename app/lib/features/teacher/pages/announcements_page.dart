import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_service.dart";
import "../../../core/api/models/api_models.dart";
import "../../../core/theme/app_theme.dart";
import "../../../core/utils/date_utils.dart";
import "../../shared/widgets/empty_state.dart";
import "../../shared/widgets/loading_shimmer.dart";
import "../providers/teacher_providers.dart";

class AnnouncementsPage extends ConsumerStatefulWidget {
  const AnnouncementsPage({super.key});

  @override
  ConsumerState<AnnouncementsPage> createState() => _AnnouncementsPageState();
}

class _AnnouncementsPageState extends ConsumerState<AnnouncementsPage> {
  bool _showForm = false;
  final _titleCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  String _audience = "all";
  bool _posting = false;
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _titleCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  Future<void> _post() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _posting = true);
    try {
      await ref.read(apiServiceProvider).postAnnouncement({
        "title": _titleCtrl.text.trim(),
        "body": _bodyCtrl.text.trim(),
        "target_audience": _audience,
      });
      ref.invalidate(teacherAnnouncementsProvider);
      if (mounted) {
        setState(() {
          _posting = false;
          _showForm = false;
          _titleCtrl.clear();
          _bodyCtrl.clear();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Announcement posted"),
            backgroundColor: AppTheme.successGreen,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _posting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Failed to post: $e"),
            backgroundColor: AppTheme.errorRed,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final announcementsAsync = ref.watch(teacherAnnouncementsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Announcements"),
        actions: [
          IconButton(
            onPressed: () => setState(() => _showForm = !_showForm),
            icon: Icon(_showForm ? Icons.close : Icons.add),
            tooltip: "Post Announcement",
          ),
        ],
      ),
      body: Column(
        children: [
          // Post form
          if (_showForm)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _titleCtrl,
                      decoration: const InputDecoration(labelText: "Title"),
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? "Enter title" : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _bodyCtrl,
                      decoration: const InputDecoration(labelText: "Message"),
                      maxLines: 3,
                      validator: (v) =>
                          (v == null || v.trim().isEmpty) ? "Enter message" : null,
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _audience,
                      decoration: const InputDecoration(labelText: "Audience"),
                      items: const [
                        DropdownMenuItem(value: "all", child: Text("Everyone")),
                        DropdownMenuItem(
                            value: "students", child: Text("Students only")),
                        DropdownMenuItem(
                            value: "teachers", child: Text("Teachers only")),
                      ],
                      onChanged: (v) =>
                          setState(() => _audience = v ?? "all"),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _posting ? null : _post,
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                      ),
                      child: _posting
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            )
                          : const Text("Post Announcement"),
                    ),
                  ],
                ),
              ),
            ),

          const Divider(height: 1),

          // List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.invalidate(teacherAnnouncementsProvider),
              child: announcementsAsync.when(
                data: (items) => items.isEmpty
                    ? const EmptyState(
                        message: "No announcements yet",
                        icon: Icons.campaign_outlined,
                      )
                    : ListView.builder(
                        itemCount: items.length,
                        itemBuilder: (ctx, i) => _AnnouncementTile(ann: items[i]),
                      ),
                loading: () => LoadingShimmer.list(count: 4, height: 80),
                error: (e, _) => EmptyState(
                  message: "Could not load announcements: $e",
                  icon: Icons.error_outline,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AnnouncementTile extends StatelessWidget {
  const _AnnouncementTile({required this.ann});
  final Announcement ann;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  ann.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: Color(0xFF111827),
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  ann.targetAudience,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFD97706),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            ann.body,
            style: const TextStyle(fontSize: 13, color: Color(0xFF374151)),
          ),
          const SizedBox(height: 4),
          Text(
            AppDateUtils.humanDate(ann.postedAt),
            style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
          ),
        ],
      ),
    );
  }
}

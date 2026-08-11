import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/api_service.dart";
import "../../../core/api/models/api_models.dart";
import "../../../core/utils/date_utils.dart";
import "../../shared/widgets/empty_state.dart";
import "../../shared/widgets/loading_shimmer.dart";
import "../providers/student_providers.dart";

class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Notifications")),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(notificationsProvider),
        child: notifAsync.when(
          data: (items) => items.isEmpty
              ? const EmptyState(
                  message: "No notifications yet",
                  icon: Icons.notifications_none_outlined,
                )
              : ListView.builder(
                  itemCount: items.length,
                  itemBuilder: (ctx, i) => _NotifTile(notif: items[i], ref: ref),
                ),
          loading: () => LoadingShimmer.list(count: 5, height: 72),
          error: (e, _) => EmptyState(
            message: "Could not load notifications: $e",
            icon: Icons.error_outline,
          ),
        ),
      ),
    );
  }
}

class _NotifTile extends StatelessWidget {
  const _NotifTile({required this.notif, required this.ref});
  final AppNotification notif;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: notif.isRead
            ? const Color(0xFFF3F4F6)
            : const Color(0xFFEFF6FF),
        child: Icon(
          Icons.notifications,
          color: notif.isRead
              ? const Color(0xFF9CA3AF)
              : const Color(0xFF1A5CFF),
          size: 20,
        ),
      ),
      title: Text(
        notif.title,
        style: TextStyle(
          fontWeight: notif.isRead ? FontWeight.w400 : FontWeight.w700,
          fontSize: 14,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            notif.body,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 13),
          ),
          Text(
            AppDateUtils.humanDate(notif.createdAt),
            style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
          ),
        ],
      ),
      isThreeLine: true,
      onTap: () async {
        if (!notif.isRead) {
          try {
            await ref.read(apiServiceProvider).markNotificationRead(notif.id);
            ref.invalidate(notificationsProvider);
          } catch (_) {}
        }
        // Navigate to deep link if present
      },
    );
  }
}

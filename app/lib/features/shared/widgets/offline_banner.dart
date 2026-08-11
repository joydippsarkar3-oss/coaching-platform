import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:connectivity_plus/connectivity_plus.dart";
import "package:riverpod_annotation/riverpod_annotation.dart";

part "offline_banner.g.dart";

@riverpod
Stream<bool> isOnline(IsOnlineRef ref) =>
    Connectivity().onConnectivityChanged.map(
      (result) => result != ConnectivityResult.none,
    );

class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final online = ref.watch(isOnlineProvider);
    return online.when(
      data: (connected) => connected
          ? const SizedBox.shrink()
          : Material(
              color: const Color(0xFFFEF3C7),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                child: Row(
                  children: [
                    const Icon(Icons.wifi_off, size: 16, color: Color(0xFF92400E)),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        "You are offline — changes will sync when reconnected",
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF92400E),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

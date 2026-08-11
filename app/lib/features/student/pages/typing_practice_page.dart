import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/api/api_service.dart';
import '../../../core/api/models/api_models.dart';
import '../../../core/theme/app_theme.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../../shared/widgets/empty_state.dart';

part 'typing_practice_page.g.dart';

@riverpod
Future<List<TypingLeaderboardEntry>> typingLeaderboard(
    TypingLeaderboardRef ref) =>
    ref.watch(apiServiceProvider).getTypingLeaderboard();

// ── S6 Typing Practice ────────────────────────────────────────────────────────

class TypingPracticePage extends ConsumerStatefulWidget {
  const TypingPracticePage({super.key});

  @override
  ConsumerState<TypingPracticePage> createState() => _TypingPracticePageState();
}

class _TypingPracticePageState extends ConsumerState<TypingPracticePage>
    with TickerProviderStateMixin {
  late TabController _tabs;

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
        title: const Text('Typing Practice'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Practice'),
            Tab(text: 'Leaderboard'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: const [
          _PracticeTab(),
          _LeaderboardTab(),
        ],
      ),
    );
  }
}

// ── Practice tab ──────────────────────────────────────────────────────────────

class _PracticeTab extends ConsumerStatefulWidget {
  const _PracticeTab();

  @override
  ConsumerState<_PracticeTab> createState() => _PracticeTabState();
}

class _PracticeTabState extends ConsumerState<_PracticeTab> {
  String _lang = 'en';
  String _preset = 'cpct_en';

  static const _presets = {
    'cpct_en': 'CPCT English',
    'cpct_hi': 'CPCT Hindi',
    'ssc_chsl': 'SSC CHSL',
    'ssc_cgl': 'SSC CGL',
    'dest': 'DEST',
    'custom': 'Custom',
  };

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Language toggle
          Row(
            children: [
              const Text('Language:', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(width: 12),
              ChoiceChip(
                label: const Text('English'),
                selected: _lang == 'en',
                onSelected: (_) => setState(() {
                  _lang = 'en';
                  _preset = 'cpct_en';
                }),
              ),
              const SizedBox(width: 8),
              ChoiceChip(
                label: const Text('हिन्दी'),
                selected: _lang == 'hi',
                onSelected: (_) => setState(() {
                  _lang = 'hi';
                  _preset = 'cpct_hi';
                }),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Preset picker
          DropdownButtonFormField<String>(
            value: _preset,
            decoration: const InputDecoration(
              labelText: 'Exam Preset',
              border: OutlineInputBorder(),
            ),
            items: _presets.entries
                .map((e) =>
                    DropdownMenuItem(value: e.key, child: Text(e.value)))
                .toList(),
            onChanged: (v) => setState(() => _preset = v ?? _preset),
          ),
          const SizedBox(height: 24),
          // Info card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _presets[_preset] ?? '',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  _presetInfo(_preset),
                ],
              ),
            ),
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _startTest,
              icon: const Icon(Icons.keyboard),
              label: const Text('Start Test'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _presetInfo(String preset) {
    final info = switch (preset) {
      'cpct_en' => '15 min · 30 WPM · 85% accuracy',
      'cpct_hi' => '15 min · 30 WPM · 85% accuracy',
      'ssc_chsl' => '10 min · 35 WPM · no accuracy req',
      'ssc_cgl' => '10 min · 40 WPM · no accuracy req',
      'dest' => '5 min · 30 WPM',
      _ => 'Custom settings',
    };
    return Text(info, style: TextStyle(color: Colors.grey[600], fontSize: 13));
  }

  void _startTest() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Starting ${_presets[_preset]} test…'),
        behavior: SnackBarBehavior.floating,
      ),
    );
    // TODO: navigate to full-screen typing runner with preset + lang
  }
}

// ── Leaderboard tab ───────────────────────────────────────────────────────────

class _LeaderboardTab extends ConsumerWidget {
  const _LeaderboardTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lbAsync = ref.watch(typingLeaderboardProvider);

    return lbAsync.when(
      loading: () => const LoadingShimmer(),
      error: (e, _) => EmptyState(
        icon: Icons.error_outline,
        title: 'Could not load leaderboard',
        subtitle: e.toString(),
      ),
      data: (entries) => entries.isEmpty
          ? const EmptyState(
              icon: Icons.leaderboard_outlined,
              title: 'No entries yet',
              subtitle: 'Complete a test to appear here',
            )
          : ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: entries.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (ctx, i) {
                final e = entries[i];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: i < 3
                        ? [
                            Colors.amber,
                            Colors.blueGrey,
                            Colors.brown,
                          ][i]
                        : Colors.grey[200],
                    child: Text(
                      '${i + 1}',
                      style: TextStyle(
                        color: i < 3 ? Colors.white : Colors.black87,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(e.studentName),
                  subtitle:
                      Text('${e.netWpm.toStringAsFixed(1)} WPM · ${e.accuracy.toStringAsFixed(1)}%'),
                  trailing: Text(
                    e.preset.toUpperCase(),
                    style: TextStyle(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                    ),
                  ),
                );
              },
            ),
    );
  }
}

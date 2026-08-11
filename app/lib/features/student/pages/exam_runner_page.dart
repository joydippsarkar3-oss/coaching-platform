import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:riverpod_annotation/riverpod_annotation.dart";
import "dart:async";
import "dart:convert";

import "../../../core/api/api_service.dart";
import "../../../core/api/models/api_models.dart";
import "../../../core/db/app_database.dart";
import "../../../core/theme/app_theme.dart";
import "../../shared/widgets/offline_banner.dart";
import "../widgets/exam_question_card.dart";
import "../widgets/question_palette.dart";

part "exam_runner_page.g.dart";

// ── Exam session provider ────────────────────────────────────────────────────

@riverpod
Future<ExamSession> examSession(ExamSessionRef ref, String examId) =>
    ref.watch(apiServiceProvider).startExam(examId);

// ── Exam runner state ─────────────────────────────────────────────────────────

class _ExamState {
  _ExamState({
    required this.session,
    required this.currentIndex,
    required this.answers,
    required this.markedForReview,
    required this.started,
    required this.submitted,
  });

  final ExamSession session;
  final int currentIndex;
  final Map<String, dynamic> answers; // questionId -> answer (String or List<String>)
  final Set<String> markedForReview;
  final bool started;
  final bool submitted;

  _ExamState copyWith({
    int? currentIndex,
    Map<String, dynamic>? answers,
    Set<String>? markedForReview,
    bool? started,
    bool? submitted,
  }) =>
      _ExamState(
        session: session,
        currentIndex: currentIndex ?? this.currentIndex,
        answers: answers ?? Map.from(this.answers),
        markedForReview: markedForReview ?? Set.from(this.markedForReview),
        started: started ?? this.started,
        submitted: submitted ?? this.submitted,
      );

  ExamQuestion get currentQuestion => session.questions[currentIndex];
  int get totalQuestions => session.questions.length;
  int get answeredCount =>
      session.questions.where((q) => answers.containsKey(q.id)).length;
  int get unansweredCount => totalQuestions - answeredCount;
}

// ── Exam Runner Page ──────────────────────────────────────────────────────────

class ExamRunnerPage extends ConsumerStatefulWidget {
  const ExamRunnerPage({super.key, required this.examId});
  final String examId;

  @override
  ConsumerState<ExamRunnerPage> createState() => _ExamRunnerPageState();
}

class _ExamRunnerPageState extends ConsumerState<ExamRunnerPage>
    with WidgetsBindingObserver {
  _ExamState? _state;
  Timer? _countdownTimer;
  Timer? _syncTimer;
  Duration _remaining = Duration.zero;
  bool _showPalette = false;
  bool _tabSwitchWarning = false;
  int _tabSwitchCount = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _countdownTimer?.cancel();
    _syncTimer?.cancel();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  // ── Lifecycle: tab switch detection ────────────────────────────────────────

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused) {
      _tabSwitchCount++;
      _logTabSwitch();
    }
    if (state == AppLifecycleState.resumed && _tabSwitchWarning) {
      if (mounted) {
        setState(() => _tabSwitchWarning = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              "Leaving the exam window may be flagged",
            ),
            backgroundColor: AppTheme.warningOrange,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
    if (state == AppLifecycleState.paused) {
      _tabSwitchWarning = true;
    }
  }

  Future<void> _logTabSwitch() async {
    // Log to backend: tab_switch event with count
    // Non-blocking; ignore failure
    try {
      if (_state != null) {
        await ref.read(apiServiceProvider).saveAnswers(
          _state!.session.attemptId,
          {
            "event": "tab_switch",
            "count": _tabSwitchCount,
            "timestamp": DateTime.now().toIso8601String(),
          },
        );
      }
    } catch (_) {}
  }

  // ── Start exam ─────────────────────────────────────────────────────────────

  void _startExam(ExamSession session) {
    // Enable immersive full-screen lock
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

    final now = DateTime.now();
    _remaining = session.serverEndTime.difference(now);

    setState(() {
      _state = _ExamState(
        session: session,
        currentIndex: 0,
        answers: {},
        markedForReview: {},
        started: true,
        submitted: false,
      );
    });

    // Countdown timer — ticks every second
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _remaining -= const Duration(seconds: 1));
      // Re-sync with server every 30s
      if (_remaining.inSeconds % 30 == 0) {
        _syncServerTime(session);
      }
      if (_remaining.inSeconds <= 0) {
        _autoSubmit();
      }
    });

    // Background sync every 10s
    _syncTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      _syncAnswers();
    });
  }

  Future<void> _syncServerTime(ExamSession session) async {
    // Refresh exam list to get server-authoritative end time
    // Silently update remaining time
    try {
      final exams = await ref.read(apiServiceProvider).getExamList();
      final exam = exams.firstWhere(
        (e) => e.id == widget.examId,
        orElse: () => throw Exception("not found"),
      );
      if (mounted) {
        setState(() {
          _remaining = exam.endTime.difference(DateTime.now());
        });
      }
    } catch (_) {
      // Offline — keep local countdown
    }
  }

  // ── Answer handling ────────────────────────────────────────────────────────

  void _selectAnswer(String questionId, dynamic answer) {
    if (_state == null) return;
    final updated = Map<String, dynamic>.from(_state!.answers);
    updated[questionId] = answer;
    setState(() {
      _state = _state!.copyWith(answers: updated);
    });
    _persistAnswerLocally(questionId, answer);
  }

  void _toggleMarkForReview(String questionId) {
    if (_state == null) return;
    final marked = Set<String>.from(_state!.markedForReview);
    if (marked.contains(questionId)) {
      marked.remove(questionId);
    } else {
      marked.add(questionId);
    }
    setState(() {
      _state = _state!.copyWith(markedForReview: marked);
    });
  }

  Future<void> _persistAnswerLocally(String questionId, dynamic answer) async {
    final db = ref.read(appDatabaseProvider);
    await db.upsertAnswer(
      ExamAnswersCompanion.insert(
        examId: widget.examId,
        questionId: questionId,
        answer: jsonEncode(answer),
        localTimestamp: DateTime.now().millisecondsSinceEpoch,
      ),
    );
  }

  Future<void> _syncAnswers() async {
    if (_state == null) return;
    try {
      final db = ref.read(appDatabaseProvider);
      final unsyncedAnswers =
          await db.getAnswersForExam(widget.examId);
      final payload = {
        "answers": unsyncedAnswers
            .map((a) => {
                  "question_id": a.questionId,
                  "answer": jsonDecode(a.answer),
                })
            .toList(),
      };
      await ref
          .read(apiServiceProvider)
          .saveAnswers(_state!.session.attemptId, payload);
      await db.markAnswersSynced(widget.examId);
    } catch (_) {
      // Offline — will retry
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  Future<void> _showSubmitDialog() async {
    final unanswered = _state?.unansweredCount ?? 0;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Submit Exam?"),
        content: Text(
          unanswered > 0
              ? "You have $unanswered unanswered question(s). Submit anyway?"
              : "Are you sure you want to submit?",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("Submit"),
          ),
        ],
      ),
    );
    if (confirmed == true) _submit();
  }

  Future<void> _autoSubmit() async {
    _countdownTimer?.cancel();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Time up! Submitting exam…"),
          backgroundColor: AppTheme.errorRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
    await Future.delayed(const Duration(seconds: 1));
    await _submit();
    // WorkManager: register background task for final submit in case app is killed
    // WorkManager().registerOneOffTask("exam_submit_${widget.examId}", "examSubmitTask");
  }

  Future<void> _submit() async {
    if (_state == null || _state!.submitted) return;
    await _syncAnswers();
    try {
      final result = await ref
          .read(apiServiceProvider)
          .submitExam(_state!.session.attemptId);
      if (!mounted) return;
      setState(() {
        _state = _state!.copyWith(submitted: true);
      });
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
      _showResultScreen(result);
    } catch (e) {
      // Queue as pending sync op if offline
      final db = ref.read(appDatabaseProvider);
      await db.insertPendingOp(
        PendingSyncOpsCompanion.insert(
          opType: "exam_submit",
          payload: jsonEncode({"attempt_id": _state!.session.attemptId}),
          createdAt: DateTime.now().millisecondsSinceEpoch,
        ),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              "Offline — exam queued for submission when reconnected",
            ),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _showResultScreen(ExamResult result) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => _ExamResultScreen(result: result),
      ),
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final sessionAsync = ref.watch(examSessionProvider(widget.examId));

    return sessionAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text("Exam")),
        body: Center(child: Text("Failed to load exam: $e")),
      ),
      data: (session) {
        if (_state == null) {
          // Show instructions screen
          return _InstructionsScreen(
            session: session,
            onStart: () => _startExam(session),
          );
        }
        return _buildExamScreen();
      },
    );
  }

  Widget _buildExamScreen() {
    final state = _state!;
    final question = state.currentQuestion;
    final isLast = state.currentIndex == state.totalQuestions - 1;
    final isMarked = state.markedForReview.contains(question.id);
    final currentAnswer = state.answers[question.id];

    return WillPopScope(
      onWillPop: () async {
        // Prevent accidental back navigation during exam
        final leave = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text("Leave exam?"),
            content: const Text(
              "Your progress is saved. You can return and continue.",
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text("Stay"),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text("Leave"),
              ),
            ],
          ),
        );
        if (leave == true) {
          SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
        }
        return leave ?? false;
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        appBar: _buildAppBar(state, isMarked, question),
        body: Column(
          children: [
            const OfflineBanner(),
            Expanded(
              child: ExamQuestionCard(
                question: question,
                currentAnswer: currentAnswer,
                onAnswerSelected: (answer) =>
                    _selectAnswer(question.id, answer),
              ),
            ),
            _buildBottomNav(state, isLast),
          ],
        ),
        endDrawer: _showPalette
            ? QuestionPalette(
                questions: state.session.questions,
                answers: state.answers,
                markedForReview: state.markedForReview,
                currentIndex: state.currentIndex,
                onJump: (i) {
                  setState(() {
                    _state = _state!.copyWith(currentIndex: i);
                    _showPalette = false;
                  });
                },
              )
            : null,
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(
      _ExamState state, bool isMarked, ExamQuestion question) {
    final h = _remaining.inHours;
    final m = _remaining.inMinutes.remainder(60);
    final s = _remaining.inSeconds.remainder(60);
    final timeStr = _remaining.inHours > 0
        ? "${h.toString().padLeft(2, "0")}:${m.toString().padLeft(2, "0")}:${s.toString().padLeft(2, "0")}"
        : "${m.toString().padLeft(2, "0")}:${s.toString().padLeft(2, "0")}";

    final timeColor = _remaining.inMinutes < 5
        ? AppTheme.errorRed
        : _remaining.inMinutes < 15
            ? AppTheme.warningOrange
            : const Color(0xFF111827);

    return AppBar(
      automaticallyImplyLeading: false,
      backgroundColor: Colors.white,
      title: Row(
        children: [
          Expanded(
            child: Text(
              "Q ${state.currentIndex + 1}/${state.totalQuestions}",
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF111827),
              ),
            ),
          ),
          // Time remaining
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.timer, size: 16, color: timeColor),
              const SizedBox(width: 4),
              Text(
                timeStr,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: timeColor,
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        // Mark for review toggle
        IconButton(
          onPressed: () => _toggleMarkForReview(question.id),
          icon: Icon(
            isMarked ? Icons.flag : Icons.flag_outlined,
            color: isMarked ? AppTheme.examMarkedReview : const Color(0xFF6B7280),
          ),
          tooltip: isMarked ? "Unmark Review" : "Mark for Review",
        ),
        // Question palette
        Builder(
          builder: (ctx) => IconButton(
            onPressed: () {
              setState(() => _showPalette = true);
              Scaffold.of(ctx).openEndDrawer();
            },
            icon: const Icon(Icons.grid_view_rounded, color: Color(0xFF6B7280)),
            tooltip: "Question Palette",
          ),
        ),
      ],
    );
  }

  Widget _buildBottomNav(_ExamState state, bool isLast) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
      ),
      child: Row(
        children: [
          OutlinedButton.icon(
            onPressed: state.currentIndex > 0
                ? () => setState(() {
                      _state = _state!
                          .copyWith(currentIndex: state.currentIndex - 1);
                    })
                : null,
            icon: const Icon(Icons.arrow_back, size: 18),
            label: const Text("Previous"),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(100, 44),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: isLast
                ? ElevatedButton(
                    onPressed: _showSubmitDialog,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.successGreen,
                      minimumSize: const Size.fromHeight(44),
                    ),
                    child: const Text("Submit Exam"),
                  )
                : ElevatedButton.icon(
                    onPressed: () => setState(() {
                      _state = _state!
                          .copyWith(currentIndex: state.currentIndex + 1);
                    }),
                    icon: const Icon(Icons.arrow_forward, size: 18),
                    label: const Text("Next"),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size.fromHeight(44),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

// ── Instructions screen ───────────────────────────────────────────────────────

class _InstructionsScreen extends StatelessWidget {
  const _InstructionsScreen({
    required this.session,
    required this.onStart,
  });
  final ExamSession session;
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(session.title),
        leading: const BackButton(),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Exam Instructions",
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF111827),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.quiz, size: 16, color: Color(0xFF6B7280)),
                          const SizedBox(width: 6),
                          Text(
                            "${session.questions.length} questions",
                            style: const TextStyle(color: Color(0xFF6B7280)),
                          ),
                          const SizedBox(width: 16),
                          const Icon(Icons.timer, size: 16, color: Color(0xFF6B7280)),
                          const SizedBox(width: 6),
                          Text(
                            "Ends ${session.serverEndTime.toLocal()}",
                            style: const TextStyle(color: Color(0xFF6B7280)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0F4FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          session.instructions.isNotEmpty
                              ? session.instructions
                              : "• Answer all questions.\n"
                                  "• Each MCQ has one correct answer unless marked multi-select.\n"
                                  "• You may flag questions for review and return to them.\n"
                                  "• Your answers are saved automatically.\n"
                                  "• Do not switch apps — this will be flagged.\n"
                                  "• The exam submits automatically when time is up.",
                          style: const TextStyle(
                            fontSize: 14,
                            height: 1.7,
                            color: Color(0xFF374151),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: onStart,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                ),
                child: const Text(
                  "Start Exam",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Post-submit result screen ─────────────────────────────────────────────────

class _ExamResultScreen extends StatelessWidget {
  const _ExamResultScreen({required this.result});
  final ExamResult result;

  @override
  Widget build(BuildContext context) {
    final passed = result.passed;
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(
                passed ? Icons.emoji_events : Icons.sentiment_dissatisfied,
                size: 80,
                color: passed ? AppTheme.warningOrange : AppTheme.errorRed,
              ),
              const SizedBox(height: 24),
              Text(
                passed ? "Congratulations! You Passed!" : "Better luck next time",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: passed ? AppTheme.successGreen : AppTheme.errorRed,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                "${result.marksObtained}/${result.totalMarks}",
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF111827),
                ),
              ),
              Text(
                "${result.percentage.toStringAsFixed(1)}%",
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 22,
                  color: Color(0xFF6B7280),
                ),
              ),
              if (result.rankInBatch != null) ...[
                const SizedBox(height: 8),
                Text(
                  "Rank #${result.rankInBatch} in batch",
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 16,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: () => context.go("/student/home"),
                child: const Text("Back to Home"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

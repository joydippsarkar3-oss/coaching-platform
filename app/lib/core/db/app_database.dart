import "package:drift/drift.dart";
import "package:drift/native.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:path/path.dart" as p;
import "package:path_provider/path_provider.dart";
import "package:riverpod_annotation/riverpod_annotation.dart";
import "dart:io";

import "tables/exam_answers.dart";
import "tables/cached_materials.dart";
import "tables/pending_sync.dart";

export "tables/exam_answers.dart";
export "tables/cached_materials.dart";
export "tables/pending_sync.dart";

part "app_database.g.dart";

@riverpod
AppDatabase appDatabase(AppDatabaseRef ref) => throw UnimplementedError(
    "overrideWithValue in main() is required");

@DriftDatabase(
  tables: [ExamAnswers, CachedMaterials, PendingSyncOps],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {},
      );

  // ── ExamAnswers helpers ────────────────────────────────────────────────

  Future<List<ExamAnswerEntry>> getAnswersForExam(String examId) =>
      (select(examAnswers)
            ..where((t) => t.examId.equals(examId)))
          .get();

  Future<void> upsertAnswer(ExamAnswersCompanion entry) =>
      into(examAnswers).insertOnConflictUpdate(entry);

  Future<void> markAnswersSynced(String examId) =>
      (update(examAnswers)..where((t) => t.examId.equals(examId))).write(
        const ExamAnswersCompanion(synced: Value(true)),
      );

  // ── CachedMaterials helpers ───────────────────────────────────────────

  Future<CachedMaterialEntry?> getCachedMaterial(
      String courseId, String unitId) =>
      (select(cachedMaterials)
            ..where(
                (t) => t.courseId.equals(courseId) & t.unitId.equals(unitId)))
          .getSingleOrNull();

  Future<void> upsertCachedMaterial(CachedMaterialsCompanion entry) =>
      into(cachedMaterials).insertOnConflictUpdate(entry);

  // ── PendingSyncOps helpers ────────────────────────────────────────────

  Future<List<PendingSyncOpEntry>> getPendingOps() =>
      (select(pendingSyncOps)
            ..where((t) => t.retryCount.isSmallerOrEqualValue(3))
            ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
          .get();

  Future<int> insertPendingOp(PendingSyncOpsCompanion entry) =>
      into(pendingSyncOps).insert(entry);

  Future<void> deletePendingOp(int id) =>
      (delete(pendingSyncOps)..where((t) => t.id.equals(id))).go();

  Future<void> incrementRetry(int id) async {
    final entry = await (select(pendingSyncOps)
          ..where((t) => t.id.equals(id)))
        .getSingleOrNull();
    if (entry == null) return;
    await (update(pendingSyncOps)..where((t) => t.id.equals(id)))
        .write(PendingSyncOpsCompanion(retryCount: Value(entry.retryCount + 1)));
  }
}

LazyDatabase _openConnection() => LazyDatabase(() async {
      final dir = await getApplicationDocumentsDirectory();
      final file = File(p.join(dir.path, "brand_training.sqlite"));
      return NativeDatabase(file, logStatements: false);
    });

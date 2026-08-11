import "package:drift/drift.dart";

class ExamAnswers extends Table {
  TextColumn get id => text().clientDefault(() =>
      DateTime.now().microsecondsSinceEpoch.toString())();
  TextColumn get examId => text()();
  TextColumn get questionId => text()();
  TextColumn get answer => text()(); // JSON-encoded: "A" or ["A","C"] for multi
  BoolColumn get markedForReview => boolean().withDefault(const Constant(false))();
  IntColumn get localTimestamp => integer()(); // millisecondsSinceEpoch
  BoolColumn get synced => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {examId, questionId};
}

typedef ExamAnswerEntry = ExamAnswer;

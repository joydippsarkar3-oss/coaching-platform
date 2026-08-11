import "package:drift/drift.dart";

class PendingSyncOps extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get opType => text()();
  // opType values: "exam_submit", "attendance", "marks", "notification_read"
  TextColumn get payload => text()(); // JSON string
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  IntColumn get createdAt => integer()(); // millisecondsSinceEpoch
}

typedef PendingSyncOpEntry = PendingSyncOp;

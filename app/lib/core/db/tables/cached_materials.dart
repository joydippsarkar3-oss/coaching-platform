import "package:drift/drift.dart";

class CachedMaterials extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get courseId => text()();
  TextColumn get unitId => text()();
  TextColumn get filePath => text()(); // absolute path in documents dir
  TextColumn get mimeType => text()(); // "application/pdf" | "video/mp4"
  IntColumn get cachedAt => integer()(); // millisecondsSinceEpoch
  IntColumn get fileSizeBytes => integer()();

  @override
  Set<Column> get uniqueColumns => {{courseId, unitId}};
}

typedef CachedMaterialEntry = CachedMaterial;

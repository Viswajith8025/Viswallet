import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/features/smart_tagging/domain/classification_models.dart';

class TaggingEngine {
  const TaggingEngine();

  static const _sourcePriority = {
    ClassificationSource.userLearned: 6,
    ClassificationSource.history: 4,
    ClassificationSource.merchant: 3,
    ClassificationSource.keyword: 2,
    ClassificationSource.ai: 1,
  };

  TransactionClassification mergeSignals(
    ClassificationRequest request,
    List<ClassificationSignal> signals, {
    List<CategoriesTableData> categories = const [],
  }) {
    if (signals.isEmpty) {
      return const TransactionClassification();
    }

    final sorted = [...signals]
      ..sort((a, b) {
        final pa = _sourcePriority[a.source] ?? 0;
        final pb = _sourcePriority[b.source] ?? 0;
        if (pa != pb) return pb.compareTo(pa);
        return b.confidence.compareTo(a.confidence);
      });

    final categorySignal = sorted.firstWhere(
      (s) => s.categorySlug != null,
      orElse: () => sorted.first,
    );

    final slugToId = {for (final c in categories) c.slug: c.id};
    final slugToName = {for (final c in categories) c.slug: c.name};

    final allTags = <String>{};
    for (final signal in sorted) {
      allTags.addAll(signal.tags);
    }

    final slug = categorySignal.categorySlug;
    return TransactionClassification(
      categorySlug: slug,
      categoryId: slug != null ? slugToId[slug] : null,
      suggestedCategoryName: slug != null ? slugToName[slug] : null,
      tags: allTags.toList(),
      confidence: categorySignal.confidence,
      signals: sorted,
    );
  }
}

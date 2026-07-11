import 'package:flutter_test/flutter_test.dart';
import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/features/smart_tagging/domain/classification_models.dart';
import 'package:rupee_track/features/smart_tagging/domain/tagging_engine.dart';
import 'package:rupee_track/features/smart_tagging/domain/transaction_classifiers.dart';

void main() {
  const engine = TaggingEngine();

  final categories = [
    CategoriesTableData(
      id: 1,
      name: 'Food',
      slug: 'food',
      iconName: 'restaurant',
      colorValue: 0xFFFF6B6B,
      isSystem: true,
      countsTowardSpending: true,
      sortOrder: 1,
      isDeleted: false,
    ),
    CategoriesTableData(
      id: 2,
      name: 'Subscriptions',
      slug: 'subscriptions',
      iconName: 'subscriptions',
      colorValue: 0xFF9B59B6,
      isSystem: true,
      countsTowardSpending: true,
      sortOrder: 3,
      isDeleted: false,
    ),
  ];

  test('merchant classifier maps Spotify to subscriptions', () async {
    const classifier = MerchantRuleClassifier();
    final signal = await classifier.classify(
      const ClassificationRequest(title: 'Spotify Premium'),
    );
    expect(signal?.categorySlug, 'subscriptions');
    expect(signal?.tags, contains('Subscription'));
  });

  test('keyword classifier adds Medical tag', () async {
    const classifier = KeywordClassifier();
    final signal = await classifier.classify(
      const ClassificationRequest(title: 'Medical store purchase'),
    );
    expect(signal?.tags, contains('Medical'));
  });

  test('engine prefers user learned over merchant', () {
    final result = engine.mergeSignals(
      const ClassificationRequest(title: 'swiggy'),
      const [
        ClassificationSignal(
          source: ClassificationSource.merchant,
          confidence: 0.85,
          categorySlug: 'food',
          tags: ['Food'],
        ),
        ClassificationSignal(
          source: ClassificationSource.userLearned,
          confidence: 1.0,
          categorySlug: 'shopping',
          tags: ['Family'],
          reason: 'User correction',
        ),
      ],
      categories: categories,
    );
    expect(result.categorySlug, 'shopping');
    expect(result.tags, containsAll(['Food', 'Family']));
  });

  test('engine prefers user learned over ai even when ai confidence is higher', () {
    final result = engine.mergeSignals(
      const ClassificationRequest(title: 'amazon pay'),
      const [
        ClassificationSignal(
          source: ClassificationSource.ai,
          confidence: 0.99,
          categorySlug: 'shopping',
          tags: ['Online'],
        ),
        ClassificationSignal(
          source: ClassificationSource.userLearned,
          confidence: 0.7,
          categorySlug: 'food',
          tags: ['Groceries'],
          reason: 'User correction',
        ),
      ],
      categories: categories,
    );
    expect(result.categorySlug, 'food');
    expect(result.tags, containsAll(['Online', 'Groceries']));
  });

  test('Swiggy maps to food via merchant rules', () async {
    const classifier = MerchantRuleClassifier();
    final signal = await classifier.classify(
      const ClassificationRequest(title: 'Swiggy order'),
    );
    expect(signal?.categorySlug, 'food');
  });
}

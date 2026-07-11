import 'package:rupee_track/core/database/app_database.dart';
import 'package:rupee_track/features/smart_tagging/domain/classification_models.dart';
import 'package:rupee_track/features/smart_tagging/domain/default_tagging_rules.dart';

/// Pluggable classifier — swap in AI or remote models later.
abstract class TransactionClassifier {
  const TransactionClassifier();

  Future<ClassificationSignal?> classify(ClassificationRequest request);
}

class UserLearnedClassifier extends TransactionClassifier {
  const UserLearnedClassifier(this.rules);

  final List<TaggingRulesTableData> rules;

  @override
  Future<ClassificationSignal?> classify(ClassificationRequest request) async {
    final pattern = normalizeTaggingPattern(request.title);
    if (pattern.isEmpty) return null;

    TaggingRulesTableData? match;
    for (final rule in rules) {
      if (rule.source != 'user') continue;
      if (rule.matchField != 'title') continue;
      if (pattern == rule.pattern || pattern.contains(rule.pattern)) {
        match = rule;
        break;
      }
    }
    if (match == null) return null;

    return ClassificationSignal(
      source: ClassificationSource.userLearned,
      confidence: match.confidence,
      categorySlug: match.categorySlug,
      tags: parseTagsJson(match.tags),
      reason: 'You classified "${match.pattern}" this way before',
    );
  }
}

class HistoryClassifier extends TransactionClassifier {
  const HistoryClassifier();

  @override
  Future<ClassificationSignal?> classify(ClassificationRequest request) async {
    if (request.historyCategorySlug == null) return null;
    return ClassificationSignal(
      source: ClassificationSource.history,
      confidence: 0.82,
      categorySlug: request.historyCategorySlug,
      tags: request.historyTags,
      reason: 'Matches your previous "${request.title}" expenses',
    );
  }
}

class MerchantRuleClassifier extends TransactionClassifier {
  const MerchantRuleClassifier({
    this.dbRules = const [],
    this.builtinRules = builtinMerchantRules,
  });

  final List<TaggingRulesTableData> dbRules;
  final List<MerchantRule> builtinRules;

  @override
  Future<ClassificationSignal?> classify(ClassificationRequest request) async {
    final text = request.combinedText;
    if (text.isEmpty) return null;

    for (final rule in dbRules) {
      if (rule.source == 'user') continue;
      if (!text.contains(rule.pattern)) continue;
      return ClassificationSignal(
        source: ClassificationSource.merchant,
        confidence: rule.confidence,
        categorySlug: rule.categorySlug,
        tags: parseTagsJson(rule.tags),
        reason: 'Merchant match: ${rule.pattern}',
      );
    }

    for (final rule in builtinRules) {
      if (!text.contains(rule.pattern)) continue;
      return ClassificationSignal(
        source: ClassificationSource.merchant,
        confidence: rule.confidence,
        categorySlug: rule.categorySlug,
        tags: rule.tags,
        reason: 'Known merchant: ${rule.pattern}',
      );
    }
    return null;
  }
}

class KeywordClassifier extends TransactionClassifier {
  const KeywordClassifier({
    this.rules = builtinKeywordRules,
  });

  final List<KeywordTagRule> rules;

  @override
  Future<ClassificationSignal?> classify(ClassificationRequest request) async {
    final text = request.combinedText;
    if (text.isEmpty) return null;

    final tags = <String>{};
    String? categorySlug;
    var bestConfidence = 0.0;
    String? matchedKeyword;

    for (final rule in rules) {
      if (!text.contains(rule.keyword)) continue;
      tags.addAll(rule.tags);
      if (rule.categorySlug != null &&
          rule.confidence >= bestConfidence) {
        categorySlug = rule.categorySlug;
        bestConfidence = rule.confidence;
        matchedKeyword = rule.keyword;
      }
    }

    if (tags.isEmpty && categorySlug == null) return null;

    return ClassificationSignal(
      source: ClassificationSource.keyword,
      confidence: bestConfidence > 0 ? bestConfidence : 0.6,
      categorySlug: categorySlug,
      tags: tags.toList(),
      reason: matchedKeyword != null
          ? 'Keyword: $matchedKeyword'
          : 'Keyword tags detected',
    );
  }
}

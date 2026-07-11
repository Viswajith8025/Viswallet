enum AllocationMode {
  manual('manual', 'I will type amounts'),
  percentage('percentage', 'Split by percentage'),
  perCategory('per_category', 'One budget per category'),
  aiSuggested('ai_suggested', 'Suggested');

  const AllocationMode(this.storageKey, this.label);

  final String storageKey;
  final String label;

  static AllocationMode fromKey(String key) => values.firstWhere(
        (m) => m.storageKey == key,
        orElse: () => AllocationMode.percentage,
      );
}

enum BucketType {
  spending('spending'),
  reserve('reserve'),
  investment('investment');

  const BucketType(this.storageKey);
  final String storageKey;

  static BucketType fromKey(String key) => BucketType.values.firstWhere(
        (t) => t.storageKey == key,
        orElse: () => BucketType.spending,
      );
}

enum BudgetAlertLevel {
  none,
  watch50,
  watch75,
  critical90,
  exceeded,
}

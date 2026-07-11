class AppConstants {
  static const appName = 'Viswallet';
  static const appTagline = 'Your money, clearly understood.';
  static const currencyCode = 'INR';
  static const currencySymbol = '₹';
  static const defaultSalaryDay = 1;

  static const defaultMajorExpenseThresholdRupees = 500;
  static const defaultLargeExpenseThresholdRupees = 2000;
  static const defaultVeryLargeExpenseThresholdRupees = 10000;
  static const defaultMajorPurchaseThresholdRupees = 5000;

  /// Hosted privacy policy — update before Play Store submission.
  static const privacyPolicyUrl =
      'https://github.com/Viswajith8025/Viswallet/blob/main/PRIVACY.md';

  static const termsOfServiceUrl =
      'https://github.com/Viswajith8025/Viswallet/blob/main/TERMS.md';

  /// Subscription cost as share of salary — warning thresholds.
  static const subscriptionBurdenWarningPercent = 10.0;
  static const subscriptionBurdenCriticalPercent = 15.0;
  static const subscriptionForecastRiskPercent = 12.0;

  /// Budget bucket usage — aligned with financial health score.
  static const budgetOnTrackMaxPercentUsed = 75.0;

  static const onboardingCompleteKey = 'onboarding_complete';
  static const localOnlyModeKey = 'local_only_mode';

  /// Deep link target for Supabase password-recovery emails.
  static const authPasswordResetRedirect = 'viswallet://reset-password';
  static const selectedMonthKeyPref = 'selected_month_key';
  static const selectedCycleKeyPref = 'selected_cycle_key';

  /// User id bound to the currently open SQLite file (account isolation).
  static const activeDatabaseUserIdKey = 'active_database_user_id';

  /// First account that claimed the legacy shared `vis_wallet.sqlite` file.
  static const legacyDatabaseOwnerUserIdKey = 'legacy_database_owner_user_id';
}

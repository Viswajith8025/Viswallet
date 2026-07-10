import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/bootstrap.dart';
import 'package:rupee_track/core/constants/app_constants.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/features/dashboard/presentation/dashboard_screen.dart';
import 'package:rupee_track/features/expenses/presentation/expense_list_screen.dart';
import 'package:rupee_track/features/expenses/presentation/quick_add_expense_screen.dart';
import 'package:rupee_track/features/insights/presentation/insights_screen.dart';
import 'package:rupee_track/features/jithu/presentation/jithu_screen.dart';
import 'package:rupee_track/features/loans/presentation/borrowed_screen.dart';
import 'package:rupee_track/features/loans/presentation/loans_screen.dart';
import 'package:rupee_track/features/monthly_report/presentation/monthly_report_screen.dart';
import 'package:rupee_track/features/monthly_report/presentation/widgets/monthly_report_listener.dart';
import 'package:rupee_track/features/more/presentation/more_screen.dart';
import 'package:rupee_track/features/onboarding/presentation/onboarding_screen.dart';
import 'package:rupee_track/features/salary/presentation/salary_screen.dart';
import 'package:rupee_track/features/settings/presentation/settings_screen.dart';
import 'package:rupee_track/features/shell/presentation/main_shell.dart';
import 'package:rupee_track/features/subscriptions/presentation/subscription_health_screen.dart';
import 'package:rupee_track/features/about/presentation/about_screen.dart';
import 'package:rupee_track/features/budget/presentation/budget_planner_screen.dart';
import 'package:rupee_track/features/budget/presentation/category_budget_screen.dart';
import 'package:rupee_track/features/budget/presentation/budget_setup_screen.dart';
import 'package:rupee_track/features/budget_alerts/presentation/widgets/budget_alerts_panel.dart';
import 'package:rupee_track/features/health_score/presentation/widgets/financial_health_card.dart';
import 'package:rupee_track/features/help_support/presentation/help_support_screen.dart';
import 'package:rupee_track/features/auth/presentation/auth_screen.dart';
import 'package:rupee_track/features/universal_search/presentation/universal_search_screen.dart';
import 'package:rupee_track/features/activity_history/presentation/activity_timeline_screen.dart';
import 'package:rupee_track/features/activity_history/presentation/recycle_bin_screen.dart';
import 'package:rupee_track/features/expense_heatmap/presentation/expense_heatmap_screen.dart';
import 'package:rupee_track/features/savings_forecast/presentation/savings_forecast_screen.dart';
import 'package:rupee_track/features/financial_calendar/presentation/financial_calendar_screen.dart';
import 'package:rupee_track/features/cloud_backup/presentation/cloud_backup_listener.dart';
import 'package:rupee_track/features/home_widget/presentation/widget_launch_handler.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final onboardingComplete =
      sharedPreferences.getBool(AppConstants.onboardingCompleteKey) ?? false;

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation:
        onboardingComplete ? AppRoutes.home : AppRoutes.onboarding,
    routes: [
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (context, state) => const CloudBackupListener(
          child: OnboardingScreen(),
        ),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => CloudBackupListener(
          child: WidgetLaunchHandler(
            child: MonthlyReportListener(
              child: BudgetAlertsListener(
                child: MainShell(child: child),
              ),
            ),
          ),
        ),
        routes: [
          GoRoute(
            path: AppRoutes.home,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: DashboardScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.expenses,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ExpenseListScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.insights,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: InsightsScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.jithu,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: JithuScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.more,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: MoreScreen(),
            ),
          ),
        ],
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.expenseAdd,
        builder: (context, state) => const QuickAddExpenseScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.salary,
        builder: (context, state) => const SalaryScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.subscriptions,
        builder: (context, state) => const SubscriptionHealthScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.loans,
        builder: (context, state) => const LoansScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.borrowed,
        builder: (context, state) => const BorrowedScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.settings,
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.budget,
        builder: (context, state) => const BudgetPlannerScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.budgetSetup,
        builder: (context, state) => const BudgetSetupScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.categoryBudget,
        builder: (context, state) => const CategoryBudgetScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.monthlyReport,
        builder: (context, state) => MonthlyReportScreen(
          initialCycleKey: state.extra as String?,
        ),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.search,
        pageBuilder: (context, state) => CustomTransitionPage(
          child: UniversalSearchScreen(
            initialQuery: state.uri.queryParameters['q'],
          ),
          transitionsBuilder: (context, animation, _, child) {
            return FadeTransition(
              opacity: animation,
              child: child,
            );
          },
        ),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.activityHistory,
        builder: (context, state) => const ActivityTimelineScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.recycleBin,
        builder: (context, state) => const RecycleBinScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.expenseHeatmap,
        builder: (context, state) => const ExpenseHeatmapScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.savingsForecast,
        builder: (context, state) => const SavingsForecastScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.calendar,
        builder: (context, state) => const FinancialCalendarScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.financialHealth,
        builder: (context, state) => const FinancialHealthScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.budgetAlerts,
        builder: (context, state) => const BudgetAlertsScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.about,
        builder: (context, state) => const AboutScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.helpSupport,
        builder: (context, state) => const HelpSupportScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: AppRoutes.auth,
        builder: (context, state) {
          final signUp = state.uri.queryParameters['signup'] == '1';
          return AuthScreen(initialSignUp: signUp);
        },
      ),
    ],
  );
});

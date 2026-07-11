import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

import 'package:rupee_track/bootstrap.dart';

import 'package:rupee_track/core/constants/app_constants.dart';

import 'package:rupee_track/core/design_system/premium_page_transitions.dart';

import 'package:rupee_track/core/router/routes.dart';

import 'package:rupee_track/features/dashboard/presentation/dashboard_screen.dart';

import 'package:rupee_track/features/expenses/presentation/expense_list_screen.dart';

import 'package:rupee_track/features/expenses/presentation/quick_add_expense_screen.dart';

import 'package:rupee_track/features/insights/presentation/insights_screen.dart';

import 'package:rupee_track/features/jithu/presentation/jithu_screen.dart';

import 'package:rupee_track/features/loans/presentation/borrowed_screen.dart';

import 'package:rupee_track/features/loans/presentation/loans_screen.dart';

import 'package:rupee_track/features/monthly_report/presentation/widgets/monthly_report_listener.dart';

import 'package:rupee_track/features/more/presentation/more_screen.dart';

import 'package:rupee_track/features/onboarding/presentation/onboarding_screen.dart';

import 'package:rupee_track/features/salary/presentation/salary_screen.dart';

import 'package:rupee_track/features/settings/presentation/settings_screen.dart';

import 'package:rupee_track/features/shell/presentation/main_shell.dart';

import 'package:rupee_track/features/subscriptions/presentation/subscription_health_screen.dart';

import 'package:rupee_track/features/about/presentation/about_screen.dart';

import 'package:rupee_track/features/budget/presentation/budget_planner_screen.dart';

import 'package:rupee_track/features/budget/presentation/budget_setup_screen.dart';

import 'package:rupee_track/features/budget_alerts/presentation/widgets/budget_alerts_panel.dart';

import 'package:rupee_track/features/help_support/presentation/help_support_screen.dart';

import 'package:rupee_track/features/auth/presentation/auth_screen.dart';

import 'package:rupee_track/features/universal_search/presentation/universal_search_screen.dart';

import 'package:rupee_track/features/activity_history/presentation/activity_timeline_screen.dart';

import 'package:rupee_track/features/activity_history/presentation/recycle_bin_screen.dart';

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

        pageBuilder: (context, state) => calmPushPage(

          child: const CloudBackupListener(

            child: OnboardingScreen(),

          ),

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

        pageBuilder: (context, state) =>

            calmPushPage(child: const QuickAddExpenseScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.salary,

        pageBuilder: (context, state) =>

            calmPushPage(child: const SalaryScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.subscriptions,

        pageBuilder: (context, state) =>

            calmPushPage(child: const SubscriptionHealthScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.loans,

        pageBuilder: (context, state) =>

            calmPushPage(child: const LoansScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.borrowed,

        pageBuilder: (context, state) =>

            calmPushPage(child: const BorrowedScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.settings,

        pageBuilder: (context, state) =>

            calmPushPage(child: const SettingsScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.budget,

        pageBuilder: (context, state) =>

            calmPushPage(child: const BudgetPlannerScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.budgetSetup,

        pageBuilder: (context, state) =>

            calmPushPage(child: const BudgetSetupScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.search,

        pageBuilder: (context, state) => calmPushPage(

          child: UniversalSearchScreen(

            initialQuery: state.uri.queryParameters['q'],

          ),

        ),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.activityHistory,

        pageBuilder: (context, state) =>

            calmPushPage(child: const ActivityTimelineScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.recycleBin,

        pageBuilder: (context, state) =>

            calmPushPage(child: const RecycleBinScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.budgetAlerts,

        pageBuilder: (context, state) =>

            calmPushPage(child: const BudgetAlertsScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.about,

        pageBuilder: (context, state) =>

            calmPushPage(child: const AboutScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.helpSupport,

        pageBuilder: (context, state) =>

            calmPushPage(child: const HelpSupportScreen()),

      ),

      GoRoute(

        parentNavigatorKey: _rootNavigatorKey,

        path: AppRoutes.auth,

        pageBuilder: (context, state) {

          final signUp = state.uri.queryParameters['signup'] == '1';

          return calmPushPage(child: AuthScreen(initialSignUp: signUp));

        },

      ),

    ],

  );

});



import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:rupee_track/bootstrap.dart';
import 'package:rupee_track/core/branding/vis_wallet_logo.dart';
import 'package:rupee_track/core/constants/app_constants.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_list_tile.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/providers/supabase_provider.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/features/auth/data/auth_repository.dart';
import 'package:rupee_track/features/cloud_backup/data/cloud_backup_coordinator.dart';

class OnboardingScreen extends HookConsumerWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFinishing = useState(false);
    final isRestoring = useState(false);
    final theme = Theme.of(context);
    final user = ref.watch(currentUserProvider);

    Future<void> finishOnboarding({required bool localOnly}) async {
      if (isFinishing.value) return;
      isFinishing.value = true;
      try {
        await sharedPreferences.setBool(AppConstants.onboardingCompleteKey, true);
        await sharedPreferences.setBool(
          AppConstants.localOnlyModeKey,
          localOnly,
        );
        if (context.mounted) {
          context.go(AppRoutes.home);
        }
      } finally {
        isFinishing.value = false;
      }
    }

    Future<void> continueWithAccount() async {
      if (user == null) return;
      isRestoring.value = true;
      try {
        await ref.read(cloudBackupCoordinatorProvider).syncAfterAuth();
        await finishOnboarding(localOnly: false);
      } finally {
        if (context.mounted) {
          isRestoring.value = false;
        }
      }
    }

    Future<void> afterSignedIn() async {
      await continueWithAccount();
    }

    Future<void> useLocalOnly() async {
      if (user != null) {
        await ref.read(authRepositoryProvider).signOut();
      }
      await finishOnboarding(localOnly: true);
    }

    final busy = isRestoring.value || isFinishing.value;

    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final short = AppResponsive.isShortScreen(context);
            final logoSize = short ? 64.0 : 80.0;
            final wordmarkSize = short ? 26.0 : 30.0;

            return SingleChildScrollView(
              padding: EdgeInsets.all(
                AppResponsive.horizontalPadding(constraints.maxWidth),
              ),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight -
                      MediaQuery.paddingOf(context).vertical,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SizedBox(height: short ? AppSpacing.xl : AppSpacing.xxxl),
                    Center(
                      child: VisWalletLogo(size: logoSize, showShadow: true),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    Center(
                      child: VisWalletWordmark(fontSize: wordmarkSize),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    if (user != null) ...[
                      Text(
                        'Welcome back',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        user.email ?? 'Signed in',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: theme.colorScheme.primary,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      PremiumCard(
                        variant: PremiumCardVariant.tinted,
                        tintColor: theme.colorScheme.primary,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            PremiumRowTile(
                              title: 'Cloud backup ready',
                              subtitle:
                                  'We can restore your budget, expenses, and goals from your last backup.',
                              leading: Icon(
                                Icons.cloud_done_outlined,
                                color: theme.colorScheme.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ] else ...[
                      Text(
                        'Track spending on your phone. Sign in when you want backup across devices.',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      PremiumCard(
                        variant: PremiumCardVariant.elevated,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Why create an account?',
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            _ValueRow(
                              icon: Icons.cloud_upload_outlined,
                              text:
                                  'Automatic cloud backup when you leave the app',
                            ),
                            _ValueRow(
                              icon: Icons.phonelink_erase_outlined,
                              text:
                                  'Restore after reinstall or a new phone',
                            ),
                            _ValueRow(
                              icon: Icons.lock_outline_rounded,
                              text: 'Same email signs you in on every device',
                            ),
                          ],
                        ),
                      ),
                    ],
                    SizedBox(height: short ? AppSpacing.xl : AppSpacing.xxxl),
                    if (busy) ...[
                      const Center(child: CircularProgressIndicator()),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        isRestoring.value
                            ? 'Restoring your data from your account…'
                            : 'Opening your dashboard…',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ] else if (user != null) ...[
                      FilledButton.icon(
                        onPressed: continueWithAccount,
                        icon: const Icon(Icons.home_rounded),
                        label: const Text('Continue to Home'),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      OutlinedButton.icon(
                        onPressed: () async {
                          await ref.read(authRepositoryProvider).signOut();
                        },
                        icon: const Icon(Icons.swap_horiz_rounded),
                        label: const Text('Switch account'),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      TextButton(
                        onPressed: useLocalOnly,
                        child: const Text('Use this phone only (no cloud sync)'),
                      ),
                    ] else ...[
                      FilledButton.icon(
                        onPressed: () async {
                          final signedIn = await context
                              .push<bool>('${AppRoutes.auth}?signup=1');
                          if (signedIn == true && context.mounted) {
                            await afterSignedIn();
                          }
                        },
                        icon: const Icon(Icons.person_add_outlined),
                        label: const Text('Create account'),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      OutlinedButton.icon(
                        onPressed: () async {
                          final signedIn =
                              await context.push<bool>(AppRoutes.auth);
                          if (signedIn == true && context.mounted) {
                            await afterSignedIn();
                          }
                        },
                        icon: const Icon(Icons.login_rounded),
                        label: const Text('Sign in'),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      TextButton(
                        onPressed: useLocalOnly,
                        child: const Text('Try without an account'),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Local-only mode keeps data on this device. You can sign in later from Settings to enable cloud backup.',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                          height: 1.45,
                        ),
                      ),
                    ],
                    const SizedBox(height: AppSpacing.xl),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ValueRow extends StatelessWidget {
  const _ValueRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadius.iconBox),
            ),
            child: Icon(icon, size: AppIconSize.sm, color: theme.colorScheme.primary),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: AppSpacing.xxs),
              child: Text(
                text,
                style: theme.textTheme.bodySmall?.copyWith(height: 1.4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

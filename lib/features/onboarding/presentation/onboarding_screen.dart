import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:rupee_track/bootstrap.dart';
import 'package:rupee_track/core/branding/vis_wallet_logo.dart';
import 'package:rupee_track/core/constants/app_constants.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/core/providers/supabase_provider.dart';
import 'package:rupee_track/core/router/routes.dart';
import 'package:rupee_track/core/widgets/theme_toggle_button.dart';
import 'package:rupee_track/features/cloud_backup/data/cloud_backup_coordinator.dart';

class OnboardingScreen extends HookConsumerWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isFinishing = useState(false);
    final isRestoring = useState(false);
    final theme = Theme.of(context);
    final user = ref.watch(currentUserProvider);

    Future<void> completeOnboarding() async {
      if (isFinishing.value) return;
      if (user == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Create an account or sign in before continuing.'),
          ),
        );
        return;
      }
      isFinishing.value = true;
      try {
        await sharedPreferences.setBool(
          AppConstants.onboardingCompleteKey,
          true,
        );
        if (context.mounted) {
          context.go(AppRoutes.home);
        }
      } finally {
        isFinishing.value = false;
      }
    }

    Future<void> afterSignedIn() async {
      isRestoring.value = true;
      try {
        await ref.read(cloudBackupCoordinatorProvider).syncAfterAuth();
      } finally {
        if (context.mounted) {
          isRestoring.value = false;
          await completeOnboarding();
        }
      }
    }

    useEffect(
      () {
        if (user == null) return null;
        var active = true;
        Future.microtask(() async {
          isRestoring.value = true;
          try {
            await ref.read(cloudBackupCoordinatorProvider).syncAfterAuth();
          } finally {
            if (active && context.mounted) {
              isRestoring.value = false;
              await completeOnboarding();
            }
          }
        });
        return () => active = false;
      },
      [user?.id],
    );

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
                    const Align(
                      alignment: Alignment.centerRight,
                      child: ThemeToggleButton(),
                    ),
                    SizedBox(height: short ? AppSpacing.xl : AppSpacing.xxxl),
                    Center(
                      child: VisWalletLogo(size: logoSize, showShadow: true),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    Center(
                      child: VisWalletWordmark(fontSize: wordmarkSize),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      'Create your account once. You stay signed in until you choose to log out.',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        height: 1.5,
                      ),
                    ),
                    SizedBox(height: short ? AppSpacing.xl : AppSpacing.xxxl),
                    if (isRestoring.value || isFinishing.value) ...[
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
                        label: const Text('Already have an account? Sign in'),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'After sign-in you\'ll land on Home. Add your monthly salary there when you\'re ready.',
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

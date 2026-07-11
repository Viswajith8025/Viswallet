import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:rupee_track/core/constants/app_constants.dart';
import 'package:rupee_track/core/branding/vis_wallet_logo.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/premium_snackbar.dart';
import 'package:rupee_track/core/design_system/premium_text_field.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/features/auth/data/auth_repository.dart';
import 'package:rupee_track/features/auth/domain/auth_error_utils.dart';

class AuthScreen extends HookConsumerWidget {
  const AuthScreen({super.key, this.initialSignUp = false});

  final bool initialSignUp;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSignUp = useState(initialSignUp);
    final emailController = useTextEditingController();
    final passwordController = useTextEditingController();
    final nameController = useTextEditingController();
    final hintController = useTextEditingController();
    final isLoading = useState(false);

    Future<void> submit() async {
      final email = emailController.text.trim();
      final password = passwordController.text;
      if (email.isEmpty || password.length < 6) {
        showPremiumSnackBar(
          context,
          message: 'Enter a valid email and password (min 6 characters).',
          kind: PremiumSnackBarKind.error,
        );
        return;
      }

      if (isSignUp.value) {
        final hint = hintController.text.trim();
        if (hint.isNotEmpty && hint.length < 3) {
          showPremiumSnackBar(
            context,
            message:
                'Password hint must be at least 3 characters, or leave it blank.',
            kind: PremiumSnackBarKind.error,
          );
          return;
        }
      }

      isLoading.value = true;
      try {
        final auth = ref.read(authRepositoryProvider);
        if (isSignUp.value) {
          final response = await auth.signUp(
            email: email,
            password: password,
            displayName: nameController.text.trim().isEmpty
                ? null
                : nameController.text.trim(),
            passwordHint: hintController.text.trim().isEmpty
                ? null
                : hintController.text.trim(),
          );
          if (!context.mounted) return;

          if (response.session != null) {
            Navigator.of(context).pop(true);
            showPremiumSnackBar(
              context,
              message: 'Welcome to ${AppConstants.appName}!',
              kind: PremiumSnackBarKind.success,
            );
          } else {
            showPremiumSnackBar(
              context,
              message:
                  'Account created. Sign in with your email and password.',
              kind: PremiumSnackBarKind.info,
            );
            isSignUp.value = false;
          }
        } else {
          await auth.signIn(email: email, password: password);
          if (context.mounted) Navigator.of(context).pop(true);
        }
      } catch (e) {
        if (context.mounted) {
          final message = AuthErrorUtils.friendlyMessage(e);
          showPremiumSnackBar(
            context,
            message: message,
            kind: PremiumSnackBarKind.error,
          );
          if (isSignUp.value && message.contains('already has an account')) {
            isSignUp.value = false;
          }
        }
      } finally {
        isLoading.value = false;
      }
    }

    Future<void> sendPasswordReset() async {
      final email = emailController.text.trim();
      if (email.isEmpty) {
        showPremiumSnackBar(
          context,
          message: 'Enter your email address first.',
          kind: PremiumSnackBarKind.error,
        );
        return;
      }
      isLoading.value = true;
      try {
        await ref.read(authRepositoryProvider).sendPasswordResetEmail(email);
        if (!context.mounted) return;
        showPremiumSnackBar(
          context,
          message:
              'Password reset email sent. Open the link in your inbox to choose a new password.',
          kind: PremiumSnackBarKind.success,
        );
      } catch (e) {
        if (context.mounted) {
          showPremiumSnackBar(
            context,
            message: AuthErrorUtils.friendlyMessage(e),
            kind: PremiumSnackBarKind.error,
          );
        }
      } finally {
        isLoading.value = false;
      }
    }

    final theme = Theme.of(context);

    return Scaffold(
      appBar: PremiumAppBar(
        title: isSignUp.value ? 'Create account' : 'Sign in',
        subtitle: 'Your ${AppConstants.appName} account',
      ),
      body: ResponsiveBody(
        child: ListView(
          padding: AppResponsive.screenPadding(
            context,
            bottom: AppSpacing.xxl,
          ),
          children: [
            Center(
              child: VisWalletLogo(
                size: 56,
                showShadow: true,
                variant: theme.brightness == Brightness.dark
                    ? VisWalletLogoVariant.dark
                    : VisWalletLogoVariant.brand,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            PremiumCard(
              variant: PremiumCardVariant.elevated,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    isSignUp.value
                        ? 'Join ${AppConstants.appName}'
                        : 'Welcome back',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxs),
                  Text(
                    isSignUp.value
                        ? 'Create an account for cloud backup across devices.'
                        : 'Use the email and password from when you signed up.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  if (isSignUp.value) ...[
                    PremiumTextField(
                      controller: nameController,
                      label: 'Display name (optional)',
                      prefixIcon: Icons.person_outline_rounded,
                      textCapitalization: TextCapitalization.words,
                      textInputAction: TextInputAction.next,
                    ),
                    const SizedBox(height: AppSpacing.md),
                  ],
                  PremiumTextField(
                    controller: emailController,
                    label: 'Email',
                    prefixIcon: Icons.mail_outline_rounded,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autocorrect: false,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  PremiumPasswordField(
                    controller: passwordController,
                    textInputAction: isSignUp.value
                        ? TextInputAction.next
                        : TextInputAction.done,
                    onSubmitted: (_) {
                      if (!isSignUp.value) submit();
                    },
                  ),
                  if (isSignUp.value) ...[
                    const SizedBox(height: AppSpacing.md),
                    PremiumTextField(
                      controller: hintController,
                      label: 'Password hint (optional)',
                      hint: "e.g. My dog's name + birth year",
                      helper:
                          'A private reminder — not your password. You can reset via email.',
                      prefixIcon: Icons.lightbulb_outline_rounded,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => submit(),
                    ),
                  ],
                  if (!isSignUp.value) ...[
                    const SizedBox(height: AppSpacing.sm),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton(
                        onPressed: isLoading.value ? null : sendPasswordReset,
                        child: const Text('Forgot password? Email reset link'),
                      ),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.lg),
                  FilledButton(
                    onPressed: isLoading.value ? null : submit,
                    child: isLoading.value
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(
                            isSignUp.value ? 'Create account' : 'Sign in',
                          ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  TextButton(
                    onPressed: isLoading.value
                        ? null
                        : () => isSignUp.value = !isSignUp.value,
                    child: Text(
                      isSignUp.value
                          ? 'Already have an account? Sign in'
                          : 'New here? Create an account',
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

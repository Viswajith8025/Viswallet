import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:rupee_track/core/constants/app_constants.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/features/auth/data/auth_repository.dart';
import 'package:rupee_track/features/auth/domain/auth_error_utils.dart';

class AuthScreen extends HookConsumerWidget {
  const AuthScreen({super.key, this.initialSignUp = false});

  /// When true, opens on the create-account form.
  final bool initialSignUp;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSignUp = useState(initialSignUp);
    final emailController = useTextEditingController();
    final passwordController = useTextEditingController();
    final nameController = useTextEditingController();
    final hintController = useTextEditingController();
    final isLoading = useState(false);
    final obscurePassword = useState(true);

    Future<void> submit() async {
      final email = emailController.text.trim();
      final password = passwordController.text;
      if (email.isEmpty || password.length < 6) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Enter a valid email and password (min 6 chars).'),
          ),
        );
        return;
      }

      if (isSignUp.value) {
        final hint = hintController.text.trim();
        if (hint.length < 3) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Add a short password hint (min 3 characters) to help you remember.',
              ),
            ),
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
            passwordHint: hintController.text.trim(),
          );
          if (!context.mounted) return;

          if (response.session != null) {
            Navigator.of(context).pop(true);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Welcome to ${AppConstants.appName}!')),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Account created. Sign in with your email and password.',
                ),
              ),
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
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(message)),
          );
          if (isSignUp.value &&
              message.contains('already has an account')) {
            isSignUp.value = false;
          }
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
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        children: [
          Text(
            isSignUp.value ? 'Join ${AppConstants.appName}' : 'Welcome back',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            isSignUp.value
                ? 'Create an account to save your profile and stay signed in.'
                : 'Use the same email and password you chose when signing up.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              height: 1.45,
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          if (isSignUp.value) ...[
            TextField(
              controller: nameController,
              textInputAction: TextInputAction.next,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Display name (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          TextField(
            controller: emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autocorrect: false,
            decoration: const InputDecoration(
              labelText: 'Email',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(
            controller: passwordController,
            obscureText: obscurePassword.value,
            textInputAction: isSignUp.value
                ? TextInputAction.next
                : TextInputAction.done,
            onSubmitted: (_) {
              if (!isSignUp.value) submit();
            },
            decoration: InputDecoration(
              labelText: 'Password',
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: Icon(
                  obscurePassword.value
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
                onPressed: () => obscurePassword.value = !obscurePassword.value,
              ),
            ),
          ),
          if (isSignUp.value) ...[
            const SizedBox(height: AppSpacing.md),
            TextField(
              controller: hintController,
              textInputAction: TextInputAction.done,
              textCapitalization: TextCapitalization.sentences,
              onSubmitted: (_) => submit(),
              decoration: const InputDecoration(
                labelText: 'Password hint',
                hintText: 'e.g. My dog\'s name + birth year',
                helperText:
                    'A private reminder — not your password. Shown if you forget.',
                border: OutlineInputBorder(),
              ),
            ),
          ],
          if (!isSignUp.value) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Forgot your password? After signing in, open Settings → Account → '
              'View password hint.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                height: 1.45,
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
                : Text(isSignUp.value ? 'Create account' : 'Sign in'),
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
    );
  }
}

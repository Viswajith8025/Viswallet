import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/design_system/tokens/app_motion.dart';
import 'package:rupee_track/core/providers/settings_provider.dart';

/// Compact theme switch — prefer Settings → Appearance for full control.
class ThemeToggleButton extends ConsumerWidget {
  const ThemeToggleButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final brightness = Theme.of(context).brightness;
    final isDark = themeMode == ThemeMode.dark ||
        (themeMode == ThemeMode.system && brightness == Brightness.dark);
    final duration = AppMotion.resolve(context, AppMotion.durationFast);

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Tooltip(
        message: isDark ? 'Switch to light mode' : 'Switch to dark mode',
        child: Material(
          color: Theme.of(context).colorScheme.surfaceContainerHighest
              .withValues(alpha: 0.72),
          borderRadius: BorderRadius.circular(999),
          child: InkWell(
            borderRadius: BorderRadius.circular(999),
            onTap: () {
              ref.read(themeModeProvider.notifier).setThemeMode(
                    isDark ? ThemeMode.light : ThemeMode.dark,
                  );
            },
            child: AnimatedContainer(
              duration: duration,
              curve: AppMotion.curveStandard,
              height: 34,
              width: 58,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: Theme.of(context)
                      .colorScheme
                      .outline
                      .withValues(alpha: 0.45),
                ),
              ),
              child: AnimatedAlign(
                duration: duration,
                curve: AppMotion.curveStandard,
                alignment: isDark ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  height: 26,
                  width: 26,
                  decoration: BoxDecoration(
                    color: isDark
                        ? Theme.of(context).colorScheme.primary
                        : Theme.of(context).colorScheme.primary,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isDark
                        ? Icons.dark_mode_rounded
                        : Icons.light_mode_rounded,
                    size: 16,
                    color: isDark
                        ? Theme.of(context).colorScheme.onPrimary
                        : Theme.of(context).colorScheme.onPrimary,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

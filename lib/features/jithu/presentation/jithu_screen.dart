import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_app_bar.dart';
import 'package:rupee_track/core/design_system/skeleton_loader.dart';
import 'package:rupee_track/core/providers/salary_cycle_provider.dart';
import 'package:rupee_track/core/utils/date_utils.dart';
import 'package:rupee_track/core/widgets/error_state.dart';
import 'package:rupee_track/features/dashboard/data/dashboard_repository.dart';
import 'package:rupee_track/features/dashboard/domain/monthly_summary.dart';
import 'package:rupee_track/features/jithu/data/jithu_repository.dart';
import 'package:rupee_track/features/jithu/domain/jithu_branding.dart';
import 'package:rupee_track/features/jithu/domain/jithu_chat_message.dart';
import 'package:rupee_track/features/jithu/domain/jithu_fallback_advisor.dart';
import 'package:rupee_track/features/safe_spend/data/safe_spend_repository.dart';
import 'package:rupee_track/features/safe_spend/domain/safe_spend_snapshot.dart';
import 'package:rupee_track/core/design_system/premium_card.dart';
import 'package:rupee_track/core/design_system/responsive.dart';
import 'package:rupee_track/features/safe_spend/presentation/widgets/safe_spend_card.dart';
import 'package:rupee_track/core/design_system/shell_bottom_inset.dart';
import 'package:rupee_track/core/router/routes.dart';

class JithuScreen extends ConsumerStatefulWidget {
  const JithuScreen({super.key});

  @override
  ConsumerState<JithuScreen> createState() => _JithuScreenState();
}

class _JithuScreenState extends ConsumerState<JithuScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final _messages = <JithuChatMessage>[];
  bool _isLoading = false;

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _ask(
    String text,
    CycleSummary summary,
    SafeSpendSnapshot safeSpend,
  ) async {
    final question = text.trim();
    if (question.isEmpty || _isLoading) return;

    setState(() {
      _messages.add(JithuChatMessage(fromUser: true, text: question));
      _isLoading = true;
      _controller.clear();
    });
    _scrollToBottom();

    try {
      final reply = await ref.read(jithuRepositoryProvider).ask(
            question: question,
            history: _messages,
            summary: summary,
            safeSpend: safeSpend,
          );

      if (!mounted) return;
      setState(() {
        _messages.add(JithuChatMessage(fromUser: false, text: reply));
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _messages.add(
          JithuChatMessage(
            fromUser: false,
            text: JithuFallbackAdvisor.reply(
              question: question,
              summary: summary,
              safeSpend: safeSpend,
            ),
          ),
        );
        _isLoading = false;
      });
    }
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final salaryDay = ref.watch(salaryDayProvider);
    final cycleKey = currentCycleKey(salaryDay: salaryDay);
    final summaryAsync = ref.watch(monthlySummaryProvider(cycleKey));
    final safeSpendAsync = ref.watch(safeSpendProvider(cycleKey));

    return Scaffold(
      appBar: PremiumAppBar(
        title: JithuBranding.displayName,
        subtitle: 'Your money assistant',
        leading: Navigator.of(context).canPop()
            ? const BackButton()
            : Padding(
          padding: const EdgeInsets.only(left: AppSpacing.sm),
          child: Center(
            child: Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: Theme.of(context)
                    .colorScheme
                    .primaryContainer
                    .withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Icon(
                Icons.auto_awesome_rounded,
                size: 20,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
        ),
      ),
      body: summaryAsync.when(
        loading: () => const ResponsiveBody(child: DashboardSkeleton()),
        error: (e, _) => ResponsiveBody(
          child: ErrorState(
            message:
                '${JithuBranding.displayName} couldn\'t read your financial summary.',
            onRetry: () {
              ref.invalidate(monthlySummaryProvider(cycleKey));
              ref.invalidate(safeSpendProvider(cycleKey));
            },
          ),
        ),
        data: (summary) => safeSpendAsync.when(
          loading: () => const ResponsiveBody(child: DashboardSkeleton()),
          error: (e, _) => ResponsiveBody(
            child: ErrorState(
              message:
                  '${JithuBranding.displayName} couldn\'t read today\'s spending limit.',
              onRetry: () => ref.invalidate(safeSpendProvider(cycleKey)),
            ),
          ),
          data: (safeSpend) => _JithuBody(
            controller: _controller,
            scrollController: _scrollController,
            messages: _messages,
            isLoading: _isLoading,
            summary: summary,
            safeSpend: safeSpend,
            onAsk: (text) => _ask(text, summary, safeSpend),
            onSeedWelcome: () {
              if (_messages.isNotEmpty) return;
              setState(() {
                _messages.add(
                  JithuChatMessage(
                    fromUser: false,
                    text: summary.salaryEntered
                        ? 'Ask me anything — your spending, saving tips, life questions, or where to find things in Viswallet.'
                        : 'I can help with budgets and spending — but first add your monthly salary. '
                            'Tap the card above or ask "Where do I add my salary?"',
                  ),
                );
              });
            },
          ),
        ),
      ),
    );
  }
}

class _JithuBody extends StatefulWidget {
  const _JithuBody({
    required this.controller,
    required this.scrollController,
    required this.messages,
    required this.isLoading,
    required this.summary,
    required this.safeSpend,
    required this.onAsk,
    required this.onSeedWelcome,
  });

  final TextEditingController controller;
  final ScrollController scrollController;
  final List<JithuChatMessage> messages;
  final bool isLoading;
  final CycleSummary summary;
  final SafeSpendSnapshot safeSpend;
  final ValueChanged<String> onAsk;
  final VoidCallback onSeedWelcome;

  @override
  State<_JithuBody> createState() => _JithuBodyState();
}

class _JithuBodyState extends State<_JithuBody> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onSeedWelcome();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final suggestions = JithuFallbackAdvisor.suggestions(widget.summary);
    final showPrompts = widget.messages.length <= 1;

    return ResponsiveBody(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          Expanded(
            child: ListView(
              controller: widget.scrollController,
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md,
                vertical: AppSpacing.xs,
              ),
              children: [
                if (!widget.summary.salaryEntered)
                  PremiumCard(
                    onTap: () => context.push(AppRoutes.salary),
                    child: ListTile(
                      leading: const Icon(Icons.payments_outlined),
                      title: const Text('Add your salary to get started'),
                      subtitle: const Text('Tap to enter monthly income'),
                      trailing: const Icon(Icons.chevron_right_rounded),
                    ),
                  )
                else
                  SafeSpendCard(snapshot: widget.safeSpend, compact: true),
                if (showPrompts) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Try asking',
                    style: theme.textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Wrap(
                    spacing: AppSpacing.xs,
                    runSpacing: AppSpacing.xs,
                    children: suggestions
                        .map(
                          (s) => ActionChip(
                            label: Text(s),
                            visualDensity: VisualDensity.compact,
                            avatar: const Icon(
                              Icons.auto_awesome_rounded,
                              size: 14,
                            ),
                            onPressed:
                                widget.isLoading ? null : () => widget.onAsk(s),
                          ),
                        )
                        .toList(),
                  ),
                ],
                const SizedBox(height: AppSpacing.md),
                ...widget.messages.map((m) => _MessageBubble(message: m)),
                if (widget.isLoading) const _TypingBubble(),
              ],
            ),
          ),
          SafeArea(
            top: false,
            bottom: false,
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                AppSpacing.md,
                AppSpacing.sm,
                AppSpacing.md,
                ShellBottomInset.composerBottom(context),
              ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: TextField(
                    controller: widget.controller,
                    enabled: !widget.isLoading,
                    textInputAction: TextInputAction.send,
                    minLines: 1,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      hintText: 'Ask a money question...',
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.sm,
                      ),
                    ),
                    onSubmitted: widget.isLoading ? null : widget.onAsk,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Semantics(
                  button: true,
                  label: 'Send message',
                  child: SizedBox(
                    height: 48,
                    width: 48,
                    child: FilledButton(
                      onPressed: widget.isLoading
                          ? null
                          : () => widget.onAsk(widget.controller.text),
                      style: FilledButton.styleFrom(
                        padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                      ),
                      child: widget.isLoading
                          ? SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: theme.colorScheme.onPrimary,
                              ),
                            )
                          : Icon(
                              Icons.send_rounded,
                              color: theme.colorScheme.onPrimary,
                            ),
                    ),
                  ),
                ),
              ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final JithuChatMessage message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isUser = message.fromUser;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.78,
        ),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: isUser
              ? theme.colorScheme.primary
              : theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.72),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(AppRadius.lg),
            topRight: const Radius.circular(AppRadius.lg),
            bottomLeft: Radius.circular(isUser ? AppRadius.lg : AppRadius.xs),
            bottomRight: Radius.circular(isUser ? AppRadius.xs : AppRadius.lg),
          ),
        ),
        child: Text(
          message.text,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: isUser
                ? theme.colorScheme.onPrimary
                : theme.colorScheme.onSurface,
            height: 1.45,
          ),
        ),
      ),
    );
  }
}

class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.72),
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Text(
              'Thinking...',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

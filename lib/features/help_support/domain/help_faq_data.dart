import 'package:flutter/material.dart';
import 'package:rupee_track/features/jithu/domain/jithu_branding.dart';

/// One help article shown in Help & Support.
class HelpFaqEntry {
  const HelpFaqEntry({
    required this.category,
    required this.question,
    required this.answer,
    this.icon,
  });

  final String category;
  final String question;
  final String answer;
  final IconData? icon;
}

/// Pre-written answers for places beginners commonly get stuck.
abstract final class HelpFaqData {
  static const categories = [
    'Getting started',
    'Adding expenses',
    'Budget & salary',
    'Home screen',
    JithuBranding.displayName,
    'Insights & reports',
    'Account & settings',
  ];

  static const entries = <HelpFaqEntry>[
    // Getting started
    HelpFaqEntry(
      category: 'Getting started',
      icon: Icons.person_add_outlined,
      question: 'Do I need an account to use Viswallet?',
      answer:
          'Yes. Create an account once during setup, or sign in if you already have one. '
          'You stay signed in until you choose to log out from Settings.',
    ),
    HelpFaqEntry(
      category: 'Getting started',
      icon: Icons.person_add_outlined,
      question: 'Where do I add my salary?',
      answer:
          'After you sign in, open Home and tap **Add** on the salary banner at the top, '
          'or tap the **Salary** tile in the summary grid. '
          'You can also use Home → Quick actions → **Income**, or More → Settings → Money cycle → **Monthly salary**.',
    ),
    HelpFaqEntry(
      category: 'Getting started',
      icon: Icons.person_add_outlined,
      question: 'Why do I need to enter my salary?',
      answer:
          'Your salary helps Viswallet calculate how much you can spend each day, '
          'how much you are saving, and whether you are on track. '
          'Add it from Home whenever you\'re ready — many features unlock after that.',
    ),
    HelpFaqEntry(
      category: 'Getting started',
      icon: Icons.person_add_outlined,
      question: 'What happens after I sign in?',
      answer:
          'You land on Home. Add your salary when you\'re ready, then use the + button for expenses, '
          'check today\'s spending guide, open ${JithuBranding.displayName} for quick advice, '
          'and use More for budget planning, reports, and settings.',
    ),

    // Adding expenses
    HelpFaqEntry(
      category: 'Adding expenses',
      icon: Icons.add_circle_outline,
      question: 'How do I add an expense quickly?',
      answer:
          'Tap the + button (you can drag it to a comfortable spot). '
          'Enter the amount, then tap what you spent on — food, travel, bills, and so on. '
          'It saves immediately. Tap Help inside Quick Add for more tips.',
    ),
    HelpFaqEntry(
      category: 'Adding expenses',
      icon: Icons.add_circle_outline,
      question: 'Why won\'t my expense save?',
      answer:
          'You need to enter an amount first, then choose a category. '
          'If saving still fails, check that the app has storage permission and try again.',
    ),
    HelpFaqEntry(
      category: 'Adding expenses',
      icon: Icons.add_circle_outline,
      question: 'What is the full expense form?',
      answer:
          'Open Quick Add and tap the expand icon at the top right. '
          'The full form lets you add a title, tags, payment method, and more details.',
    ),
    HelpFaqEntry(
      category: 'Adding expenses',
      icon: Icons.add_circle_outline,
      question: 'Can I use voice to add an expense?',
      answer:
          'Yes. In Quick Add, tap the microphone and say something like '
          '"250 lunch" or "500 Swiggy". Viswallet fills the amount and shop name when it can.',
    ),
    HelpFaqEntry(
      category: 'Adding expenses',
      icon: Icons.add_circle_outline,
      question: 'How do I repeat a common expense?',
      answer:
          'Quick Add shows repeat chips for expenses you log often. '
          'Tap one to save it again in a single tap.',
    ),

    // Budget & salary
    HelpFaqEntry(
      category: 'Budget & salary',
      icon: Icons.pie_chart_outline,
      question: 'What is a spending group?',
      answer:
          'A spending group is a part of your salary — like food, travel, or savings. '
          'When you add an expense, Viswallet tracks it against the right group so you know what is left.',
    ),
    HelpFaqEntry(
      category: 'Budget & salary',
      icon: Icons.pie_chart_outline,
      question: 'How do I set a budget for each category?',
      answer:
          'Go to More → Category budgets. Enter your salary, then type a monthly limit '
          'for Food, Transport, Bills, and every other category. Expenses automatically '
          'count against the matching category.',
    ),
    HelpFaqEntry(
      category: 'Budget & salary',
      icon: Icons.pie_chart_outline,
      question: 'How do I set up my budget?',
      answer:
          'Go to More → Budget planner → Create my budget. '
          'Enter your salary, choose how to split it (percentage is easiest for beginners), '
          'review the groups, then save.',
    ),
    HelpFaqEntry(
      category: 'Budget & salary',
      icon: Icons.pie_chart_outline,
      question: 'What does "carry forward money left over" mean?',
      answer:
          'If you do not spend all the money in a group this month, '
          'the leftover can be added to next month\'s plan for that same group.',
    ),
    HelpFaqEntry(
      category: 'Budget & salary',
      icon: Icons.pie_chart_outline,
      question: 'Where do I change my salary?',
      answer:
          'Home → tap the **Salary** tile in the summary grid, or Quick actions → **Income**. '
          'You can also open More → Settings → Money cycle → **Monthly salary**. '
          'Update the amount whenever your income changes.',
    ),
    HelpFaqEntry(
      category: 'Budget & salary',
      icon: Icons.pie_chart_outline,
      question: 'What is the salary date / salary cycle?',
      answer:
          'This is the day you usually get paid each month. '
          'Viswallet uses it to define "this month" — from one salary date to the day before the next. '
          'Change it in Settings → Salary cycle.',
    ),
    HelpFaqEntry(
      category: 'Budget & salary',
      icon: Icons.pie_chart_outline,
      question: 'What are budget alerts?',
      answer:
          'Friendly warnings when you have used 50%, 75%, 90%, or 100% of a spending group. '
          'Turn them on in Settings.',
    ),

    // Home screen
    HelpFaqEntry(
      category: 'Home screen',
      icon: Icons.home_outlined,
      question: 'What is "today\'s spending guide"?',
      answer:
          'It is a suggested daily limit based on your salary, spending so far, '
          'and days left in the month. It helps you avoid running out of money before your next salary.',
    ),
    HelpFaqEntry(
      category: 'Home screen',
      icon: Icons.home_outlined,
      question: 'Why does Home show only this month?',
      answer:
          'Home focuses on your current month so it stays simple. '
          'To look at older months, go to More → Monthly closing report or Insights.',
    ),
    HelpFaqEntry(
      category: 'Home screen',
      icon: Icons.home_outlined,
      question: 'What is the + button and can I move it?',
      answer:
          'The + button opens Quick Add. Press and drag it to any corner you like — '
          'Viswallet remembers the position.',
    ),
    HelpFaqEntry(
      category: 'Home screen',
      icon: Icons.home_outlined,
      question: 'How do I switch dark and light mode?',
      answer:
          'Tap the sun/moon icon at the top right of most screens. '
          'You can also set System, Light, or Dark in Settings → Appearance.',
    ),

    // AI Jithu
    HelpFaqEntry(
      category: JithuBranding.displayName,
      icon: Icons.auto_awesome_outlined,
      question: 'Who is ${JithuBranding.displayName}?',
      answer:
          '${JithuBranding.displayName} is your AI money assistant in Viswallet. Ask about safe daily spending, '
          'where your money is going, or saving tips. Answers use your real Viswallet numbers.',
    ),
    HelpFaqEntry(
      category: JithuBranding.displayName,
      icon: Icons.auto_awesome_outlined,
      question: 'Why does ${JithuBranding.displayName} say "Add salary to unlock advice"?',
      answer:
          '${JithuBranding.displayName} needs your salary and some spending data to give useful answers. '
          'Add salary from Home → Salary tile, Quick actions → Income, or Settings → Monthly salary.',
    ),
    HelpFaqEntry(
      category: JithuBranding.displayName,
      icon: Icons.auto_awesome_outlined,
      question: 'Is ${JithuBranding.displayName} connected to the internet?',
      answer:
          'Yes, when you chat ${JithuBranding.displayName} uses cloud AI (Groq) with your financial summary as context. '
          'Your full expense list is not uploaded — only the numbers shown in the quick read. '
          'If offline, ${JithuBranding.displayName} falls back to simple on-device answers.',
    ),

    // Insights & reports
    HelpFaqEntry(
      category: 'Insights & reports',
      icon: Icons.insights_outlined,
      question: 'What is the Insights tab for?',
      answer:
          'Insights shows where your money goes over time — daily averages, '
          'biggest categories, repeated expenses, and charts. '
          'Use the month selector at the top to change the period.',
    ),
    HelpFaqEntry(
      category: 'Insights & reports',
      icon: Icons.insights_outlined,
      question: 'What is Financial health?',
      answer:
          'A simple score (0–100) for your money habits — saving, budgeting, debt, '
          'subscriptions, and spending steadiness. Open it from Home or Insights.',
    ),
    HelpFaqEntry(
      category: 'Insights & reports',
      icon: Icons.insights_outlined,
      question: 'How do I see last month\'s summary?',
      answer:
          'Go to More → Monthly closing report, or tap the monthly report card on Home. '
          'Pick a previous month and view spending, budget performance, and exports.',
    ),

    // Account & settings
    HelpFaqEntry(
      category: 'Account & settings',
      icon: Icons.settings_outlined,
      question: 'I forgot my password. What can I do?',
      answer:
          'After signing in, open Settings → Account → View password hint. '
          'If you added a hint during signup, it will appear there. '
          'Viswallet does not email a reset link — the hint is what you saved yourself.',
    ),
    HelpFaqEntry(
      category: 'Account & settings',
      icon: Icons.settings_outlined,
      question: 'Why can\'t I create a new account?',
      answer:
          'Account creation may be turned off on the server for a short time. '
          'Try again later, or sign in if you already have an account.',
    ),
    HelpFaqEntry(
      category: 'Account & settings',
      icon: Icons.settings_outlined,
      question: 'Where is my data stored?',
      answer:
          'Your expenses and budget are saved on this phone and backed up to your account when signed in. '
          'Reinstalls and app updates restore automatically. Only Factory reset erases cloud data.',
    ),
    HelpFaqEntry(
      category: 'Account & settings',
      question: 'How do I sign out?',
      answer:
          'Go to Settings → Account → Sign out. '
          'You will need to sign in again next time you open the app.',
      icon: Icons.settings_outlined,
    ),
    HelpFaqEntry(
      category: 'Account & settings',
      icon: Icons.settings_outlined,
      question: 'The app shows an error. What should I try?',
      answer:
          'Pull down to refresh on the screen, or tap Retry if you see it. '
          'Make sure you are signed in and have added salary if the screen needs it. '
          'Restart the app if a screen stays blank.',
    ),
  ];
}

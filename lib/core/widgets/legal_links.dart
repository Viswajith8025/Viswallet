import 'package:flutter/material.dart';
import 'package:rupee_track/core/constants/app_constants.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';
import 'package:rupee_track/core/design_system/premium_list_tile.dart';
import 'package:rupee_track/core/design_system/premium_snackbar.dart';
import 'package:url_launcher/url_launcher.dart';

/// Privacy policy and terms links for Settings and About.
class LegalLinksCard extends StatelessWidget {
  const LegalLinksCard({super.key});

  Future<void> _open(BuildContext context, String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!context.mounted) return;
      showPremiumSnackBar(
        context,
        message: 'Could not open link',
        kind: PremiumSnackBarKind.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        PremiumMenuTile(
          icon: Icons.privacy_tip_outlined,
          title: 'Privacy policy',
          subtitle: 'How we handle your data',
          onTap: () => _open(context, AppConstants.privacyPolicyUrl),
        ),
        const SizedBox(height: AppSpacing.sm),
        PremiumMenuTile(
          icon: Icons.description_outlined,
          title: 'Terms of service',
          subtitle: 'Rules for using ${AppConstants.appName}',
          onTap: () => _open(context, AppConstants.termsOfServiceUrl),
        ),
      ],
    );
  }
}

/// Compact row variant for About screen.
class LegalLinksSection extends StatelessWidget {
  const LegalLinksSection({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(top: AppSpacing.md),
      child: LegalLinksCard(),
    );
  }
}

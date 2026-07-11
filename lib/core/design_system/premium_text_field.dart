import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:rupee_track/core/design_system/design_tokens.dart';

/// Themed text field — uses [ThemeData.inputDecorationTheme], no ad-hoc borders.
class PremiumTextField extends StatelessWidget {
  const PremiumTextField({
    required this.controller,
    super.key,
    this.label,
    this.hint,
    this.helper,
    this.errorText,
    this.prefixText,
    this.prefixIcon,
    this.suffix,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.textCapitalization = TextCapitalization.none,
    this.autocorrect = true,
    this.readOnly = false,
    this.onChanged,
    this.onSubmitted,
    this.maxLines = 1,
    this.inputFormatters,
  });

  final TextEditingController controller;
  final String? label;
  final String? hint;
  final String? helper;
  final String? errorText;
  final String? prefixText;
  final IconData? prefixIcon;
  final Widget? suffix;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final TextCapitalization textCapitalization;
  final bool autocorrect;
  final bool readOnly;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final int maxLines;
  final List<TextInputFormatter>? inputFormatters;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      textCapitalization: textCapitalization,
      autocorrect: autocorrect,
      readOnly: readOnly,
      maxLines: maxLines,
      inputFormatters: inputFormatters,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      style: Theme.of(context).textTheme.bodyLarge,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        helperText: helper,
        errorText: errorText,
        prefixText: prefixText,
        prefixIcon: prefixIcon != null ? Icon(prefixIcon, size: AppIconSize.md) : null,
        suffixIcon: suffix,
      ),
    );
  }
}

/// Password field with visibility toggle.
class PremiumPasswordField extends StatefulWidget {
  const PremiumPasswordField({
    required this.controller,
    super.key,
    this.label = 'Password',
    this.textInputAction,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final String label;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;

  @override
  State<PremiumPasswordField> createState() => _PremiumPasswordFieldState();
}

class _PremiumPasswordFieldState extends State<PremiumPasswordField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return PremiumTextField(
      controller: widget.controller,
      label: widget.label,
      obscureText: _obscure,
      textInputAction: widget.textInputAction,
      onSubmitted: widget.onSubmitted,
      autocorrect: false,
      suffix: IconButton(
        tooltip: _obscure ? 'Show password' : 'Hide password',
        onPressed: () => setState(() => _obscure = !_obscure),
        icon: Icon(
          _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
          size: AppIconSize.md,
        ),
      ),
    );
  }
}

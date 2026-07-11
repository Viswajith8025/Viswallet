import 'package:flutter/material.dart';

/// Maps [CategoriesTable.icon] string values to Material [IconData].
///
/// Unknown names fall back to [Icons.category_outlined] — never a blank glyph.
IconData categoryIconFromName(String? iconName) {
  if (iconName == null || iconName.trim().isEmpty) {
    return Icons.category_outlined;
  }
  return _categoryIconByName[iconName] ?? Icons.category_outlined;
}

/// Every icon name stored in [defaultCategories] and common DB overrides.
const Map<String, IconData> _categoryIconByName = {
  'restaurant': Icons.restaurant,
  'smartphone': Icons.smartphone,
  'subscriptions': Icons.subscriptions,
  'directions_bus': Icons.directions_bus,
  'shopping_bag': Icons.shopping_bag,
  'movie': Icons.movie,
  'receipt_long': Icons.receipt_long,
  'favorite': Icons.favorite,
  'home': Icons.home,
  'school': Icons.school,
  'trending_up': Icons.trending_up,
  'savings': Icons.savings_outlined,
  'family_restroom': Icons.family_restroom,
  'account_balance': Icons.account_balance,
  'payments': Icons.payments,
  'more_horiz': Icons.more_horiz,
};

/// Glyphs resolved at runtime from category DB strings — listed for release
/// icon tree-shaking so glyphs are bundled in optimized APKs/AABs.
const List<IconData> kCategoryIconGlyphs = [
  Icons.restaurant,
  Icons.smartphone,
  Icons.subscriptions,
  Icons.directions_bus,
  Icons.shopping_bag,
  Icons.movie,
  Icons.receipt_long,
  Icons.favorite,
  Icons.home,
  Icons.school,
  Icons.trending_up,
  Icons.savings_outlined,
  Icons.family_restroom,
  Icons.account_balance,
  Icons.payments,
  Icons.more_horiz,
  Icons.category_outlined,
];

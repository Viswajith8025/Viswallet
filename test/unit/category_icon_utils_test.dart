import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rupee_track/core/constants/category_defaults.dart';
import 'package:rupee_track/core/utils/category_icon_utils.dart';
import 'package:rupee_track/core/utils/material_icon_manifest.dart';

void main() {
  test('default category icon names resolve to Material icons', () {
    for (final category in defaultCategories) {
      final icon = categoryIconFromName(category.iconName);
      expect(icon, isNot(equals(Icons.category_outlined)),
          reason: '${category.slug} should map ${category.iconName}');
    }
  });

  test('unknown category icon names fall back safely', () {
    expect(categoryIconFromName('not_a_real_icon'), Icons.category_outlined);
    expect(categoryIconFromName(''), Icons.category_outlined);
    expect(categoryIconFromName(null), Icons.category_outlined);
  });

  test('material icon manifest is non-empty for release bundling', () {
    MaterialIconManifest.ensureBundled();
    expect(MaterialIconManifest.all.length, greaterThan(kCategoryIconGlyphs.length));
  });
}

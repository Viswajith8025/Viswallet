/// Strict 8-point spacing grid (base unit = 8).
abstract final class AppSpacing {
  static const unit = 8.0;

  static const s0 = 0.0;
  static const half = 4.0;
  static const s1 = unit;
  static const s2 = unit * 2;
  static const s3 = unit * 3;
  static const s4 = unit * 4;
  static const s5 = unit * 5;
  static const s6 = unit * 6;
  static const s7 = unit * 7;
  static const s8 = unit * 8;

  // Legacy aliases — map to 8-pt grid (prefer s* in new code).
  static const xxs = half;
  static const xs = s1;
  static const sm = s2;
  static const md = s2;
  static const lg = s3;
  static const xl = s3;
  static const xxl = s4;
  static const xxxl = s5;
  static const huge = s6;

  static const screenHorizontal = s3;
  static const cardPadding = s3;
  static const sectionGap = s3;
  static const menuTilePadding = s2;
  static const iconBox = s6;
}

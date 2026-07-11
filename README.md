# Viswallet

Premium personal finance tracker — understand where every rupee goes.

**Tagline:** Your money, clearly understood.

> **Package name:** The Dart/Flutter package is `rupee_track` (historical internal name).
> User-facing branding, store listing, and deep links use **Viswallet**. Do not rename
> the package without a coordinated migration — imports, Android applicationId, and CI
> all reference `rupee_track` today.

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) 3.24+
- Android Studio (for Android) or Visual Studio with C++ (for Windows desktop)

## Platforms

| Platform | Status |
|----------|--------|
| **Android** | Primary release target (Play Store) |
| **Windows** | Dev/desktop builds supported |
| **Web** | Removed — not shipped |
| **iOS** | Not in v1.0 scope (no `ios/` folder); add when App Store signing is ready |

## Setup

```powershell
cd viswallet
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run
```

## Brand

- **Colors:** Deep navy primary (#0F3D5E), teal secondary, mint accent
- **Fonts:** Plus Jakarta Sans (headlines) + Inter (body)
- **Logo:** Geometric wallet with stylized "V"

## Architecture

Feature-first Clean Architecture · Riverpod · GoRouter · Drift (SQLite)

See [RELEASE.md](RELEASE.md) for signing, Groq/Jithu keys, and `flutter build appbundle`.

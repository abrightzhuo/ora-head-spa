# ORA Head Spa iOS Build

## Requirements

- Full Xcode installation
- Apple Developer account and signing team
- Node.js and npm

## Prepare dependencies

From the extracted package root, run:

```bash
npm ci
```

The Xcode project uses Swift Package Manager. Capacitor is pinned to `7.6.9`,
and the Capacitor plugins are resolved from the installed npm packages.

## Open and build

Open:

```text
ios/App/App.xcodeproj
```

In the App target:

1. Open **Signing & Capabilities**.
2. Select the Apple Developer team.
3. Confirm the bundle identifier is `com.myoraspa.app`.
4. Select an iPhone simulator or connected device and run the App target.

For App Store distribution, update the version/build number, create an Archive,
and complete signing through Xcode Organizer.

The app loads `https://www.myoraspa.com` and supports custom links in this form:

```text
com.myoraspa.app://www.myoraspa.com/account
```

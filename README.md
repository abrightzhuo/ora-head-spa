# React + TypeScript + Vite

## Customer mobile apps

The iOS and Android apps use Capacitor 7 and load the production customer
experience from `https://www.myoraspa.com`.

- App name: `ORA Head Spa`
- Bundle/Application ID: `com.myoraspa.app`
- Custom deep link: `com.myoraspa.app://www.myoraspa.com/<path>`

Sync web and native projects:

```bash
npm run mobile:sync
```

Open the native projects after installing the platform toolchains:

```bash
npm run mobile:ios
npm run mobile:android
```

iOS requires the full Xcode application. Android requires Android Studio and
an Android SDK configured through `ANDROID_HOME` or `android/local.properties`.
Store signing credentials and developer accounts are required for release
archives.

## Gift card email delivery

Gift card purchases send the recipient and purchaser localized emails through
Resend after Square payment and database writes succeed. Configure these
server-side Vercel environment variables:

- `RESEND_API_KEY`: Resend API key. Mark it Sensitive and never add `VITE_`.
- `RESEND_FROM_EMAIL`: Sender using a domain verified in Resend, for example
  `ORA Gift Cards <giftcards@example.com>`.
- `RESEND_REPLY_TO_EMAIL`: Optional customer-service reply address.
- `PUBLIC_SITE_URL`: Production site URL used for gift card balance links.

Add the variables to Production and Preview, then redeploy. Sandbox purchases
send email with a test warning because Sandbox gift cards remain inactive.

## Customer accounts

Customer registration and sign-in use Supabase Auth. Before deploying:

1. Run `supabase/migrations/20260821_customer_accounts.sql` in the Supabase
   SQL Editor.
2. In Supabase Authentication settings, keep Email enabled and require email
   confirmation.
3. Set the Site URL to `https://ora-head-spa.vercel.app`.
4. Add `https://ora-head-spa.vercel.app/account` to the allowed redirect URLs.

Booking and gift card payment APIs require a confirmed Supabase user token.
The server uses the authenticated email instead of trusting a purchaser email
from the browser. Customer record queries return only that user's linked
appointments and gift cards; staff permissions continue to use
`staff_profiles`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  extends: [
    // other configs...
    // Enable lint rules for React
    reactX.configs['recommended-typescript'],
    // Enable lint rules for React DOM
    reactDom.configs.recommended,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

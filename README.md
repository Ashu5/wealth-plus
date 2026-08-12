# Wealth Plus UI

The application is registred www.koshmitra.com.
## Firebase deployment with GitHub secrets

This app is prepared to inject Firebase and API values at build time from GitHub Actions secrets.

### Required GitHub secrets
- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `FIREBASE_SERVICE_ACCOUNT`

### Local development
Create a local env file named `.envdev` with the same variable names.

### Deploy
Push to `main` or run the workflow manually from GitHub Actions.

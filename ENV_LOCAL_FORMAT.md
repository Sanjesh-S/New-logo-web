# Correct .env.local Format

Your `.env.local` file should contain environment variables in **KEY=value** format, NOT JavaScript objects.

## ❌ Wrong Format (JavaScript object):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC4SqbxwKCJmUBNKt85UwEJgNnep9t7qOY",
  authDomain: "worthyten-otp-a925d.firebaseapp.com",
  // ...
};
```

## ✅ Correct Format (Environment variables):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC4SqbxwKCJmUBNKt85UwEJgNnep9t7qOY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=worthyten-otp-a925d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=worthyten-otp-a925d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=worthyten-otp-a925d.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1067702314639
NEXT_PUBLIC_FIREBASE_APP_ID=1:1067702314639:web:0bb2a39181720c306572fa
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-WBXQ5SM16Y
TELEGRAM_BOT_TOKEN=8588484467:AAGgyZn5TNgz1LgmM0M5hQ_ZeQPk6JEzs6A
TELEGRAM_CHAT_ID=6493761091
```

## Update Your .env.local File

Replace the JavaScript object with the environment variables shown above. Each line should be:
- `VARIABLE_NAME=value`
- No quotes needed (unless the value contains spaces)
- No `const`, `=`, or JavaScript syntax
- One variable per line

## After Updating

1. Save the file
2. Restart your development server:
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

The error should be resolved!

# Firestore Security Rules Setup

## Issue
The API route is getting "PERMISSION_DENIED: Missing or insufficient permissions" when trying to write to the `pickupRequests` collection.

## Solution: Update Firestore Security Rules

You need to update your Firestore security rules to allow writes to the `pickupRequests` collection.

### Steps:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `worthyten-otp-a925d`

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab

3. **Update Security Rules**
   - Replace your current rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reads/writes to pickupRequests collection
    match /pickupRequests/{document=**} {
      allow read, write: if true; // For development - restrict in production
    }
    
    // Allow reads/writes to valuations collection
    match /valuations/{document=**} {
      allow read, write: if true; // For development - restrict in production
    }
    
    // Allow reads/writes to products collection
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    // Allow reads/writes to productPricing collection
    match /productPricing/{document=**} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    // Allow reads/writes to settings collection
    match /settings/{document=**} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    // Allow reads/writes to users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow reads/writes to staffUsers collection
    match /staffUsers/{document=**} {
      allow read, write: if request.auth != null; // Only authenticated users
    }
  }
}
```

4. **Publish the Rules**
   - Click "Publish" button
   - Wait for the rules to be deployed (usually takes a few seconds)

## Production Security Rules (Recommended)

For production, use more restrictive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Pickup requests - allow anyone to create, but only admins to read/update
    match /pickupRequests/{requestId} {
      allow create: if true; // Anyone can create pickup requests
      allow read, update, delete: if request.auth != null && 
        exists(/databases/$(database)/documents/staffUsers/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/staffUsers/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Valuations - allow authenticated users to create, admins to read/update
    match /valuations/{valuationId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update, delete: if request.auth != null && 
        exists(/databases/$(database)/documents/staffUsers/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/staffUsers/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Products - public read, admin write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/staffUsers/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/staffUsers/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Product pricing - public read, admin write
    match /productPricing/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/staffUsers/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/staffUsers/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Settings - public read, admin write
    match /settings/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/staffUsers/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/staffUsers/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users - users can read/write their own data
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Staff users - only admins can read/write
    match /staffUsers/{document=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/staffUsers/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/staffUsers/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Testing

After updating the rules:
1. Wait a few seconds for the rules to propagate
2. Try creating a pickup request again
3. Check the browser console for any remaining errors

## Troubleshooting

- **Rules not updating**: Clear browser cache and hard refresh (Ctrl+Shift+R)
- **Still getting permission errors**: Check that you're using the correct Firebase project
- **Rules syntax errors**: Use the Firebase Console Rules editor which will highlight syntax errors

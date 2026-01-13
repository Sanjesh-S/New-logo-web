# Complete Firestore Security Rules

Copy and paste this entire ruleset into your Firebase Console → Firestore Database → Rules tab:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is staff member
    function isStaff() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/staffUsers/$(request.auth.uid));
    }
    
    // Helper function to get staff user data
    function getStaffUser() {
      return get(/databases/$(database)/documents/staffUsers/$(request.auth.uid)).data;
    }
    
    // Helper function to check if user has specific role
    function hasRole(role) {
      return isStaff() && getStaffUser().role == role && getStaffUser().isActive == true;
    }
    
    // Helper function to check if user is admin (manager or superadmin)
    function isAdmin() {
      return hasRole('superadmin') || hasRole('manager');
    }
    
    // Staff Users Collection - Only Super Admins can manage
    match /staffUsers/{userId} {
      allow read: if isStaff();
      allow create, update, delete: if hasRole('superadmin');
    }
    
    // Products Collection
    match /products/{productId} {
      // Anyone can read products (for public website)
      allow read: if true;
      
      // Only managers and superadmins can add/edit products
      allow create, update: if isAdmin();
      
      // Only superadmins can delete products
      allow delete: if hasRole('superadmin');
    }
    
    // Product Pricing Collection
    match /productPricing/{productId} {
      // Anyone can read pricing (needed for valuation flow)
      allow read: if true;
      
      // Only managers and superadmins can manage pricing
      allow create, update: if isAdmin();
      
      // Only superadmins can delete pricing
      allow delete: if hasRole('superadmin');
    }
    
    // Pickup Requests Collection - Allows API routes to create
    match /pickupRequests/{requestId} {
      // Allow anyone to create pickup requests (for API routes)
      allow create: if true;
      
      // Users can read their own requests (if userId is set)
      allow read: if isAuthenticated() && 
                     (request.auth.uid == resource.data.userId || isStaff());
      
      // Staff can read all pickup requests
      allow read: if isStaff();
      
      // Staff can update pickup requests (status changes, etc.)
      allow update: if isStaff();
      
      // Only superadmins can delete pickup requests
      allow delete: if hasRole('superadmin');
    }
    
    // Valuations Collection - Allows API routes to create
    match /valuations/{valuationId} {
      // Allow anyone to create valuations (for API routes)
      allow create: if true;
      
      // Users can read their own valuations (if userId is set)
      allow read: if isAuthenticated() && 
                     (request.auth.uid == resource.data.userId || isStaff());
      
      // Staff can read all valuations
      allow read: if isStaff();
      
      // Staff can update valuations
      allow update: if isStaff();
      
      // Only superadmins can delete valuations
      allow delete: if hasRole('superadmin');
    }
    
    // Settings Collection
    match /settings/{document=**} {
      // Anyone can read settings (for pricing rules, etc.)
      allow read: if true;
      
      // Only admins can write settings
      allow write: if isAdmin();
    }
    
    // Users Collection (for customer data and coins)
    match /users/{userId} {
      // Users can read their own data, staff can read all users
      allow read: if isAuthenticated() && 
                     (request.auth.uid == userId || isStaff());
      
      // Users can create and update their own data
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && 
                       (request.auth.uid == userId || isStaff());
      
      // Only superadmins can delete users
      allow delete: if hasRole('superadmin');
    }
    
    // Mail Collection (if you have this)
    match /mail/{document=**} {
      allow read, write: if isStaff();
    }
    
    // Default deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Key Changes Made:

1. ✅ **pickupRequests**: Changed `allow create` to `if true` - allows API routes to create pickup requests
2. ✅ **valuations**: Added complete rule set with `allow create: if true` - allows API routes to create valuations
3. ✅ **settings**: Added rule for pricing rules and settings
4. ✅ **mail**: Added rule if you use mail collection

## How to Apply:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `worthyten-otp-a925d`
3. Navigate to **Firestore Database** → **Rules** tab
4. **Replace** your entire rules section with the code above
5. Click **"Publish"** button
6. Wait a few seconds for rules to propagate

## Testing:

After updating the rules:
- ✅ Pickup requests will save to Firestore
- ✅ Telegram notifications will be sent
- ✅ Valuations will be created successfully
- ✅ Order flow will complete without errors

## Security Notes:

- `allow create: if true` allows unauthenticated API writes, which is needed for server-side routes
- All other operations (read, update, delete) still require proper authentication
- Staff members can manage all data
- Regular users can only read/update their own data

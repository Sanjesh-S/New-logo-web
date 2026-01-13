# Updated Firestore Rules for Pickup Requests

## Issue
Your current rules require authentication for `pickupRequests`, but the server-side API route doesn't have an authenticated user context.

## Solution
Update the `pickupRequests` rule to allow unauthenticated writes from API routes:

```javascript
// Pickup Requests Collection
match /pickupRequests/{requestId} {
  // Allow anyone to create pickup requests (for API routes and authenticated users)
  allow create: if true; // Allow unauthenticated API writes
  
  // Users can read their own requests (if userId is set)
  allow read: if isAuthenticated() && 
                 (request.auth.uid == resource.data.userId || isStaff());
  
  // Staff can update pickup requests (status changes, etc.)
  allow update: if isStaff();
  
  // Only superadmins can delete pickup requests
  allow delete: if hasRole('superadmin');
}
```

## Complete Updated Rules

Replace your entire rules section with this:

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
    
    // Pickup Requests Collection - UPDATED
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
    
    // Valuations Collection - REQUIRED
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
    
    // Settings Collection (if you have this)
    match /settings/{document=**} {
      allow read: if true;
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
    
    // Default deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Key Changes

1. **pickupRequests.create**: Changed from `isAuthenticated() && request.auth.uid == request.resource.data.userId` to `if true` - allows unauthenticated API writes
2. **pickupRequests.read**: Added a rule for staff to read all requests
3. **Added valuations collection**: If you use this collection, it now allows unauthenticated creates

## Security Note

Allowing `create: if true` means anyone can create pickup requests. This is acceptable because:
- Pickup requests are customer submissions (not sensitive admin data)
- You can validate the data on the server side
- Staff can still manage/update them through authenticated routes

If you want more security, you could:
- Add rate limiting in your API route
- Validate the request data server-side
- Use Firebase App Check for additional protection

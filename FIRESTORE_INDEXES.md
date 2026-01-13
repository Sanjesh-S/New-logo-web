# Firestore Indexes Required

This document lists the composite indexes that need to be created in Firebase Console for optimal query performance.

## Required Indexes

### 1. Valuations Collection

**Index for: `getUserValuations`**
- Collection: `valuations`
- Fields:
  - `userId` (Ascending)
  - `createdAt` (Descending)
- Query Scope: Collection

**How to create:**
1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Add the fields above in the specified order
4. Set query scope to "Collection"

### 2. Devices Collection

**Index for: `getDevices` (with brand filter)**
- Collection: `devices`
- Fields:
  - `category` (Ascending)
  - `brand` (Ascending)
  - `model` (Ascending)
- Query Scope: Collection

**Note:** Firestore will prompt you to create these indexes automatically when you run queries that require them. You can also create them manually using the steps above.

## Performance Benefits

- **Faster Queries**: Composite indexes allow Firestore to efficiently execute queries with multiple filters
- **Lower Costs**: Optimized queries use fewer reads
- **Better Scalability**: Indexes improve performance as your data grows

## Monitoring

Check Firestore usage in Firebase Console to monitor:
- Query performance
- Index usage
- Read/write operations

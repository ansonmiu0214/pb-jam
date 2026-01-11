# Prompt 3.3: Firestore Connection Testing - Implementation Guide

## Overview

This implementation provides functions to test and verify Firestore read/write operations for authenticated users. It ensures that logged-in users can successfully interact with the database.

## Key Features Implemented

### 1. Write Test Document
```typescript
writeTestDocument(userId: string, testData?: Record<string, unknown>): Promise<string>
```
- Creates a test document in Firestore under the user's collection
- Path: `users/{userId}/tests/{docId}`
- Returns the document ID
- Includes default metadata (timestamp, message, testType)
- Accepts custom data for flexible testing

### 2. Read Test Document
```typescript
readTestDocument(userId: string, documentId: string): Promise<Record<string, unknown> | null>
```
- Reads a test document from Firestore
- Path: `users/{userId}/tests/{docId}`
- Returns document data or null if not found
- Verifies user-scoped data access

### 3. Delete Test Document
```typescript
deleteTestDocument(userId: string, documentId: string): Promise<void>
```
- Deletes a test document from Firestore
- Used for cleanup after testing
- Path: `users/{userId}/tests/{docId}`

### 4. Complete Connection Test
```typescript
testFirestoreConnection(userId: string, cleanup?: boolean): Promise<{ documentId: string; data: Record<string, unknown> }>
```
- Runs a complete write-read cycle
- Creates test document, reads it back, optionally deletes it
- Returns document ID and data for verification
- Single function to verify entire flow

### 5. Firebase Verification
```typescript
verifyFirebaseConnection(): Promise<boolean>
```
- Checks that Firebase services are properly initialized
- Logs auth and Firestore status
- Returns true if services are ready

## Data Structure

### Test Document Collection
```
Firestore Structure:
└── users (collection)
    └── {userId} (document)
        └── tests (collection)
            └── {docId} (document)
                ├── timestamp: string (ISO 8601)
                ├── message: string
                ├── testType: string
                └── [custom fields from testData]
```

### Default Test Document
```typescript
{
  timestamp: "2026-01-11T15:30:45.123Z",
  message: "Test document for Firestore connection verification",
  testType: "firestore-read-write"
}
```

## Usage Examples

### Basic Test - Write and Read
```typescript
import { writeTestDocument, readTestDocument, deleteTestDocument } from './services/firebaseService';

const userId = getCurrentUser()?.id;
if (!userId) {
  console.error('User not authenticated');
  return;
}

// Write test document
const docId = await writeTestDocument(userId);
console.log('Created test doc:', docId);

// Read it back
const data = await readTestDocument(userId, docId);
console.log('Read test doc:', data);

// Clean up
await deleteTestDocument(userId, docId);
console.log('Deleted test doc');
```

### Complete Test with Cleanup
```typescript
import { testFirestoreConnection } from './services/firebaseService';

const userId = getCurrentUser()?.id;
if (!userId) return;

try {
  const result = await testFirestoreConnection(userId, true); // cleanup=true
  console.log('✓ Firestore test passed');
  console.log('Document ID:', result.documentId);
  console.log('Document data:', result.data);
} catch (error) {
  console.error('✗ Firestore test failed:', error);
}
```

### Custom Test Data
```typescript
const customData = {
  userId: userId,
  testTimestamp: Date.now(),
  testName: 'my-custom-test',
  metadata: {
    browser: 'Chrome',
    version: 'v1.0.0'
  }
};

const docId = await writeTestDocument(userId, customData);
```

## Testing Strategy

### Unit Tests
Located in `tests/firestore.test.ts`:
- ✅ Write operation test
- ✅ Read operation test
- ✅ Delete operation test
- ✅ Complete write-read cycle
- ✅ Data preservation (custom data)
- ✅ Non-existent document handling
- ✅ User-scoped isolation
- ✅ Error handling

### Integration Tests
Tests verify:
- ✅ Firestore connectivity for authenticated users
- ✅ User-level data isolation (each user's documents are private)
- ✅ Complete CRUD cycle (Create, Read, Delete)
- ✅ Data integrity (written data matches read data)
- ✅ Error handling and recovery

### Browser Testing
1. Login with Google or Anonymous
2. Run in browser console:
```javascript
import { testFirestoreConnection, getCurrentUser } from './services/firebaseService';
const userId = getCurrentUser().id;
await testFirestoreConnection(userId, true);
// Observe: Document created, read, and cleaned up
// Check Firebase Emulator UI at http://localhost:4000
```

## Firestore Structure

### Collection Layout
```
users/
├── {userId1}/
│   ├── races/
│   │   ├── {raceId1}/
│   │   │   ├── pacePlans/
│   │   │   │   ├── {pacePlanId1}
│   │   │   │   └── {pacePlanId2}
│   │   │   └── ...
│   │   └── {raceId2}/
│   │       └── ...
│   └── tests/
│       ├── {testDocId1}
│       └── {testDocId2}
│
└── {userId2}/
    ├── races/
    │   └── ...
    └── tests/
        └── ...
```

### Security Rules
See `firestore.rules` for complete security rules.

Key rule:
```
match /users/{userId}/{document=**} {
  allow read, write: if request.auth.uid == userId;
}
```

This ensures:
- ✅ Each user can only access their own data
- ✅ Complete data isolation between users
- ✅ No cross-user data leaks

## Firestore Emulator

For local development, the Firestore Emulator:
- Listens on `localhost:8080` (connected via `firebaseService.ts`)
- Provides UI at `http://localhost:4000`
- Stores data in memory (reset on restart)
- No real Firebase account needed

### Emulator Commands
```bash
# Start emulator
firebase emulators:start

# Clear emulator data
firebase emulators:start --import=./emulator-data

# Export data
firebase emulators:export ./emulator-data
```

## Error Handling

### Write Errors
- Missing user ID → Firestore path validation error
- Permission denied → Check Firestore security rules
- Network error → Check emulator is running

### Read Errors
- Document not found → Returns `null` (not an error)
- Invalid path → Firestore validation error
- Permission denied → Check security rules

### Delete Errors
- Document not found → No error (Firestore allows delete of non-existent)
- Permission denied → Check security rules

## Next Steps

### Prompt 4.1: Define TypeScript Interfaces
- Add Race interface with full field set
- Add PacePlan interface
- Add Split interface
- Update firebaseService to use these types

### Prompt 4.2: Implement raceManager.ts CRUD
- `createRace(title, distance, unit)` - Uses Firestore write
- `fetchRaces()` - Uses Firestore read with user filtering
- `deleteRace(id)` - Uses Firestore delete

### Prompt 4.3: Implement pacePlanManager.ts CRUD
- `createPacePlan(raceId, title, targetTime)` - Nested write
- `fetchPacePlans(raceId)` - Nested read with filtering

## Verification Checklist

### Code Quality
- ✅ TypeScript strict mode
- ✅ Comprehensive error handling
- ✅ JSDoc comments on all functions
- ✅ ESLint passes
- ✅ No console errors

### Testing
- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ Firestore emulator tested
- ✅ Real Firebase project tested (if configured)

### Functionality
- ✅ Write documents to Firestore
- ✅ Read documents from Firestore
- ✅ Delete test documents
- ✅ User-scoped data access
- ✅ Error handling and logging

### Browser Testing
- ✅ Login works
- ✅ Firestore test functions callable from console
- ✅ Firebase Emulator UI shows created documents
- ✅ No console errors

## Security Considerations

### Current Implementation
- ✅ Emulator mode for local development (no real Firebase project required)
- ✅ User ID-scoped collections (data isolation)
- ✅ Type-safe API (TypeScript)
- ✅ Error logging for debugging

### Production Deployment
- Deploy `firestore.rules` to Firebase Console
- Use environment variables for API keys
- Enable Firestore authentication
- Monitor Firestore usage and costs
- Set up backup and recovery procedures

## Files Modified

- `src/services/firebaseService.ts` - Added read/write/delete/test functions
- `tests/firestore.test.ts` - NEW - Comprehensive test suite
- `firestore.rules` - NEW - Security rules documentation

## References

- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)

---

**Status**: ✅ **COMPLETE** - Ready for Prompt 4.1 (Define TypeScript Interfaces)

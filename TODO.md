# Firebase Removal TODO

## Steps to Complete Firebase Removal

- [ ] Remove Firebase dependency from package.json
- [ ] Delete Firebase-related files:
  - src/firebase/firebase.ts
  - firebase.json
  - firestore.rules
  - firestore.indexes.json
  - test-firestore-connection.ts
- [ ] Update src/services/firestoreTest.service.ts to use mock data instead of Firebase
- [ ] Update src/components/FirestoreTestScreen.tsx to work with mock data
- [ ] Remove Firestore Test menu item from src/components/Sidebar.tsx
- [ ] Run npm install to update dependencies
- [ ] Test that app builds and runs without Firebase errors

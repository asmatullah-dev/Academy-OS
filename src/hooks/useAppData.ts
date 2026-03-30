import { useState, useEffect } from 'react';
import { AppData, Student, Subject, Section, AttendanceRecord, Test, TestResult, FeePayment, Staff, StaffPayment, TimetableEntry, AcademySettings } from '../types';
import { db, auth } from '../firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firestoreUtils';
import { generateId } from '../utils';

const STORAGE_KEY = 'academy_os_data';
const ACADEMY_ID = 'main_academy'; // Fixed ID for the primary school

const INITIAL_DATA: AppData = {
  students: [],
  subjects: [],
  sections: [],
  attendance: [],
  tests: [],
  testResults: [],
  feePayments: [],
  staff: [],
  staffPayments: [],
  timetable: [],
  settings: {
    name: 'My Academy',
    lastBackup: new Date().toISOString(),
  },
};

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local data', e);
      }
    }
    return INITIAL_DATA;
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user && !user.isAnonymous) {
        const email = user.email?.trim().toLowerCase();
        if (email === 'asmatn628@gmail.com' || email === 'asmatullah9327@gmail.com') {
          setIsAdminUser(true);
          setPermissionDenied(false);
        } else if (email) {
          // Check if user is in staff collection
          try {
            const { getDoc, doc } = await import('firebase/firestore');
            const staffDoc = await getDoc(doc(db, `academies/${ACADEMY_ID}/staff`, email));
            
            if (staffDoc.exists()) {
              const role = staffDoc.data().role?.toLowerCase();
              if (role === 'admin' || role === 'superadmin') {
                setIsAdminUser(true);
                setPermissionDenied(false);
              } else {
                setIsAdminUser(false);
                setPermissionDenied(true);
              }
            } else {
              setIsAdminUser(false);
              setPermissionDenied(true);
            }
          } catch (err: any) {
            console.error('Error checking admin status:', err);
            setIsAdminUser(false);
            setPermissionDenied(true);
          }
        }
      } else {
        setIsAdminUser(false);
        setPermissionDenied(false);
      }
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Real-time sync from Firestore
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    const unsubscribes: (() => void)[] = [];

    const syncCollection = (collName: keyof AppData, path: string) => {
      const unsub = onSnapshot(collection(db, path), (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setData(prev => ({ ...prev, [collName]: items }));
      }, (error: any) => {
        // Ignore permission errors if the user just logged out (race condition)
        if (!auth.currentUser && (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions'))) {
          return;
        }
        handleFirestoreError(error, OperationType.LIST, path);
      });
      unsubscribes.push(unsub);
    };

    // Sync collections based on role
    syncCollection('students', `academies/${ACADEMY_ID}/students`);
    syncCollection('subjects', `academies/${ACADEMY_ID}/subjects`);
    syncCollection('sections', `academies/${ACADEMY_ID}/sections`);
    syncCollection('attendance', `academies/${ACADEMY_ID}/attendance`);
    syncCollection('tests', `academies/${ACADEMY_ID}/tests`);
    syncCollection('testResults', `academies/${ACADEMY_ID}/testResults`);
    syncCollection('feePayments', `academies/${ACADEMY_ID}/feePayments`);
    syncCollection('timetable', `academies/${ACADEMY_ID}/timetable`);

    if (isAdminUser) {
      syncCollection('staff', `academies/${ACADEMY_ID}/staff`);
      syncCollection('staffPayments', `academies/${ACADEMY_ID}/staffPayments`);
    }

    // Sync settings
    const unsubSettings = onSnapshot(doc(db, `academies/${ACADEMY_ID}/settings/global`), (snapshot) => {
      if (snapshot.exists()) {
        setData(prev => ({ ...prev, settings: snapshot.data() as AcademySettings }));
      }
    }, (error: any) => {
      // Ignore permission errors if the user just logged out (race condition)
      if (!auth.currentUser && (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions'))) {
        return;
      }
      handleFirestoreError(error, OperationType.GET, `academies/${ACADEMY_ID}/settings/global`);
    });
    unsubscribes.push(unsubSettings);

    return () => unsubscribes.forEach(unsub => unsub());
  }, [isAuthReady, currentUser, isAdminUser]);

  const updateData = async (newData: Partial<AppData>) => {
    // Optimistic update
    setData(prev => ({ ...prev, ...newData }));

    if (!isAuthReady || !currentUser) return;

    // Only admins can write to Firestore
    if (!isAdminUser) {
      console.warn('Write operation skipped: User is not an administrator');
      return;
    }

    try {
      // Handle settings update
      if (newData.settings) {
        const cleanSettings = JSON.parse(JSON.stringify(newData.settings));
        await setDoc(doc(db, `academies/${ACADEMY_ID}/settings/global`), cleanSettings, { merge: true });
      }

      // Note: For collections, we usually update specific items. 
      // This simple updateData implementation might need to be more granular for production.
      // But for this app's current structure, we'll handle specific updates in components
      // or implement a smarter diff here.
      
      // If the entire array is provided, we might need to sync it.
      // However, the components are already calling updateData with the full array.
      // We'll implement a basic sync for the arrays that changed.
      
      const collections: (keyof AppData)[] = [
        'students', 'subjects', 'sections', 'attendance', 'tests', 
        'testResults', 'feePayments', 'staff', 'staffPayments', 'timetable'
      ];

      for (const coll of collections) {
        if (newData[coll]) {
          const newItems = newData[coll] as any[];
          const oldItems = (data[coll] as any[]) || [];
          
          // Find deleted items
          const newItemIds = new Set(newItems.map(i => i.id));
          const deletedItems = oldItems.filter(i => !newItemIds.has(i.id));
          
          const promises = [];
          
          // Delete removed items
          for (const item of deletedItems) {
            if (item.id) {
              promises.push(deleteDoc(doc(db, `academies/${ACADEMY_ID}/${coll}`, item.id)));
            }
          }
          
          // Update/Add items
          for (const item of newItems) {
            const oldItem = oldItems.find(i => i.id === item.id);
            if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(item)) {
              // Strip undefined values which cause Firestore errors
              const cleanItem = JSON.parse(JSON.stringify(item));
              const itemId = item.id || generateId(); // Fallback if id is missing
              promises.push(setDoc(doc(db, `academies/${ACADEMY_ID}/${coll}`, itemId), cleanItem));
            }
          }
          
          await Promise.all(promises);
        }
      }

    } catch (error: any) {
      console.error('Failed to sync to Firestore', error);
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.WRITE, `academies/${ACADEMY_ID}`);
      } else {
        alert('Failed to save changes to the cloud. Please check your connection and try again.');
      }
    }
  };

  const importData = async (imported: AppData) => {
    setData(imported);
    if (!isAuthReady || !currentUser) return;

    // Batch import
    const batch = writeBatch(db);
    // ... implement batch import if needed ...
  };

  return { data, updateData, importData, permissionDenied };
}

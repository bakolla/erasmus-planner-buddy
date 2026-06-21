import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Task, DocumentItem, Expense, TripDetails, AccountCredential } from "@/lib/types";
import { seedTasks, seedDocuments, seedExpenses, seedTrip } from "@/lib/seed-data";
import { auth, db, storage, isFirebaseConfigured } from "@/lib/firebase";
import { encryptText, decryptText, encryptFile } from "@/lib/encryption";
import { saveLocalFile, deleteLocalFile } from "@/lib/local-files";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

type Status = "idle" | "loading" | "success" | "error";

interface UserProfile {
  uid: string;
  email: string | null;
}

interface PlannerState {
  // Firebase Auth & Encryption State
  user: UserProfile | null;
  isAuthLoading: boolean;
  firebaseConfigured: boolean;
  encryptionKey: string | null;
  isLocked: boolean;
  rawCredentials: any[]; // Cache encrypted credentials from Firestore if locked
  authModalOpen: boolean;
  configModalOpen: boolean;

  // App Data State
  tasks: Task[];
  documents: DocumentItem[];
  expenses: Expense[];
  trip: TripDetails;
  credentials: AccountCredential[];
  status: Status;
  error: string | null;

  // Auth & Encryption Actions
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: UserProfile | null) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  setAuthModalOpen: (open: boolean) => void;
  setConfigModalOpen: (open: boolean) => void;
  signInAsDemo: () => Promise<void>;

  // Tasks
  addTask: (t: Omit<Task, "id" | "createdAt">) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;

  // Documents
  addDocument: (d: Omit<DocumentItem, "id">) => Promise<void>;
  updateDocument: (id: string, patch: Partial<DocumentItem>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  uploadDocumentFile: (docId: string, file: File) => Promise<void>;
  deleteDocumentFile: (docId: string) => Promise<void>;

  // Credentials Vault
  addCredential: (c: Omit<AccountCredential, "id">) => Promise<void>;
  updateCredential: (id: string, patch: Partial<AccountCredential>) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;

  // Expenses
  addExpense: (e: Omit<Expense, "id">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Trip
  updateTrip: (patch: Partial<TripDetails>) => Promise<void>;

  reset: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      // Auth & Encryption Default State
      user: null,
      isAuthLoading: true,
      firebaseConfigured: isFirebaseConfigured,
      encryptionKey: null,
      isLocked: false,
      rawCredentials: [],
      authModalOpen: false,
      configModalOpen: false,

      // App Default State
      tasks: seedTasks,
      documents: seedDocuments,
      expenses: seedExpenses,
      trip: seedTrip,
      credentials: [],
      status: "idle",
      error: null,

      // Auth actions
      signIn: async (email, password) => {
        if (!auth) throw new Error("Firebase nie jest skonfigurowane.");
        await signInWithEmailAndPassword(auth, email, password);
        
        // Store password in memory session
        if (typeof window !== "undefined") {
          sessionStorage.setItem("master_key", password);
        }
        set({ encryptionKey: password, isLocked: false });
      },
      signUp: async (email, password) => {
        if (!auth) throw new Error("Firebase nie jest skonfigurowane.");
        await createUserWithEmailAndPassword(auth, email, password);

        // Store password in memory session
        if (typeof window !== "undefined") {
          sessionStorage.setItem("master_key", password);
        }
        set({ encryptionKey: password, isLocked: false });
      },
      signInAsDemo: async () => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("master_key", "demo123");
        }
        const demoUser = { uid: "demo-user", email: "demo@erasmusbuddy.com" };
        set({ user: demoUser });

        // Retrieve existing trip settings to preserve user's styling/personalization
        const currentTrip = get().trip;

        // Populate store with beautiful seed/demo data
        set({
          tasks: seedTasks,
          documents: seedDocuments,
          expenses: seedExpenses,
          trip: {
            ...seedTrip,
            city: "Barcelona",
            country: "Hiszpania",
            institution: "Universitat Politècnica de Catalunya (UPC)",
            startDate: new Date().toISOString().split("T")[0],
            endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            estimatedBudgetEUR: 3500,
            themeColor: currentTrip?.themeColor || "indigo",
            fontSize: currentTrip?.fontSize || "normal",
            highContrast: currentTrip?.highContrast !== undefined ? currentTrip.highContrast : false,
            language: currentTrip?.language || "pl",
            darkMode: currentTrip?.darkMode !== undefined ? currentTrip.darkMode : false,
            underlineLinks: currentTrip?.underlineLinks !== undefined ? currentTrip.underlineLinks : false,
            dyslexiaFont: currentTrip?.dyslexiaFont !== undefined ? currentTrip.dyslexiaFont : false,
            reducedMotion: currentTrip?.reducedMotion !== undefined ? currentTrip.reducedMotion : false,
            textSpacing: currentTrip?.textSpacing !== undefined ? currentTrip.textSpacing : false,
            grayscale: currentTrip?.grayscale !== undefined ? currentTrip.grayscale : false,
            disableAmbient: currentTrip?.disableAmbient !== undefined ? currentTrip.disableAmbient : false,
            customLinks: currentTrip?.customLinks || [],
          },
          credentials: [
            {
              id: "demo-cred-1",
              title: "USOSweb - Uniwersytet Partnerski",
              url: "https://usos.partner.edu.pl",
              login: "student123",
              password: "PasswordDemo123!",
              notes: "Konto do rejestracji na przedmioty i sprawdzania ocen.",
            },
            {
              id: "demo-cred-2",
              title: "Portal Erasmus+ (Moodle)",
              url: "https://moodle.erasmus.org",
              login: "demo_student",
              password: "SecurePassword456!",
              notes: "Platforma e-learningowa z kursami przygotowawczymi.",
            }
          ],
          encryptionKey: "demo123",
          isLocked: false,
          status: "success",
          isAuthLoading: false,
        });
      },
      signOut: async () => {
        if (auth) {
          await fbSignOut(auth);
        }
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("master_key");
        }
        get().reset();
      },
      unlock: async (password) => {
        const raw = get().rawCredentials;
        if (raw.length === 0) {
          // If no accounts exist yet, the password is valid
          if (typeof window !== "undefined") {
            sessionStorage.setItem("master_key", password);
          }
          set({ encryptionKey: password, isLocked: false });
          return true;
        }

        try {
          // Try to decrypt the first item to verify the key
          const first = raw[0];
          await decryptText(first.login, password);

          // Decryption succeeded, meaning password is correct!
          // Decrypt all cached credentials
          const decryptedList: AccountCredential[] = [];
          for (const item of raw) {
            decryptedList.push({
              id: item.id,
              title: item.title,
              url: item.url,
              login: await decryptText(item.login, password),
              password: item.password ? await decryptText(item.password, password) : "",
              notes: item.notes ? await decryptText(item.notes, password) : "",
            });
          }

          if (typeof window !== "undefined") {
            sessionStorage.setItem("master_key", password);
          }
          set({
            encryptionKey: password,
            credentials: decryptedList,
            isLocked: false,
          });
          return true;
        } catch (e) {
          console.error("Niepoprawne hasło deszyfrujące:", e);
          return false;
        }
      },
      setUser: async (user) => {
        set({ user });
        if (user && user.uid === "demo-user") {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("master_key", "demo123");
          }
          const currentTrip = get().trip;
          set({
            tasks: seedTasks,
            documents: seedDocuments,
            expenses: seedExpenses,
            trip: {
              ...seedTrip,
              city: "Barcelona",
              country: "Hiszpania",
              institution: "Universitat Politècnica de Catalunya (UPC)",
              startDate: new Date().toISOString().split("T")[0],
              endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              estimatedBudgetEUR: 3500,
              themeColor: currentTrip?.themeColor || "indigo",
              fontSize: currentTrip?.fontSize || "normal",
              highContrast: currentTrip?.highContrast !== undefined ? currentTrip.highContrast : false,
              language: currentTrip?.language || "pl",
              darkMode: currentTrip?.darkMode !== undefined ? currentTrip.darkMode : false,
              underlineLinks: currentTrip?.underlineLinks !== undefined ? currentTrip.underlineLinks : false,
              dyslexiaFont: currentTrip?.dyslexiaFont !== undefined ? currentTrip.dyslexiaFont : false,
              reducedMotion: currentTrip?.reducedMotion !== undefined ? currentTrip.reducedMotion : false,
              textSpacing: currentTrip?.textSpacing !== undefined ? currentTrip.textSpacing : false,
              grayscale: currentTrip?.grayscale !== undefined ? currentTrip.grayscale : false,
              disableAmbient: currentTrip?.disableAmbient !== undefined ? currentTrip.disableAmbient : false,
              customLinks: currentTrip?.customLinks || [],
            },
            credentials: [
              {
                id: "demo-cred-1",
                title: "USOSweb - Uniwersytet Partnerski",
                url: "https://usos.partner.edu.pl",
                login: "student123",
                password: "PasswordDemo123!",
                notes: "Konto do rejestracji na przedmioty i sprawdzania ocen.",
              },
              {
                id: "demo-cred-2",
                title: "Portal Erasmus+ (Moodle)",
                url: "https://moodle.erasmus.org",
                login: "demo_student",
                password: "SecurePassword456!",
                notes: "Platforma e-learningowa z kursami przygotowawczymi.",
              }
            ],
            encryptionKey: "demo123",
            isLocked: false,
            status: "success",
            isAuthLoading: false,
          });
          return;
        }
        if (user && db) {
          set({ status: "loading", error: null });
          try {
            // Check if key is already in memory
            const savedKey = typeof window !== "undefined" ? sessionStorage.getItem("master_key") : null;

            // 1. Fetch tasks
            const tasksSnap = await getDocs(collection(db, "users", user.uid, "tasks"));
            const tasks: Task[] = [];
            tasksSnap.forEach((d) => tasks.push(d.data() as Task));

            // 2. Fetch documents
            const docsSnap = await getDocs(collection(db, "users", user.uid, "documents"));
            const documents: DocumentItem[] = [];
            for (const d of docsSnap.docs) {
              const docData = d.data() as DocumentItem;
              if (!docData.fileUrl) {
                try {
                  const localFile = await getLocalFile(docData.id);
                  if (localFile) {
                    docData.fileUrl = `localdb://${docData.id}`;
                    docData.fileName = localFile.name;
                    docData.fileType = localFile.type;
                    docData.fileSize = localFile.bytes.byteLength;
                  }
                } catch (idxErr) {
                  console.warn("Failed to check IndexedDB cache during user doc sync:", idxErr);
                }
              }
              documents.push(docData);
            }

            // 3. Fetch expenses
            const expensesSnap = await getDocs(collection(db, "users", user.uid, "expenses"));
            const expenses: Expense[] = [];
            expensesSnap.forEach((d) => expenses.push(d.data() as Expense));

            // 4. Fetch trip
            const tripDoc = await getDoc(doc(db, "users", user.uid, "trip", "details"));
            let trip = get().trip;
            if (tripDoc.exists()) {
              const dbTrip = tripDoc.data() as TripDetails;
              const mergedTrip = {
                ...seedTrip,
                ...dbTrip,
                themeColor: dbTrip.themeColor || trip.themeColor || "indigo",
                fontSize: dbTrip.fontSize || trip.fontSize || "normal",
                highContrast: dbTrip.highContrast !== undefined ? dbTrip.highContrast : (trip.highContrast !== undefined ? trip.highContrast : false),
                darkMode: dbTrip.darkMode !== undefined ? dbTrip.darkMode : (trip.darkMode !== undefined ? trip.darkMode : false),
                language: dbTrip.language || trip.language || "pl",
                underlineLinks: dbTrip.underlineLinks !== undefined ? dbTrip.underlineLinks : (trip.underlineLinks !== undefined ? trip.underlineLinks : false),
                dyslexiaFont: dbTrip.dyslexiaFont !== undefined ? dbTrip.dyslexiaFont : (trip.dyslexiaFont !== undefined ? trip.dyslexiaFont : false),
                reducedMotion: dbTrip.reducedMotion !== undefined ? dbTrip.reducedMotion : (trip.reducedMotion !== undefined ? trip.reducedMotion : false),
                textSpacing: dbTrip.textSpacing !== undefined ? dbTrip.textSpacing : (trip.textSpacing !== undefined ? trip.textSpacing : false),
                grayscale: dbTrip.grayscale !== undefined ? dbTrip.grayscale : (trip.grayscale !== undefined ? trip.grayscale : false),
                disableAmbient: dbTrip.disableAmbient !== undefined ? dbTrip.disableAmbient : (trip.disableAmbient !== undefined ? trip.disableAmbient : false),
              };
              trip = mergedTrip;

              // If there's any difference in settings between merged and DB versions, update Firestore
              const hasDiff = dbTrip.themeColor !== mergedTrip.themeColor ||
                              dbTrip.fontSize !== mergedTrip.fontSize ||
                              dbTrip.highContrast !== mergedTrip.highContrast ||
                              dbTrip.darkMode !== mergedTrip.darkMode ||
                              dbTrip.language !== mergedTrip.language ||
                              dbTrip.underlineLinks !== mergedTrip.underlineLinks ||
                              dbTrip.dyslexiaFont !== mergedTrip.dyslexiaFont ||
                              dbTrip.reducedMotion !== mergedTrip.reducedMotion ||
                              dbTrip.textSpacing !== mergedTrip.textSpacing ||
                              dbTrip.grayscale !== mergedTrip.grayscale ||
                              dbTrip.disableAmbient !== mergedTrip.disableAmbient;
              if (hasDiff) {
                try {
                  await updateDoc(doc(db, "users", user.uid, "trip", "details"), {
                    themeColor: mergedTrip.themeColor,
                    fontSize: mergedTrip.fontSize,
                    highContrast: mergedTrip.highContrast,
                    darkMode: mergedTrip.darkMode,
                    language: mergedTrip.language,
                    underlineLinks: mergedTrip.underlineLinks,
                    dyslexiaFont: mergedTrip.dyslexiaFont,
                    reducedMotion: mergedTrip.reducedMotion,
                    textSpacing: mergedTrip.textSpacing,
                    grayscale: mergedTrip.grayscale,
                    disableAmbient: mergedTrip.disableAmbient,
                  });
                } catch (updateErr) {
                  console.error("Failed to update merged trip settings in Firestore:", updateErr);
                }
              }
            }

            // 5. Fetch encrypted credentials
            const credsSnap = await getDocs(collection(db, "users", user.uid, "credentials"));
            const rawCreds: any[] = [];
            credsSnap.forEach((d) => rawCreds.push(d.data()));

            // Decrypt credentials if key is present, otherwise lock the vault
            let decryptedCreds: AccountCredential[] = [];
            let needsLock = false;

            if (rawCreds.length > 0) {
              if (savedKey) {
                try {
                  for (const rc of rawCreds) {
                    decryptedCreds.push({
                      id: rc.id,
                      title: rc.title,
                      url: rc.url,
                      login: await decryptText(rc.login, savedKey),
                      password: rc.password ? await decryptText(rc.password, savedKey) : "",
                      notes: rc.notes ? await decryptText(rc.notes, savedKey) : "",
                    });
                  }
                  set({ encryptionKey: savedKey, isLocked: false });
                } catch (e) {
                  // Saved key is invalid or failed to decrypt
                  needsLock = true;
                }
              } else {
                // No key in memory, application is locked
                needsLock = true;
              }
            } else {
              // No credentials saved in Firestore yet
              if (savedKey) {
                set({ encryptionKey: savedKey, isLocked: false });
              } else {
                needsLock = false; // Nothing to decrypt, don't show lock until first creation
              }
            }

            // Sync: if Firestore is completely empty for this user, upload the current local state
            if (tasksSnap.empty && docsSnap.empty && expensesSnap.empty && !tripDoc.exists() && credsSnap.empty) {
              const batch = writeBatch(db);
              get().tasks.forEach((t) => {
                batch.set(doc(db, "users", user.uid, "tasks", t.id), t);
              });
              get().documents.forEach((d) => {
                batch.set(doc(db, "users", user.uid, "documents", d.id), d);
              });
              get().expenses.forEach((e) => {
                batch.set(doc(db, "users", user.uid, "expenses", e.id), e);
              });
              batch.set(doc(db, "users", user.uid, "trip", "details"), get().trip);
              await batch.commit();
            } else {
              // Otherwise, update Zustand store with Firestore values
              set({
                tasks: tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
                documents,
                expenses,
                trip,
                rawCredentials: rawCreds,
                credentials: decryptedCreds,
                isLocked: needsLock,
              });
            }
            set({ isAuthLoading: false, status: "success" });
          } catch (e: any) {
            console.error("Błąd pobierania danych z Firestore:", e);
            set({ isAuthLoading: false, status: "error", error: "Błąd synchronizacji z chmurą" });
          }
        } else {
          // If no user, we are in offline local mode
          set({ isAuthLoading: false, isLocked: false });
        }
      },

      addTask: async (t) => {
        set({ status: "loading", error: null });
        try {
          const task: Task = { ...t, id: uid(), createdAt: new Date().toISOString() };
          set({ tasks: [task, ...get().tasks], status: "success" });

          const userId = get().user?.uid;
          if (db && userId && userId !== "demo-user") {
            await setDoc(doc(db, "users", userId, "tasks", task.id), task);
          }
        } catch (e) {
          set({ status: "error", error: "Nie udało się dodać zadania" });
        }
      },
      updateTask: async (id, patch) => {
        set({ status: "loading", error: null });
        try {
          const updatedTasks = get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
          set({ tasks: updatedTasks, status: "success" });

          const userId = get().user?.uid;
          if (db && userId && userId !== "demo-user") {
            await updateDoc(doc(db, "users", userId, "tasks", id), patch);
          }
        } catch (e) {
          set({ status: "error", error: "Nie udało się zaktualizować zadania" });
        }
      },
      deleteTask: async (id) => {
        set({ status: "loading", error: null });
        try {
          set({ tasks: get().tasks.filter((t) => t.id !== id), status: "success" });

          const userId = get().user?.uid;
          if (db && userId && userId !== "demo-user") {
            await deleteDoc(doc(db, "users", userId, "tasks", id));
          }
        } catch (e) {
          set({ status: "error", error: "Nie udało się usunąć zadania" });
        }
      },
      toggleTask: async (id) => {
        const t = get().tasks.find((x) => x.id === id);
        if (!t) return;
        await get().updateTask(id, { status: t.status === "done" ? "todo" : "done" });
      },

      addDocument: async (d) => {
        set({ status: "loading", error: null });
        try {
          const docItem: DocumentItem = { ...d, id: uid() };
          set({ documents: [docItem, ...get().documents], status: "success" });

          const userId = get().user?.uid;
          if (db && userId && userId !== "demo-user") {
            await setDoc(doc(db, "users", userId, "documents", docItem.id), docItem);
          }
        } catch (e) {
          set({ status: "error", error: "Nie udało się dodać dokumentu" });
        }
      },
      updateDocument: async (id, patch) => {
        try {
          const updatedDocs = get().documents.map((d) => (d.id === id ? { ...d, ...patch } : d));
          set({ documents: updatedDocs });

          const userId = get().user?.uid;
          if (db && userId && userId !== "demo-user") {
            await updateDoc(doc(db, "users", userId, "documents", id), patch);
          }
        } catch (e) {
          console.error("Błąd podczas edycji dokumentu:", e);
        }
      },
      deleteDocument: async (id) => {
        try {
          const docItem = get().documents.find((d) => d.id === id);
          if (docItem?.fileName) {
            await get().deleteDocumentFile(id);
          }

          set({ documents: get().documents.filter((d) => d.id !== id) });

          const userId = get().user?.uid;
          if (db && userId && userId !== "demo-user") {
            await deleteDoc(doc(db, "users", userId, "documents", id));
          }
        } catch (e) {
          console.error("Błąd podczas usuwania dokumentu:", e);
        }
      },
      uploadDocumentFile: async (docId, file) => {
        const isPl = get().trip?.language === "pl";
        if (file.size > 750 * 1024) {
          throw new Error(
            isPl
              ? "Plik jest zbyt duży. Maksymalny rozmiar załącznika to 750 KB."
              : "File is too large. Maximum attachment size is 750 KB."
          );
        }

        const userId = get().user?.uid;
        const key = get().encryptionKey || "local_default_key";

        // 1. Encrypt the file client-side before uploading/saving!
        const encryptedFileBlob = await encryptFile(file, key);

        // 2. Convert encrypted blob to Base64 to store in Firestore
        const arrayBuffer = await encryptedFileBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = "";
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        const base64Data = window.btoa(binaryString);

        // 3. Save file payload to IndexedDB (always cache a copy locally for offline/CORS bypass)
        try {
          await saveLocalFile(docId, {
            name: file.name,
            type: file.type,
            bytes: arrayBuffer,
          });
        } catch (localSaveError) {
          console.error("Failed to save copy to IndexedDB:", localSaveError);
        }

        // 4. Update local state
        const updatedDocs = get().documents.map((d) => {
          if (d.id === docId) {
            return {
              ...d,
              fileUrl: "dbbase64://",
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileDataB64: base64Data,
            };
          }
          return d;
        });
        set({ documents: updatedDocs });

        // 5. Update Firestore if logged in
        if (userId && db && userId !== "demo-user") {
          try {
            await updateDoc(doc(db, "users", userId, "documents", docId), {
              fileUrl: "dbbase64://",
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileDataB64: base64Data,
            });
          } catch (e) {
            console.warn("Failed to update firestore for document attachment:", e);
          }
        }
      },
      deleteDocumentFile: async (docId) => {
        const userId = get().user?.uid;
        const docItem = get().documents.find((d) => d.id === docId);
        if (!docItem || !docItem.fileName) return;

        // 1. Delete from IndexedDB regardless of mode
        await deleteLocalFile(docId);

        // 2. Update local state first
        const updatedDocs = get().documents.map((d) => {
          if (d.id === docId) {
            const { fileUrl, fileName, fileSize, fileType, fileDataB64, ...rest } = d;
            return rest;
          }
          return d;
        });
        set({ documents: updatedDocs });

        // 3. Update Firebase if configured
        if (userId && db && userId !== "demo-user") {
          try {
            await updateDoc(doc(db, "users", userId, "documents", docId), {
              fileUrl: null,
              fileName: null,
              fileSize: null,
              fileType: null,
              fileDataB64: null,
            });
          } catch (e) {
            console.error("Błąd podczas usuwania pliku z Firebase:", e);
          }
        }
      },

      // Credentials Vault actions
      addCredential: async (c) => {
        const userId = get().user?.uid;
        const key = get().encryptionKey;

        // Verify key is present if we are logged in
        if (userId && !key) {
          throw new Error("Baza danych jest zablokowana. Odblokuj ją najpierw.");
        }

        const id = uid();
        const plaintextCred: AccountCredential = { ...c, id };

        // 1. Add to local state (decrypted)
        set({ credentials: [plaintextCred, ...get().credentials] });

        // 2. Save encrypted representation to Firestore
        if (db && userId && key && userId !== "demo-user") {
          try {
            const encryptedCred = {
              id,
              title: c.title,
              url: c.url || "",
              login: await encryptText(c.login, key),
              password: c.password ? await encryptText(c.password, key) : "",
              notes: c.notes ? await encryptText(c.notes, key) : "",
            };
            
            // Update rawCredentials cache too
            set({ rawCredentials: [encryptedCred, ...get().rawCredentials] });
            
            await setDoc(doc(db, "users", userId, "credentials", id), encryptedCred);
          } catch (e) {
            console.error("Błąd podczas szyfrowania i zapisu konta:", e);
          }
        }
      },
      updateCredential: async (id, patch) => {
        const userId = get().user?.uid;
        const key = get().encryptionKey;

        if (userId && !key) {
          throw new Error("Baza danych jest zablokowana.");
        }

        // 1. Update local state
        const updatedList = get().credentials.map((c) => (c.id === id ? { ...c, ...patch } : c));
        set({ credentials: updatedList });

        // 2. Encrypt and save to Firestore
        if (db && userId && key && userId !== "demo-user") {
          try {
            const currentDecrypted = get().credentials.find((c) => c.id === id)!;
            const encryptedPatch: any = {};
            
            if (patch.title !== undefined) encryptedPatch.title = patch.title;
            if (patch.url !== undefined) encryptedPatch.url = patch.url;
            if (patch.login !== undefined) encryptedPatch.login = await encryptText(patch.login, key);
            if (patch.password !== undefined) encryptedPatch.password = await encryptText(patch.password, key);
            if (patch.notes !== undefined) encryptedPatch.notes = await encryptText(patch.notes, key);

            // Update rawCredentials cache
            set({
              rawCredentials: get().rawCredentials.map((rc) =>
                rc.id === id ? { ...rc, ...encryptedPatch } : rc
              ),
            });

            await updateDoc(doc(db, "users", userId, "credentials", id), encryptedPatch);
          } catch (e) {
            console.error("Błąd podczas edycji szyfrowanego konta:", e);
          }
        }
      },
      deleteCredential: async (id) => {
        // 1. Update local state
        set({ credentials: get().credentials.filter((c) => c.id !== id) });
        set({ rawCredentials: get().rawCredentials.filter((rc) => rc.id !== id) });

        // 2. Delete from Firestore
        const userId = get().user?.uid;
        if (db && userId && userId !== "demo-user") {
          try {
            await deleteDoc(doc(db, "users", userId, "credentials", id));
          } catch (e) {
            console.error("Błąd podczas usuwania konta z chmury:", e);
          }
        }
      },

      addExpense: async (e) => {
        set({ status: "loading", error: null });
        try {
          const expense: Expense = { ...e, id: uid() };
          set({ expenses: [expense, ...get().expenses], status: "success" });

          const userId = get().user?.uid;
          if (db && userId && userId !== "demo-user") {
            await setDoc(doc(db, "users", userId, "expenses", expense.id), expense);
          }
        } catch (err) {
          set({ status: "error", error: "Nie udało się dodać wydatku" });
        }
      },
      deleteExpense: async (id) => {
        set({ status: "loading", error: null });
        try {
          set({ expenses: get().expenses.filter((e) => e.id !== id), status: "success" });

          const userId = get().user?.uid;
          if (db && userId && userId !== "demo-user") {
            await deleteDoc(doc(db, "users", userId, "expenses", id));
          }
        } catch (err) {
          set({ status: "error", error: "Nie udało się usunąć wydatku" });
        }
      },

      updateTrip: async (patch) => {
        set({ status: "loading", error: null });
        try {
          const updatedTrip = { ...get().trip, ...patch };
          set({ trip: updatedTrip, status: "success" });

          const userId = get().user?.uid;
          if (db && userId && userId !== "demo-user") {
            await setDoc(doc(db, "users", userId, "trip", "details"), updatedTrip);
          }
        } catch (err) {
          set({ status: "error", error: "Nie udało się zaktualizować szczegółów wyjazdu" });
        }
      },

      setAuthModalOpen: (open) => set({ authModalOpen: open }),
      setConfigModalOpen: (open) => set({ configModalOpen: open }),

      reset: () => {
        const currentTrip = get().trip;
        set({
          user: null,
          encryptionKey: null,
          isLocked: false,
          rawCredentials: [],
          tasks: seedTasks,
          documents: seedDocuments,
          expenses: seedExpenses,
          trip: {
            ...seedTrip,
            themeColor: currentTrip?.themeColor || "indigo",
            fontSize: currentTrip?.fontSize || "normal",
            highContrast: !!currentTrip?.highContrast,
            language: currentTrip?.language || "pl",
            darkMode: !!currentTrip?.darkMode,
            underlineLinks: !!currentTrip?.underlineLinks,
            dyslexiaFont: !!currentTrip?.dyslexiaFont,
            reducedMotion: !!currentTrip?.reducedMotion,
            textSpacing: !!currentTrip?.textSpacing,
            grayscale: !!currentTrip?.grayscale,
            disableAmbient: !!currentTrip?.disableAmbient,
          },
          credentials: [],
          status: "idle",
          error: null,
          authModalOpen: false,
          configModalOpen: false,
        });
      },
    }),
    {
      name: "erasmus-planner-v1",
      partialize: (state) => ({
        tasks: state.tasks,
        documents: state.documents,
        expenses: state.expenses,
        trip: state.trip,
      }),
    },
  ),
);

const RATES: Record<string, number> = { EUR: 1, PLN: 0.23, USD: 0.92 };
export const toEUR = (amount: number, currency: string) => amount * (RATES[currency] ?? 1);

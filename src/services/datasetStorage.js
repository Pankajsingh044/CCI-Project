// =====================================================
// CCI DATASET STORAGE - INDEXEDDB
// =====================================================

const DB_NAME = "CCI_Database";
const DB_VERSION = 1;
const STORE_NAME = "datasets";
const DATASET_ID = "currentDataset";

// =====================================================
// OPEN DATABASE
// =====================================================

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ||
        new Error("Unable to open IndexedDB.")
      );
    };
  });
}

// =====================================================
// SAVE DATASET
// =====================================================

export async function saveDataset(dataset) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store.put({
      id: DATASET_ID,
      ...dataset,
      savedAt: new Date().toISOString(),
    });

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(
        request.error ||
        new Error("Unable to save dataset.")
      );
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      reject(
        transaction.error ||
        new Error("Dataset transaction failed.")
      );
      db.close();
    };
  });
}

// =====================================================
// GET DATASET
// =====================================================

export async function getDataset() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readonly"
    );

    const store =
      transaction.objectStore(STORE_NAME);

    const request =
      store.get(DATASET_ID);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(
        request.error ||
        new Error("Unable to load dataset.")
      );
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      reject(
        transaction.error ||
        new Error("Dataset read transaction failed.")
      );
      db.close();
    };
  });
}

// =====================================================
// DELETE DATASET
// =====================================================

export async function deleteDataset() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store =
      transaction.objectStore(STORE_NAME);

    const request =
      store.delete(DATASET_ID);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(
        request.error ||
        new Error("Unable to delete dataset.")
      );
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = () => {
      reject(
        transaction.error ||
        new Error("Dataset delete transaction failed.")
      );
      db.close();
    };
  });
}

// =====================================================
// CHECK DATASET
// =====================================================

export async function hasDataset() {
  const dataset = await getDataset();

  return !!dataset;
}
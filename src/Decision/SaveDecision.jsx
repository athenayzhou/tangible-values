export default function SaveDecision({
  decisionType,
  decisionValue,
  decisionId,
}) {
  const dbName = "decisionDatabase";
  const objectStoreName = "decisions";

  const request = indexedDB.open(dbName);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);

    const currentTimestamp = decisionId || Date.now();
    const data = {
      decision: decisionType,
      value: decisionValue,
      id: currentTimestamp,
      timestamp: new Date(currentTimestamp).toLocaleString(),
    };
    objectStore.add(data);

    transaction.oncomplete = () => {
      console.log(`Decision saved successfully: ${JSON.stringify(data)}`);
    };

    transaction.onerror = (error) => {
      console.error(`Error saving decision:`, error);
    };
  };

  request.onerror = (event) => {
    console.error("Error opening IndexedDB:", event.target.error);
  };

  return;
}

export default function AnalyzeDecision(decisionType) {
  const analyzeDictator = (entries) => {
    if (entries.length > 0) {
      const counts = {};
      let mostCommon = null;
      let mostCommonCount = 0;
      entries.forEach((entry) => {
        if (entry.decision === decisionType) {
          if (!counts[entry.value]) {
            counts[entry.value] = 0;
          }
          counts[entry.value] += 1;
          if (counts[entry.value] > mostCommonCount) {
            mostCommonCount = counts[entry.value];
            mostCommon = entry.value;
          }
        }
      });
      console.log(
        `${decisionType} - On average, dictators gave recipients ${mostCommon}$.`,
      );
    } else {
      console.log(`No entries for ${decisionType} in the database.`);
    }
  };

  const analyzeVolunteer = (entries) => {
    if (entries.length > 0) {
      let count1 = 0;
      let count5 = 0;
      entries.forEach((entry) => {
        if (
          entry.decision === decisionType &&
          (entry.value === 1 || entry.value === 5)
        ) {
          if (entry.value === 1) {
            count1 += 1;
          } else {
            count5 += 1;
          }
        }
      });
      const totalResponses = count1 + count5;
      const percentage1 = Math.round((count1 / totalResponses) * 100);
      const percentage5 = Math.round((count5 / totalResponses) * 100);
      console.log(
        `${decisionType} - so far, ${percentage1}% of people claimed $1, while ${percentage5}% of people claimed $5.`,
      );
    } else {
      console.log(`No entries for ${decisionType} in the database.`);
    }
  };

  const analyzeExchange = (entries) => {
    if (entries.length > 0) {
      let exchange = 0;
      let keep = 0;
      entries.forEach((entry) => {
        if (
          entry.decision === decisionType &&
          (entry.value === true || entry.value === false)
        ) {
          if (entry.value === true) {
            exchange += 1;
          } else {
            keep += 1;
          }
        }
      });
      const totalResponses = exchange + keep;
      const percentageExchange = Math.round((exchange / totalResponses) * 100);
      const percentageKeep = Math.round((keep / totalResponses) * 100);
      console.log(
        `${decisionType} - so far, ${percentageExchange}% of people chose to trade, while ${percentageKeep}% of people chose to keep.`,
      );
    } else {
      console.log(`No entries for ${decisionType} in the database.`);
    }
  };

  const analyzeTrust = (entries) => {
    if (entries.length > 0) {
      const counts = {};
      let mostCommon = null;
      let mostCommonCount = 0;
      entries.forEach((entry) => {
        if (entry.decision === decisionType) {
          if (!counts[entry.value]) {
            counts[entry.value] = 0;
          }
          counts[entry.value] += 1;
          if (counts[entry.value] > mostCommonCount) {
            mostCommonCount = counts[entry.value];
            mostCommon = entry.value;
          }
        }
      });
      console.log(
        `${decisionType} - On average, people sent ${mostCommon}$ to the other person.`,
      );
    } else {
      console.log(`No entries for ${decisionType} in the database.`);
    }
  };

  const dbName = "decisionDatabase";
  const objectStoreName = "decisions";

  const request = indexedDB.open(dbName);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction(objectStoreName, "readonly");
    const objectStore = transaction.objectStore(objectStoreName);

    const getAllValuesRequest = objectStore.getAll();

    getAllValuesRequest.onsuccess = (event) => {
      const entries = event.target.result;

      switch (decisionType) {
        case "dictator":
          analyzeDictator(entries);
          break;
        case "volunteer":
          analyzeVolunteer(entries);
          break;
        case "exchange":
          analyzeExchange(entries);
          break;
        case "trust":
          analyzeTrust(entries);
          break;
        default:
          console.log(`Unknown decision type: ${decisionType}`);
      }
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onerror = (error) => {
      console.error("Error reading from IndexedDB:", error);
    };
  };

  request.onerror = (event) => {
    console.error("Error opening IndexedDB:", event.target.error);
  };
}

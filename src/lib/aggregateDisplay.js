function whole(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v) : 0;
}

function coerceAggregateRow(raw) {
  if (raw == null) return null;
  let row = raw;
  if (Array.isArray(row)) {
    row = row.length > 0 ? row[0] : null;
  }
  if (row == null || typeof row !== "object") return null;
  const keys = Object.keys(row);
  if (keys.length === 1) {
    const inner = row[keys[0]];
    if (inner != null && typeof inner === "object") {
      row = Array.isArray(inner)
        ? inner.length > 0
          ? inner[0]
          : null
        : inner;
    }
  }
  return row;
}

function splitFromCounts(c1, c2) {
  const n1 = Number(c1);
  const n2 = Number(c2);
  if (!Number.isFinite(n1) || !Number.isFinite(n2)) return null;
  const t = n1 + n2;
  if (t <= 0) return null;
  const a = Math.round((100 * n1) / t);
  return { a, b: 100 - a };
}

export function formatAggregate(thoughtId, raw) {
  const aggregate = coerceAggregateRow(raw);
  if (!aggregate) return null;

  switch (thoughtId) {
    case "dictator": {
      const mk =
        aggregate.mean_kept ??
        aggregate.avg_kept ??
        aggregate.meanKept;
      const mg =
        aggregate.mean_given ??
        aggregate.avg_given ??
        aggregate.meanGiven;
      if (mk == null && mg == null) return null;
      return `avg ${whole(mk)} kept · avg ${whole(mg)} given`;
    }
    case "volunteer": {
      const nTotal =
        aggregate.n ?? aggregate.total ?? aggregate.count ?? aggregate.row_count;
      if (nTotal !== undefined && Number(nTotal) === 0) {
        return "no responses yet";
      }

      let a = aggregate.pct_one;
      let b = aggregate.pct_five;
      if (a == null || b == null) {
        const fromCounts = splitFromCounts(
          aggregate.count_one ?? aggregate.cnt_one,
          aggregate.count_five ?? aggregate.cnt_five,
        );
        if (fromCounts) {
          a = fromCounts.a;
          b = fromCounts.b;
        }
      }
      if (a == null || b == null) {
        const p = aggregate.majority_pct ?? aggregate.majority_percent;
        const cRaw = aggregate.majority_choice ?? aggregate.majority;
        const c = cRaw != null ? String(cRaw).trim() : "";
        if (p != null && p !== "" && (c === "1" || c === "5")) {
          const pw = whole(p);
          if (c === "1") {
            a = pw;
            b = 100 - pw;
          } else {
            a = 100 - pw;
            b = pw;
          }
        }
      }
      if (a != null && b != null) {
        return `${whole(a)}% one coin · ${whole(b)}% five coins`;
      }
      return null;
    }
    case "exchange": {
      const nTotal =
        aggregate.n ?? aggregate.total ?? aggregate.count ?? aggregate.row_count;
      if (nTotal !== undefined && Number(nTotal) === 0) {
        return "no responses yet";
      }

      let k = aggregate.pct_keep;
      let e = aggregate.pct_exchange;
      if (k == null || e == null) {
        const fromCounts = splitFromCounts(
          aggregate.count_keep ?? aggregate.cnt_keep,
          aggregate.count_exchange ?? aggregate.cnt_exchange,
        );
        if (fromCounts) {
          k = fromCounts.a;
          e = fromCounts.b;
        }
      }
      if (k == null || e == null) {
        const p = aggregate.majority_pct ?? aggregate.majority_percent;
        const rawChoice =
          aggregate.majority_choice != null ? String(aggregate.majority_choice) : "";
        const c = rawChoice.trim().toLowerCase();
        if (p != null && p !== "" && (c === "keep" || c === "exchange")) {
          const pw = whole(p);
          if (c === "keep") {
            k = pw;
            e = 100 - pw;
          } else {
            k = 100 - pw;
            e = pw;
          }
        }
      }
      if (k != null && e != null) {
        return `${whole(k)}% keep · ${whole(e)}% exchange`;
      }
      return null;
    }
    case "trust": {
      const ms =
        aggregate.mean_sent ??
        aggregate.avg_sent ??
        aggregate.average_sent ??
        aggregate.avg_amount_sent ??
        aggregate.mean_amount_sent ??
        aggregate.avg_of_sent;
      if (ms == null) return null;
      return `avg ${whole(ms)} coins sent`;
    }
    default:
      return null;
  }
}

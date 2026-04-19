function whole(n) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.round(x) : 0;
}

export default function Hud({ balance, values }) {
  const trust = whole(values?.trust);
  const altruism = whole(values?.altruism);
  const deceit = whole(values?.deceit);
  const greed = whole(values?.greed);
  const standing = whole(values?.standing);

  const showDevReset = import.meta.env.DEV;

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1000,
        pointerEvents: "none",
        color: "#111",
        background: "rgba(255,255,255,0.88)",
        borderRadius: 8,
        padding: "10px 12px",
        fontWeight: 700,
        lineHeight: 1.4,
        minWidth: 190,
      }}
    >
      <div style={{ marginBottom: 6 }}>Gold: {balance}</div>

      <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 2 }}>Values</div>
      <div>Trust: {trust}</div>
      <div>Altruism: {altruism}</div>
      <div>Deceit: {deceit}</div>
      <div>Greed: {greed}</div>

      <div style={{ marginTop: 6 }}>Standing: {standing}</div>

      {showDevReset && (
        <div style={{ marginTop: 10, pointerEvents: "auto" }}>
          <button
            type="button"
            onClick={() => {
              try {
                window.localStorage.removeItem("tv_session_id");
                window.localStorage.removeItem("tv_dictator_locked_session");
              } catch {
                // ignore
              }
              window.location.reload();
            }}
            style={{
              width: "100%",
              padding: "6px 8px",
              fontWeight: 700,
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.2)",
              background: "rgba(255,255,255,0.9)",
              cursor: "pointer",
            }}
          >
            DEV: new session
          </button>
        </div>
      )}
    </div>
  );
}

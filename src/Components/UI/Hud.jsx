export default function Hud({ balance, values }) {
  const trust = Number(values?.trust ?? 0).toFixed(1);
  const altruism = Number(values?.altruism ?? 0).toFixed(1);
  const deceit = Number(values?.deceit ?? 0).toFixed(1);
  const greed = Number(values?.greed ?? 0).toFixed(1);
  const standing = Number(values?.standing ?? 0).toFixed(1);

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
    </div>
  );
}
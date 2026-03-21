export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>LangSync Pulse</h1>
      <p>MVP scaffold is ready.</p>
      <ul>
        <li>POST /api/captures</li>
        <li>GET /api/health</li>
      </ul>
    </main>
  );
}

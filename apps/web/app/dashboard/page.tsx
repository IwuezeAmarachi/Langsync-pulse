export default function DashboardPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>LangSync Pulse</h1>
      <p>Your AI search visibility dashboard</p>
      <nav>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "1rem" }}>
          <li>
            <a href="/dashboard/prompts">Prompts</a>
          </li>
          <li>
            <a href="/dashboard/competitors">Competitors</a>
          </li>
          <li>
            <a href="/dashboard/sources">Sources</a>
          </li>
        </ul>
      </nav>
    </div>
  );
}

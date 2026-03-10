export function AboutPage() {
  return (
    <div className="page">
      <h1>About</h1>
      <p>Built with Snice's React integration.</p>
      <ul>
        <li><code>&lt;SniceRouter&gt;</code> for hash-based routing</li>
        <li><code>&lt;Route&gt;</code> for route definitions with guards</li>
        <li><code>useSniceContext()</code> for shared application state</li>
        <li><code>useNavigate()</code> for programmatic navigation</li>
      </ul>
    </div>
  );
}

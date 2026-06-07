import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div>
      <header
        style={{
          padding: "20px",
          borderBottom: "1px solid #ddd",
        }}
      >
        <h2>Portal B2B</h2>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
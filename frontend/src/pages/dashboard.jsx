import { useAuth } from "../context/AuthContext";

export default function Dashboard() {

  const { token } = useAuth();

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard</h1>

      <p>Usuario autenticado.</p>

      <p>
        Token cargado:
      </p>

      <textarea
        style={{
          width: "100%",
          height: "150px",
        }}
        value={token || ""}
        readOnly
      />
    </div>
  );
}
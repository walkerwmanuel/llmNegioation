import { AuthButton } from "../components/auth/AuthButton";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b1020",
        color: "white",
      }}
    >
      <div
        style={{
          padding: 32,
          borderRadius: 12,
          background: "#11182d",
          textAlign: "center",
          maxWidth: 400,
          width: "100%",
        }}
      >
        <h2>Login Required</h2>
        <p>Please sign in to use the system</p>
        <AuthButton />
      </div>
    </div>
  );
}
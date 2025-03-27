import { useState } from "react";
import FirebaseAuth from "./components/FirebaseAuth";
import TextEditor from "./components/TextEditor";

function App() {
  const [user, setUser] = useState(null);

  return (
    <div
      style={{
        fontFamily: "'Poppins', sans-serif",
        textAlign: "center",
        padding: "40px",
        background: "#1e1e1e",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>✍️ The Writer's Haven</h1>
      <p style={{ fontSize: "1.2rem", opacity: "0.8", marginBottom: "30px" }}>
        Where your words meet the cloud! 🚀
      </p>

      {user ? (
        <>
          <h2 style={{ fontSize: "1.8rem", color: "#00d4ff", marginBottom: "10px" }}>
            👋 Hey, {user.displayName}!
          </h2>
          <p style={{ fontSize: "1.1rem", opacity: "0.8" }}>
            Ready to pen down your next masterpiece? 🖊️
          </p>
          <TextEditor />
        </>
      ) : (
        <div>
          <p
            style={{
              fontSize: "1.3rem",
              marginBottom: "20px",
              background: "#333",
              padding: "10px",
              borderRadius: "8px",
              display: "inline-block",
            }}
          >
            🔐 Sign in to unlock your creative space & save your work forever!
          </p>
          <FirebaseAuth onLogin={setUser} />
        </div>
      )}
    </div>
  );
}

export default App;

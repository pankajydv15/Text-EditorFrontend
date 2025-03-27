import { auth, provider, signInWithPopup } from "../firebaseConfig";
import { useState } from "react";

const FirebaseAuth = ({ onLogin }) => {
  const [user, setUser] = useState(null);

  const handleLogin = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        setUser(result.user);
        console.log("✅ User logged in:", result.user);
        onLogin(result.user);
      })
      .catch((error) => console.log("❌ Error:", error));
  };

  return (
    <div>
      {user ? (
        <h2>Welcome, {user.displayName}</h2>
      ) : (
        <button onClick={handleLogin}>Sign in with Google</button>
      )}
    </div>
  );
};


export default FirebaseAuth;

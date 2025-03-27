import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { gapiLoad, gisLoad, authenticateUser, saveToGoogleDrive } from "../services/googleDriveServices";
import "./TextEditor.css"; // Add a separate CSS file for styles
import Placeholder from "@tiptap/extension-placeholder"; 
// ✅ Import Placeholder

const TextEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({
      placeholder: "Start writing here...", // ✅ Placeholder text
    }),
  ],
    content: "",
  });

  

  const [user, setUser] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    gapiLoad();
    gisLoad();
  }, []);

  const handleGoogleLogin = () => {
    authenticateUser();
    setUser({ displayName: "" });
  };

  const handleSaveDraft = () => {
    const content = editor.getHTML();
    const draft = { content, timestamp: Date.now() };
    const savedDrafts = JSON.parse(localStorage.getItem("drafts")) || [];
    savedDrafts.push(draft);
    localStorage.setItem("drafts", JSON.stringify(savedDrafts));
    setDrafts(savedDrafts);
    alert("✅ Draft saved locally!");
  };

  const handleLoadDraft = (draft) => {
    editor.commands.setContent(draft.content);
  };

  const handleClearDrafts = () => {
    localStorage.removeItem("drafts");
    setDrafts([]);
    alert("🗑️ Drafts cleared!");
  };

  const handleSaveToDrive = async () => {
    if (!fileName.trim()) {
      alert("❌ Please enter a file name before saving.");
      return;
    } 

    const content = editor.getText();
    setLoading(true);
    try {
      await saveToGoogleDrive(content, fileName);
      alert(`✅ "${fileName}" saved to Google Drive!`);
      setFileName("");
    } catch (err) {
      console.error("❌ Error saving to Google Drive:", err);
      alert("❌ Failed to save to Google Drive.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLetters = async () => {
    console.log("📡 Fetching letters...");
    setLoading(true);
    setLetters([]);
    try {
      const token = gapi.client.getToken()?.access_token;
      // const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("❌ User not authenticated. Please login with Google.");
        return;
      }
      const response = await fetch("https://text-editorbackend.onrender.com/fetch-letters", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Unauthorized request");

      const data = await response.json();
      console.log("✅ Letters Fetched:", data);
      setLetters(data);
    } catch (error) {
      console.error("❌ Error fetching letters:", error);
      alert("❌ Failed to fetch letters.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2>✍️ Letter Editor</h2>
        {!user ? (
          <button className="btn login-btn" onClick={handleGoogleLogin}>
            🔒 Login with Google
          </button>
        ) : (
          <p>👋 Welcome {user.displayName}</p>
        )}
      </div>

      <div className="editor-toolbar">
        <button onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
        <button onClick={() => editor.chain().focus().undo().run()}>↩️</button>
        <button onClick={() => editor.chain().focus().redo().run()}>↪️</button>
      </div>

      <EditorContent editor={editor} className="editor-content" />

      <div className="file-name-input">
        <input
          type="text"
          placeholder="Enter file name..."
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />
      </div>

      <div className="editor-actions">
        <button className="btn" onClick={handleSaveDraft}>💾 Save Draft</button>
        <button className="btn" onClick={handleSaveToDrive} disabled={loading}>
          🚀 {loading ? "Saving..." : "Save to Google Drive"}
        </button>
        <button className="btn" onClick={handleFetchLetters} disabled={loading}>
          📂 {loading ? "Fetching..." : "Fetch Letters"}
        </button>
        <button className="btn danger" onClick={handleClearDrafts}>🗑️ Clear Drafts</button>
      </div>

      {drafts.length > 0 && (
        <div className="saved-drafts">
          <h3>📁 Saved Drafts:</h3>
          <ul>
            {drafts.map((draft, index) => (
              <li key={index}>
                <button className="draft-btn" onClick={() => handleLoadDraft(draft)}>
                  Draft {index + 1} - {new Date(draft.timestamp).toLocaleString()}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {letters.length > 0 && (
        <div className="google-drive-letters">
          <h3>📂 Google Drive Letters:</h3>
          <ul>
            {letters.map((letter) => (
              <li key={letter.id}>
                <a href={`https://docs.google.com/document/d/${letter.id}`} target="_blank" rel="noopener noreferrer">
                {letter.name.replace(/\.\w+$/, "")}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TextEditor;

const SCOPES = "https://www.googleapis.com/auth/drive.file";
let tokenClient;
let gapiLoaded = false;
let gisLoaded = false;

// Load Google API Client
export const gapiLoad = () => {
  gapi.load("client", async () => {
    await gapi.client.init({
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    });
    gapiLoaded = true;
  });
};

// Load Google Identity Service (OAuth)
export const gisLoad = () => {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      if (tokenResponse.error) {
        console.error("Google login error:", tokenResponse.error);
        return;
      }
      gapi.client.setToken(tokenResponse);
      console.log("✅ Google Authentication Successful");
    },
  });
  gisLoaded = true;
};

// Google Login
export const authenticateUser = () => {
  if (!gapiLoaded || !gisLoaded) {
    console.error("Google API not loaded properly.");
    return;
  }
  tokenClient.requestAccessToken();
};



// Function to get or create "Letter" folder in Google Drive
const getOrCreateLetterFolder = async () => {
  try {
    // 🔍 Check if "Letter" folder already exists in root
    const response = await gapi.client.drive.files.list({
      q: "name='Letter' and mimeType='application/vnd.google-apps.folder' and 'root' in parents",
      fields: "files(id, parents)",
    });

    if (response.result.files.length > 0) {
      console.log("📂 'Letter' folder exists:", response.result.files[0].id);
      return response.result.files[0].id; // Return folder ID
    }

    // 🆕 Create new "Letter" folder inside root
    const folderResponse = await gapi.client.drive.files.create({
      resource: {
        name: "Letter",
        mimeType: "application/vnd.google-apps.folder",
        parents: ["root"], // ✅ Ensure it is inside root
      },
      fields: "id",
    });

    console.log("✅ 'Letter' folder created:", folderResponse.result.id);
    return folderResponse.result.id; // Return new folder ID
  } catch (error) {
    console.error("❌ Error getting/creating folder:", error);
    throw error;
  }
};


// Save content to Google Drive inside "Letter" folder in Google Docs format
export const saveToGoogleDrive = async (content,fileName) => {

  if (!gapi.client.getToken()) {
    console.error("❌ User not authenticated.");
    throw new Error("User not authenticated");
  }

  try {
    const folderId = await getOrCreateLetterFolder(); // Get folder ID

    // 📝 Step 1: Create an empty Google Docs file inside the "Letter" folder
    const fileResponse = await gapi.client.drive.files.create({
      resource: {
        name: `${fileName}.docx`, // File name
        mimeType: "application/vnd.google-apps.document", // Google Docs format
        parents: [folderId], // ✅ Save inside "Letter" folder
      },
      fields: "id", // Get the file ID
    });

    const fileId = fileResponse.result.id; // Get newly created document ID
    console.log("📄 Empty Google Docs file created:", fileId);

    // ✏️ Step 2: Add content inside the created Google Docs file
    const docsAPIUrl = `https://docs.googleapis.com/v1/documents/${fileId}:batchUpdate`;
    const response = await fetch(docsAPIUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gapi.client.getToken().access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 }, // Insert at the beginning
              text: content, // Insert the actual editor content
            },
          },
        ],
      }),
    });

    if (!response.ok) throw new Error("❌ Failed to insert content");

    console.log(`✅ Content added to Google Docs file: ${fileName}.docx (ID: ${fileId})`);
    return { fileId };
  } catch (error) {
    console.error("❌ Failed to save to Google Drive:", error);
    throw error;
  }
};


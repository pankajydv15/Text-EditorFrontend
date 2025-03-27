const SCOPES = "https://www.googleapis.com/auth/drive.file";
let tokenClient;
let gapiLoaded = false;
let gisLoaded = false;


export const gapiLoad = () => {
  gapi.load("client", async () => {
    await gapi.client.init({
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    });
    gapiLoaded = true;
  });
};

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


export const authenticateUser = () => {
  if (!gapiLoaded || !gisLoaded) {
    console.error("Google API not loaded properly.");
    return;
  }
  tokenClient.requestAccessToken();
};



const getOrCreateLetterFolder = async () => {
  try {
  
    const response = await gapi.client.drive.files.list({
      q: "name='Letter' and mimeType='application/vnd.google-apps.folder' and 'root' in parents",
      fields: "files(id, parents)",
    });

    if (response.result.files.length > 0) {
      console.log("📂 'Letter' folder exists:", response.result.files[0].id);
      return response.result.files[0].id; 
    }

    
    const folderResponse = await gapi.client.drive.files.create({
      resource: {
        name: "Letter",
        mimeType: "application/vnd.google-apps.folder",
        parents: ["root"], 
      },
      fields: "id",
    });

    console.log("✅ 'Letter' folder created:", folderResponse.result.id);
    return folderResponse.result.id; 
  } catch (error) {
    console.error("❌ Error getting/creating folder:", error);
    throw error;
  }
};



export const saveToGoogleDrive = async (content,fileName) => {

  if (!gapi.client.getToken()) {
    console.error("❌ User not authenticated.");
    throw new Error("User not authenticated");
  }

  try {
    const folderId = await getOrCreateLetterFolder(); 

    
    const fileResponse = await gapi.client.drive.files.create({
      resource: {
        name: `${fileName}.docx`, 
        mimeType: "application/vnd.google-apps.document", 
        parents: [folderId], 
      },
      fields: "id", 
    });

    const fileId = fileResponse.result.id; 
    console.log("📄 Empty Google Docs file created:", fileId);

    
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
              location: { index: 1 }, 
              text: content, 
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


/**
 * Google Drive import for planning documents.
 *
 * Uses Google Identity Services for a browser-only access token with the
 * drive.file scope (only files the user picks in this app) and the Google
 * Picker for choosing a file. The client ID and API key are public by design;
 * both are restricted to dreamplaneredu.com in Google Cloud.
 */

export const GOOGLE_CLIENT_ID = "213835376493-49n9eicbg526vfp9c3jhlubu5ij8nq88.apps.googleusercontent.com";
export const GOOGLE_PICKER_API_KEY = "AIzaSyAytvcrKZLQW5LTLeX-wUFVPJ_gLiTcUuE";
export const GOOGLE_APP_ID = "213835376493";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const GOOGLE_DOC = "application/vnd.google-apps.document";

export interface DrivePick {
  id: string;
  name: string;
  mimeType: string;
  url: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

const scriptPromises = new Map<string, Promise<void>>();
function loadScript(src: string): Promise<void> {
  if (!scriptPromises.has(src)) {
    scriptPromises.set(
      src,
      new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => {
          scriptPromises.delete(src);
          reject(new Error("Could not load Google services"));
        };
        document.head.appendChild(s);
      }),
    );
  }
  return scriptPromises.get(src)!;
}

let pickerReady: Promise<void> | null = null;
async function loadGoogle(): Promise<void> {
  await Promise.all([loadScript("https://accounts.google.com/gsi/client"), loadScript("https://apis.google.com/js/api.js")]);
  if (!pickerReady) {
    pickerReady = new Promise((resolve) => window.gapi.load("picker", { callback: () => resolve() }));
  }
  await pickerReady;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/** Get an access token, asking the user to sign in with Google if needed. */
export async function getDriveToken(): Promise<string> {
  await loadGoogle();
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (resp: any) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error_description || resp.error || "Google sign-in was cancelled"));
          return;
        }
        cachedToken = { value: resp.access_token, expiresAt: Date.now() + Number(resp.expires_in || 3600) * 1000 };
        resolve(resp.access_token);
      },
      error_callback: (err: any) => reject(new Error(err?.message || "Google sign-in was cancelled")),
    });
    client.requestAccessToken({ prompt: cachedToken ? "" : "consent" });
  });
}

/** Open the Google Picker. Resolves to null if the user closes it. */
export async function pickDriveFile(locale: string): Promise<{ pick: DrivePick; token: string } | null> {
  const token = await getDriveToken();
  const g = window.google;
  return new Promise((resolve) => {
    const view = new g.picker.DocsView(g.picker.ViewId.DOCS)
      .setMimeTypes([GOOGLE_DOC, DOCX, "text/plain"].join(","))
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);
    const picker = new g.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(GOOGLE_PICKER_API_KEY)
      .setAppId(GOOGLE_APP_ID)
      .setLocale(locale)
      .setCallback((data: any) => {
        const action = data[g.picker.Response.ACTION];
        if (action === g.picker.Action.PICKED) {
          const doc = data[g.picker.Response.DOCUMENTS][0];
          resolve({
            pick: {
              id: doc[g.picker.Document.ID],
              name: doc[g.picker.Document.NAME],
              mimeType: doc[g.picker.Document.MIME_TYPE],
              url: doc[g.picker.Document.URL],
            },
            token,
          });
        } else if (action === g.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .build();
    picker.setVisible(true);
  });
}

/**
 * Download a Drive file as a File the existing upload pipeline accepts
 * (.docx or .txt). Google Docs are exported as .docx.
 */
export async function downloadDriveFile(
  fileId: string,
  token: string,
): Promise<{ file: File; name: string; url: string }> {
  const headers = { Authorization: `Bearer ${token}` };
  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=name,mimeType,webViewLink&supportsAllDrives=true`,
    { headers },
  );
  if (!metaRes.ok) throw new Error(`Google Drive (${metaRes.status})`);
  const meta = await metaRes.json();

  let blob: Blob;
  let fileName = meta.name as string;
  let type: string;
  if (meta.mimeType === GOOGLE_DOC) {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(DOCX)}`,
      { headers },
    );
    if (!res.ok) throw new Error(`Google Drive (${res.status})`);
    blob = await res.blob();
    type = DOCX;
    if (!fileName.toLowerCase().endsWith(".docx")) fileName += ".docx";
  } else if (meta.mimeType === DOCX || meta.mimeType === "text/plain") {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
      { headers },
    );
    if (!res.ok) throw new Error(`Google Drive (${res.status})`);
    blob = await res.blob();
    type = meta.mimeType;
  } else {
    throw new Error("UNSUPPORTED_TYPE");
  }

  return { file: new File([blob], fileName, { type }), name: meta.name, url: meta.webViewLink };
}

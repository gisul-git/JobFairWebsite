import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";

function cleanEnv(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  // Support values pasted with wrapping quotes in env files.
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function normalizeStorageKey(value: string): string {
  // Accept either raw account key or a full Azure connection string.
  if (!value.toLowerCase().includes("accountkey=")) return value;

  const parts = value.split(";");
  for (const part of parts) {
    const [rawK, ...rest] = part.split("=");
    if (!rawK || rest.length === 0) continue;
    if (rawK.trim().toLowerCase() === "accountkey") {
      return rest.join("=").trim();
    }
  }

  return value;
}

function getConfig() {
  const account = cleanEnv(process.env.AZURE_STORAGE_ACCOUNT);
  const key = normalizeStorageKey(cleanEnv(process.env.AZURE_STORAGE_KEY));
  const container = cleanEnv(process.env.AZURE_CONTAINER_NAME);

  if (!account) throw new Error("Missing AZURE_STORAGE_ACCOUNT");
  if (!key) throw new Error("Missing AZURE_STORAGE_KEY");
  if (!container) throw new Error("Missing AZURE_CONTAINER_NAME");

  return { account, key, container };
}

function getConnectionString() {
  const { account, key } = getConfig();
  return `DefaultEndpointsProtocol=https;AccountName=${account};AccountKey=${key};EndpointSuffix=core.windows.net`;
}

function getPublicBlobUrl(blobName: string) {
  const { account, container } = getConfig();
  return `https://${account}.blob.core.windows.net/${container}/${encodeURIComponent(blobName)}`;
}

export async function uploadToBlob(buffer: Buffer, filename: string): Promise<string> {
  const { container } = getConfig();

  const service = BlobServiceClient.fromConnectionString(getConnectionString());
  const containerClient = service.getContainerClient(container);
  await containerClient.createIfNotExists();

  const blobClient = containerClient.getBlockBlobClient(filename);

  const contentType = filename.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : "application/octet-stream";

  await blobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  // Private containers return 404-style XML to anonymous clients without a SAS token.
  return getSasUrl(filename);
}

/** Extract blob path (filename within container) from our Azure blob URL. */
export function blobNameFromAzureBlobUrl(blobUrl: string): string | null {
  try {
    const u = new URL(blobUrl);
    const path = u.pathname.replace(/^\/+/, "");
    const { container } = getConfig();
    const prefix = `${container}/`;
    if (!path.startsWith(prefix)) return null;
    const encodedName = path.slice(prefix.length);
    return decodeURIComponent(encodedName);
  } catch {
    return null;
  }
}

/** Fresh read-only SAS for an existing blob (e.g. after an old SAS expired). */
export async function getReadSasForBlobUrl(blobUrl: string): Promise<string | null> {
  const name = blobNameFromAzureBlobUrl(blobUrl);
  if (!name) return null;
  return getSasUrl(name);
}

export async function getSasUrl(blobName: string): Promise<string> {
  const { account, key, container } = getConfig();
  const sharedKey = new StorageSharedKeyCredential(account, key);

  const startsOn = new Date(Date.now() - 5 * 60 * 1000);
  // Certificates may be previewed in an iframe or shared; keep a practical TTL.
  const expiresOn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: container,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn,
      expiresOn,
    },
    sharedKey
  ).toString();

  return `${getPublicBlobUrl(blobName)}?${sas}`;
}

/** Best-effort delete for an uploaded blob by its stored URL. */
export async function deleteBlobByUrl(blobUrl: string): Promise<boolean> {
  const blobName = blobNameFromAzureBlobUrl(blobUrl);
  if (!blobName) return false;

  const { container } = getConfig();
  const service = BlobServiceClient.fromConnectionString(getConnectionString());
  const containerClient = service.getContainerClient(container);
  const blobClient = containerClient.getBlockBlobClient(blobName);
  const result = await blobClient.deleteIfExists();
  return result.succeeded;
}


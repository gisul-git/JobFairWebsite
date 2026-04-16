import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";

function getConfig() {
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  const key = process.env.AZURE_STORAGE_KEY;
  const container = process.env.AZURE_CONTAINER_NAME;

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

  return getPublicBlobUrl(filename);
}

export async function getSasUrl(blobName: string): Promise<string> {
  const { account, key, container } = getConfig();
  const sharedKey = new StorageSharedKeyCredential(account, key);

  const startsOn = new Date(Date.now() - 5 * 60 * 1000);
  const expiresOn = new Date(Date.now() + 60 * 60 * 1000);

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


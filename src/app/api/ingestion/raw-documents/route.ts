import { parseRawDocumentInput, storeRawDocumentIfNew } from "@/server/raw-documents";
import { requireIngestionApiKey } from "@/server/api/ingestion-auth";
import { jsonError, jsonOk, readJsonBody } from "@/server/api/responses";

export async function POST(request: Request) {
  const auth = requireIngestionApiKey(request);
  if (!auth.ok) {
    return auth.response;
  }

  const input = parseRawDocumentInput(await readJsonBody(request));
  if (!input) {
    return jsonError("Invalid raw document payload", 400);
  }

  return jsonOk(await storeRawDocumentIfNew(input));
}

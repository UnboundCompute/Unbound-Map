export const MAX_CLIENT_JSON_BYTES = 2 * 1024 * 1024;

/** Read a JSON response with a strict byte ceiling before parsing it. */
export async function boundedJson<T = unknown>(response: Response, maxBytes = MAX_CLIENT_JSON_BYTES): Promise<T> {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error('The repository service returned an oversized response.');

  let body: string;
  try {
    body = await response.text();
  } catch {
    throw new Error('The repository service response could not be read.');
  }
  if (new TextEncoder().encode(body).byteLength > maxBytes) throw new Error('The repository service returned an oversized response.');

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error('The repository service returned an invalid response.');
  }
}

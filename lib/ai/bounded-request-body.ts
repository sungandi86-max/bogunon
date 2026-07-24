export class RequestBodyTooLargeError extends Error {
  readonly name = "RequestBodyTooLargeError";
}

export async function readBoundedRequestText(
  request: Request,
  maxBytes: number,
): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder();
  let byteCount = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) return text + decoder.decode();

      byteCount += chunk.value.byteLength;
      if (byteCount > maxBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

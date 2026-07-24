import "client-only";

import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

if (typeof Worker !== "undefined") {
  GlobalWorkerOptions.workerSrc = workerSrc;
}

export { getDocument };

declare module "mammoth/mammoth.browser.js" {
  interface RawTextResult {
    readonly messages: readonly unknown[];
    readonly value: string;
  }

  export function extractRawText(input: {
    readonly arrayBuffer: ArrayBuffer;
  }): Promise<RawTextResult>;
}

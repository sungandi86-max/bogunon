"use client";

import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AiConnectionClientError,
  validateAiConnection,
} from "@/components/ai/ai-connection-client";
import type { AiConnectionInput } from "@/lib/ai/types";

export type AiConnectionStatus =
  | { readonly kind: "disconnected" }
  | { readonly kind: "checking" }
  | { readonly kind: "connected" }
  | { readonly kind: "failed"; readonly message: string };

type AiConnectionContextValue = {
  readonly connection: AiConnectionInput | null;
  readonly connect: (connection: AiConnectionInput) => Promise<boolean>;
  readonly disconnect: () => void;
  readonly status: AiConnectionStatus;
};

const AiConnectionContext = createContext<AiConnectionContextValue | null>(null);

export function AiConnectionProvider({
  children,
  initialConnection = null,
}: {
  readonly children: ReactNode;
  readonly initialConnection?: AiConnectionInput | null;
}) {
  const [connection, setConnection] = useState<AiConnectionInput | null>(initialConnection);
  const [status, setStatus] = useState<AiConnectionStatus>(
    initialConnection ? { kind: "connected" } : { kind: "disconnected" },
  );

  const connect = useCallback(async (candidate: AiConnectionInput): Promise<boolean> => {
    setConnection(null);
    setStatus({ kind: "checking" });
    try {
      await validateAiConnection(candidate);
      setConnection(candidate);
      setStatus({ kind: "connected" });
      return true;
    } catch (error) {
      const message = error instanceof AiConnectionClientError
        ? error.message
        : error instanceof DOMException && error.name === "AbortError"
          ? "AI 연결 확인 시간이 길어지고 있습니다. 다시 시도해 주세요."
          : error instanceof TypeError
            ? "네트워크 연결을 확인하고 다시 시도해 주세요."
            : "AI 연결을 확인하지 못했습니다. 다시 시도해 주세요.";
      setConnection(null);
      setStatus({ kind: "failed", message });
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnection(null);
    setStatus({ kind: "disconnected" });
  }, []);

  const value = useMemo(
    () => ({ connection, connect, disconnect, status }),
    [connection, connect, disconnect, status],
  );

  return <AiConnectionContext value={value}>{children}</AiConnectionContext>;
}

export function useAiConnection(): AiConnectionContextValue {
  const value = use(AiConnectionContext);
  if (!value) {
    throw new Error("AiConnectionProvider 안에서 사용해야 합니다.");
  }
  return value;
}

"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

const swrConfig = {
  fetcher,
  dedupingInterval: 10000,
  revalidateIfStale: false,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  errorRetryCount: 2,
};

function DataProvider({ children }) {
  const { data: session, status } = useSession();
  const cacheKey =
    status === "loading"
      ? "session-loading"
      : `${session?.user?.id || "anonymous"}:${session?.user?.role || ""}`;

  return (
    <SWRConfig key={cacheKey} value={swrConfig}>
      {children}
    </SWRConfig>
  );
}

export function Providers({ children }) {
  return (
    <SessionProvider>
      <DataProvider>{children}</DataProvider>
    </SessionProvider>
  );
}

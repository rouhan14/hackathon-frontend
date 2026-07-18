import type { WorkOsClient } from "./types";
import { httpWorkOsClient } from "./http-client";
import { mockWorkOsClient } from "./mock-client";

export const isMockMode = process.env.NEXT_PUBLIC_DATA_MODE === "mock";

export const workOsClient: WorkOsClient = isMockMode
  ? mockWorkOsClient
  : httpWorkOsClient;

export * from "./types";

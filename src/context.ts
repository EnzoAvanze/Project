import { createContext, useContext } from "react";
import type { State, Page } from "./types";
export interface AppContext {
  state: State;
  page: Page;
  go: (page: Page) => void;
  refresh: () => Promise<void>;
  act: (
    path: string,
    body?: Record<string, unknown>,
    method?: string,
    queueLabel?: string,
  ) => Promise<any>;
  toast: (message: string) => void;
  online: boolean;
  pendingCount: number;
  openQueue: () => void;
  openEditor: (
    type: "medications" | "appointments" | "contacts",
    item?: any,
  ) => void;
  confirmMedication: (med: any) => void;
}
export const Context = createContext<AppContext>(null!);
export const useApp = () => useContext(Context);

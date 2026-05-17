import {
  ApiKey,
  ApiKeyProvider,
  OpenRouterModel,
  OpenRouterProvider,
} from "@voquill/types";
import {
  type AgentMode,
  type PostProcessingMode,
  type TranscriptionMode,
} from "../types/ai.types";
import { ActionStatus } from "../types/state.types";

export type SettingsApiKeyProvider = ApiKeyProvider;

export type SettingsApiKey = ApiKey;

export type SettingsTranscriptionState = {
  mode: TranscriptionMode | null;
  selectedApiKeyId: string | null;
};

export type SettingsGenerativeState = {
  mode: PostProcessingMode | null;
  selectedApiKeyId: string | null;
};

export type SettingsAgentModeState = Omit<SettingsGenerativeState, "mode"> & {
  mode: AgentMode | null;
  openclawGatewayUrl: string | null;
  openclawToken: string | null;
};

export type SettingsState = {
  microphoneDialogOpen: boolean;
  audioDialogOpen: boolean;
  shortcutsDialogOpen: boolean;
  clearLocalDataDialogOpen: boolean;
  aiTranscriptionDialogOpen: boolean;
  aiPostProcessingDialogOpen: boolean;
  agentModeDialogOpen: boolean;
  moreSettingsDialogOpen: boolean;
  dictationLanguageDialogOpen: boolean;
  appKeybindingsDialogOpen: boolean;
  globalPasteKeybindDialogOpen: boolean;
  diagnosticsDialogOpen: boolean;
  aiTranscription: SettingsTranscriptionState;
  aiPostProcessing: SettingsGenerativeState;
  agentMode: SettingsAgentModeState;
  apiKeys: SettingsApiKey[];
  apiKeysStatus: ActionStatus;
  hotkeyIds: string[];
  hotkeysStatus: ActionStatus;
  autoLaunchEnabled: boolean;
  autoLaunchStatus: ActionStatus;
  openRouterModels: OpenRouterModel[];
  openRouterModelsStatus: ActionStatus;
  openRouterSearchQuery: string;
  openRouterProviders: OpenRouterProvider[];
  openRouterProvidersStatus: ActionStatus;
};

export const INITIAL_SETTINGS_STATE: SettingsState = {
  microphoneDialogOpen: false,
  audioDialogOpen: false,
  shortcutsDialogOpen: false,
  clearLocalDataDialogOpen: false,
  aiTranscriptionDialogOpen: false,
  aiPostProcessingDialogOpen: false,
  agentModeDialogOpen: false,
  moreSettingsDialogOpen: false,
  dictationLanguageDialogOpen: false,
  appKeybindingsDialogOpen: false,
  globalPasteKeybindDialogOpen: false,
  diagnosticsDialogOpen: false,
  aiTranscription: {
    mode: null,
    selectedApiKeyId: null,
  },
  aiPostProcessing: {
    mode: null,
    selectedApiKeyId: null,
  },
  agentMode: {
    mode: null,
    selectedApiKeyId: null,
    openclawGatewayUrl: null,
    openclawToken: null,
  },
  apiKeys: [],
  apiKeysStatus: "idle",
  hotkeyIds: [],
  hotkeysStatus: "idle",
  autoLaunchEnabled: false,
  autoLaunchStatus: "idle",
  openRouterModels: [],
  openRouterModelsStatus: "idle",
  openRouterSearchQuery: "",
  openRouterProviders: [],
  openRouterProvidersStatus: "idle",
};

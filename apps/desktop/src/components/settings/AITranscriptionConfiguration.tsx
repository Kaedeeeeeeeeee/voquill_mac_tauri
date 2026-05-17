import { Stack } from "@mui/material";
import { useCallback } from "react";
import {
  setPreferredTranscriptionApiKeyId,
  setPreferredTranscriptionMode,
} from "../../actions/user.actions";
import { useAppStore } from "../../store";
import { type TranscriptionMode } from "../../types/ai.types";
import { getEffectiveTranscriptionMode } from "../../utils/user.utils";
import {
  SegmentedControl,
  SegmentedControlOption,
} from "../common/SegmentedControl";
import { maybeArrayElements } from "./AIPostProcessingConfiguration";
import { ApiKeyList } from "./ApiKeyList";
import { VoquillCloudSetting } from "./VoquillCloudSetting";

export type AITranscriptionConfigurationProps = {
  hideCloudOption?: boolean;
};

export const AITranscriptionConfiguration = ({
  hideCloudOption,
}: AITranscriptionConfigurationProps) => {
  const transcription = useAppStore((state) => state.settings.aiTranscription);
  const effectiveMode = useAppStore(getEffectiveTranscriptionMode);

  const handleModeChange = useCallback((mode: TranscriptionMode) => {
    void setPreferredTranscriptionMode(mode);
  }, []);

  const handleApiKeyChange = useCallback((id: string | null) => {
    void setPreferredTranscriptionApiKeyId(id);
  }, []);

  return (
    <Stack spacing={3} alignItems="flex-start" sx={{ width: "100%" }}>
      <SegmentedControl<TranscriptionMode>
        value={effectiveMode}
        onChange={handleModeChange}
        options={[
          ...maybeArrayElements<SegmentedControlOption<TranscriptionMode>>(
            !hideCloudOption,
            [
              {
                value: "cloud",
                label: "Voquill",
              },
            ],
          ),
          { value: "api", label: "API" },
        ]}
        ariaLabel="Processing mode"
      />

      {effectiveMode === "api" && (
        <ApiKeyList
          selectedApiKeyId={transcription.selectedApiKeyId}
          onChange={handleApiKeyChange}
          context="transcription"
        />
      )}

      {effectiveMode === "cloud" && <VoquillCloudSetting />}
    </Stack>
  );
};

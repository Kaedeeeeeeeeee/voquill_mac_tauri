import { NativeSetupDialog } from "./NativeSetupDialog";
import { PaymentDialog } from "../payment/PaymentDialog";
import { UpgradePlanDialog } from "../pricing/UpgradePlanDialog";
import { AIAgentModeDialog } from "../settings/AIAgentModeDialog";
import { AIPostProcessingDialog } from "../settings/AIPostProcessingDialog";
import { AITranscriptionDialog } from "../settings/AITranscriptionDialog";
import { AppKeybindingsDialog } from "../settings/AppKeybindingsDialog";
import { GlobalPasteKeybindDialog } from "../settings/GlobalPasteKeybindDialog";
import { AudioDialog } from "../settings/AudioDialog";
import { ClearLocalDataDialog } from "../settings/ClearLocalDataDialog";
import { DictationLanguageDialog } from "../settings/DictationLanguageDialog";
import { DiagnosticsDialog } from "../settings/DiagnosticsDialog";
import { MicrophoneDialog } from "../settings/MicrophoneDialog";
import { MoreSettingsDialog } from "../settings/MoreSettingsDialog";
import { ShortcutsDialog } from "../settings/ShortcutsDialog";
import { ToneEditorDialog } from "../tones/ToneEditorDialog";
import { FlagTranscriptionDialog } from "../transcriptions/FlagTranscriptionDialog";
import { RetranscribeDialog } from "../transcriptions/RetranscribeDialog";

export const RootDialogs = () => {
  return (
    <>
      <RetranscribeDialog />
      <FlagTranscriptionDialog />
      <ToneEditorDialog />
      <AITranscriptionDialog />
      <AIPostProcessingDialog />
      <AIAgentModeDialog />
      <MicrophoneDialog />
      <AudioDialog />
      <ShortcutsDialog />
      <ClearLocalDataDialog />
      <UpgradePlanDialog />
      <PaymentDialog />
      <MoreSettingsDialog />
      <DictationLanguageDialog />
      <AppKeybindingsDialog />
      <GlobalPasteKeybindDialog />
      <DiagnosticsDialog />
      <NativeSetupDialog />
    </>
  );
};

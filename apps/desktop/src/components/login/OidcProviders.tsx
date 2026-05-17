import { Google } from "@mui/icons-material";
import { Button } from "@mui/material";
import { FormattedMessage } from "react-intl";
import { submitSignInWithGoogle } from "../../actions/login.actions";
import { useAppStore } from "../../store";

type OidcProvidersProps = {
  onBeforeSignIn?: () => void;
  variant?: "outlined" | "contained";
};

export const OidcProviders = ({
  onBeforeSignIn,
  variant = "outlined",
}: OidcProvidersProps) => {
  const loading = useAppStore((state) => state.login.status === "loading");

  const handleGoogleClick = () => {
    onBeforeSignIn?.();
    submitSignInWithGoogle();
  };

  return (
    <Button
      fullWidth
      variant={variant}
      startIcon={<Google />}
      disabled={loading}
      onClick={handleGoogleClick}
    >
      <FormattedMessage defaultMessage="Continue with Google" />
    </Button>
  );
};

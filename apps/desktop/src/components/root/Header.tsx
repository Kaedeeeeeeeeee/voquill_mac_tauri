import { LogoutOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { getIdentifier } from "@tauri-apps/api/app";
import { useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "react-router-dom";
import { useAsyncData } from "../../hooks/async.hooks";
import { useHeaderPortal } from "../../hooks/header.hooks";
import { useIsOnboarded } from "../../hooks/user.hooks";
import { getAuthRepo } from "../../repos";
import { useAppStore } from "../../store";
import { getIsOnTrial } from "../../utils/member.utils";
import { getInitials } from "../../utils/string.utils";
import { getMyUser } from "../../utils/user.utils";
import { LogoWithText } from "../common/LogoWithText";
import {
  MenuPopoverBuilder,
  type MenuPopoverItem,
} from "../common/MenuPopover";
import { TrialCountdown } from "../common/TrialCountdown";
import { GpuMigrationDialog } from "./GpuMigrationDialog";
import { SenderReceiverChip } from "./SenderReceiverChip";

export type BaseHeaderProps = {
  logo?: React.ReactNode;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
};

export const BaseHeader = ({
  logo,
  leftContent,
  rightContent,
}: BaseHeaderProps) => {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ py: 1, px: 2 }}
    >
      <Box sx={{ py: 0.5, pr: 1 }}>{logo}</Box>
      {leftContent}
      <Box sx={{ flexGrow: 1 }} />
      {rightContent}
    </Stack>
  );
};

export const AppHeader = () => {
  const nav = useNavigate();
  const { leftContent } = useHeaderPortal();
  const isOnboarded = useIsOnboarded();
  const isOnTrial = useAppStore(getIsOnTrial);

  const myName = useAppStore((state) => {
    const user = getMyUser(state);
    return user?.name ?? "Unknown";
  });

  const myInitials = useMemo(() => getInitials(myName), [myName]);
  const identifierData = useAsyncData(getIdentifier, []);
  const isGpuBuild =
    identifierData.state === "success" &&
    identifierData.data.split(".").includes("gpu");
  const [gpuMigrationDialogOpen, setGpuMigrationDialogOpen] = useState(false);

  const handleLogoClick = () => {
    nav("/");
  };

  const sharedRightMenuItems: MenuPopoverItem[] = [
    {
      kind: "listItem",
      title: <FormattedMessage defaultMessage="Sign out" />,
      onClick: async ({ close }) => {
        close();
        await getAuthRepo().signOut();
      },
      leading: <LogoutOutlined />,
    },
  ];

  let rightContent: React.ReactNode;
  if (isOnboarded) {
    rightContent = (
      <Stack direction="row" alignItems="center" gap={1.5}>
        {isGpuBuild && (
          <Button
            onClick={() => setGpuMigrationDialogOpen(true)}
            variant="contained"
            sx={{
              fontWeight: 600,
              fontSize: 13,
              px: 1.5,
              py: 0.75,
            }}
          >
            <FormattedMessage defaultMessage="GPU App Deprecation | Upgrade Now" />
          </Button>
        )}
        {isOnTrial && <TrialCountdown />}
        <MenuPopoverBuilder
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          items={sharedRightMenuItems}
        >
          {({ ref, open }) => (
            <Button
              ref={ref}
              onClick={open}
              sx={{
                display: { xs: "none", sm: "flex" },
                flexShrink: 0,
                flexDirection: "row",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: 14,
                }}
              >
                {myInitials}
              </Avatar>
              <Stack textAlign="left" spacing={0.5}>
                <Typography variant="subtitle1" fontWeight={700} lineHeight={1}>
                  {myName}
                </Typography>
              </Stack>
            </Button>
          )}
        </MenuPopoverBuilder>
      </Stack>
    );
  }

  const logo = (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box onClick={handleLogoClick} sx={{ cursor: "pointer" }}>
        <LogoWithText />
      </Box>
      <SenderReceiverChip />
    </Stack>
  );

  return (
    <>
      <BaseHeader
        logo={logo}
        leftContent={leftContent}
        rightContent={rightContent}
      />
      <GpuMigrationDialog
        open={gpuMigrationDialogOpen}
        onClose={() => setGpuMigrationDialogOpen(false)}
      />
    </>
  );
};

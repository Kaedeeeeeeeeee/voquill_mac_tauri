import { Member, Nullable } from "@voquill/types";
import { getRec } from "@voquill/utilities";
import { getIntl } from "../i18n";
import type { AppState } from "../state/app.state";
import { EffectivePlan } from "../types/member.types";

export const getMyMember = (state: AppState): Nullable<Member> => {
  return getRec(state.memberById, state.auth?.uid) ?? null;
};

export const getEffectivePlan = (_state: AppState): EffectivePlan => {
  return "pro";
};

export const getIsVoquillCloudUser = (_state: AppState): boolean => {
  return true;
};

export const planToDisplayName = (plan: EffectivePlan): string => {
  if (plan === "enterprise") {
    return getIntl().formatMessage({ defaultMessage: "Enterprise" });
  } else if (plan === "community") {
    return getIntl().formatMessage({ defaultMessage: "Community" });
  } else if (plan === "free") {
    return getIntl().formatMessage({ defaultMessage: "Free" });
  } else {
    return getIntl().formatMessage({ defaultMessage: "Pro" });
  }
};

export const getIsOnTrial = (_state: AppState): boolean => {
  return false;
};

export const getTrialDaysRemaining = (_state: AppState): number | null => {
  return null;
};

export const getTrialProgress = (_state: AppState): number | null => {
  return null;
};

export const getIsPro = (_state: AppState): boolean => {
  return true;
};

export const getIsPaidSubscriber = (_state: AppState): boolean => {
  return true;
};

export const getMemberExceedsLimitByState = (_state: AppState): boolean => {
  return false;
};

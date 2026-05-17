import { FullConfig, Member, MemberPlan } from "@voquill/types";

export const TRIAL_DURATION_DAYS = 7;

export const getMemberExceedsWordLimit = (
  _member: Member,
  _config: FullConfig,
): boolean => {
  return false;
};

export const getMemberExceedsTokenLimit = (
  _member: Member,
  _config: FullConfig,
): boolean => {
  return false;
};

export const getMemberExceedsLimits = (
  _member: Member,
  _config: FullConfig,
): boolean => {
  return false;
};

export type Limit = {
  perDay: number;
  perWeek: number;
  perMonth: number;
};

export const getWordLimit = (config: FullConfig, plan: MemberPlan): Limit => {
  if (plan === "pro") {
    return {
      perDay: config.proWordsPerDay,
      perWeek: config.proWordsPerWeek,
      perMonth: config.proWordsPerMonth,
    };
  } else {
    return {
      perDay: config.freeWordsPerDay,
      perWeek: config.freeWordsPerWeek,
      perMonth: config.freeWordsPerMonth,
    };
  }
};

export const getTokenLimit = (config: FullConfig, plan: MemberPlan): Limit => {
  if (plan === "pro") {
    return {
      perDay: config.proTokensPerDay,
      perWeek: config.proTokensPerWeek,
      perMonth: config.proTokensPerMonth,
    };
  } else {
    return {
      perDay: config.freeTokensPerDay,
      perWeek: config.freeTokensPerWeek,
      perMonth: config.freeTokensPerMonth,
    };
  }
};

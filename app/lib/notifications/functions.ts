"use client";

import { httpsCallable } from "firebase/functions";
import { FbFunctions } from "@/app/lib/services/firebase";

type MaterializePayload = {
  audienceId: string;
  rebuild?: boolean;
};

type MaterializeResult = {
  audienceId: string;
  type: string;
  fromManual: number;
  fromSessions: number;
  totalAfter: number;
};

type RunCampaignPayload = {
  campaignId: string;
};

type RunCampaignResult = {
  executionId: string;
  targetedIdsCount: number;
  targetedRunsCount: number;
  lines: number;
  sent: number;
  failed: number;
};

/** Llama a CF materializeAudienceMembers */
export async function materializeAudience(
  audienceId: string,
  opts: { rebuild?: boolean } = {},
): Promise<MaterializeResult> {
  const fn = httpsCallable<MaterializePayload, MaterializeResult>(
    FbFunctions,
    "materializeAudienceMembers",
  );

  const res = await fn({
    audienceId,
    rebuild: opts.rebuild ?? true,
  });

  return res.data;
}

/** Llama a CF runCampaignNow */
export async function runCampaignNowClient(
  campaignId: string,
): Promise<RunCampaignResult> {
  const fn = httpsCallable<RunCampaignPayload, RunCampaignResult>(
    FbFunctions,
    "runCampaignNow",
  );

  const res = await fn({ campaignId });
  return res.data;
}

// functionalities/functions/index.ts

export * from "./notifications/applyCampaign";
export * from "./notifications/materializeAudienceMembers";
export * from "./notifications/runCampaignNow";
export * from "./notifications/registerNotificationRun";
export * from "./notifications/exportAudienceMembers"; // 👈 NUEVO

export { applyCampaignToAudience } from "./notifications/applyCampaign";
export { materializeAudienceMembers } from "./notifications/materializeAudienceMembers";
export { runCampaignNow } from "./notifications/runCampaignNow";
export { registerNotificationRun } from "./notifications/registerNotificationRun";
export { exportAudienceMembersToCsv } from "./notifications/exportAudienceMembers"; // 👈 NUEVO

export type LumepicMessageTemplateVariables = {
  eventName: string;
  bibNumber: string;
  resultUrl: string;
  selfieUrl: string;
  instagramHandle: string;
};

export type LumepicDetectionConfig = {
  emptyStateTexts: string[];
  thumbnailUrlSubstrings: string[];
  navigationTimeoutMs: number;
  networkIdleTimeoutMs: number;
};

export type LumepicEventConfig = {
  id: string;
  name: string;
  eventUrl: string;
  selfieUrl?: string;
  instagramHandle?: string;
  successMessageTemplates?: string[];
  noPhotosMessageTemplates?: string[];
  detection?: Partial<LumepicDetectionConfig>;
};

export type LumepicEventOption = {
  id: string;
  name: string;
  source: "configured" | "custom";
};

export type LumepicMessageSettingsInput = {
  instagramHandle?: string;
  successMessageTemplates?: string[];
  noPhotosMessageTemplates?: string[];
};

export type LumepicCustomEventInput = {
  id: string;
  name: string;
  eventUrl: string;
  selfieUrl?: string;
} & LumepicMessageSettingsInput;

export type LumepicCheckStatus = "found" | "not_found" | "error";

export type LumepicStoredConfig = {
  version: 1;
  activeEvents: LumepicCustomEventInput[];
  instagramHandle: string;
  successMessageTemplates: string[];
  noPhotosMessageTemplates: string[];
};

export type LumepicCheckSuccessResult = {
  success: true;
  status: "found" | "not_found";
  hasPhotos: boolean;
  bibNumber: string;
  eventId: string;
  eventName: string;
  resultUrl: string;
  selfieUrl: string;
  message: string;
  reason: string;
};

export type LumepicCheckErrorResult = {
  success: false;
  status: "error";
  hasPhotos: null;
  bibNumber: string;
  eventId: string;
  eventName: string | null;
  resultUrl: string | null;
  selfieUrl: string | null;
  message: null;
  reason: string;
  errorCode: "INVALID_INPUT" | "EVENT_NOT_FOUND" | "CHECK_FAILED";
};

export type LumepicCheckResult = LumepicCheckSuccessResult | LumepicCheckErrorResult;

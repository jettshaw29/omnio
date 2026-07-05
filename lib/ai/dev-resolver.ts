"use server";

// Central parser for hand-pasted Claude responses in dev mode. One place the
// shared <DevAiStep> component routes every touchpoint's paste through, so
// the component stays generic. Returns `unknown`; each caller casts to the
// type it knows it's getting.
import { parseInterviewResponse } from "./interview";
import { parseOfferResponse } from "./offer";
import { parseBrandResponse } from "./brand";
import { parseWebsiteResponse } from "./website";
import { parseProspectResponse } from "./prospect";
import { parseOutreachResponse } from "./outreach";
import { parseProposalResponse } from "./proposal";
import { parseChecklistResponse, parseStatusUpdateResponse } from "./delivery";
import { parseTestimonialResponse } from "./testimonial";

export type DevTouchpoint =
  | "interview"
  | "offer"
  | "brand"
  | "website"
  | "prospect"
  | "outreach"
  | "proposal"
  | "checklist"
  | "statusUpdate"
  | "testimonial";

export async function resolveDevResponse(
  touchpoint: DevTouchpoint,
  raw: string
): Promise<unknown> {
  switch (touchpoint) {
    case "interview":
      return parseInterviewResponse(raw);
    case "offer":
      return parseOfferResponse(raw);
    case "brand":
      return parseBrandResponse(raw);
    case "website":
      return parseWebsiteResponse(raw);
    case "prospect":
      return parseProspectResponse(raw);
    case "outreach":
      return parseOutreachResponse(raw);
    case "proposal":
      return parseProposalResponse(raw);
    case "checklist":
      return parseChecklistResponse(raw);
    case "statusUpdate":
      return parseStatusUpdateResponse(raw);
    case "testimonial":
      return parseTestimonialResponse(raw);
  }
}

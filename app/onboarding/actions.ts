"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getNextInterviewStep,
  type InterviewMessage,
  type InterviewStep,
  type NicheOption,
} from "@/lib/ai/interview";

export async function requestNextStep(
  history: InterviewMessage[]
): Promise<InterviewStep> {
  return getNextInterviewStep(history);
}

// Interview transcript is persisted once, at the moment the niche locks,
// rather than turn-by-turn — the interview is short enough that this is a
// deliberate simplification, not a data-loss risk worth engineering around
// in V1 (02_TECH_ARCHITECTURE.md's conversations/messages tables still end
// up with the full record either way).
export async function lockNiche(
  agencyId: string,
  niche: NicheOption,
  transcript: InterviewMessage[]
) {
  await prisma.$transaction(async (tx) => {
    await tx.agency.update({
      where: { id: agencyId },
      data: { niche: niche.name, nicheLockedAt: new Date() },
    });
    const conversation = await tx.conversation.create({ data: { agencyId } });
    if (transcript.length > 0) {
      await tx.message.createMany({
        data: transcript.map((m) => ({
          conversationId: conversation.id,
          role: m.role,
          content: m.content,
        })),
      });
    }
  });

  redirect("/");
}

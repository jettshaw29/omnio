import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * The card anatomy from 01_MISSION_CONTROL_UX.md §1: one sentence, one line
 * of reasoning (visible by default, never behind a tooltip — Article VI),
 * one button. Never a second competing action.
 */
export function MissionControlCard({
  sentence,
  reasoning,
  actionLabel,
  onAction,
}: {
  sentence: string;
  reasoning: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <Card className="max-w-[640px] w-full p-8 flex flex-col gap-6">
      <h1 className="text-h1 font-semibold text-text-primary">{sentence}</h1>
      <p className="text-body-lg text-text-secondary">{reasoning}</p>
      <Button variant="primary" onClick={onAction} className="self-start">
        {actionLabel}
      </Button>
    </Card>
  );
}

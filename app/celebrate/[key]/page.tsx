import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCurrentAgency } from "@/lib/current-agency";
import { CelebrationScreen } from "@/components/celebration-screen";

function nextHrefFor(queue: string[]): string {
  if (queue.length === 0) return "/";
  const [next, ...rest] = queue;
  return `/celebrate/${next}${rest.length ? `?queue=${rest.join(",")}` : ""}`;
}

export default async function CelebratePage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ queue?: string }>;
}) {
  const { key } = await params;
  const { queue: queueParam } = await searchParams;
  const queue = queueParam ? queueParam.split(",") : [];
  const user = await requireUser();

  if (key === "first_client") {
    return (
      <CelebrationScreen
        headline="You have a client. This is a business now."
        subline="That's the moment this whole thing became real."
        nextHref={nextHrefFor(queue)}
      />
    );
  }

  if (key === "first_1000") {
    const agency = await getCurrentAgency(user.id, user.email!);

    const toCents = agency.clients.reduce((sum, c) => sum + c.amountPaidCents, 0);
    const last = agency.clients[agency.clients.length - 1];
    const fromCents = toCents - (last?.amountPaidCents ?? 0);

    return (
      <CelebrationScreen
        headline="$1,000 earned. You built a business — for real."
        subline="No business → a profitable AI agency."
        moneyCounter={{ fromCents, toCents }}
        nextHref={nextHrefFor(queue)}
      />
    );
  }

  notFound();
}

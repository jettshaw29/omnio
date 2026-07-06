import Link from "next/link";

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-8 py-5 border-b border-border">
        <span className="text-body font-semibold text-text-primary">Omnio</span>
        <Link
          href="/login"
          className="bg-pine text-white text-small font-medium px-5 py-2.5 rounded-lg hover:bg-pine-hover transition-colors"
        >
          Start free
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-28 border-b border-border">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
          <h1 className="text-display font-semibold text-text-primary" style={{ lineHeight: "1.1" }}>
            Your first $1,000 client.<br />Step by step.
          </h1>
          <p className="text-body-lg text-text-secondary max-w-lg" style={{ lineHeight: "1.6" }}>
            Omnio guides complete beginners through building and selling an AI service to local businesses — from deciding what to offer to collecting your first payment.
          </p>
          <div className="flex flex-col items-center gap-3 mt-2">
            <Link
              href="/login"
              className="bg-pine text-white text-body font-medium px-8 py-4 rounded-lg hover:bg-pine-hover transition-colors"
            >
              Start free
            </Link>
            <span className="text-small text-text-tertiary">
              Free during early access. No experience required.
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 border-b border-border">
        <div className="max-w-3xl mx-auto flex flex-col gap-12">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-h1 font-semibold text-text-primary">How Omnio works</h2>
            <p className="text-body-lg text-text-secondary">
              Four stages. Omnio tells you exactly what to do at each one.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StepCard
              number="1"
              title="Find your niche and offer"
              description="Omnio interviews you to understand your background, then helps you land on a specific AI service — one that matches your situation and has real demand from local businesses."
            />
            <StepCard
              number="2"
              title="Build the foundation"
              description="You get a brand name, a price, and a live website. Everything you need to look like a real business before you contact your first prospect."
            />
            <StepCard
              number="3"
              title="Get in front of real businesses"
              description="Omnio tells you exactly what makes a qualified prospect, drafts your outreach messages, and walks you through building a list of 25 local businesses to contact."
            />
            <StepCard
              number="4"
              title="Close and deliver"
              description="Omnio generates your sales proposal, preps you for the call, and walks you through delivery — until a real business owner pays you."
            />
          </div>
        </div>
      </section>

      {/* What you'll sell */}
      <section className="px-6 py-20 bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-h1 font-semibold text-text-primary">What you'll actually sell</h2>
            <p className="text-body-lg text-text-secondary">
              Not vague "AI solutions." Specific services that solve obvious, expensive problems for small businesses.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <ServiceCard
              title="AI voice receptionist"
              description="Answers calls, books appointments, and qualifies leads for plumbers, contractors, and home service companies — 24 hours a day."
            />
            <ServiceCard
              title="Appointment booking"
              description="Replaces the back-and-forth for salons, clinics, and local services. Clients book themselves without a phone call."
            />
            <ServiceCard
              title="Lead qualification"
              description="Sorts and follows up with incoming leads automatically. Built for real estate agents, mortgage brokers, and local sales businesses."
            />
          </div>
          <p className="text-body text-text-secondary text-center">
            Omnio helps you choose the right service for your background during onboarding.
          </p>
        </div>
      </section>

      {/* Honest CTA */}
      <section className="px-6 py-28">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-6 text-center">
          <h2 className="text-h1 font-semibold text-text-primary">Join the first wave.</h2>
          <p className="text-body-lg text-text-secondary" style={{ lineHeight: "1.6" }}>
            Omnio is in early access. We&apos;re building with the first group of people who want
            an actual path to their first client — not another course to abandon. As users reach
            their first $1,000, their stories will be here.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="bg-pine text-white text-body font-medium px-8 py-4 rounded-lg hover:bg-pine-hover transition-colors"
            >
              Start free
            </Link>
            <span className="text-small text-text-tertiary">No credit card. No experience.</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-8 py-6 flex items-center justify-between">
        <span className="text-small text-text-tertiary">Omnio</span>
        <span className="text-small text-text-tertiary">Early access · 2025</span>
      </footer>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 bg-surface border border-border rounded-md p-6">
      <div className="flex items-center gap-3">
        <span
          className="text-small font-semibold rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(31, 95, 79, 0.1)", color: "#1f5f4f" }}
        >
          {number}
        </span>
        <span className="text-body font-semibold text-text-primary">{title}</span>
      </div>
      <p className="text-body text-text-secondary" style={{ lineHeight: "1.6" }}>
        {description}
      </p>
    </div>
  );
}

function ServiceCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2 border border-border rounded-md p-5">
      <span className="text-body font-semibold text-text-primary">{title}</span>
      <p className="text-small text-text-secondary" style={{ lineHeight: "1.5" }}>
        {description}
      </p>
    </div>
  );
}

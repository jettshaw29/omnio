import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { JourneyHeader } from "@/components/journey-header";
import { getCurrentAgency } from "@/lib/current-agency";

export default async function ResourcesPage() {
  const user = await requireUser();
  const agency = await getCurrentAgency(user.id, user.email!);

  return (
    <div className="min-h-screen flex flex-col">
      <JourneyHeader brandName={agency.brandName} />
      <main className="flex-1 px-6 py-16">
        <div className="max-w-[680px] mx-auto flex flex-col gap-12">

          <div className="flex flex-col gap-2">
            <Link href="/" className="text-small text-text-tertiary hover:text-text-secondary transition-colors">
              ← Back to Mission Control
            </Link>
            <h1 className="text-h1 font-semibold text-text-primary">How to build what you sold.</h1>
            <p className="text-body-lg text-text-secondary">
              Three AI services Omnio guides you toward — and exactly how to build each one.
              Pick the one that matches your niche.
            </p>
          </div>

          <ServiceGuide
            title="AI voice receptionist"
            forWho="Home service companies — plumbers, electricians, HVAC, contractors"
            whatItDoes="Answers incoming calls 24/7, captures caller info, books appointments, and handles basic questions — so the owner never misses a lead."
            tools={[
              { name: "Synthflow", role: "The AI that answers the phone. No-code, built for beginners.", url: "https://synthflow.ai" },
              { name: "Calendly", role: "Where appointments get booked. Free tier is enough to start.", url: "https://calendly.com" },
            ]}
            timeEstimate="3–5 hours for a working first version"
            steps={[
              "Create a free Synthflow account. Choose 'Inbound receptionist' as the agent type.",
              "Set the agent's name (e.g. 'Sarah from [Client Business]') and paste in the business info: services offered, hours, service area, pricing if they share it.",
              "Connect Synthflow to your client's Calendly link so the AI can offer to book a callback or appointment.",
              "Test it yourself — call the Synthflow number 10 times with different questions. Fix anything that sounds wrong in the script.",
              "Give your client a Synthflow phone number. They forward their main business line to it, or use it as a second number for leads from their website.",
              "Send your client a short Loom video showing exactly how it works and how to check their bookings.",
            ]}
            clientSees="Their phone gets answered every time, leads are captured overnight, and appointments show up in their calendar automatically."
          />

          <div className="border-t border-border" />

          <ServiceGuide
            title="Appointment booking automation"
            forWho="Salons, med spas, clinics, personal trainers, consultants"
            whatItDoes="Replaces phone tag and back-and-forth texts with a booking page clients use themselves. Owner gets notified, reminders go out automatically."
            tools={[
              { name: "Calendly", role: "Booking page clients use to pick a time. Free tier covers most small businesses.", url: "https://calendly.com" },
              { name: "Make.com", role: "Automation layer — sends confirmations, reminders, and follow-ups. 1,000 free operations/month.", url: "https://make.com" },
            ]}
            timeEstimate="2–3 hours for a working first version"
            steps={[
              "Create a Calendly account for your client (or help them set up their own). Add their services, session lengths, and availability.",
              "Customize the booking page with their business name, logo if they have one, and a short description.",
              "In Make.com, build a simple automation: when a booking is created → send a confirmation email/text to the client. Use a free Gmail connection for the email.",
              "Add a second automation: 24 hours before the appointment → send a reminder. This alone cuts no-shows by 30–50%.",
              "Embed the Calendly booking widget on their website, or give them a direct booking link to share on Instagram and Google.",
              "Show them how to view their upcoming bookings and block time off when needed.",
            ]}
            clientSees="Customers book themselves at any hour. The owner stops playing phone tag and gets a clean calendar with automatic reminders."
          />

          <div className="border-t border-border" />

          <ServiceGuide
            title="Lead qualification system"
            forWho="Real estate agents, mortgage brokers, insurance agents, local sales businesses"
            whatItDoes="Captures leads from a form, automatically filters out unqualified ones, and routes the good leads to the owner with everything they need to close."
            tools={[
              { name: "Tally", role: "Free form builder for the lead intake form. No account limits.", url: "https://tally.so" },
              { name: "Make.com", role: "Automation that processes each form submission and routes it.", url: "https://make.com" },
              { name: "Google Sheets", role: "Simple CRM to track all leads. Free, your client already has it.", url: "https://sheets.google.com" },
            ]}
            timeEstimate="2–4 hours for a working first version"
            steps={[
              "In Tally, build a lead intake form. Ask the questions that separate a real prospect from a time-waster — budget, timeline, location, specific need. Keep it under 6 questions.",
              "In Make.com, connect Tally to a Google Sheet. Every form submission creates a new row automatically.",
              "Add qualification logic in Make: if the lead meets the criteria (e.g. budget over $X, timeline under 6 months), send the owner an immediate email with the lead's details. If they don't qualify, send the lead a polite 'not the right fit' response.",
              "Add a column in Google Sheets for lead status: New, Contacted, Qualified, Closed. Show your client how to update it after each call.",
              "Give your client the Tally form link. They add it to their website, Instagram bio, and any ad campaigns they run.",
              "Run 5 test submissions through the whole flow yourself before handing it over.",
            ]}
            clientSees="Every lead gets captured and evaluated automatically. They only spend time on calls with people who are actually ready to buy."
          />

          <div className="bg-surface border border-border rounded-md p-6 flex flex-col gap-3">
            <p className="text-body font-semibold text-text-primary">Not sure which one you built?</p>
            <p className="text-body text-text-secondary">
              Go back to your offer — it describes exactly what service you promised. If you&apos;re still
              unsure, the safest V1 to deliver is appointment booking. It&apos;s the fastest to build, the
              easiest for clients to understand, and the most likely to get you a testimonial.
            </p>
            <Link href="/" className="text-body text-pine hover:underline">
              Back to Mission Control →
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}

function ServiceGuide({
  title,
  forWho,
  whatItDoes,
  tools,
  timeEstimate,
  steps,
  clientSees,
}: {
  title: string;
  forWho: string;
  whatItDoes: string;
  tools: { name: string; role: string; url: string }[];
  timeEstimate: string;
  steps: string[];
  clientSees: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-h1 font-semibold text-text-primary">{title}</h2>
        <p className="text-small text-text-secondary">{forWho}</p>
        <p className="text-body-lg text-text-secondary">{whatItDoes}</p>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-small font-medium text-text-primary">Tools you&apos;ll use</span>
        <div className="flex flex-col gap-2">
          {tools.map((t) => (
            <div key={t.name} className="flex items-start gap-3 bg-surface border border-border rounded-md p-4">
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-body font-semibold text-pine hover:underline flex-shrink-0"
              >
                {t.name}
              </a>
              <span className="text-body text-text-secondary">— {t.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-small font-medium text-text-primary">Time to build:</span>
        <span className="text-small text-text-secondary">{timeEstimate}</span>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-small font-medium text-text-primary">Steps</span>
        <ol className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="text-small font-semibold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(31, 95, 79, 0.1)", color: "#1f5f4f" }}
              >
                {i + 1}
              </span>
              <span className="text-body text-text-secondary" style={{ lineHeight: "1.6" }}>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-surface border border-border rounded-md p-4 flex flex-col gap-1">
        <span className="text-small font-medium text-text-primary">What your client sees</span>
        <p className="text-body text-text-secondary">{clientSees}</p>
      </div>
    </div>
  );
}

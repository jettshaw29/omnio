# The AI Agency Playbook

Status: draft. This is Omnio's actual expertise — the thing that makes the AI a business partner instead of a wrapper around a language model. Every generated recommendation, draft, and piece of Mission Control guidance should trace back to a section here. If the AI says something this document doesn't support, that's a bug.

**How this is meant to be used (ties to `02_TECH_ARCHITECTURE.md` §3):** this is one static document, not a per-user corpus — it doesn't grow, and it's small enough to live in full inside a cached system-prompt block. It confirms rather than contradicts the "no RAG in V1" call: retrieval infrastructure is for large, growing, per-entity document sets. A single ~expert's-worth of knowledge that's the same for every user is exactly what prompt caching is for.

---

## 1. Choosing an Agency Type

The single most common failure mode isn't a bad idea — it's no specificity. "AI agency" is not a business. "AI voice receptionist for dental practices" is.

**Decision tree:**
- Do you already have a relationship, experience, or credibility in an industry? → Specialize there first. Existing trust beats a cold start every time.
- If not, filter candidate niches on three questions:
  1. **Is the pain acute and expensive, in a way the owner already feels?** (A missed call is a missed patient/sale — visceral and countable. "Could be more efficient" is not.)
  2. **Is the buyer reachable by a stranger?** Owner-operated local and small B2B businesses with a public website, phone number, or social presence. Enterprise buyers behind procurement are not a beginner's market.
  3. **Is the deliverable buildable in under two weeks with existing AI tools** (voice agents, chatbot builders, workflow automation platforms) by one person? If it requires a custom model or a dev team, it's not a first offer.

**Beginner-viable niche/service pairs (starting points, not a limit):**
- AI voice receptionist for home services, dental, or med spas (recovers missed-call revenue)
- AI lead-qualification chatbot for real estate or home services websites
- AI review-response and reputation management for local multi-location businesses
- AI content repurposing (one video/podcast → weeks of social posts) for coaches and creators
- AI outbound appointment-setting for B2B service businesses
- Internal workflow automation (invoice processing, CRM entry, email triage) for small agencies or e-commerce operators
- AI support-deflection chatbot for e-commerce or small SaaS

**Caution:** some of these (AI chatbots for real estate especially) are already heavily pitched as of 2026. That's not a reason to avoid them, but positioning (§4) has to work harder to stand out — generic "AI chatbot" pitches in an oversaturated niche get ignored.

## 2. Identifying Ideal Clients

A good first ICP (ideal client profile) passes all four filters:
- **Can actually pay.** An established, revenue-generating business — not a pre-revenue startup.
- **Feels the pain without being told.** They already know they're losing something (calls, leads, hours); you're not educating them that a problem exists.
- **Decides fast.** An owner-operator who can say yes on a call, not a committee.
- **Is a repeatable shape.** If this client works, ten more just like them exist — that's what makes the second and third sale faster than the first.

## 3. Service Selection

Productize one clearly named service with a fixed scope and timeline. "Custom AI solutions" doesn't sell because a stranger can't picture what they're buying. "AI Missed-Call Recovery System — live in 10 days" does. A named, repeatable service is also what makes delivery (§17) fast and portfolio-building (§8) possible: build the template once, customize per client, rather than reinventing scope every time.

## 4. Positioning

Formula: **"I help [specific niche] [achieve a specific, measurable outcome] using [category], without [the thing they're afraid of]."**

Example: *"I help home service companies stop losing jobs to missed calls with a 24/7 AI phone assistant — without hiring another receptionist."*

The failure mode is leading with the technology ("AI-powered solutions") instead of the outcome. Nobody wakes up wanting AI. They wake up wanting fewer missed calls.

## 5. Pricing Strategy

- **Price the outcome, not the hours.** Hourly pricing signals uncertainty and punishes the agency for getting fast/efficient. Fixed-price productized packages price the value delivered.
- **Structure the first deal to reach $1,000 in one close, not ten.** This is the single highest-leverage pricing decision for a new agency: if the first offer is priced at $1,000–$2,000 with a 50% deposit, one signed client crosses the entire first-milestone finish line at the moment of signing — before any work is even delivered. Pricing too low (chasing a first "yes") is the most common way beginners make reaching $1,000 needlessly slow.
- **Deposit structure:** 50% upfront / 50% on delivery for packages over ~$1,000; full payment upfront for anything smaller. This funds the work and filters out non-serious buyers.
- **Anchor to the client's cost of the problem, not your build time.** "You're losing an estimated $3,000/month to missed calls; this is a one-time $1,500 fix" reframes price as obviously cheap relative to the problem.
- 2–3 tiers are fine (Starter / Pro / Custom) but exist to anchor the middle option, not to create real decision paralysis for a business evaluating their very first AI vendor. Push the one you want them to pick.

**Decision tree — which structure for which client:**
- Confident, established buyer, clear budget → fixed price, 50/50 deposit.
- Hesitant, first-time-with-AI buyer → smaller paid pilot (e.g. one location, one use case) with a clear path to the full package after results show.
- Repeat/warm referral → can skip the pilot, go straight to full package — trust is already partially transferred.

## 6. Offer Creation

An offer = Niche + Problem + Productized Solution + Price + Guarantee. The guarantee matters more for a beginner than an established agency: a stranger is being asked to trust someone with no track record, so risk reversal (e.g., "if this doesn't book at least 5 extra appointments in 30 days, the remaining balance is waived") does the trust-building work that a portfolio would otherwise do. Pair with a fast turnaround (1–2 weeks) as a differentiator against slow traditional dev shops.

## 7. Website Structure

Because Omnio ships one template, not a builder, this is literally the content spec the website-generation AI fills in, in this order:

1. **Headline** — the outcome, not the technology.
2. **Subheadline** — who it's for and how it works, one line.
3. **The problem** — agitate the specific, felt pain (use numbers where possible).
4. **The solution** — three simple steps, no jargon.
5. **Proof** — portfolio, demo, or case study (see §8 for what to show before real clients exist).
6. **Pricing** — visible, not "contact for quote." Hidden pricing reads as expensive or evasive to a first-time buyer.
7. **Guarantee** — the risk reversal from §6.
8. **One call to action**, repeated at top and bottom. Never two competing CTAs.

## 8. Portfolio Strategy (before you have real clients)

The classic chicken-and-egg: clients want proof, but proof requires clients. Legitimate ways out:
- Build 1–2 projects for a "founding client" at a steep discount or free, explicitly in exchange for a case study and testimonial — a real, common, ethical trade.
- Self-demo: build the system for yourself or a willing friend's business and record it working. Proof of capability doesn't require a paying client, just a working example.
- Never fabricate results. This isn't just an ethics position — it's also the fastest way to lose the trust that Article VI of the Constitution says compounds and is nearly impossible to earn back.

## 9. Lead Generation

For a solo beginner with no existing audience, ranked by speed-to-first-client: **cold email > cold DM > local/phone outreach > content/inbound.** Content and inbound work long-term but are the slowest possible path to a first client, so they're not the right default focus pre-$1,000. List sources: local business directories, Google Maps, LinkedIn Sales Navigator, and niche-specific associations or directories.

## 10. Cold Email

**Deliverability, said plainly:** a brand-new sending domain gets flagged as spam if used for a sudden volume of cold email. This isn't optional infrastructure — it's the difference between outreach that lands and outreach that's invisible. Use a separate sending domain from the main site, ramp volume gradually (roughly 20–30/day increasing over two weeks), and set up SPF/DKIM/DMARC before sending anything at volume. Omnio doesn't build or automate this (see product non-goals) but every user needs to hear it before their first send, not after their first send fails silently.

**Message structure:** specific, personalized opener (something real about their business) → the specific problem → the solution in one line with a concrete benefit → low-friction CTA ("worth a quick 10 minutes?"). No attachments or links in a first cold email — both are spam triggers. Follow up 3–4 times over two weeks, each touch adding a new angle, never just "just bumping this."

**Most common mistake:** leading with "I use AI to..." instead of leading with their problem.

## 11. Cold DM

Works best on LinkedIn for B2B niches and Instagram for local owner-operators who run their own social accounts. Same structure as cold email, shorter and more casual. Engaging with their content first (a genuine comment) before DMing meaningfully improves response rate over a cold-open DM. The most common failure is sending the identical templated DM to everyone — it reads as spam and gets accounts blocked or ignored at scale.

## 12. Discovery Calls

Structure: rapport (2 min) → discovery questions about their current process and pain, letting them talk roughly 70% of the time (5–10 min) → present a solution mapped specifically to what they just said → clear next step.

**Most common mistakes:** pitching before understanding the specific situation; talking more than listening; not confirming budget and decision-making authority early enough to know if this call can actually close.

## 13. Sales Process

End to end: Lead → Discovery call → Proposal → Follow-up → Signed contract → Deposit paid. The biggest lever in the whole process is speed: proposals sent within 24 hours of the call, while the prospect's urgency is still high, close at meaningfully higher rates than proposals sent days later.

**Objection decision tree:**
- Price objection → reframe to the cost of the problem (§5), or offer the smaller pilot structure instead of discounting the full offer.
- Trust objection ("I've never worked with an AI agency / with you") → offer the guarantee (§6) or the smaller pilot (§5) rather than pushing harder on the same offer.
- Timing objection ("maybe next quarter") → reframe the cost of waiting (what the missed calls/leads are costing them every month they delay), don't just schedule a follow-up and drop it.

## 14. Proposal Creation

One page: recap their problem in their own words from the call → the proposed solution → what's included and the timeline → the investment (price) → the guarantee → one simple next step (reply to confirm, or a deposit link). A proposal that feels hand-written to their specific call outperforms a generic template every time — reference specifics they actually said.

## 15. Contracts

Minimum viable contract for a first client: scope of work, timeline, payment terms and due dates, what happens if the client is late providing access/info the work depends on, cancellation/refund terms, and who owns the delivered system. A simple, clear one-page agreement beats an intimidating lawyer-drafted one for a first engagement — the goal is mutual clarity, not legal maximalism.

## 16. Client Onboarding

Checklist: a welcome message that sets expectations, a single list of everything needed (logins, brand assets, process documentation), a kickoff call, a confirmed timeline, one point of contact. The most common mistake is starting build work before the client has actually provided what the work depends on, then having the resulting delay read as the agency's fault.

## 17. Project Delivery

Communicate progress proactively — a scheduled midpoint check-in, not silence followed by a reveal. Test with real scenarios before handoff. Train the client on how to use and monitor the system themselves. Provide simple handover documentation.

**Most common mistakes:** scope creep (quietly building things never agreed to, which delays the promised timeline) and the opposite failure, going dark during the build and letting the client's anxiety build unaddressed.

## 18. Collecting Testimonials

Ask immediately after a delivered win, while enthusiasm is highest — not weeks later. Ask a specific, guided question ("What result surprised you most?") rather than "could you leave a review," which produces generic or no responses. Get a specific number or result if the client will share one, and get explicit permission to use their name and logo.

## 19. Getting Referrals

Ask at the moment of highest satisfaction — right after a good result, not as a separate cold ask later. Make the ask specific and easy to act on: "Do you know another [niche] owner who's frustrated by [the same problem]?" rather than "know anyone who needs this?" A light incentive (a discount on the next month, a referral bonus) can help once value is already proven — leading with the incentive instead of the result undermines it.

## 20. Retainers

The moment of delivery is the moment to offer ongoing monitoring, maintenance, and optimization as a monthly retainer — this is what turns one-off project revenue into the recurring revenue that makes an agency an actual business rather than a string of one-off gigs. Position it naturally: "most clients keep me on to monitor and improve this monthly for $X," not as a hard upsell.

## 21. Scaling & Hiring

Knowledge-only for V1 — the product's Scale stage is explicitly not built yet (see `00_V1_PRODUCT_SPEC.md` §7), but the AI should already know this if a user asks ahead of schedule. Repeat the same offer with more clients in the same niche before diversifying into new services. Systemize delivery into templates/SOPs before hiring anyone. Hire for delivery capacity first (a contractor or VA) once demand exceeds solo bandwidth — keep sales in the founder's hands the longest, since a new agency's sales process is rarely repeatable enough to hand off early.

## 22. Common Beginner Mistakes (consolidated)

- Choosing "AI agency" as the niche instead of a specific service for a specific audience (§1).
- Vague, technology-first positioning instead of outcome-first (§4).
- Underpricing out of confidence issues, or defaulting to hourly (§5).
- Waiting for a "perfect" portfolio or website before starting outreach (§8).
- Mass, unpersonalized outreach that burns a new domain's deliverability (§10).
- Talking more than listening on discovery calls (§12).
- Slow proposal turnaround that lets deal urgency evaporate (§13).
- No contract and no deposit, leaving the agency exposed to scope creep or non-payment (§15).
- Going dark during delivery instead of proactive updates (§17).
- Never asking for a testimonial or referral, leaving free growth on the table (§18, §19).

## 23. Decision Trees (index)

All decision trees live inline, next to the decision they inform, so the AI can pull the relevant one without loading the whole document:
- Niche selection — §1
- Pricing structure by buyer confidence — §5
- Sales objection handling — §13

## 24. Cross-Cutting Best Practices

The rules that show up in more than one section, distilled:
1. **Specificity beats breadth**, at every layer — niche, offer, outreach message, proposal.
2. **Outcome beats technology** in every piece of language a client sees.
3. **Speed compounds** — fast proposals, fast follow-ups, fast delivery updates all outperform "eventually good" versions of the same thing.
4. **Price and structure the first deal so a single close reaches the goal**, don't rely on volume to get there.
5. **Ask for proof (testimonials, referrals) at the moment of highest satisfaction**, never as an afterthought later.
6. **Never fabricate a result.** Trust is the actual product being sold in every one of these interactions.

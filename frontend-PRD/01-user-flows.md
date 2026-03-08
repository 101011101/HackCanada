# User Flows

---

## Who this is for

An urban individual — balcony, rooftop, backyard — who has heard about MyCelium and opened the app for the first time. They don't know what to grow. They may be skeptical. They have no account.

---

## The lifecycle in one sentence

A farmer joins once, gets assigned a crop, grows it, reports back, and gets a new assignment. That loop repeats until they stop.

---

## Phase 1 — Joining the network

### Landing

The user opens the app. They see a dark screen with a live network of nodes — dots connected by lines, one dashed node that represents them. The message is simple: *become a node*. Below it, live stats: how many growers are active, network health, nearby hubs.

Two choices:
- **"Enlist my plot"** — they're ready, go straight to setup.
- **"What would I grow?"** — they want to see value first, go to suggestions.

---

### Suggestions (optional)

The user enters their plot size. The app immediately shows them a ranked list of crops they could grow — no account, no form, no commitment. Each card shows the crop name, a match percentage, why it fits, and an estimated yield per cycle.

This is purely informational. Nothing is saved.

At the bottom: **"Join with [top crop]"** — this carries their plot size into setup and skips the redundant fields.

They can also skip this entirely and go straight to setup from the landing screen.

---

### Setup

A short, four-step form. Each step is one concept.

**Step 1 — Plot basics.** Name their farm, tap "Use GPS" to set location, confirm plot size and type (balcony / rooftop / backyard / community).

**Step 2 — Soil.** Enter pH and moisture. If they have a soil meter, they can photograph it and the app reads the values. If they don't have one, they tap "Use defaults" and move on.

**Step 3 — Climate.** Enter temperature and humidity. They can tap "Use my location" and the app pulls current weather automatically.

**Step 4 — Resources.** Choose their gear level (basic / intermediate / advanced) and monthly budget (low / medium / high). Two taps, done.

A review screen shows everything with edit links. They tap **"Connect to network."**

The app sends their data, shows a brief "Connecting..." state, and lands them on their dashboard with their first crop assignment.

---

## Phase 2 — Growing (repeats every cycle)

A cycle lasts as long as the assigned crop takes to grow — anywhere from 2 to 12 weeks depending on the crop.

### Dashboard

The dashboard shows the farmer one thing clearly: **what they are growing and what to do about it**.

At the top: the assigned crop, the target yield, and how many days into the cycle they are.

Below that: a task list. Four to five ordered steps — seed, water, maintain, harvest — each with what tool is needed and roughly how long it takes. Tasks can be ticked off as they go.

If there's a risk flag from the network (frost warning, overwatering risk), it appears as a banner above the tasks.

At the bottom: the expected yield for this cycle.

As the end of the cycle approaches (last 3 days), a prompt appears: *"Cycle ending soon — log your harvest."*

---

### Logging conditions (anytime)

The farmer can open the Update screen whenever they want to report what they're observing. They enter their current soil readings — pH, moisture, temperature, humidity. These sync to the backend and update the network's model of their plot.

They can also mark tasks as done, in progress, or skipped. This stays local on their device.

---

### End of cycle

When the cycle ends, the farmer enters how much they actually harvested — a number in kilograms. They tap **"Get my next assignment."**

The app triggers a re-optimisation across the whole network, then fetches the farmer's new crop assignment. The dashboard refreshes with the new crop, a new task list, and a new cycle countdown.

The loop begins again.

---

## Phase 3 — Leaving

### Voluntary leave

In the Profile screen, the farmer can tap "Leave the network." A confirmation dialog warns them that their local data will be cleared. If they confirm, the app resets to the landing screen and they are treated as a new user.

Their farm data remains in the network's backend — it is not deleted. If they rejoin later, they start fresh with a new farm entry.

### Voluntary pause

The farmer can set a pause until a specific date. While paused, the dashboard shows a paused state and the update screen is disabled. When the date passes, the app resumes normally.

### Just stopping

If the farmer simply stops opening the app, nothing happens on either end. Their node stays in the network. No account to expire, no session to time out.

---

## Navigation map

```
/                  Landing
/suggestions       See what I'd grow (optional, no account)
/setup             Join the network (4-step form)

/dashboard         My current assignment (default after joining)
/update            Log conditions + task progress
/wallet            Hub Currency balance + log a delivery
/profile           Farm details + leave the network
```

All screens from `/dashboard` onward require the farmer to have joined. Anyone who hasn't is sent back to `/`.

---

## Key rules

- No account. No password. No sign-in screen. Identity is the farm ID stored locally on the device.
- Suggestions are stateless — nothing is saved unless the user proceeds to setup.
- Optional fields (soil meter readings, humidity) have "use defaults" or "auto-fill" paths so no one gets stuck.
- Every screen that loads data must handle loading, error, and empty states — farmers use this on a phone in a garden.

<!--
Generated file. Do not edit directly.
Source: ../pikappapp.html
Regenerate with: node scripts/html-to-md.mjs
-->

---
title: "Pi Kapp App"
source: "pikappapp.html"
url: "/pikappapp"
category: "Design"
description: "A mobile application concept for undergraduate fraternity members to track milestones and stay connected with their organization."
---

# Pi Kapp App

## Description

A mobile application concept for undergraduate fraternity members to track milestones and stay connected with their organization.

## Metadata

- Category: Design
- Role: UX Designer
- Client: Pi Kappa Phi
- Type: Concept · Product Design

## Section Headings

- Three users, one flow
- Wireframes & information architecture
- Inheriting the system
- Where the value lives
- When the static screen becomes a real artifact
- What the concept clarified

## Body Copy

A native mobile concept for a brotherhood that didn't have one. Built to serve a freshman tracking first milestones and a senior running a chapter, inside the same flow.

An app for a brotherhood that didn't have one, sharing a single flow across very different members.

Pi Kappa Phi is a national fraternity with collegiate members spanning a four-year arc. The concept needed to land for three distinct users without splintering into three apps:

Two constraints shaped everything that followed. The visual system had to inherit the existing brand: deep blue, gold star, the tessellated hex pattern that runs through the print materials. And the data layer had to plug into iMIS, the national member database, so the app could pull rank, term, and chapter assignment without duplicating records.

Hand sketches first, then a sitemap that pinned down the four-tab shell.

Research looked at apps that turn long-arc goals into short-loop motivation: progress bars, ranked completion percentages, and term-bounded streaks. The pattern that translated cleanest to a fraternity context was a per-term progress bar paired with a ranking against the chapter. Visible to the member, comparable across peers, and explicitly time-bounded so it resets each semester.

The sitemap settled on a four-tab shell: Member (your dashboard), Chapter (your house), National HQ (Pi Kapp at large), and Settings. Same shell for everyone; what changes is the density of what's already done.

The brand was set. The job was making it feel like an app, not a printed brochure.

The login and welcome screens lean on Pi Kappa Phi's existing visual system. Form fields, button shape, and bottom navigation are the only places where the app gets to add new vocabulary; everything else inherits. The hex pattern softens behind the splash, the gold star becomes the loading mark, and the deep blue carries the chrome on every screen.

The system that came out of that work codified the inherited brand into a working vocabulary: color, type, mark, pattern, and the handful of components everything else is built from. Five tokens, one feeling.

A progress bar and a ranked percent create the loop a member opens the app to see.

The Member screen is home base: full-term progress, completion percentage, current rank against the chapter (21/45 in the mock), and the bulletin feed below. Tapping a milestone opens its task list, with one task expanded inline showing description and due date; siblings stay collapsed until tapped. Progressive disclosure keeps the dashboard from buckling under a term's worth of detail.

This is the flow that has to work for all three personas. A freshman with two completed tasks and a senior with twenty both land on the same screen. The hierarchy is what changes.

The comp held the design language. The prototype tested whether it held under interaction.

A high-fidelity comp answers what something looks like. It can't answer what it feels like to use. So I rebuilt the Member dashboard as a working concept with single-file React, Tailwind, and Framer Motion. The prototype tested whether gold-on-blue stayed legible at thumb scale, whether the milestone expand felt like progress instead of a state change, and whether the gold star earned its keep as something more than a mark.

The polish moments are where the brand stops being decoration and starts being function. The avatar gets a thin gold progress ring that reflects the semester at a glance. Tab switching uses spring physics, not ease-in-out. The difference between premium and templated almost always lives in the motion curve. Checking off a task pops a single gold star particle that scales, lifts, and fades. Same star that loads the splash. Same star that sits at the center of every empty state. One asset, three jobs.

What the prototype clarified, beyond what any flat comp could, was that the system had room to breathe. The same five tokens that built the splash also built the empty state, the tap feedback, and the progress ring. The brand wasn't a decoration layer applied at the end; it was the structure underneath.

A constrained brand system was a frame, not a ceiling. The harder question was hierarchy: how to surface enough of the long-arc journey to motivate a freshman, without overwhelming a senior who's already most of the way through. The answer wasn't different screens for different users. It was the same flow, ranked.

## Lists And Tags

- A freshman just starting rush, tracking their first milestones.
- A junior on the executive board running chapter responsibilities.
- A graduating senior closing out capstone classes.

## Images

- Pi Kapp App hero phone mockup: images/pikapp-hero.png
- Pi Kapp App hand-drawn wireframes: images/pikapp-wireframes.png
- Pi Kapp App sitemap: images/pikapp-sitemap.png
- Pi Kapp App login and splash screens: images/pikapp-screens-1.png
- Pi Kapp App chapter status, bulletin, and milestone screens: images/pikapp-screens-2.png
- Pi Kapp App design system board: color palette, type pairing, gold star at three sizes, hex tessellation, and component states: images/pikapp-app-designsystem.png
- Pi Kapp App member dashboard with progress bar and bulletin: images/pikapp-member.png
- Pi Kapp App milestone detail with one task expanded: images/pikapp-task-expand.png
- Pi Kapp App prototype: Member dashboard with avatar progress ring, semester bar, rank chip, and chapter bulletin feed: images/pikapp-app-hero.png
- Pi Kapp App prototype: a task being checked off with the gold star particle bursting from the gold checkbox: images/pikapp-app-burst.png
- Pi Kapp App prototype: Chapter tab empty state with the gold star centered on deep blue with hex tessellation: images/pikapp-app-emptystate.png

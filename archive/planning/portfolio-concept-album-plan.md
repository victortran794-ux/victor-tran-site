# Archived Source Note — Portfolio Concept Album Plan

Status: Archived / superseded.

This file is a historical source note. The active direction is now `../../PORTFOLIO_DIRECTION_BRIEF.md`. Do not treat this file as the current implementation plan unless Victor explicitly reopens it.

---

# Portfolio Direction — Concept Album with Quiet Stagehands

A synthesis of two inputs:
1. A close read of the "VT" Spotify playlist (95 tracks)
2. Microsoft Design's *A Simplified System* article (Copilot Design System)

The portfolio is a **concept album**. The navigation is a **quiet stagehand**. The album is loud and theatrical; the stagehand is silent and ambient. That tension is the whole design.

---

## What the playlist actually shows

Beyond the obvious pop-punk / emo layer, the playlist has five threads that matter for the portfolio:

- **Musical theater is huge.** Come From Away, Aida, La La Land, Hedwig, Kinky Boots, Hadestown, Mamma Mia, Alice By Heart, HSM2, Sia's Annie cover. This is probably the single strongest thread and the easiest to miss.
- **Electronic / festival-melodic.** ODESZA (×2), Flume (×2), Madeon (×2 — "Home" double-saved), M83 Midnight City, Zedd, Chainsmokers, Subtronics, CloZee, GRiZ, Rezz, Disclosure, Sullivan King, Kai Wachi. Deep shelf, from indie-electronic to dubstep.
- **Lady Gaga as a pillar.** Applause, Venus, Chromatica I + II + Alice + 911, Vanish Into You. Multiple *Chromatica* interludes — only matters if you care about albums-as-concepts.
- **Video game / animation OSTs.** Ori and the Blind Forest, Legend of Korra, Tarzan, Bumblebee. Cinematic, scored, sincere.
- **Recent adds lean art-pop.** Lorde *Virgin*, AURORA, Gaga *MAYHEM*. Current Victor is more conceptual / minimal than 2008 Warped Tour Victor — that's where the surface polish should land.

Other live threads: pop-radio gloss (Maroon 5, Taylor's Version, Avril, Miley), indie-folk yearning (Lord Huron ×2, Swell Season, Young the Giant), and the **remaster impulse** (Taylor's Version, FOB doing Thriller, Paramore Live at Red Rocks, Downtown Fiction covering Nicki — the playlist *celebrates* re-recording).

## What the Microsoft article gives us

Most of the article is over-engineered for a personal site. Three ideas are portable:

- **Cognitive rhythm** — exploration vs. focus. The site can deliberately support both modes.
- **Throw-and-catch continuity** — no dead-ends, hand off between surfaces.
- **Ambient, not interrupting** — a small persistent something that travels with the visitor.

Skip the rest (the four-surface architecture, system rhetoric, and especially the Microsoft visual register — it's at odds with the playlist).

## The fusion

| From the music | From the article | Becomes |
|---|---|---|
| Album + tracklist | Throw-and-catch | Autoplay sequencing between case studies |
| Acts / scenes | Cognitive rhythm | Lobby mode vs. Show mode |
| Remaster philosophy | Continuity | Versioned project pages |
| Now-playing footer | Ambient persistence | Now-playing chip across the site |
| Crossfade transitions | Ambient continuity | Color seams between projects |

---

## The ten moves

### 1. Two reading temperatures
The site has a *Lobby* mode (exploration: tracklist, hover-rich, sampling allowed) and a *Show* mode (focus: inside a case study, wide, hushed, one thing at a time). The shift between them is the cognitive-rhythm move. Lobby is dense and playful; Show is scored and patient.

### 2. Landing page = album cover + tracklist
Hero image or designed mark up top. Below it, projects laid out like a Spotify tracklist — number, title, year-as-duration, small "E" badge for the spicier ones, hover-preview of a single key image. This single move communicates the whole metaphor before anyone reads a word.

### 3. Persistent "now playing" chip
Bottom-corner, always there, never demanding: `03 / 09 — IBM Cloud Console` with a thread-thin progress bar tied to scroll position. Click to skip. The stagehand.

### 4. Throw-and-catch between projects
No dead-ends at the bottom of case studies. The next project's hero crossfades in, the accent color shifts, the now-playing chip updates. The album keeps playing.

### 5. Interludes between projects
Short B-sides — a doodle, a process gif, a one-paragraph essay, a saved meme. Like *Chromatica I* bridging into *Alice*. Keeps the experience continuous instead of project-1 / hard-cut / project-2, and lets real personality live somewhere that isn't a case study.

### 6. Palette: neon melancholy, one bubblegum accent
Deep navy/violet base, soft bloom, pastel-into-saturated gradients, one Chromatica-pink accent per project that fades to the next project's color at the crossfade. *Not* Microsoft-neutral, *not* Hot Topic black-and-red — the Madeon *Adventure* / Flume *Palaces* / ODESZA *The Last Goodbye* / Lorde *Virgin* register. Cinematic, recent, art-pop.

### 7. Type: theatrical display + art-pop body
Headlines in a condensed or wide-stance display (Playbill / band-poster energy — Tusker, Druk, GT Sectra Display). Body in something clean and 2025. The pairing is what holds Phil Collins and August Burns Red on the same playlist.

### 8. About page = Playbill
- **Director's note** (your story, short)
- **Cast** (collaborators, mentors)
- **Setlist** (favorite projects, ranked)
- **Liner notes** (tools, fonts, the actual VT playlist embedded)
- **One confessional list** — "7 things I'll fight for in a design review" — because that's the literal form *7 Things* and *I'd Do Anything* are written in.

### 9. Show one "remaster"
Pick one project and present it as v1 / v2 / *Victor's Version*. Versions side-by-side, what changed, why. Almost no portfolio does this — and it lines up with your actual *Those You've Known* remaster work, so the credibility is built-in.

### 10. One opt-in scored moment
A toggle in the now-playing chip: ambient audio plays through the site. Default off. The Ori / Korra / Tarzan sincerity, made explicit but never imposed.

---

## Where to start

**If you do one thing:** build the tracklist landing page + the now-playing chip together. Those two communicate the entire concept-album-with-stagehand metaphor in one beat. Everything else (interludes, remaster, Playbill About, crossfade transitions) can be added project-by-project without a redesign — they're additive.

**If you do two things:** add the throw-and-catch on the bottom of one case study. That proves the album-keeps-playing instinct works before you commit it to every page.

---

## What to skip (deliberately)

- Full Hot Topic black-and-red palette. (One earlier draft pushed this; the rest of the playlist overrides it.)
- Microsoft-neutral corporate polish. (Drains personality.)
- MySpace-era pastiche taken literally. (The good parts of MySpace — listing, social warmth, over-personalization — survive as form choices, not visual ones.)
- The Microsoft article's four-surface architecture. (Over-engineered for a personal site.)
- Mandatory audio. (Sincere scored moments only work opt-in.)

---

## Open questions for you to ponder

1. Does the album metaphor hold up across all your current case studies, or do some resist tracklist treatment?
2. Which project deserves the *remaster* treatment first?
3. How much of the Playbill About is comfortable vs. too vulnerable? (Director's note is the test — too short feels arch, too long feels indulgent.)
4. Is opt-in audio worth the implementation cost, or is the visual "scoring" (palette, transitions) enough?
5. Does Lobby vs. Show actually need two visual systems, or is it just one system in two temperatures (denser/sparser, brighter/dimmer)?

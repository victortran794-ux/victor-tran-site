# IBM Cloud public supporting-image manifest

Last reviewed: 2026-08-10

## Publication boundary

The case study uses the eleven artifacts below. They come from the supplied Figma Updates file or from the documented derivatives listed here. Customer names, participant identities, account or resource IDs, credentials, private URLs, internal metrics, and sole-authorship claims remain excluded.

The current story is grounded in Victor's 2026-08-11 raw-note capture. Event Notifications is framed as his first assigned end-to-end research and design process, followed by concept testing. The flow is proposed and tested work, not a claim of shipment. Monitoring and IBM Cloud Logs are described as review and adaptation explorations, while the published evidence remains generalized or sanitized. The illustration method remains explicitly collaborative.

## Narrative source

- Raw-note capture: `C:\Users\Victor\Documents\Website Items\Portfolio Reviews\2026-08-11\IBM_CLOUD_RAW_NOTE_CAPTURE_2026-08-11.md`
- Monitoring framing: first major heuristic review of the specific Monitoring product, using an established evaluation path while already familiar with Observability more broadly.
- IBM Cloud Logs framing: IBM Cloud Logs was based on Coralogix's white-label product. Victor's Figma work explored IBM product conventions and scoped manual overhaul work. Explored states are not automatically shipped states.
- Illustration framing: collaborative workgroup, early Sketch-to-Figma trial, co-design and contribution across concepts, reusable components, guidance, documentation, review, light-mode adaptation, and mentoring.
- Closing reflection: research and exploration can save time by reducing uncertainty and uncovering valuable information, while visual craft can create clarity and moments of delight.

## Reviewed artifacts

### Event Notifications flow

- `images/ibm-cloud-event-flow-details.png`
  - Source: Figma node `6:7102`
  - Public use: authentic Details-step screen, used as the primary workflow image
  - Dimensions: `1024 × 656`
  - SHA-256: `48f8afd7a128bb8cb50dd7837475a3fc97b4daf33a47f7c940a7e3dcb731e8af`

- `images/ibm-cloud-event-flow-condition-empty.png`
  - Source: Figma node `6:7107`
  - Public use: authentic empty-condition state
  - Dimensions: `1024 × 656`
  - SHA-256: `d3c6552adda082a1a6bd3f8c0330207b21383168f12198045c66af7784fc20f3`

- `images/ibm-cloud-event-flow-condition-compound.png`
  - Source: Figma node `6:7108`
  - Public use: authentic compound-condition state
  - Dimensions: `1024 × 656`
  - SHA-256: `416ccce17c3ff145374f4f8b9d279ed7fdeed96e6ce840968308b0f3bed74224`

### Event Notifications research and component

- `images/ibm-cloud-research-framing.png`
  - Source: Figma node `6:8632`
  - Derivative: sample-size metric removed from the white background; role cards and research questions preserved
  - Public label: `Research framing · Sanitized source`
  - Dimensions: `1024 × 324`
  - SHA-256: `71c0dc8da093d0b2c3360614b0aa41f527c0d79f52f4779315f167990ae1ba6a`

- `images/ibm-cloud-research-findings.png`
  - Source: Figma node `6:8633`
  - Public use: authentic anonymous findings panel, split from the adjacent framing image
  - Dimensions: `1024 × 304`
  - SHA-256: `4b789a00f8e4f298e6e40f8635bb02ea1b5533312becd5b32338cc9e689d08cf`

- `images/ibm-cloud-card-component-design.png`
  - Source: Figma node `6:8635`
  - Public use: Victor's high-fidelity component work, secondary to the full flow
  - Dimensions: `1024 × 640`
  - SHA-256: `50ba0a8dcf0c784584ec44b345b21256a2d5195491dd276bd859f47ea39c72c9`

### Technical environment

- `images/ibm-cloud-routing-architecture.png`
  - Source: Figma node `6:7238`
  - Public use: small technical-environment diagram near the opening
  - Dimensions: `1024 × 768`
  - SHA-256: `606ee4e19741eead6c0b545254b4858c4bf59880ae93f85a970bcad9859b8bd3`

### Visual systems

- `images/ibm-cloud-concept-to-final.png`
  - Source: Figma node `6:8626`
  - Derivative: unrelated board material remains excluded; 40 pixels of bottom breathing room were added so the construction studies are not cut low
  - Public label: `Concept to final · Edited source crop`
  - Dimensions: `820 × 360`
  - SHA-256: `a04c3acdcac03f6acbe79a097f013e6efb17506e58d356ef0e659afb3181d3dd`

- `images/ibm-cloud-visual-system-foundations.png`
  - Source: Figma node `6:8838`
  - Public use: shared base, shadow, color, gradient, and lighting rules
  - Dimensions: `1024 × 350`
  - SHA-256: `60b5f263629b627268815f79d7e758f0287605bdc556a2b7e8a64727c5884420`

- `images/ibm-cloud-isometric-compositions.png`
  - Source: Figma node `6:7278`
  - Public use: composition range built with the shared isometric method
  - Dimensions: `1024 × 320`
  - SHA-256: `00811e67c5336b8874507aff2261ae546c2b1bc16da06bfdb7fcfdd09aec4cb5`

- `images/ibm-cloud-service-icons.png`
  - Source: Figma node `6:7111`
  - Derivative: one-pixel export boundary removed from the bottom edge; icon pixels remain unchanged
  - Dimensions: `1024 × 292`
  - SHA-256: `123801a037b685a053d9bfe0fd3ac706b0815fb00923d93b35a9286e04c20095`

## Claim boundaries

- Describe Event Notifications as Victor's first assigned end-to-end research and design process, with product-manager and design-lead collaboration.
- State that the alternative was proposed and concept-tested. Do not claim the original flow was defective or that the alternative shipped.
- Present the authentic flow as the main Event Notifications evidence and the high-fidelity component as supporting work.
- Present the Monitoring work as a heuristic evaluation of a specific product, not Victor's introduction to Observability generally.
- Describe IBM Cloud Logs accurately as based on Coralogix's white-label product. The Figma explorations tested IBM consistency and scoped manual work; they do not prove every explored state shipped.
- Do not use the phrase `clearest example`.
- Do not imply Sysdig Secure or IBM Cloud Logs are release context for Event Notifications.
- Keep the technical diagram contextual and visually subordinate.
- Keep anonymous research evidence attached to Event Notifications.
- Describe the illustration system as a collaborative workgroup and reusable method-building effort rather than Victor's sole ownership of IBM Cloud's visual language.

## Required verification

- Regenerate public Markdown with `node scripts/html-to-md.mjs`.
- Start a local HTTP server before the browser contract. The tested command is `SITE_URL=http://127.0.0.1:38201 node scripts/check-ibmcloud-browser.mjs`.
- Run `node scripts/check-ibmcloud-hiring-cut.mjs` and the full repository preflight.
- Check 390px, 768px, and 1440px in Light and Dark modes.
- Obtain Victor's explicit approval before commit, push, PR, merge, or deployment.

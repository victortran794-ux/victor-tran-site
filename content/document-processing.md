<!--
Generated file. Do not edit directly.
Source: ../document-processing.html
Regenerate with: node scripts/html-to-md.mjs
-->

---
title: "Designing the trust layer for AI document processing"
source: "document-processing.html"
url: "/document-processing"
category: "Product Design / AI Workflow Design"
description: "A product design case study about designing an accuracy evaluation workflow for AI document processing in Watson Orchestrate."
---

# Designing the trust layer for AI document processing

## Description

A product design case study about designing an accuracy evaluation workflow for AI document processing in Watson Orchestrate.

## Page Intro

Watson Orchestrate’s document processing capabilities helped teams automate work across business documents like invoices, purchase orders, bills of lading, and utility bills. I contributed to the shipped classifier and extractor experiences, then led Accuracy Evaluation: a workflow planned for this summer that helps builders test extraction quality against ground truth, understand where automation is reliable, and improve document schemas before deployment.

## Metadata

- Category: Product Design / AI Workflow Design
- Role: Lead designer for Accuracy Evaluation; contributor across shipped classifier and extractor experiences
- Context: Watson Orchestrate document processing
- Focus: AI extraction, ground truth, evaluation metrics, schema improvement
- System: Carbon-aligned product design

## Section Headings

- The missing loop after extraction
- AI extraction was useful, but hard to validate
- Shipped classifier and extractor work shaped the evaluation direction
- Lead designer for Accuracy Evaluation
- Turning evaluation into an iteration loop
- Make accuracy useful, not just visible
- A measurable quality loop for document automation
- Designing trust into complex AI systems

## Body Copy

I designed the evaluation layer that helped builders understand, measure, and improve AI document extraction before trusting it in production.

Hero visual placeholder: document input → AI extraction → accuracy evaluation → schema improvement.

Watson Orchestrate’s document processing capabilities helped teams automate work across business documents like invoices, purchase orders, bills of lading, and utility bills.

I contributed to the broader classifier and extractor experiences, helping shape how builders configured document workflows, selected schemas, and worked with AI-generated extraction results.

But the most important question came after extraction:

How do builders know if the AI is accurate enough to trust?

That became the focus of Accuracy Evaluation, a workflow I owned as the lead designer. The goal was to help builders test extraction quality against ground truth, understand where automation was reliable, and improve their document schemas before deploying workflows at scale.

Enterprise teams needed more than “it worked on a few examples.”

Document extraction could identify fields, pull values, and support automation. But for enterprise teams, “it worked on a few examples” was not enough.

Builders needed to answer questions like:

Without a structured evaluation workflow, teams had to rely on small manual spot-checks and subjective confidence. That made it difficult to responsibly scale document automation.

The problem was not just extracting data. It was making extraction quality measurable, explainable, and improvable.

Before/after placeholder: informal spot-checking → no clear readiness signal → structured evaluation workflow.

Before leading Accuracy Evaluation, I tag-teamed work across the shipped document classifier and extractor experiences.

That work included:

This gave me a working understanding of the system: how builders created extractors, how document types shaped schemas, how AI confidence surfaced, and where the experience broke down between testing and deployment.

With classifier and extractor shipped, Accuracy Evaluation became the missing loop.

For Accuracy Evaluation, I led the design direction for the experience.

My role was to define how builders could move from informal testing to a repeatable evaluation workflow:

The design needed to serve technical accuracy goals while still feeling usable to builders who were configuring workflows, not performing data science.

The workflow centered around a simple quality loop:

Instead of treating accuracy as a static score, the design framed evaluation as part of the builder’s iteration process.

A builder could upload a larger set of documents, confirm the expected values, run the extractor, and compare the AI output against ground truth. From there, they could inspect weak fields, understand where extraction failed, and make targeted schema changes.

The goal was not just to show whether an extractor passed or failed. It was to help builders understand what to improve next.

Accuracy, precision, recall, and F1 score are useful, but they can quickly become abstract. The design needed to translate those metrics into builder-friendly signals: what changed, what failed, which fields need attention, which documents are causing issues, and whether the extractor is improving over time.

Ground truth creation could have become a completely separate experience. Instead, the direction reused familiar review patterns from human-in-the-loop document review, keeping the experience connected to the broader platform.

When a field performed poorly, the experience needed to connect that result back to field names, descriptions, examples, document variation, or model behavior. Evaluation became a bridge between AI output and better configuration.

AI document processing will always have edge cases. The experience could not imply perfect automation, so the design made uncertainty visible and manageable before production use.

Annotated UI placeholder: field-level metrics, weak-field review, or failure-to-schema improvement moment.

Accuracy Evaluation is planned to release this summer and defines a design direction for making document extraction quality easier to measure and improve.

It connected the broader document processing platform into a clearer loop:

classify → extract → review → evaluate → improve

For builders, this created a path from “the AI extracted something” to “I understand how well it performs, where it fails, and what I can do next.”

For the platform, it helped frame document processing as a more trustworthy enterprise workflow: configurable, reviewable, and measurable.

This project shows my ability to design inside complex AI product systems where trust depends on more than a polished interface.

It reflects my strengths in AI product UX, enterprise workflow design, builder tools, systems thinking, Carbon-aligned product design, translating technical concepts into usable workflows, and owning an ambiguous product area independently.

## Lists And Tags

- How accurate is this extractor across a real test set?
- Which fields are reliable?
- Which fields keep failing?
- Are schema changes improving results?
- Is this workflow ready for production?
- document classification flows
- schema-based extraction patterns
- confidence thresholds
- builder configuration experiences
- alignment with the newer agent model
- Carbon and visual consistency across related document processing work
- prepare a representative test set
- create or import ground truth
- run an evaluation
- review overall and field-level accuracy
- identify weak spots
- adjust schema definitions
- rerun evaluation and compare results

<!--
Generated file. Do not edit directly.
Source: ../document-processing.html
Regenerate with: node scripts/html-to-md.mjs
-->

---
title: "Make the trust loop visible."
source: "document-processing.html"
url: "/document-processing"
category: ""
description: "A product-design study of classification, extraction, human review, and evaluation in Watson Orchestrate Document Processing."
---

# Make the trust loop visible.

## Description

A product-design study of classification, extraction, human review, and evaluation in Watson Orchestrate Document Processing.

## Page Intro

Document automation does not stop at extracting a value. Builders need to know what the system recognized, where it is uncertain, how a person can correct it, and whether a change improved the result. I worked across Watson Orchestrate's Document Processing experience to help connect those moments into one platform workflow.

## Metadata

- Role: Contributor across Classifier and Extractor; lead designer for Accuracy Evaluation
- Period: Product design · 2025–2026
- Scope: Classifier + Extractor specifications
- Throughline: Human-in-the-loop shared patterns
- Release: Evaluation direction · released July 2026

## Section Headings

- The work started with the platform, not the dashboard.
- Trust comes from a workflow people can inspect.

## Body Copy

Document Processing / Watson Orchestrate

Return to the broader IBM watsonx Orchestrate canvas story →

A document first had to be identified, matched to a schema, read for fields and tables, reviewed where confidence was low, and evaluated against a known reference.

I joined the work in 2025 and ramped up alongside the existing designer, Cate. Together, we made up the design team. I helped translate earlier product concepts into the newer agent model, delivered specifications and interaction designs for Document Classifier and Extractor, and contributed shared patterns across the canvas and component library.

I also worked with adjacent Chat, Carbon, and Tools teams where document review crossed product boundaries. The role was collaborative: connecting states and patterns rather than claiming the platform as a solo design.

Parallel feature arc

Developed in parallel with the broader canvas work, the feature moved from document setup into human review. Accuracy Evaluation came later, extending that trust loop into field-level quality inspection.

Document Processing feature arc

Suggested classes make the system recommendation visible before the workflow moves forward.

Field setup connects the source document to the structure the workflow needs.

Review keeps uncertain output and its source close enough for a person to resolve the difference.

The Accuracy Evaluator direction brought field-level quality into view near the end of the feature arc.

Interface details use fictional sample data and are shown as design examples, not measured outcomes. These are unaltered owner exports, including their fictional profile markers.

Document Extractor and Evaluation released in July 2026, connecting extraction with a quality-review workflow people could inspect.

Document Processing study

## Lists And Tags

- 01 · ClassifyEstablish the document type Suggested classes make the system recommendation visible before the workflow moves forward.
- 02 · ExtractShape the information model Field setup connects the source document to the structure the workflow needs.
- 03 · ReviewPut uncertainty in context Review keeps uncertain output and its source close enough for a person to resolve the difference.
- Later phase · EvaluateMake quality inspectable The Accuracy Evaluator direction brought field-level quality into view near the end of the feature arc.

## Images

- Document classifier setup with two fictional sample classes: images/document-processing/public/classify-setup.png
- Document extractor field editor using a fictional purchase order: images/document-processing/public/extract-field.png
- Document review table with editable fictional extracted values: images/document-processing/public/review-table.png
- Evaluation screen with fictional field-level comparison: images/document-processing/public/evaluate-results.png
- Document review screen showing verified fictional output: images/document-processing/public/review-verified.png
- Evaluation screen showing a fictional uploaded test set: images/document-processing/public/evaluate-test-set.png
- Evaluation screen prompting a rerun after extractor changes: images/document-processing/public/evaluate-rerun.png
- Evaluation screen with extraction indicators on a fictional source document: images/document-processing/public/evaluate-indicators.png

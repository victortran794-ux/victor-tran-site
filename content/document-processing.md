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

Builders need to see what a document extractor found, check uncertain results against the source, and see whether their changes improved the output. I worked on Classifier and Extractor specifications and led the design of Accuracy Evaluation in IBM watsonx Orchestrate.

## Metadata

- Role: Contributor across Classifier and Extractor; lead designer for Accuracy Evaluation
- Period: 2025–2026
- Scope: Classifier and Extractor specifications; Accuracy Evaluation design
- Throughline: Shared patterns for human review
- Release: Document Extractor and Accuracy Evaluation · July 2026

## Section Headings

- The work started with the platform, not the dashboard.
- Trust comes from a workflow people can inspect.

## Body Copy

Document Processing / IBM watsonx Orchestrate

Return to the broader IBM watsonx Orchestrate canvas story →

The workflow identifies the document type, extracts its fields and tables, supports human review, and compares the results with a reference.

I joined Cate on the design team in 2025. I helped adapt earlier concepts to the newer agent model, delivered interaction designs and specifications for Document Classifier and Extractor, and contributed shared canvas and component patterns.

I also worked with adjacent teams on shared document-review patterns.

Parallel feature arc

I worked on document setup and human review alongside the broader canvas work. Accuracy Evaluation came later, adding a way to compare extracted fields with reference values.

Document Processing feature arc

Suggested classes make the system recommendation visible before the workflow moves forward.

Field setup connects the source document to the structure the workflow needs.

Review keeps uncertain output and its source close enough for a person to resolve the difference.

Accuracy Evaluation compares extracted and reference values field by field.

The screens use fictional sample data. The values shown are examples, not measured product results.

Document Extractor and Accuracy Evaluation were released in July 2026.

Document Processing study

## Lists And Tags

- 01 · ClassifyEstablish the document type Suggested classes make the system recommendation visible before the workflow moves forward.
- 02 · ExtractShape the information model Field setup connects the source document to the structure the workflow needs.
- 03 · ReviewPut uncertainty in context Review keeps uncertain output and its source close enough for a person to resolve the difference.
- Later phase · EvaluateMake quality inspectable Accuracy Evaluation compares extracted and reference values field by field.

## Images

- Document classifier setup with two fictional sample classes: images/document-processing/public/classify-setup.png
- Document extractor field editor using a fictional purchase order: images/document-processing/public/extract-field.png
- Document review table with editable fictional extracted values: images/document-processing/public/review-table.png
- Evaluation screen with fictional field-level comparison: images/document-processing/public/evaluate-results.png
- Document review screen showing verified fictional output: images/document-processing/public/review-verified.png
- Evaluation screen showing a fictional uploaded test set: images/document-processing/public/evaluate-test-set.png
- Evaluation screen prompting a rerun after extractor changes: images/document-processing/public/evaluate-rerun.png
- Evaluation screen with extraction indicators on a fictional source document: images/document-processing/public/evaluate-indicators.png

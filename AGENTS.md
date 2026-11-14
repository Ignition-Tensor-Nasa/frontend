# Project Context — NASA Space Apps Challenge 2026

## Hackathon & Team
- **Event:** NASA International Space Apps Challenge 2026 (team project)
- **Challenge:** *Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data*
- **Challenge URL:** https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/
- **Reference Video:** https://www.youtube.com/watch?v=AVuEiKxOpc0

## Challenge Summary
- **Problem:** In microgravity (e.g., aboard the ISS or during transit to the Moon/Mars), buoyancy-driven convection disappears, causing flames to behave very differently from Earth—often burning as dim, nearly spherical, slow-moving, and harder-to-detect anomalies.
- **Data Trove:** Decades of NASA microgravity combustion experiments (such as **BASS**, **BASS-II**, **ACME**, **FLEX**, **SoFIE**, and **SPICE**) stored across repositories like **Physical Sciences Informatics (PSI)** and **NASA Technical Reports Server (NTRS)** are dense and scattered, making cross-comparison and quick interpretation difficult.
- **Goal:** Build an interactive, AI/SI-powered web application and dashboard that synthesizes, searches, ranks, and interprets microgravity combustion findings to deliver actionable fire-safety insights for protecting astronauts, spacecraft, and future lunar/Martian habitats.

## Repository Scope
- This repository (`frontend`) holds the frontend application for the team's hackathon project.

## Frontend & Technical Requirements
- **High Priority on Frontend & Visual Design:** The UI/UX must look polished, modern, and impressive (aerospace / mission-control / scientific analytics grade — not a basic prototype).
- **Rich Data Presentation:** Core capabilities include advanced interactive data tables (sorting, multi-criteria filtering, search, virtualization) and interactive scientific/analytical charts (heatmaps, scatter plots, parallel coordinates, etc.).
- **No Trivial Technologies:** Do **not** use simple, low-code, or trivial frontend solutions (e.g., Streamlit, Gradio, plain HTML/jQuery, or barebones templates).

## Chosen Frontend Tech Stack
- **Core Framework & Styling:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Data Tables:** TanStack Table v8 (advanced sorting, faceted/multi-criteria filtering, virtualization)
- **Data Visualization & Charts:** Apache ECharts (interactive scientific charts, heatmaps, scatter plots, parallel coordinates)

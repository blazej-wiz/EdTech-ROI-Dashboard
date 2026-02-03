# EdTech ROI Dashboard

A decision-support ROI dashboard built to help educational institutions evaluate whether AI adoption delivers real financial and educational value.

Built in under 24 hours during the Finnovator Challenge, this project focuses on **evidence-led decision-making** rather than assumptions or headline claims.

![EdTech ROI Dashboard demo](assets/ROI%20Demo%20Final.gif)

---

## 🚩 The Problem

Teachers are increasingly overworked, leading to burnout, higher absence, and attrition.  
Schools are then forced into expensive supply cover and recruitment cycles year after year.

Despite this, school leaders are often asked to invest in tools that claim to address these challenges, **without a reliable way to quantify whether those interventions generate a meaningful return**.

---

## 🎯 The Goal

To give school leaders a **clear, defensible way to decide**:
- whether AI adoption is worth investing in
- under what conditions it delivers value
- and where the financial and educational impacts come from

---

## 🧠 The Approach

The dashboard is designed to mirror how school leaders actually evaluate investments:

1. **Fast, high-level view**  
   A small set of core inputs produces an immediate ROI snapshot.

2. **Deeper modelling when needed**  
   Assumptions can be refined using institution-specific staffing and cost data for budget and leadership discussions.

3. **Scenario-based decision support**  
   Key “what if” questions are modelled directly, rather than buried in spreadsheets.

---

## 📊 What the Dashboard Enables

- Quantify the impact of AI adoption using institution-specific data  
- Model Year 1 ROI, payback period, and 5-year cumulative net benefit  
- Compare “what if” scenarios for reduced absence and improved staff retention  
- Identify the conditions required for value — not just whether it exists  

---

## 💡 Financial ROI vs Educational Impact

A deliberate distinction is made between:

- **Cash ROI**  
  Savings from reduced supply cover and lower attrition.

- **Educational impact**  
  Time reallocated from administrative and marking tasks to higher-quality, student-facing teaching.

Educational value is shown transparently (including £-equivalent value of reallocated time), but **kept separate from financial ROI** to keep the model honest.

---

## 🏗️ Architecture Overview

- **Frontend:** React / Next.js with a focus on clarity and decision confidence  
- **Backend logic:** Deterministic financial and staffing models (TypeScript)  
- **Visuals:** Scenario charts and ROI projections designed for leadership audiences  

---

## 📈 Scalability

Although initially built for secondary schools, the decision framework is intentionally scalable and can be applied to:
- Universities
- Further education institutions
- Alternative education and home-schooling contexts

No redesign of the core logic is required.

---

## 🔮 Future Work

This project was built as a proof of concept within a limited timeframe. Building on this foundation, future iterations could include:

- **Token-level AI cost modelling**  
  Incorporating real token-based pricing (e.g. Gemini 2.0 or comparable LLMs) to replace average EdTech pricing assumptions, enabling more accurate and institution-aware cost projections.

- **Usage-based adoption patterns**  
  Modelling different levels of AI usage across subjects, year groups, or staff roles rather than a single adoption rate.

- **Comparative AI tooling analysis**  
  Visual comparisons between different AI tools and pricing models, helping institutions assess relative cost-effectiveness and value across providers.

- **Expanded outcome metrics**  
  Extending beyond absence and retention to explore impacts on workload distribution, assessment turnaround times, or student experience.

These extensions would further strengthen the dashboard’s ability to support evidence-led decision-making around AI adoption.

---

## 🚀 Getting Started

```bash
npm install
npm run dev

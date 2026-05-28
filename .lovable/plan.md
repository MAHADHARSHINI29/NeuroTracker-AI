

# NeuroTrack AI — Full Build Plan

## Overview
A modern health web app for tracking headache patterns, predicting migraine types via rule-based logic, and generating doctor reports. Built with React + Tailwind + Supabase (external).

## Design System
- **Colors**: Calming medical palette — primary blues (#2563EB, #1E40AF), soft whites (#F8FAFC), accent teal (#0D9488), warning amber, danger red
- **Typography**: Clean sans-serif, clear hierarchy
- **Style**: Card-based layouts, smooth Framer Motion animations, rounded corners, soft shadows
- **Mobile-first** responsive design with professional healthcare aesthetic

## Pages & Features

### 1. Landing Page
- Hero section with tagline "Track. Predict. Prevent."
- Feature highlights (tracking, AI predictions, analytics, reports)
- Call-to-action buttons for signup
- Smooth scroll animations

### 2. Authentication (Login / Signup)
- Email + password auth via Supabase
- Clean medical-themed forms
- Redirect to dashboard after login

### 3. User Dashboard
- Welcome card with summary stats (total headaches, avg severity, days since last)
- Recent headache entries list
- Quick-log button
- Smart risk alerts banner (e.g., "High migraine frequency detected — consider consulting a neurologist")
- AI-generated personal insights cards ("Your headaches correlate with <6hrs sleep")

### 4. Headache Tracker Form
- Multi-step or single-page form with:
  - Date/time picker
  - Pain intensity slider (1–10)
  - Head location selector (visual head diagram or buttons: front, side, back, whole)
  - Pain type (throbbing, pressure, stabbing)
  - Duration input
  - Associated symptoms checkboxes (nausea, vomiting, light/sound sensitivity, visual aura)
  - Sleep hours, stress level, hydration level, screen time sliders
  - Trigger checkboxes (lack of sleep, dehydration, stress, weather change)
- Save to Supabase `headache_entries` table

### 5. AI Prediction Results
- After logging, run rule-based prediction engine:
  - Classifies as: Migraine with aura, Migraine without aura, Tension headache, Cluster headache
  - Shows confidence score, detected triggers, severity risk level
- Results displayed in a clean card layout with color-coded severity

### 6. Analytics Dashboard
- Headache frequency chart (weekly/monthly bar chart)
- Severity trend line chart
- Trigger correlation breakdown (which triggers appear most)
- Calendar heatmap view of headache history
- Built with Recharts

### 7. Doctor Report Page
- Auto-generated structured summary: frequency, severity distribution, common triggers, predicted types, symptom timeline
- PDF download using client-side PDF generation (jsPDF or similar)

### 8. Doctor Finder Section
- Static recommendation section that shows when risk is elevated
- Links to find neurologists (informational)

### 9. Settings / Profile
- Update name, email preferences
- View account info

## Database Schema (Supabase)
- `profiles` — user profile data linked to auth.users
- `headache_entries` — all symptom log fields (date, intensity, location, pain_type, duration, symptoms, sleep, stress, hydration, screen_time, triggers)
- `predictions` — stored prediction results per entry
- RLS policies for user-scoped data access

## Rule-Based Prediction Engine
TypeScript module that scores symptoms against headache type criteria:
- **Migraine with aura**: visual aura + throbbing + light sensitivity + moderate-high intensity
- **Migraine without aura**: throbbing + nausea + light/sound sensitivity, no aura
- **Tension headache**: pressure type + bilateral + mild-moderate intensity
- **Cluster headache**: severe stabbing + one-sided + short duration
- Returns type, confidence %, triggers, risk level

## Smart Alerts
- Analyze entry frequency and severity trends
- Show contextual warnings on dashboard when patterns indicate risk

## Personal Insights
- Pattern detection from stored data (sleep correlation, screen time correlation, trigger frequency)
- Displayed as insight cards on dashboard


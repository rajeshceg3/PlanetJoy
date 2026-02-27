

🌍 PRODUCT REQUIREMENTS DOCUMENT (UPDATED)

Project Name: PlanetJoy

Architecture: Fully Client-Side, No Backend


---

1. Executive Summary (Updated)

1.1 Product Vision

PlanetJoy is a fully browser-based, self-contained WebGL educational globe that teaches animals and plants through playful exploration.

It must:

Run entirely in the browser

Require no backend services

Require no login

Store all progress locally

Be deployable as static files



---

1.2 Architecture Constraint (New Mandatory Requirement)

The application:

Must be deployable as static files (HTML + JS + CSS + assets)

Must not require any runtime server logic

Must not use any external APIs

Must not depend on cloud databases

Must not send user data anywhere


Allowed:

Static hosting (Vercel, Netlify, GitHub Pages, S3)

PWA offline caching


Not allowed:

REST API backend

Node server

Firebase

Supabase

Auth systems

Analytics tracking



---

2. System Architecture (Browser-Only)

Browser
 ├── Three.js WebGL Engine
 ├── React UI Layer
 ├── Zustand (local state)
 ├── Static JSON (animals, plants)
 ├── Web Audio API
 ├── localStorage (progress)
 ├── Service Worker (offline caching)
 └── Asset Bundles (images, textures, sounds)

Everything loads from static assets.


---

3. Data Management (No Backend)

All data will be:

Stored as local JSON files

Imported at build time

Bundled into application



---

3.1 Data Structure

Example folder structure:

/public
  /assets
    /textures
    /animals
    /sounds
  /data
    continents.json
    animals.json


---

3.2 Example animals.json

{
  "Africa": [
    {
      "id": "lion",
      "name": "Lion",
      "lat": -1.9,
      "lon": 34.5,
      "sound": "/assets/sounds/lion.mp3",
      "image": "/assets/animals/lion.png",
      "description": "I am Leo the Lion! I live in sunny grasslands.",
      "funFact": "Lions live in groups called prides!"
    }
  ]
}

Loaded using:

import animals from '/data/animals.json';

No fetch from server.


---

4. Progress Storage (Local Only)

All learning progress stored using:

localStorage

Example:

localStorage.setItem("visitedContinents", JSON.stringify(["Africa", "Asia"]));

On load:

const visited = JSON.parse(localStorage.getItem("visitedContinents")) || [];


---

Why localStorage?

Built into browser

No network needed

Survives refresh

Simple key-value store



---

5. Offline Capability (Required)

PlanetJoy must work without internet after first load.

We implement:

PWA (Progressive Web App)

Requirements:

service-worker.js

Cache all assets

Manifest file

Installable on tablet



---

Service Worker Example

const CACHE_NAME = "planetjoy-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/assets/textures/earth.png",
  "/assets/animals/lion.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});


---

6. Performance Constraints (Critical Since No Backend)

Because all assets are bundled:

6.1 Bundle Size Limit

Target:

Total initial load < 15MB

First paint < 3 seconds on 4G



---

6.2 Optimization Rules

Use texture atlases

Compress images (WebP)

Compress audio (OGG)

Use lazy loading for continent-specific assets



---

7. Asset Loading Strategy

To prevent slow load:

Load in phases:

1. Core globe


2. Current continent animals


3. Others on demand



Example:

if (selectedContinent === "Africa") {
  import("/assets/africaBundle.js");
}

This reduces memory usage.


---

8. Removed Sections (From Previous Version)

The following are now removed:

REST API endpoints

POST /progress

Database schema

Backend hosting

Server security policies


Because there is no server.


---

9. Security Model (Updated)

Since no backend exists:

Security focuses on:

Preventing asset tampering

Preventing XSS

Content Security Policy (CSP)



---

9.1 Required Security Headers

Content-Security-Policy:
  default-src 'self';
  img-src 'self';
  media-src 'self';
  script-src 'self';


---

10. Deployment Requirements

Must be deployable via:

GitHub Pages

Netlify

Vercel static

S3 static hosting


Build output:

npm run build

Produces:

/dist
  index.html
  assets/
  service-worker.js
  manifest.json


---

11. Testing Adjustments

Since no backend:

Must test:

Cold load performance

Offline mode

Storage persistence

Memory leaks (WebGL cleanup)



---

12. Risk Analysis (Updated)

Risk: Large Asset Bundle

Mitigation:

Dynamic import by continent

Compress textures

Sprite atlases



---

Risk: localStorage Limit (5–10MB)

Mitigation:

Store only progress IDs

Never store images/audio in storage



---

Risk: WebGL Crash on Low Devices

Mitigation:

Limit sphere geometry to 64 segments

Fallback message if WebGL unsupported



---

13. New Mandatory Acceptance Criteria

The application must:

Run when opened from static hosting

Continue working when internet is turned off

Not make any network calls after initial load

Store progress locally

Load under 3 seconds on mid-range tablet



---

14. Final Architecture Summary

PlanetJoy is now:

A fully client-side, static-deployable, offline-capable WebGL educational experience with zero backend dependencies.

It is:

Privacy-safe

School-friendly

Low-maintenance

Cheap to host

Globally scalable instantly



-
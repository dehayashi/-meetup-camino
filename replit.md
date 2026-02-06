# Caminho Companion

## Overview
A full-stack web application that connects pilgrims on the Camino de Santiago, allowing them to share activities, transportation, meals, and accommodation during their journey. Built with React + Express + PostgreSQL.

## Recent Changes
- 2026-02-06: Initial MVP built with all core features
  - Landing page with Camino hero image
  - User authentication via Replit Auth
  - Pilgrim profiles with travel preferences
  - Activity CRUD (transport, meal, hike, lodging)
  - Smart activity recommendations based on city/date/preferences
  - Interactive Leaflet map with activity pins
  - Chat within activities (polling-based)
  - Star ratings and reviews
  - Mock donation page
  - Seed data with sample pilgrims and activities
  - Camino-themed design with blue/green/beige color palette

## User Preferences
- Mobile-first, responsive design
- Portuguese (Brazilian) as primary language
- Clean, pilgrimage-themed aesthetic

## Project Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect)
- **Maps**: Leaflet.js with OpenStreetMap tiles
- **Routing**: wouter (frontend), Express (backend)
- **State**: TanStack React Query

### Key Files
- `shared/schema.ts` - All Drizzle schemas (pilgrimProfiles, activities, activityParticipants, chatMessages, ratings, donations)
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database operations (DatabaseStorage class)
- `server/seed.ts` - Seed data for demo
- `client/src/App.tsx` - Main app with routing and auth flow
- `client/src/pages/` - All page components
- `client/src/components/` - Reusable components (ActivityCard, MapView, BottomNav, ThemeProvider)

### API Endpoints
- `GET/POST /api/profile` - Pilgrim profile CRUD
- `GET /api/activities` - List all activities
- `GET /api/activities/recommended` - Smart recommendations
- `GET /api/activities/mine` - User's activities
- `GET/POST /api/activities/:id` - Activity detail & create
- `POST /api/activities/:id/join` - Join activity
- `POST /api/activities/:id/leave` - Leave activity
- `GET/POST /api/activities/:id/messages` - Chat messages
- `GET/POST /api/activities/:id/ratings` - Ratings
- `POST /api/donations` - Record donation

### Database Tables
- `users` + `sessions` - Auth (managed by Replit Auth)
- `pilgrim_profiles` - Extended user profiles
- `activities` - Activities created by pilgrims
- `activity_participants` - Join table
- `chat_messages` - Chat per activity
- `ratings` - Star ratings per activity
- `donations` - Donation records

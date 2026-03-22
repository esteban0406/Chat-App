# Discol Case Study

## Problem

Modern chat platforms feel simple on the surface, but they rely on a dense mix of systems behind the scenes: identity, real-time communication, permissions, presence, media, and deployment reliability. I built **Discol** to explore that full product and engineering challenge through a Discord-inspired application that goes beyond basic messaging.

The goal was to create a portfolio project that demonstrated more than UI polish. I wanted to show the ability to design and ship a complete real-time product: a system where users can register, connect with friends, join communities, chat instantly, manage roles and permissions, enter voice rooms, and interact with a guided demo experience. Just as importantly, I wanted the project to reflect production-minded engineering practices, including automated testing, containerized environments, and continuous delivery.

## Solution

Discol is a full-stack real-time chat application built around the concept of servers, channels, friendships, and role-based collaboration. Users can sign up with email and password or Google OAuth, create servers, invite other users, organize conversations into text and voice channels, and manage server membership through roles and permissions.

The product experience is designed to feel interactive and alive. Text messages are delivered in real time with Socket.IO, while online and offline presence updates are pushed directly to relevant users rather than broadcast globally. Voice rooms are powered by LiveKit, allowing users to join channel-based audio or video sessions from within the application. Profiles support avatar uploads through Cloudinary, and the app also includes a demo mode with seeded content so recruiters and reviewers can explore the product without having to populate it manually.

On the frontend, the application uses Next.js with React and a responsive layout that supports both desktop and mobile navigation patterns. It also includes English and Spanish localization, plus a guided product tour that helps new users understand the interface. On the backend, NestJS provides a modular API with separate domains for authentication, users, friendships, servers, roles, channels, messages, voice access, and real-time gateway events.

## Architecture

The architecture is intentionally straightforward and strong in separation of concerns. The frontend is a **Next.js 16** application using the App Router, React 19, and Tailwind CSS v4. It handles page routing, responsive UI, long-lived client state, and real-time event subscriptions. Shared contexts manage current user state, server state, friends, and notifications so the interface stays synchronized as events arrive.

The backend is a **NestJS 11** modular monolith. That structure made it possible to keep the project easy to reason about while still separating business logic into focused modules such as auth, servers, channels, messages, friendships, voice, and AI assistant features. All REST endpoints are exposed under `/api`, while Socket.IO runs alongside the HTTP API for low-latency messaging and targeted user notifications.

For data persistence, the app uses **PostgreSQL** with **Prisma ORM**. The schema models the core collaboration domain clearly: users, OAuth accounts, friendships, servers, invites, members, roles, channels, and messages. Role-based access control is enforced through explicit server permissions such as channel creation, invite management, role management, and server deletion, which keeps authorization rules visible and maintainable.

The real-time system uses two useful communication patterns. Channel rooms are used for chat fanout, so only users in the active channel receive live messages. User-specific rooms are used for private notifications like friend requests, server invites, and presence changes. That keeps the real-time layer efficient and avoids noisy broadcasts.

The project is also designed to be easy to run and ship. Local development uses Docker Compose to bring up the frontend, backend, and LiveKit service together. Production builds use multi-stage Dockerfiles for both frontend and backend, with health checks and non-root runtime images. The frontend is built in standalone mode for lightweight deployment, while the backend generates Prisma artifacts and runs as a compiled NestJS service.

## Challenges

### 1. Making real-time features feel selective instead of noisy

One of the main design challenges was avoiding the common trap of treating every event as a broadcast. Messaging, status updates, channel changes, invites, and friendship actions all have different audiences. I solved this by separating channel-level events from user-level events. Messages are emitted only to the relevant channel room, while friend and invite notifications are emitted directly to the affected users. This made the real-time layer cleaner and closer to how a production chat system should behave.

### 2. Keeping authorization understandable as features expanded

As soon as server management features were added, authorization became more complex than simple ownership checks. Channel creation, role management, inviting users, renaming a server, and removing members all needed explicit rules. Instead of scattering those checks across controllers and services, I modeled a dedicated permission system in Prisma and enforced it through NestJS guards. That gave the project a clear RBAC story and made the architecture much easier to explain and extend.

### 3. Verifying a real-time product across multiple layers

A real-time app can appear to work while still hiding fragile behavior across API flows, sockets, and UI state. To reduce that risk, I built a layered test strategy: backend unit tests for service and module logic, backend integration tests against a real PostgreSQL database, frontend unit tests for components and client utilities, and Playwright end-to-end tests that boot the full stack in Docker. That testing approach gave the project much stronger credibility than a visual demo alone.

## Results

Discol became a strong end-to-end case study in building and shipping a modern real-time product. It demonstrates full-stack ownership across product design, domain modeling, authentication, authorization, WebSocket workflows, voice integration, media uploads, internationalization, testing, and deployment.

From a portfolio perspective, the project shows several qualities that matter to employers:

- The ability to turn a familiar product concept into a complete, working system rather than a superficial clone.
- Experience designing maintainable backend architecture with clear module boundaries and explicit domain modeling.
- Comfort building real-time user experiences that combine REST APIs, sockets, presence, and channel-based communication.
- Production awareness through Dockerized environments, CI pipelines, container builds, health checks, and VPS deployment.
- Quality discipline through automated testing at the unit, integration, and browser end-to-end levels.

In total, the repository includes **53 frontend unit tests**, **34 backend unit tests**, **14 backend integration tests**, and **9 Playwright end-to-end specs**, supported by GitHub Actions pipelines that gate pull requests before deployment. That made the project not just a feature demo, but a credible example of how I approach engineering quality and delivery from start to finish.

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS v4
- Backend: NestJS 11, Prisma ORM, PostgreSQL
- Real-time: Socket.IO
- Voice and video: LiveKit
- Authentication: JWT, Passport, Google OAuth 2.0
- Media storage: Cloudinary
- Testing: Jest, Supertest, Playwright
- DevOps: Docker, Docker Compose, GitHub Actions, GHCR, VPS deployment over SSH

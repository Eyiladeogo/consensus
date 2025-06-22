# Consensus: Collaborative Decision Voting App

- **Live Frontend URL:** [https://getconsensus.vercel.app]
- **Live Backend URL:** [https://consensus-44zx.onrender.com]
- **GitHub Repository:** [https://github.com/Eyiladeogo/consensus]

---

## 1. Introduction

**Consensus** is a full-stack web application designed to facilitate collaborative decision-making through anonymous voting. Users can create decision rooms, define options, set deadlines, and collect anonymous votes. The app emphasizes a clean, intuitive UI and a robust, scalable backend.

---

## 2. Core Functionality Implemented

- **User Authentication:** Secure registration and login using JWT (JSON Web Tokens) for stateless authentication.
- **Decision Room Creation:** Authenticated users can create new decision rooms, defining:
  - A clear title and descriptive explanation
  - A list of 2 to 5 distinct voting options
  - A specific deadline for voting
- **Dynamic Room Management:** Users can view a dashboard of all decision rooms they have created.
- **Voting:**
  - Users can cast exactly one vote per room.
- **Vote Justification:** Voters can provide a text comment to justify their choice.
- **Live Tallies & Results:**
  - The room creator can view vote tallies for their active decision rooms.
  - After the deadline, final results are displayed to anyone viewing the room.
  - Vote justifications are shown to the room creator, e.g., `[Voter Display Name] voted for "[Option Text]" - "[Comment]"`.

---

## 3. Technical Stack

### Frontend

- **React** (v19)
- **TypeScript** (v4.9.5)
- **Tailwind CSS** (v3.4.17)

### Backend

- **Node.js**
- **Express** (v5.1.0)
- **TypeScript** (v5.8.3)
- **Prisma** (v6.10.0)


### Database

- **PostgreSQL**

---

## 4. Architectural Decisions & Thought Process

### Frontend (Client-side)

- **Component-Based Design:** Reusable React components (e.g., `AuthPage`, `Dashboard`, `DecisionRoom`).
- **State Management:** `useState` and `useEffect` for local state and side effects. `localStorage` and cookies for persistent tokens and anonymous voter tracking.
- **API Communication:** Centralized `api` utility (Axios) for HTTP requests, including JWT token attachment.
- **Styling:** Tailwind CSS with a custom color palette and extended shadow values.
- **Responsive Design:** Tailwind's responsive utilities for mobile, tablet, and desktop.
- **User Experience:** Clear information hierarchy, intuitive navigation, and visual feedback.

### Backend (Server-side)

- **RESTful API:** Clear and consistent endpoints with appropriate HTTP methods.
- **Layered Architecture:**
  - **Routes:** Define API endpoints.
  - **Controllers:** Handle request parsing, validation, and business logic.
  - **Prisma Client:** Used in controllers for database interaction.
- **Authentication:** JWTs for stateless authentication. Custom Express middleware (`authMiddleware`) for route protection.
- **Database Interaction:** Prisma ORM with type-safe interaction and schema-defined models.
- **One Vote Per User/Guest:** Enforced via `voterId` and a `@@unique([decisionRoomId, voterId])` constraint in the Vote model.
- **Error Handling:** Robust error handling in controllers.

### Database Schema Design

- **User:** Stores credentials and links to rooms/votes.
- **DecisionRoom:** Core entity for a decision, with title, explanation, deadline, and options.
- **Option:** Represents a choice within a room.
- **Vote:** Records a single vote, with:
  - `voterId`: Unique string for the voter (user ID or guest ID)
  - `userId`: Nullable, links to User if registered
  - `comment`: Nullable, stores justification
  - `@@unique([decisionRoomId, voterId])`: Enforces one-vote-per-voter-per-room
- **InvitationCode:** (Planned) For rooms requiring codes, with an `isUsed` flag.

---

## 5. Challenges & Limitations

- **Anonymous Voting Robustness:** Cookie-based voting prevents casual duplicate votes, but can be bypassed by clearing cookies (a trade-off for anonymity).
- **Invitation Code Feature:**
  - Prisma schema and backend logic are implemented.
  - Frontend UI is mostly in place.
  - Full end-to-end testing and integration are incomplete.
- **Real-time Polling:** Framework for live tallies exists, but polling/WebSockets for auto-refresh are not yet implemented.

---

## 6. Future Improvements

- Invitation code to permit guest/anonymous voting
- Real-time tally updates (polling or WebSockets)
- Discussion thread within decision rooms
- User profiles
- Email notifications
- UI polish (animations, transitions, accessibility)
- Unit and integration testing
- Deployment automation (CI/CD)

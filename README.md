# UniEvent - Campus Event Pulse 🎓

UniEvent is a modern, centralized platform designed to help university students discover events, connect with societies, and stay engaged with campus life. It bridges the gap between student organizers and attendees with a sleek, responsive interface.

![UniEvent Banner](https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1200&auto=format&fit=crop)

## 🚀 Features

- **Event Discovery**: Browse upcoming and past events with advanced filtering (University, Date, Society, Category).
- **Interactive RSVP**: Students can "Count Me In" to track attendance (Optimistic UI updates).
- **Society Profiles**: detailed pages for university societies with leadership info.
- **Admin Dashboard**: 
  - **Role-Based Access Control (RBAC)**: Secure admin-only areas.
  - **Request Flow**: Users can request admin access via the signup page or dashboard.
  - **Management**: Approve/Reject admin requests, Edit Society details, Manage Categories.
- **Event Creation**: Organizers can host new events with rich details and image uploads.
- **Authentication**: Secure email/password login via Appwrite.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **Backend API**: [Appwrite](https://appwrite.io/) (Database, Auth, Storage)
- **State/Query**: [TanStack Query](https://tanstack.com/query/latest) (v5)
- **Icons**: [Lucide React](https://lucide.dev/)

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- An Appwrite Cloud account (or local instance)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/unievent.git
cd unievent
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID=events
NEXT_PUBLIC_APPWRITE_SOCIETIES_COLLECTION_ID=societies
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=event-posters

# For server-side script usage (init-appwrite.mjs)
# You also need an API Key with full database/storage/users scopes
APPWRITE_API_KEY=your_secret_api_key
```

### 3. Database Initialization
We include a powerful script to set up your Appwrite project automatically (Schemas, Collections, Mock Data).

```bash
node scripts/init-appwrite.mjs
```
*Allows you to seed Universities (including National Textile University), Societies, and Categories.*

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## 🔐 User Access & Permissions

**All registered users have dashboard access** to create and manage their own content:
*   **Create Societies**: Any user can create a new society/club.
*   **Edit Own Content**: Users can only edit societies they created.
*   **Create Events**: All users can host events.
*   **Manage Categories**: Add or remove event categories (shared resource).

This open model encourages community participation while maintaining ownership controls.

## 📂 Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── admin/        # Admin Dashboard
│   ├── create-event/ # Event creation flow
│   ├── events/       # Event details & editing
│   └── ...
├── components/       # Reusable UI components
│   ├── events/       # Event-specific cards/lists
│   ├── layout/       # Navbar, Footer
│   └── ui/           # Primitive shadcn components
├── context/          # React Context (AuthContext)
└── lib/              # Utilities
    ├── appwrite.ts   # Appwrite Client SDK
    ├── services.ts   # Data fetching & logic
    └── types.ts      # TypeScript interfaces
```

---

Made with ❤️ for the Hackathon.

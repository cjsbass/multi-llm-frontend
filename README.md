# MultiLLM Frontend

A Next.js web application for querying multiple frontier LLM providers and comparing their responses.

## Features

- **Multi-Model Querying**: Query 4 frontier AI models simultaneously
- **Side-by-Side Comparison**: View all responses in a clean grid layout
- **AI-Powered Analysis**: Use Claude Opus 4.5 to analyze and compare responses
- **Query History**: Track your previous searches
- **Grok-Inspired UI**: Modern dark theme interface

## Architecture

This frontend follows the **separation of concerns** principle:
- **Frontend**: Handles UI, user interactions, and presentation
- **Backend**: Manages API calls, business logic, and LLM integrations

### Why Separate Frontend and Backend?

1. **Security**: API keys never exposed to the browser
2. **Performance**: Backend can optimize and cache requests
3. **Scalability**: Services can scale independently
4. **Maintainability**: Changes to one don't affect the other

## Setup

### Prerequisites

- Node.js 18+ installed
- Backend API running (see `../multi-llm-backend/README.md`)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

The `.env.local` file should contain:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000 (or 3001 if 3000 is in use).

## Usage

1. Make sure the backend API is running at http://localhost:8000
2. Open the frontend at http://localhost:3000
3. Enter your query in the search box
4. View responses from all LLM providers
5. Click "Analyze All Responses" to get AI-powered comparison

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with dark theme
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles
├── components/
│   └── ui/                 # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── scroll-area.tsx
├── lib/
│   └── utils.ts            # Utility functions
├── public/                 # Static assets
├── .env.local             # Environment variables (not in git)
├── .env.example           # Example environment file
├── next.config.ts         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## How It Works

### Frontend Responsibilities

1. **Presentation Layer**: Renders the UI and handles user interactions
2. **State Management**: Manages loading states, query history, results
3. **API Communication**: Makes HTTP requests to the backend
4. **User Experience**: Animations, responsive design, error handling

### What the Frontend Does NOT Do

- ❌ Store or handle API keys
- ❌ Connect directly to LLM providers
- ❌ Implement business logic
- ❌ Access databases

All sensitive operations happen in the backend, keeping the frontend secure and focused on user experience.

## API Integration

The frontend communicates with the backend via REST API:

### Query Multiple LLMs

```typescript
POST http://localhost:8000/api/query
Content-Type: application/json

{
  "query": "Your question here"
}
```

### Analyze Responses

```typescript
POST http://localhost:8000/api/analyze
Content-Type: application/json

{
  "query": "Original question",
  "responses": [/* array of LLM responses */]
}
```

## Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` |

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put sensitive keys here!

## Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: lucide-react

## License

ISC

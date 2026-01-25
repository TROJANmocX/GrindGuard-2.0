<div align="center">
  <img src="public/logo.png" alt="GrindGuard Logo" width="120" />
</div>

# GrindGuard 2.0 🛡️

> **From Sheet to Streak.** Ruthless accountability for your LeetCode grind.

![React](https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ⚡ What is GrindGuard?

GrindGuard connects your **LeetCode Profile** directly to **Striver's SDE Sheet**. It automates your progress tracking, giving you accurate streaks and daily focus tasks based on your actual submission history.

**No more manual checkboxes. No more lies. Just data.**

---

## 🎯 Key Features

- **Real-Time Sync**: Fetches solved problems directly from LeetCode API
- **Smart Analytics**: Visual progress breakdown by topic (Arrays, DP, Graphs, etc.)
- **Daily Mission**: AI-powered recommendations targeting your weakest areas
- **Streak Tracking**: Verified against your official LeetCode submission calendar
- **Company Tags**: See which companies ask each problem (Amazon, Google, etc.)
- **Acceptance Rates**: Gauge problem difficulty at a glance
- **Failure Resilience**: Graceful error handling with visual feedback
- **Animated UI**: Smooth transitions and real-time progress updates

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first styling

**Data Sources**
- **Alfa LeetCode API** - Real-time problem & profile data
- **Striver's SDE Sheet** - Curated problem set (CSV)
- **LeetCode Metadata** - Company tags, acceptance rates (50k+ problems)

**AI & Storage**
- **Google Gemini 1.5** - AI-powered analysis (optional)
- **Supabase** - Authentication & user profiles
- **LocalStorage** - Manual problem tracking fallback

### Project Structure

```
GrindGuard™ 2.0/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx    # Main orchestrator (Single Source of Truth)
│   │   ├── Header.tsx       # Sync status & navigation
│   │   ├── ProblemList.tsx  # Sortable problem table
│   │   ├── DailyMission.tsx # Focus recommendations
│   │   └── ...
│   ├── lib/                 # Core logic
│   │   ├── leetcode.ts      # API integration
│   │   ├── csvParser.ts     # Striver sheet parser
│   │   ├── enrichment.ts    # Metadata merging
│   │   ├── recommendation.ts # Daily mission algorithm
│   │   ├── progress.ts      # Stats calculation
│   │   └── gemini.ts        # AI analysis
│   ├── contexts/            # React context providers
│   │   └── AuthContext.tsx  # Supabase auth
│   ├── hooks/               # Custom React hooks
│   │   └── useCountUp.ts    # Animated counters
│   └── utils/               # Utilities
│       └── normalization.ts # Slug/ID normalization
├── public/
│   └── data/                # Static CSV files
│       ├── striver_sheet_new.csv
│       └── lc_metadata.csv
└── scripts/
    └── verify_integrity.ts  # Logic verification script
```

### Data Flow

```
LeetCode API → Dashboard (fetch) → Normalize IDs → Merge Metadata
                    ↓
            allSolved (memoized)
                    ↓
        ┌───────────┼───────────┐
        ↓           ↓           ↓
   DailyMission  Progress  Analytics
   (filtered)    (ticked)  (animated)
```

**Key Principle**: `Dashboard.tsx` is the **single source of truth**. All child components receive data as props and are purely presentational.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- A **LeetCode account** with solved problems
- (Optional) **Gemini API key** for AI features

### 1. Clone the Repository

```bash
git clone https://github.com/TROJANmocX/GrindGuard-2.0.git
cd GrindGuard-2.0
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key (optional):

```env
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

> **Note**: The app works without Gemini, but AI-powered analysis will be disabled.

### 4. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 5. Login & Sync

1. Sign in with your LeetCode username
2. Click the **"Sync"** button in the header
3. Watch your progress populate automatically

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Vite) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Lint code with ESLint |

---

## 🔧 Configuration

### Supabase Setup (Optional)

If you want to deploy with authentication:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Add your Supabase URL and anon key to `.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### Custom Problem Sheet

To use a different problem set:

1. Place your CSV in `public/data/`
2. Update the path in `src/lib/csvParser.ts`

---

## 🎨 Features Deep Dive

### Smart Sorting

Problems are automatically sorted by priority:
1. **Daily Mission** (Blue "FOCUS" tag)
2. **Weak Topics** (Orange "WEAK" tag - topics <40% complete)
3. **Unsolved Problems**
4. **Solved Problems** (dimmed, moved to bottom)

### Sync Status Indicators

- 🟢 **Green**: Data is fresh (<5 mins old)
- 🟡 **Yellow**: Data is stale (>5 mins old)
- 🔵 **Blue**: Sync in progress
- 🔴 **Red**: Sync failed (old data retained)

### Failure Resilience

If the LeetCode API fails:
- ✅ Your old data stays visible
- 🔴 Status dot turns red
- 🔄 Click "Sync" to retry

---

## 🐛 Troubleshooting

**Problem**: "No problems loaded"
- **Solution**: Check your internet connection and click "Sync"

**Problem**: "Sync Failed" (red dot)
- **Solution**: The LeetCode API might be down. Your cached data is still visible. Try again later.

**Problem**: Solved problems not appearing
- **Solution**: Ensure your LeetCode profile is public. Check username spelling.

**Problem**: TypeScript errors
- **Solution**: Run `npm run typecheck` to see details

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">
  <sub>Built with frustration and coffee by <strong>TROJANmocX</strong>.</sub>
  <br>
  <sub>Because manual tracking is for people who enjoy lying to themselves.</sub>
</div>

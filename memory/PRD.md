# Church Planter's Daily Journal App - PRD

## Original Problem Statement
Build a "Church Planter's Daily Journal App" as a progressive web app. The application serves as a detailed 365-day (now 6-year) devotional and ministry tracker for a church planter in Puerto Princesa, Palawan, Philippines.

## Core Requirements

### Year 1 Features (Implemented)
- **Daily Journal**: Log praises, prayers, and entries using the 5 P's method (Passage, Principle, Practice, Praises, Prayer)
- **People Tracker**: Log outreach contacts with follow-up frequency in days
- **Expense/Budget Ledger**: Track against a ₱11,400/$200 monthly budget
- **Reports**: Weekly and monthly review/accountability reports
- **Data Persistence**: Entries persist across sessions via localStorage
- **Progress Tracking**: Dashboards for actual vs. target metrics

### Extended Features (Implemented)
- **6-Year Plan**: Extended from 1-year to 6-year ministry plan
- **Pre-filled Devotional Content**: First 3 P's (Passage, Principle, Practice) are pre-filled with rhyming, quotable content based on user's Bible reading plan
- **Discipleship Tracker**: Monitor who is discipling whom and their progress
- **Date Picker**: Jump to any date within the 6-year plan
- **Stewardship Section**: Reorganized navigation for People, Expenses, and Reports
- **Settings Page**: Night/Day/Auto mode and font size options
- **Offline Support**: PWA with service worker for offline use
- **Contact Frequency**: Numeric input for days between follow-ups

## Technical Architecture

### Framework & Tech Stack
- **Frontend**: React.js with Tailwind CSS
- **UI Components**: shadcn/ui from `/app/frontend/src/components/ui/`
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Data Persistence**: Browser localStorage via custom useLocalStorage hook
- **Architecture**: Frontend-only Progressive Web App (PWA)
- **Offline Support**: Service Worker (`/app/frontend/public/service-worker.js`)

### File Structure
```
/app/frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── service-worker.js
├── src/
│   ├── components/
│   │   ├── Layout.js
│   │   └── ui/ (shadcn components)
│   ├── contexts/
│   │   └── ThemeContext.js
│   ├── data/
│   │   ├── bibleReadingPlan.js (User's Bible reading plan)
│   │   └── dailyDevotionals.js (Devotional content generator)
│   ├── hooks/
│   │   ├── useDiscipleshipTracking.js
│   │   └── useLocalStorage.js
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── DiscipleshipTracker.js
│   │   ├── ExpenseLedger.js
│   │   ├── JournalEntry.js
│   │   ├── PeopleTracker.js
│   │   ├── Reports.js
│   │   ├── Settings.js
│   │   └── Stewardship.js
│   └── utils/
│       └── dateUtils.js
```

## What's Been Implemented (Dec 2025)

### Session 1 - Core MVP
- Application scaffolding and core pages
- Data persistence with localStorage
- PWA setup with offline support
- 6-year ministry plan with phase targets

### Session 2 - UI Enhancements
- Settings page with theme controls (Light/Dark/Auto)
- Font size selector
- Discipleship tracker
- Date picker for journal navigation
- Stewardship navigation section

### Session 3 - Content & Dark Mode Fixes
- ✅ **Bible Reading Plan**: Implemented user's BibleReadingPlan.docx with complete reading schedule starting March 1, 2026
- ✅ **Contact Frequency**: Added numeric input (days) for follow-up reminders in People Tracker
- ✅ **Dark Mode Text Visibility**: Fixed all pages with bright text colors (`dark:text-white`, `dark:text-stone-200`, `dark:text-stone-300`) for:
  - Journal page: Tasks completed, Year phase/motto, progress metrics, goals
  - Stewardship page: Scripture quote and verse reference
  - Dashboard, People Tracker, Expense Ledger
- ✅ **Rhyming Principles**: Pre-filled devotional content with church planting themed rhymes

### Session 4 - Key Verses & Principles (Dec 4, 2025)
- ✅ **Fixed Bible Passage Display**: Passage now shows full format "Day X - Month DD, YYYY (DayOfWeek) - Book Chapter"
- ✅ **Added Key Verses**: Each day now displays a key verse chosen from that day's chapter
- ✅ **Verse-Based Principles**: Rhyming principles are now based on each day's key verse, not generic rotating themes
- ✅ **Created keyVerses.js**: Comprehensive data file with key verses and rhyming principles for:
  - Psalms 143-150
  - Proverbs 1-31
  - Ecclesiastes 1-12
  - Song of Solomon 1-8
  - Isaiah 1-66
  - Jeremiah 1-52
  - Lamentations 1-5
  - Sample chapters from Ezekiel, Daniel, Hosea, Micah, Habakkuk, Malachi
  - Sample chapters from New Testament (Matthew, Acts, Romans, Philippians, Hebrews, Revelation)
  - Fallback for chapters not yet added

## Prioritized Backlog

### P0 - Completed
- [x] Bible reading plan from user's DOCX (exact Book + Chapter, no verse numbers)
- [x] Full date format with day number and day of week
- [x] Key verse display for each chapter
- [x] Verse-based rhyming principles
- [x] Numeric contact frequency input
- [x] Dark mode text visibility fixes

### P1 - Upcoming
- [ ] Dashboard widgets for "Today's Bible Reading" and "Today's Rhyming Principle"
- [ ] Sunday Accountability Report page

### P2 - Future
- [ ] Memory Verse feature (save verses to a list)
- [ ] PDF export for devotionals
- [ ] Bible verse API integration (display full verse text)
- [ ] Theme switch notifications

## 6-Year Ministry Targets
| Year | Phase | Motto | Key Targets |
|------|-------|-------|-------------|
| 1 | Seed & Survey | Identify 3-5 Timothys; weekly Bible study | 5 disciples, 10 attendance |
| 2 | Root & Grow | Launch Sunday gathering; 2 discipleship groups | 15 disciples, 30 attendance |
| 3 | Branch & Multiply | Timothy-led cell groups; WPU & PSU outreach | 30 disciples, 60 attendance |
| 4 | Structure & Send | Formal leadership; Timothy micro-churches | 50 disciples, 100 attendance |
| 5 | Establish & Commission | Self-sustaining church; send out planters | 80 disciples, 150 attendance |
| 6 | Reproduce & Rejoice | Multiple reproducing groups | 120 disciples, 200 attendance |

## Design Guidelines
- Dark/Light/Auto theme support
- Forest green (#0F5132) primary color
- Mango/orange accent colors
- Serif fonts for headings
- Mobile-first responsive design
- Offline-capable PWA

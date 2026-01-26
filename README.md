# ContentHub - Travel Content CMS Demo

A prototype content management system designed for travel booklet composition. This demo showcases a "build-your-own" CMS approach as an alternative to headless CMS solutions.

![ContentHub Screenshot](https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200&h=600&fit=crop)

## 🎯 Overview

This prototype demonstrates a content management interface for managing:

- **Destinations** - Travel locations with descriptions, media, and venue collections
- **Venues** - Hotels, experiences, activities, and dining linked to destinations
- **Media Library** - Centralized storage for images and videos
- **Content Blocks** - Reusable content components for booklet composition

## 🏗️ Architecture Philosophy

Instead of using a headless CMS, this approach suggests:

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Front-End                          │
│                   (This React App)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│              (REST/GraphQL - Optional)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Database                               │
│            (PostgreSQL / Supabase)                           │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Destinations│───▶│   Venues    │───▶│Content Blocks│     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                   │            │
│         └──────────────────┴───────────────────┘            │
│                            │                                │
│                            ▼                                │
│                    ┌─────────────┐                          │
│                    │    Media    │                          │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloud Storage                              │
│           (S3 / GCS / Cloudflare R2)                        │
└─────────────────────────────────────────────────────────────┘
```

### Suggested Database Schema

```sql
-- Destinations
CREATE TABLE destinations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Venues
CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  destination_id INTEGER REFERENCES destinations(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  description TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Content Blocks
CREATE TABLE content_blocks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  content JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Media
CREATE TABLE media (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  url TEXT NOT NULL,
  size_bytes BIGINT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Junction tables for many-to-many relationships
CREATE TABLE destination_content_blocks (
  destination_id INTEGER REFERENCES destinations(id),
  content_block_id INTEGER REFERENCES content_blocks(id),
  position INTEGER,
  PRIMARY KEY (destination_id, content_block_id)
);

CREATE TABLE venue_content_blocks (
  venue_id INTEGER REFERENCES venues(id),
  content_block_id INTEGER REFERENCES content_blocks(id),
  position INTEGER,
  PRIMARY KEY (venue_id, content_block_id)
);

-- Polymorphic media links
CREATE TABLE media_links (
  id SERIAL PRIMARY KEY,
  media_id INTEGER REFERENCES media(id),
  linkable_type VARCHAR(50),  -- 'destination', 'venue', 'content_block'
  linkable_id INTEGER,
  position INTEGER
);
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/content-cms-demo.git
cd content-cms-demo

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
content-cms-demo/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── index.jsx       # Shared UI components
│   │   ├── Dashboard.jsx       # Main dashboard view
│   │   ├── EditorPanel.jsx     # Slide-out editor
│   │   ├── Header.jsx          # Top navigation bar
│   │   └── Sidebar.jsx         # Left navigation
│   ├── data/
│   │   └── mockData.js         # Demo data
│   ├── App.jsx                 # Main application
│   ├── index.css               # Global styles
│   └── main.jsx                # Entry point
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## ✨ Features

### Dashboard
- Overview statistics for all content types
- Quick access to recent destinations and venues
- Shortcuts to generate booklets and upload media

### Destinations Management
- Grid/list view toggle
- Search and filter
- Status management (draft/published/archived)
- Inline editing with slide-out panel

### Venues Management
- Filter by destination
- Type categorization (Hotel, Experience, Activity, Dining)
- Content block linking

### Media Library
- Grid view with thumbnails
- Multi-select for batch operations
- Filter by type (images/videos)
- Drag & drop upload zone
- Usage tracking

### Content Blocks
- Reusable content templates
- Usage statistics across destinations
- Type categorization

### Editor Panel
- Cover image upload
- Rich text fields
- Status management
- Content block ordering
- Media linking

## 🛠️ Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 🔮 Future Enhancements

To make this production-ready, you would add:

1. **Backend Integration**
   - Connect to Supabase/PostgreSQL
   - Implement REST or GraphQL API
   - Add authentication (Supabase Auth, Auth0, etc.)

2. **Media Handling**
   - Cloud storage integration (S3, GCS, R2)
   - Image optimization and resizing
   - Video transcoding

3. **Rich Text Editing**
   - Add TipTap or Slate.js for content blocks
   - Markdown support
   - Embed support

4. **Composition Engine**
   - PDF generation
   - Template system
   - Variable substitution

5. **Collaboration**
   - Multi-user support
   - Version history
   - Comments and approvals

## 📄 License

MIT License - feel free to use this as a starting point for your own projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built as a prototype to demonstrate the "build-your-own CMS" approach for document composition systems.

# Miniature Paint Color Wheel

An interactive color wheel for miniature hobbyists. Visualize paint colors from major brands (Citadel, Army Painter, Vallejo, Green Stuff World) on an HSL color wheel with color theory scheme matching.

**Live site:** [colorwheel.nathanhealea.com](https://colorwheel.nathanhealea.com)

## Features

- HSL color wheel with 190+ paints from major miniature paint brands
- Color theory scheme matching (complementary, split-complementary, analogous)
- Search and filter by brand, color segment, and paint type
- Zoom and pan with interactive SVG canvas
- Detail panel with HSL sliders, duplicate detection, and scheme matches
- Authentication via email, Google, and Discord

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [Supabase](https://supabase.com) (auth & database)
- [TailwindCSS](https://tailwindcss.com) 4 + [daisyUI](https://daisyui.com) 5
- [Zustand](https://zustand.docs.pmnd.rs) for state management
- [Vitest](https://vitest.dev) for testing

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for local Supabase)

### Quick Start

```bash
# Clone the repository
git clone git@github.com:NathanHealea/colorwheel.nathanhealea.com.git
cd colorwheel.nathanhealea.com

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start local Supabase (Docker must be running)
npx supabase start

# Update .env.local with the keys printed by npx supabase start
# (see CONTRIBUTING.md for details)

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup instructions including Supabase configuration and environment variables.

## Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start dev server (default port 3000)|
| `npm run build`   | Production build                    |
| `npm run start`   | Serve production build              |
| `npm run lint`    | Run ESLint                          |
| `npm run prettify`| Format all files with Prettier      |
| `npm run test`    | Run tests with Vitest               |

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

## License

This project is not currently licensed for distribution. All rights reserved.

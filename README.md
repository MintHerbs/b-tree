# B+ Tree Visualizer

An interactive, animated B+ tree visualizer built for students learning tree data structures.

## Stack

- **Framework**: React 18 (JavaScript)
- **Bundler**: Vite
- **Styling**: CSS Modules
- **Animation**: SVG + CSS transitions
- **Routing**: React Router v6
- **Deployment**: Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
/
├── public/
│   └── favicon.svg                    # App icon
├── src/
│   ├── main.jsx                       # Vite entry point
│   ├── App.jsx                        # Router setup
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx            # Initial input screen
│   │   └── TreePage.jsx               # Main visualization screen
│   │
│   ├── components/
│   │   ├── Navbar/                    # Top navigation bar
│   │   ├── InputBox/                  # Claude-style centered input
│   │   ├── TreeCanvas/                # SVG viewport with pan/zoom
│   │   ├── TreeNode/                  # Single B+ tree node renderer
│   │   ├── TreeEdge/                  # SVG lines between nodes
│   │   ├── PointerArrow/              # Animated traversal arrow
│   │   ├── OperationsPanel/           # Right sidebar controls
│   │   └── StepControls/              # Bottom playback controls
│   │
│   ├── lib/
│   │   ├── BPlusTree.js               # Pure B+ tree data structure
│   │   └── treeLayout.js              # Tree to SVG coordinate conversion
│   │
│   ├── engine/
│   │   └── AnimationEngine.js         # Animation step generator
│   │
│   ├── hooks/
│   │   ├── useBPlusTree.js            # Tree state management
│   │   └── useAnimationPlayer.js      # Animation playback control
│   │
│   └── styles/
│       └── global.css                 # CSS variables and resets
```

## Features

- B+ Tree Visualizer with animated insert/delete operations
- ER Diagram Builder with AI-powered schema generation
- Step-by-step animation playback controls
- Interactive SVG canvas with pan and zoom
- Responsive design for all screen sizes
- Multi-tool landing page with starfield background
- External CPA Calculator integration

## Development Status

All files have been scaffolded with descriptive comments. Each component is a stub ready for implementation.

## License

MIT

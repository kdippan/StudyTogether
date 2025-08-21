# Customizable Dashboard

A production-quality, single-page customizable dashboard built with pure HTML, CSS, and vanilla JavaScript. Features drag-and-drop widgets, theming, persistence, and comprehensive accessibility support.

![Dashboard Preview](https://github.com/user-attachments/assets/14f90e7c-70e9-4885-bbc8-618698ea7a09)

## ✨ Features

### Core Functionality
- **🎯 Drag & Drop Grid System** - Snap-to-grid positioning with collision detection
- **📏 Resizable Widgets** - Drag handles for precise sizing control
- **💾 Auto-Persistence** - Layout and settings saved to localStorage
- **🎨 Multiple Themes** - Light, Dark, AMOLED, and System preference detection
- **📱 Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- **♿ Accessibility First** - WCAG AA compliant with full keyboard navigation

### Widget Library (10 Widgets)
1. **⏰ Clock** - Digital/analog display with timezone support
2. **🌤️ Weather** - Current conditions with offline fallback
3. **📝 Notes** - Rich text editor with autosave and formatting
4. **✅ Todo List** - Task management with filters and statistics
5. **🍅 Pomodoro Timer** - Focus timer with customizable cycles
6. **📅 Calendar** - Mini calendar with quick notes
7. **💭 Quotes** - Inspirational quotes with categories
8. **📈 Stocks** - Stock prices with mock data (extensible)
9. **🔗 Quick Links** - Bookmark manager with favicons
10. **💻 System Info** - Device and browser information

### Advanced Features
- **🔍 Widget Search** - Find widgets by name or type
- **⚙️ Per-Widget Settings** - Customizable configuration for each widget
- **📤 Import/Export** - Save and share dashboard layouts
- **🎮 Keyboard Shortcuts** - Full keyboard control and navigation
- **🌐 Offline Support** - Works without internet connection
- **🎯 Context Menus** - Right-click actions for widgets
- **🔄 Auto-Refresh** - Configurable refresh rates for dynamic content

## 🚀 Setup

### Simple Setup
1. Clone the repository
2. Open `dashboard/index.html` in any modern browser
3. No build process or server required!

### With Local Server (Recommended)
```bash
cd dashboard
python3 -m http.server 8080
# or
npx serve .
```

## ⌨️ Keyboard Shortcuts

### General
- `Ctrl/Cmd + N` - Add new widget
- `Ctrl/Cmd + S` - Save layout
- `Ctrl/Cmd + O` - Import layout
- `Ctrl/Cmd + E` - Export layout
- `Ctrl/Cmd + Shift + R` - Reset to default
- `T` - Toggle theme
- `?` - Show keyboard shortcuts help
- `Escape` - Close modals/menus
- `Ctrl/Cmd + /` - Focus search

### Widget Navigation
- `Arrow Keys` - Move selected widget
- `Shift + Arrow Keys` - Resize selected widget
- `Page Up/Down` - Move widget up/down by 5 rows
- `Home/End` - Move widget to start/end of row
- `Tab` - Navigate between widgets

### Mouse/Touch
- **Drag** widget header to move
- **Drag** widget edges/corners to resize
- **Right-click** widget for context menu
- **Long-press** on touch devices for context menu

## 🎨 Theming

### Built-in Themes
- **Light** - Clean and bright
- **Dark** - Easy on the eyes
- **AMOLED** - Pure black for OLED displays
- **System** - Follows system preference

### Customizing Themes
Edit `css/themes.css` to modify existing themes or add new ones:

```css
[data-theme="custom"] {
  --bg: #your-background;
  --text: #your-text-color;
  --primary: #your-primary-color;
  /* ... other CSS variables */
}
```

## 🔧 Adding New Widgets

### 1. Create Widget Class
Create a new file in `js/widgets/my-widget.js`:

```javascript
export class MyWidget {
    static type = 'my-widget';
    static title = 'My Widget';
    static description = 'What my widget does';
    
    constructor(config = {}) {
        this.config = { title: 'My Widget', ...config };
        this.element = null;
    }

    async createElement() {
        this.element = document.createElement('div');
        this.element.className = 'widget-grid-item my-widget-container';
        this.element.innerHTML = `/* your HTML */`;
        return this.element;
    }

    async init() {
        // Initialize your widget
    }

    getConfig() {
        return { ...this.config };
    }

    destroy() {
        if (this.element) this.element.remove();
    }
}
```

### 2. Register Widget
Add to `js/main.js`:

```javascript
import { MyWidget } from './widgets/my-widget.js';

// In registerWidgetTypes():
const types = [
    // ... existing widgets
    MyWidget
];
```

### 3. Add Styles
Add widget-specific styles to `css/widgets.css`:

```css
.my-widget {
    /* Your widget styles */
}
```

## 🎯 Performance Optimizations

- **GPU Acceleration** - Transforms use `translate3d` for smooth animations
- **Intersection Observer** - Lazy loading for off-screen widgets
- **Debounced Operations** - Efficient state persistence
- **RequestAnimationFrame** - Smooth 60fps drag operations
- **Reduced Motion Support** - Respects user accessibility preferences

## 📱 Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile**: Touch-optimized with full feature parity

## 🏗️ Architecture

### File Structure
```
dashboard/
├── index.html          # Main HTML file
├── assets/
│   ├── favicon.svg     # App icon
│   └── icons.svg       # SVG sprite sheet
├── css/
│   ├── base.css        # Variables, reset, utilities
│   ├── layout.css      # Grid system, responsive layout
│   ├── components.css  # Buttons, modals, forms
│   ├── widgets.css     # Widget-specific styles
│   ├── themes.css      # Theme definitions
│   └── animations.css  # Animations and transitions
└── js/
    ├── main.js         # Application entry point
    ├── state.js        # State management and persistence
    ├── grid.js         # Drag/drop/resize system
    ├── ui.js           # UI components and interactions
    └── widgets/        # Individual widget modules
        ├── clock.js
        ├── weather.js
        ├── notes.js
        ├── todo.js
        ├── pomodoro.js
        ├── calendar.js
        ├── quotes.js
        ├── stocks.js
        ├── links.js
        └── system.js
```

### Design Patterns
- **Module System** - ES6 modules for clean separation
- **Event-Driven** - Pub/sub pattern for loose coupling
- **State Management** - Centralized state with persistence
- **Component-Based** - Self-contained widget architecture

## 🧪 Manual Testing Checklist

### Core Functionality
- [ ] Drag widgets to new positions
- [ ] Resize widgets using handles
- [ ] Widgets snap to grid properly
- [ ] Layout persists after page reload
- [ ] Add/remove widgets works
- [ ] Widget settings save correctly

### Themes & Accessibility
- [ ] All themes apply correctly
- [ ] System theme follows OS preference
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] High contrast mode support
- [ ] Reduced motion respected

### Import/Export
- [ ] Export creates valid JSON
- [ ] Import restores layout correctly
- [ ] Reset to default works
- [ ] Error handling for invalid files

### Responsive Design
- [ ] Works on mobile devices
- [ ] Touch interactions functional
- [ ] Layout adapts to screen size
- [ ] Performance remains smooth

## 🔍 Troubleshooting

### Common Issues

**Widgets not loading:**
- Check browser console for JavaScript errors
- Ensure all files are served from HTTP (not file://)

**Drag/drop not working:**
- Verify pointer events are supported
- Check for JavaScript conflicts

**Layout not persisting:**
- Confirm localStorage is available
- Check storage quota limits

**Performance issues:**
- Disable animations with reduced motion
- Reduce number of active widgets
- Use performance tools to identify bottlenecks

## 📄 License

This dashboard is part of the StudyTogether project. Check the main repository for license information.

## 🤝 Contributing

1. Follow the established code patterns
2. Add proper JSDoc comments
3. Test on multiple browsers
4. Ensure accessibility compliance
5. Update documentation as needed

---

Built with ❤️ using pure web technologies - no frameworks required!
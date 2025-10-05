# Puppeteer MCP Guide for Claude

## Purpose
Use Puppeteer MCP to test and verify frontend implementations during development. This enables visual regression testing and automated UI verification.

## Key Information
- **Dev Server URL**: `http://localhost:8080` (not 5173)
- **Default viewport**: 1200x800 for desktop testing
- **Mobile viewport**: 375x667 for mobile testing

## Core Commands

### Navigation

**CRITICAL**: Always use GPU acceleration flags when navigating to ensure proper rendering of CSS transparency, shadows, and visual effects in WSL.

```
mcp__puppeteer__puppeteer_navigate
- url: "http://localhost:8080"
- launchOptions: {
    "headless": true,
    "args": [
      "--enable-gpu",
      "--use-gl=desktop",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--enable-accelerated-2d-canvas"
    ]
  }
```

**Why these flags matter**:
- Without GPU acceleration, WSL renders CSS opacity/transparency as diagonal stripe patterns
- Shadows, blurs, and semi-transparent backgrounds will look broken
- These flags force Chromium to use hardware acceleration for proper compositing

### Screenshots
```
mcp__puppeteer__puppeteer_screenshot
- name: "descriptive-name"
- width: 1200
- height: 800
- selector: ".specific-element"  // Optional: capture specific element
```

### Interactions
```
mcp__puppeteer__puppeteer_click
- selector: "#button-id"

mcp__puppeteer__puppeteer_fill
- selector: "input[name='email']"
- value: "test@example.com"

mcp__puppeteer__puppeteer_select
- selector: "select#category"
- value: "option-value"
```

### Page Inspection
```
mcp__puppeteer__puppeteer_evaluate
- script: |
    ({
      title: document.title,
      hasContent: document.querySelector('.main-content') !== null,
      errorCount: document.querySelectorAll('.error').length,
      formData: Object.fromEntries(new FormData(document.querySelector('form')))
    })
```

## Testing Workflow

### 1. Before Implementation
Take a baseline screenshot to document current state:
```
mcp__puppeteer__puppeteer_screenshot
- name: "feature-before"
```

### 2. After Implementation
Verify the changes:
```
# Navigate to the page (with GPU acceleration)
mcp__puppeteer__puppeteer_navigate
- url: "http://localhost:8080/path"
- launchOptions: {
    "headless": true,
    "args": [
      "--enable-gpu",
      "--use-gl=desktop",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--enable-accelerated-2d-canvas"
    ]
  }

# Wait for content to load
mcp__puppeteer__puppeteer_evaluate
- script: "new Promise(r => setTimeout(r, 2000))"

# Take screenshot
mcp__puppeteer__puppeteer_screenshot
- name: "feature-after"

# Verify functionality
mcp__puppeteer__puppeteer_evaluate
- script: "/* check specific elements/state */"
```

### 3. Test User Flows
```
# Example: Test login flow
1. Navigate to login page
2. Fill email field
3. Fill password field
4. Click submit button
5. Verify redirect to dashboard
6. Check for user info display
```

## Common Verification Scripts

### Check if React loaded
```
mcp__puppeteer__puppeteer_evaluate
- script: |
    ({
      hasReact: typeof React !== 'undefined',
      hasRoot: document.getElementById('root') !== null,
      rootContent: document.getElementById('root')?.children.length > 0
    })
```

### Check for errors
```
mcp__puppeteer__puppeteer_evaluate
- script: |
    ({
      consoleErrors: window.__errors || [],
      uiErrors: Array.from(document.querySelectorAll('.error, [class*="error"]')).map(e => e.textContent),
      hasErrorBoundary: document.querySelector('[data-error-boundary]') !== null
    })
```

### Get form values
```
mcp__puppeteer__puppeteer_evaluate
- script: |
    (() => {
      const form = document.querySelector('form');
      if (!form) return null;
      return Object.fromEntries(new FormData(form));
    })()
```

### Check component state
```
mcp__puppeteer__puppeteer_evaluate
- script: |
    ({
      modalOpen: document.querySelector('.modal') !== null,
      menuExpanded: document.querySelector('[aria-expanded="true"]') !== null,
      activeTab: document.querySelector('.tab.active')?.textContent
    })
```

## Best Practices

### DO:
- Take screenshots before and after changes
- Test both desktop and mobile viewports
- Verify console has no errors after interactions
- Check accessibility attributes (aria-labels, roles)
- Test keyboard navigation for interactive elements

### DON'T:
- Assume elements load instantly (use timeouts)
- Forget to check error states
- Skip mobile testing
- Ignore console warnings

## Mobile Testing
```
# Set mobile viewport (with GPU acceleration)
mcp__puppeteer__puppeteer_navigate
- url: "http://localhost:8080"
- launchOptions: {
    "headless": true,
    "args": [
      "--enable-gpu",
      "--use-gl=desktop",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--enable-accelerated-2d-canvas"
    ]
  }

# Then immediately set viewport
mcp__puppeteer__puppeteer_evaluate
- script: "window.resizeTo(375, 667)"

# Take mobile screenshot
mcp__puppeteer__puppeteer_screenshot
- name: "feature-mobile"
- width: 375
- height: 667
```

## Debugging Tips

### When elements aren't found:
1. Check if page loaded: `document.readyState`
2. Wait for specific element: `document.querySelector('.target') !== null`
3. List all matching elements: `document.querySelectorAll('.class').length`

### When interactions fail:
1. Check element visibility: `element.offsetParent !== null`
2. Verify not disabled: `!element.disabled`
3. Check z-index issues: `window.getComputedStyle(element).zIndex`

## Remember
- Dev server must be running (`npm run dev`)
- Server runs on port 8080, not 5173
- Always verify changes visually with screenshots
- Test user flows, not just static views
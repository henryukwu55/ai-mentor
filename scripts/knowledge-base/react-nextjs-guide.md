# React & Next.js — Common Errors, Hook Rules, and Patterns

## The Rules of Hooks (must follow always)

1. Only call hooks at the top level — never inside loops, conditions, or nested functions
2. Only call hooks from React function components or custom hooks
3. Hook names must start with `use`

**Wrong:**
```js
function MyComponent({ isLoggedIn }) {
  if (isLoggedIn) {
    const [count, setCount] = useState(0); // WRONG — conditional hook
  }
}
```
**Right:**
```js
function MyComponent({ isLoggedIn }) {
  const [count, setCount] = useState(0); // Always called, at the top
  if (!isLoggedIn) return null;
}
```

---

## useState

**State updates are asynchronous — the new value is not available on the next line:**
```js
const [count, setCount] = useState(0);

function handleClick() {
  setCount(count + 1);
  console.log(count); // Still logs 0, not 1
}
```

**Updating state based on previous state — always use the functional form:**
```js
// WRONG — can use stale value in concurrent mode
setCount(count + 1);

// RIGHT
setCount(prev => prev + 1);
```

**Objects and arrays in state must be replaced, not mutated:**
```js
// WRONG — React doesn't detect this change
state.items.push(newItem);
setState(state);

// RIGHT
setState(prev => ({ ...prev, items: [...prev.items, newItem] }));
```

---

## useEffect

**Dependency array rules:**
- Empty array `[]` → runs once after first render
- No array → runs after every render (usually a bug)
- `[a, b]` → runs when a or b changes

**Missing dependency warning from ESLint is important — don't suppress it blindly.**
If you exclude a dependency, you risk stale closures. Fix the dependency instead.

**Cleanup — return a function to stop subscriptions, clear timers, cancel fetches:**
```js
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // cleanup
}, []);
```

**Don't make the effect callback itself async — create an inner async function:**
```js
// WRONG
useEffect(async () => { ... }, []);

// RIGHT
useEffect(() => {
  async function load() { ... }
  load();
}, []);
```

---

## Next.js Specific

**'use client' directive:**
Required at the top of any file that uses useState, useEffect, browser APIs
(localStorage, window, document), or event handlers. Server Components (default)
cannot use these.

**Hydration errors ("Text content does not match server-rendered HTML"):**
Caused by code that produces different output on server vs client, e.g. reading
`localStorage`, `new Date()`, `Math.random()`, or `window` during render.
Fix: wrap browser-only code in useEffect, or use `dynamic(() => import(...), { ssr: false })`.

**Environment variables:**
- `NEXT_PUBLIC_` prefix → available in the browser
- No prefix → server-side only (API routes, Server Components)
- Changes to `.env.local` require a server restart

**Image optimisation:**
Use `next/image` instead of `<img>`. Always provide `width`, `height` or `fill` prop.

**Routing (App Router):**
- `app/page.tsx` → route `/`
- `app/about/page.tsx` → route `/about`
- `app/api/users/route.ts` → API route `/api/users`
- `layout.tsx` wraps all child pages with shared UI

---

## Common React Performance Mistakes

**Defining objects/arrays/functions inside JSX causes re-renders:**
```js
// WRONG — new object every render triggers child re-render
<Child style={{ color: "red" }} onClick={() => doSomething()} />

// RIGHT — define outside component or memoize
const style = { color: "red" };
const handleClick = useCallback(() => doSomething(), []);
<Child style={style} onClick={handleClick} />
```

**When to use useMemo and useCallback:**
- `useCallback` — memoize a function passed to a child component wrapped in `React.memo`
- `useMemo` — memoize an expensive calculation
- Don't use them everywhere — they have overhead. Profile first.

---

## Debugging React

- **React DevTools** (browser extension) — inspect component tree, state, and props live
- `console.log` inside render to track how often a component re-renders
- Add `key` prop to list items — missing `key` causes incorrect re-render behaviour
- If state doesn't update, check you're not mutating the original object

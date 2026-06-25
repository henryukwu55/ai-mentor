# JavaScript & TypeScript — Common Errors and Debugging Guide

## TypeError: Cannot read properties of undefined (reading 'X')

This is the most common JS error. It means you tried to access a property on
something that is `undefined`.

**Root causes and fixes:**
- An async fetch hasn't resolved yet — use optional chaining: `user?.profile?.name`
- An array is empty and you accessed index 0 — guard with `arr.length > 0`
- A function returned `undefined` when you expected an object — check the return statement
- You destructured before data arrived — initialise with a default: `const { name = "" } = user ?? {}`

**Debugging steps:**
1. `console.log` the variable just before the line that crashes
2. Use the browser DevTools Sources tab to set a breakpoint
3. Ask: "where does this value come from, and could it ever be undefined?"

---

## TypeError: X is not a function

**Root causes:**
- You called a method that doesn't exist on that type, e.g. calling `.map()` on an object instead of an array
- You forgot `()` when calling a function: `doSomething` vs `doSomething()`
- A default import was used instead of a named import (or vice versa)

---

## Async / Await Mistakes

**Forgetting await:**
```js
// WRONG — fetchUser returns a Promise, not the user object
const user = fetchUser(id);
console.log(user.name); // TypeError

// RIGHT
const user = await fetchUser(id);
console.log(user.name);
```

**Using await outside an async function:**
```js
// WRONG
function loadData() {
  const data = await fetch("/api/data"); // SyntaxError
}

// RIGHT
async function loadData() {
  const data = await fetch("/api/data");
}
```

**Forgetting to handle errors:**
Always wrap await calls in try/catch, or chain .catch():
```js
try {
  const res = await fetch("/api/data");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
} catch (err) {
  console.error("Failed to load:", err);
}
```

---

## TypeScript Errors

**Type 'X' is not assignable to type 'Y':**
You are passing the wrong shape of data. Read the error carefully — TypeScript
tells you exactly which field is wrong and what it expected.

**Object is possibly 'null' or 'undefined':**
TypeScript is warning you about a runtime crash risk. Fix it with:
- Optional chaining: `obj?.field`
- Non-null assertion (only when you are 100% sure): `obj!.field`
- A type guard: `if (obj !== null) { ... }`

**Property 'X' does not exist on type 'Y':**
You are accessing a field that isn't in the type definition. Either:
- You made a typo in the field name
- The API returned a different shape than expected — add `console.log` to check
- You need to extend the type with an interface or add the field to the type

**Using `any` is a code smell.** When you reach for `any`, ask yourself what the
actual shape of the data is and define a proper type instead.

---

## Scope and Closure

**Variable declared with `var` leaks out of loops:**
```js
// WRONG — all callbacks log 3
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// RIGHT — use let
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
```

**Stale closure in React (most common cause of "my state is always 0"):**
Inside a `useEffect` or `setTimeout`, the closure captures the value of state
at the time it was created. Use a ref to get the live value:
```js
const countRef = useRef(count);
useEffect(() => { countRef.current = count; }, [count]);
```

---

## Debugging Strategies

1. **Read the stack trace top to bottom.** The first line is where it crashed,
   but the cause is usually a few lines down in your own code.
2. **Isolate the problem.** Comment out code until the error stops, then add
   it back line by line.
3. **Use console.log liberally.** Log the type AND value: `console.log(typeof x, x)`
4. **Check the Network tab.** For API errors, look at the actual request and
   response, not just the JS error.
5. **Search the exact error message.** Copy the core error message (not the file
   path) into a search engine — someone has almost certainly seen it before.
6. **Rubber duck debug.** Explain the problem out loud, step by step, as if
   to someone who knows nothing. You often find the bug while explaining it.
7. **Take a break.** After 30 minutes stuck on one bug, get up. Fresh eyes find
   things tired eyes miss.

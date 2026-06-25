# Data Structures & Algorithms — Essentials for Students

## Why This Matters

Even if your project doesn't use a linked list directly, interviewers and
defence panelists use algorithm questions to test whether you can think
logically, break down a problem, and reason about performance.

---

## Time Complexity (Big O Notation)

Big O describes how an algorithm's runtime grows as input size (n) grows.

| Complexity | Name | Example |
|------------|------|---------|
| O(1) | Constant | Array lookup by index, hashmap get |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Loop through an array once |
| O(n log n) | Linearithmic | Efficient sort (merge sort, quicksort) |
| O(n²) | Quadratic | Nested loops over same array |
| O(2ⁿ) | Exponential | Brute-force subsets |

**Rule of thumb for your project:** If your dataset can grow large,
avoid O(n²) in hot paths. If you're doing a full table scan on every request,
add a database index.

---

## Arrays and Objects (Hashmaps)

Arrays and hashmaps (objects in JS, dicts in Python) are the most-used
data structures in real projects.

**Use a hashmap when you need O(1) lookup by key:**
```js
// O(n) — loops through every user
function findUser(users, id) {
  return users.find(u => u.id === id);
}

// O(1) — lookup by key
const userMap = Object.fromEntries(users.map(u => [u.id, u]));
function findUser(id) { return userMap[id]; }
```

**Frequency counting pattern:**
```js
function mostCommon(arr) {
  const count = {};
  for (const item of arr) count[item] = (count[item] ?? 0) + 1;
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
}
```

---

## Sorting

JavaScript's `.sort()` sorts lexicographically by default (treats elements as strings).
**Always provide a comparator for numbers:**
```js
[10, 2, 21].sort()           // [10, 2, 21] — WRONG (lexicographic)
[10, 2, 21].sort((a, b) => a - b)  // [2, 10, 21] — correct ascending
[10, 2, 21].sort((a, b) => b - a)  // [21, 10, 2] — correct descending
```

---

## Recursion

A function that calls itself. Needs a **base case** to stop.

```js
function factorial(n) {
  if (n <= 1) return 1;       // base case
  return n * factorial(n - 1); // recursive case
}
```

**Stack overflow** happens when recursion goes too deep. For deeply nested
data, consider iteration with an explicit stack instead.

---

## Common Algorithm Patterns

**Two-pointer technique** — O(n) instead of O(n²) for searching pairs:
```js
// Find two numbers that sum to target in a sorted array
function twoSum(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [arr[left], arr[right]];
    if (sum < target) left++;
    else right--;
  }
  return null;
}
```

**Sliding window** — efficient substring/subarray problems:
```js
// Max sum of k consecutive elements
function maxSubarraySum(arr, k) {
  let sum = arr.slice(0, k).reduce((a, b) => a + b, 0);
  let max = sum;
  for (let i = k; i < arr.length; i++) {
    sum += arr[i] - arr[i - k];
    max = Math.max(max, sum);
  }
  return max;
}
```

---

## Trees and Graphs (for defence questions)

**Binary tree traversal:**
```js
function inOrder(node) {
  if (!node) return [];
  return [...inOrder(node.left), node.val, ...inOrder(node.right)];
}
```

**Breadth-First Search (BFS) — level by level, uses a queue:**
Use for: shortest path, level-order traversal

**Depth-First Search (DFS) — goes deep first, uses a stack or recursion:**
Use for: detecting cycles, tree traversal, connected components

**When a panelist asks "how does your system find related items?":**
This is a graph traversal problem. Your RAG system is a form of similarity
graph — each document is a node, similarity scores are edge weights.

---

## Approaching Algorithm Problems in an Interview or Defence

1. **Clarify the problem.** Ask about input size, edge cases, expected output format.
2. **State a brute-force solution first.** "The naive approach would be O(n²) because..."
3. **Optimise.** "We can improve this to O(n) by using a hashmap..."
4. **Write the code.** Clean, readable, with variable names that make sense.
5. **Test it.** Walk through with a small example by hand.
6. **Discuss trade-offs.** Time vs space, readability vs performance.

Thinking out loud throughout the process is more important than getting the
optimal answer immediately. Interviewers evaluate your reasoning process.

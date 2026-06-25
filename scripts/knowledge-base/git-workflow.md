# Git — Workflow, Branching, and Common Problems

## Core Concepts

**Repository** — the project folder tracked by Git
**Commit** — a snapshot of changes with a message
**Branch** — a parallel line of development
**Remote** — the copy of the repo on GitHub (or other host)
**HEAD** — pointer to the commit you're currently on

---

## Daily Workflow

```bash
git status                    # what's changed?
git add .                     # stage all changes
git add src/components/Button.tsx  # stage one file
git commit -m "feat: add logout button"
git push origin main          # push to GitHub

git pull origin main          # get latest changes from remote
```

---

## Branching Strategy (Feature Branch Workflow)

Never commit directly to `main` on a team project.

```bash
git checkout -b feat/user-authentication   # create + switch to new branch
# ... do your work ...
git add . && git commit -m "feat: implement JWT login"
git push origin feat/user-authentication   # push branch to GitHub
# → open a Pull Request on GitHub
# → get it reviewed
# → merge to main
git checkout main && git pull              # update local main
git branch -d feat/user-authentication    # clean up
```

**Branch naming conventions:**
- `feat/short-description` — new feature
- `fix/short-description` — bug fix
- `chore/short-description` — maintenance (deps, config)
- `docs/short-description` — documentation only

---

## Commit Message Convention (Conventional Commits)

Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

```
feat(auth): add Google OAuth login
fix(cart): prevent negative quantities
docs: update API setup instructions
refactor(db): extract query helpers into lib/db.ts
chore: bump dependencies to latest patch versions
```

Good commit messages explain **why**, not just **what**:
- Bad:  `fix bug`
- Bad:  `changed stuff`
- Good: `fix: cart total not updating when quantity changes`
- Good: `feat: persist sessions to Supabase for analytics tracking`

---

## Merge Conflicts — How to Resolve Them

A merge conflict happens when two branches changed the same lines. Git marks the
conflict in the file like this:

```
<<<<<<< HEAD (your branch)
const greeting = "Hello";
=======
const greeting = "Hi there";
>>>>>>> main
```

**Steps to resolve:**
1. Open the conflicting file
2. Decide which version is correct (or combine them)
3. Delete the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
4. `git add` the resolved file
5. `git commit` (Git pre-fills the merge commit message)

**Tips:**
- Use VS Code's built-in merge editor (shows Accept Current / Accept Incoming buttons)
- Talk to the person who made the other change before overwriting their work
- Keep commits small and frequent to reduce the chance of large conflicts

---

## Undoing Things

```bash
# Undo the last commit, keep the changes staged
git reset --soft HEAD~1

# Undo the last commit, unstage the changes (changes still in working dir)
git reset HEAD~1

# DANGER: Undo last commit AND throw away all changes permanently
git reset --hard HEAD~1

# Discard all unstaged changes in a file
git checkout -- src/App.tsx

# Discard ALL unstaged changes
git checkout -- .

# Revert a commit (safe for shared branches — creates a new undo commit)
git revert abc1234
```

**Never force-push to a shared branch.** `git push --force` rewrites history
and will break everyone else's local copies.

---

## Common Git Mistakes

**Committed sensitive data (API keys, passwords):**
1. Immediately rotate/invalidate the key — assume it is compromised
2. Remove it from the file
3. Use `git filter-repo` or BFG Repo Cleaner to scrub it from history
4. Force-push (tell your team first)
5. Add it to `.gitignore` and use environment variables going forward

**Committed to main directly when you shouldn't have:**
```bash
git checkout -b feat/my-feature    # create branch at current commit
git checkout main
git reset --hard origin/main       # reset main back to remote state
```

**`.gitignore` not working:**
If a file was already tracked before being added to `.gitignore`, Git still
tracks it. Fix:
```bash
git rm --cached path/to/file
git commit -m "chore: stop tracking secret file"
```

**Pushed to wrong branch:**
```bash
git push origin HEAD:correct-branch-name
git push origin :wrong-branch-name  # delete the wrong branch from remote
```

---

## .gitignore for Node/Next.js Projects

```
node_modules/
.next/
.env
.env.local
*.log
.DS_Store
dist/
.turbo/
```

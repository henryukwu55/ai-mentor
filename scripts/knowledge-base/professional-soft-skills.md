# Professional & Soft Skills for Software Engineers

## Communicating Technical Work to Non-Technical Stakeholders

The best engineers can explain complex ideas simply. This is not about
dumbing things down — it is about meeting your audience where they are.

**The Feynman Technique:**
1. Explain the concept as if to a 12-year-old
2. Identify gaps in your explanation
3. Fill the gaps by going back to the source material
4. Simplify further, using analogies

**Analogies for common technical concepts:**
- Database index = book index — instead of reading every page, jump straight to the right one
- Cache = notepad on your desk — faster than walking to the filing cabinet every time
- API = restaurant menu — you order from it without knowing how the kitchen works
- Load balancer = hotel receptionist — routes each guest to an available room

**In status updates, lead with impact, not process:**
- Weak: "I spent the week refactoring the authentication module."
- Strong: "Login is now 40% faster and more secure — I replaced the old session system with JWT."

---

## Giving and Receiving Code Review Feedback

**Giving feedback:**
- Comment on code, not the person. "This function is hard to follow" not "You wrote confusing code."
- Ask questions instead of making demands. "Could this be extracted into a helper?" vs "Extract this."
- Distinguish between blockers and suggestions. Use "nit:" for minor style preferences.
- Explain why, not just what. "Consider memoising this — it runs on every keystroke."

**Receiving feedback:**
- Assume good intent. Most reviewers are trying to help the codebase, not criticise you.
- Ask for clarification before disagreeing. "Could you say more about what you mean?"
- "Disagree and commit" — you can implement the suggestion while still noting your view.
- Thank reviewers for thorough reviews. Detailed feedback is a gift.

---

## Estimating and Managing Deadlines

**Why developers underestimate:**
- They estimate for the happy path, forgetting edge cases, testing, code review, and integration
- They forget about meetings, context-switching, and unexpected bugs
- Tasks that "should take an hour" often have hidden dependencies

**Rule of thumb:** Take your initial estimate and multiply by 2–3 for individual
tasks, 3–5 for tasks you have never done before.

**How to communicate when you will miss a deadline:**
Tell your manager or team lead as soon as you know — not the day before or on the day.
> "I underestimated this task. I originally said Friday but I now think it will be
> Monday. Here's what's blocking me and what I'm doing to unblock it."

Surprises are worse than bad news delivered early.

---

## Asking for Help Effectively

A common mistake among junior developers is either (1) never asking for help and
getting stuck for days, or (2) asking for help before trying to solve the problem
themselves.

**The "15-minute rule":** Try to solve the problem yourself for 15 minutes first.
After 15 minutes of no progress, ask for help.

**How to ask a good question:**
1. State what you are trying to do
2. State what you expected to happen
3. State what actually happened (include the exact error message)
4. Show what you have already tried
5. Show the relevant code

This format — used in Stack Overflow, GitHub issues, and with your mentor — gets
you help faster because the person helping doesn't have to extract this information
from you one question at a time.

---

## Handling Conflict in Teams

**When you disagree with a technical decision:**
1. Make sure you understand the reasoning behind the decision first — ask, don't assume
2. Raise your concern with data and reasoning, not just preference
3. Pick the right channel — private conversation before public disagreement
4. If overruled, implement the decision professionally — "disagree and commit"

**When a colleague is consistently late with work that blocks you:**
1. First check if they need help — they may be stuck
2. Raise it privately with them, not in a team meeting
3. If it continues, raise it with your manager with specifics (dates, impact)

---

## Working Effectively in Agile Teams

**Daily standup:** What did I do yesterday? What am I doing today? Am I blocked?
Keep it under 2 minutes. It is a synchronisation meeting, not a status report.

**Sprint planning:** Commit to work you are confident you can complete. It is
better to deliver 6 story points and pick up more than to commit to 12 and miss.

**Retrospectives:** Be specific and constructive.
- Not: "Communication was bad"
- Better: "We had 3 instances this sprint where PRs sat unreviewed for more than 2 days —
  can we agree on a 24-hour review SLA?"

**Definition of Done:** A task is not done when the code is written. It is done when
it is reviewed, merged, tested, and deployed to the appropriate environment.

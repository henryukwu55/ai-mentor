# Oral Defence Preparation Guide

## What Panelists Are Actually Looking For

Panelists are not trying to trick you or make you fail. They want to see:
1. **Deep understanding** — not just "it works" but why it works
2. **Critical thinking** — you can reason about trade-offs, not just repeat facts
3. **Intellectual honesty** — you know what you don't know
4. **Communication** — you can explain technical ideas clearly
5. **Ownership** — you built this, you understand every part of it

---

## How to Introduce Your Project (First 2 Minutes)

Structure your opening as: Problem → Solution → Impact

> "The problem I was solving is [describe the pain point in user terms].
> My solution is [one-sentence description of what you built].
> The key technical decisions I made were [2–3 decisions].
> The result is a system that [measurable outcome or capability]."

Avoid: "I built a website that lets users do stuff."
Be specific about what problem you solved and for whom.

---

## Questions You Will Almost Certainly Be Asked

**Architecture:**
- Walk me through the architecture of your system.
- Why did you choose [technology] over the alternatives?
- What is the most complex part of your system and why?
- Where is your single point of failure?
- How does data flow from the frontend to the database?

**Code quality:**
- How did you test this? What's your test coverage?
- If you found a bug in production, how would you debug it?
- What would you refactor if you had more time?
- How did you handle error cases?
- Show me a piece of code you're proud of and explain why.

**Security:**
- How do you prevent SQL injection?
- How do you store passwords?
- How does your authentication work?
- What data is exposed to unauthenticated users?

**Scalability:**
- How would your system perform with 10x the users?
- What is the biggest bottleneck in your system?
- Where would you add caching?

**Reflection:**
- What was the hardest problem you solved?
- What would you do differently if you started over?
- What did you learn from this project?
- What is the biggest limitation of your current implementation?

---

## How to Answer When You Don't Know

Never pretend to know something you don't. Panelists will probe further and
the situation gets worse. Instead:

**"I don't know, but here's how I would find out..."**
> "I'm not sure of the exact mechanism, but I'd look at the documentation
> for [library], run a test to observe the behaviour, and measure the
> performance impact."

**"I haven't implemented that, but here's how I'd approach it..."**
> "I didn't implement rate limiting, but I'd add it using a Redis sliding
> window counter keyed on the user's IP address, and return a 429 status
> when the limit is exceeded."

This shows problem-solving ability even in areas you haven't implemented.

---

## Handling Pressure and Interruptions

Panelists will sometimes interrupt mid-answer. This is intentional — they
want to see how you handle it.

- **Pause before responding.** A 2-second pause looks thoughtful, not ignorant.
- **Acknowledge the question.** "That's a good point — let me address that."
- **Don't get defensive.** "That's a fair criticism. Here's why I made that decision..."
- **It's okay to say "Let me think about that."** Silence is better than rambling.

If you feel overwhelmed: take a breath, restate the question back to the
panelist to confirm understanding, then answer methodically.

---

## Practising Effectively

**Talk out loud.** Reading notes silently is different from speaking under
pressure. Practise saying your answers, not just thinking them.

**Time yourself.** Most oral defence sessions are 20–45 minutes. Practise a
5-minute project introduction so you don't run over.

**Use the AI Mentor in defence mode.** Each panelist (Theory, Code, System
Design) will ask questions from their domain. Treat every question as real —
don't skip answers you don't know.

**Record yourself.** Play it back and listen for: filler words (um, like,
basically), speaking too fast under stress, trailing off at the end of sentences.

**Know your code.** You should be able to walk through any file in your project
without notes. If you can't explain a piece of code, you need more practice.

---

## Day-of Tips

- Arrive (or log in) 10 minutes early
- Have your project running and ready to demo before the session starts
- Keep your project repo open in your editor — you may be asked to show code
- Drink water — nerves dry out your throat
- Remember: you have been working on this project for weeks or months.
  The panelists just read a brief. You are the expert in the room on your specific project.

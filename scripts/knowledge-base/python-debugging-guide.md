# Python — Common Errors, Debugging, and Best Practices

## Common Runtime Errors

**NameError: name 'X' is not defined**
Variable used before it was assigned, or a typo in the variable name.
```python
# WRONG
print(reslt)   # typo

# RIGHT
result = compute()
print(result)
```

**TypeError: 'NoneType' object is not subscriptable / has no attribute 'X'**
A function returned `None` when you expected a value. Check that every code
path in the function has an explicit `return` statement.

**IndentationError**
Python is whitespace-sensitive. Use 4 spaces consistently; never mix tabs and spaces.
Configure your editor to insert spaces when you press Tab.

**IndexError: list index out of range**
Accessing an index that doesn't exist. Check `len(lst)` before accessing.
Use negative indexing carefully: `lst[-1]` is the last element, safe as long as the list is non-empty.

**KeyError: 'X'**
Accessing a dict key that doesn't exist. Use `.get()` with a default:
```python
# WRONG — raises KeyError if 'email' not in user
email = user['email']

# RIGHT
email = user.get('email', '')  # returns '' if key missing
```

---

## Debugging Techniques

**Print debugging:**
```python
print(f"DEBUG: user={user}, type={type(user)}")
```

**Python debugger (pdb):** Insert `breakpoint()` in your code. When execution
hits that line, you get an interactive REPL where you can inspect variables,
step through code line by line, and evaluate expressions.

**Common pdb commands:**
- `n` — next line
- `s` — step into function
- `c` — continue to next breakpoint
- `p variable` — print a variable
- `q` — quit

---

## Virtual Environments

Always use a virtual environment. This isolates your project's dependencies
from your system Python and from other projects.

```bash
python -m venv venv          # create virtual environment
source venv/bin/activate     # activate (Linux/Mac)
venv\Scripts\activate        # activate (Windows)

pip install fastapi uvicorn  # install packages (only in this venv)
pip freeze > requirements.txt  # save dependencies
pip install -r requirements.txt  # install from requirements.txt
```

**Never commit `venv/` to Git.** Add it to `.gitignore`.

---

## FastAPI Specifics

**Defining a route with path parameter and query parameter:**
```python
from fastapi import FastAPI
app = FastAPI()

@app.get("/users/{user_id}")
async def get_user(user_id: int, include_posts: bool = False):
    # user_id comes from the path, include_posts from ?include_posts=true
    ...
```

**Request body with Pydantic:**
```python
from pydantic import BaseModel

class CreateUserRequest(BaseModel):
    name: str
    email: str
    age: int | None = None  # optional field

@app.post("/users", status_code=201)
async def create_user(body: CreateUserRequest):
    print(body.name, body.email)
```

**Handling errors:**
```python
from fastapi import HTTPException

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = db.find(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

**Async database queries:** Use an async library (asyncpg, databases, SQLAlchemy
with async support). Never block the event loop with synchronous I/O.

---

## Python Best Practices

**Use f-strings for string formatting:**
```python
# Preferred
message = f"Hello, {name}! You have {count} messages."
```

**List comprehensions over loops for simple transforms:**
```python
# Loop
squares = []
for n in range(10):
    squares.append(n ** 2)

# Comprehension (preferred for simple cases)
squares = [n ** 2 for n in range(10)]
```

**Context managers for file and resource handling:**
```python
# WRONG — file may not close if exception occurs
f = open("data.json")
data = json.load(f)
f.close()

# RIGHT — always closes, even on exception
with open("data.json") as f:
    data = json.load(f)
```

**Type hints (use them):**
```python
def calculate_total(prices: list[float], discount: float = 0.0) -> float:
    return sum(prices) * (1 - discount)
```

Type hints don't change runtime behaviour but they document intent, help your
editor autocomplete correctly, and catch errors with mypy.

**Don't use mutable defaults in function arguments:**
```python
# WRONG — the same list is shared across all calls
def append_item(item, lst=[]):
    lst.append(item)
    return lst

# RIGHT
def append_item(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst
```

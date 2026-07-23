---
name: coding-styles
description: Applies core software engineering principles (SOLID, DRY, KISS, YAGNI) to development work. Use when planning features, starting development, writing code, refactoring, or reviewing architecture.
---

# Principled Development

Before writing code, remember: simplicity wins. Apply these principles to every decision.

## YAGNI - You Aren't Gonna Need It

**Build only what's required right now.**

```python
# Bad - speculative generality
class UserManager:
    def create_user(self, data): ...
    def create_bulk_users(self, data_list): ...  # "might need later"
    def create_user_async(self, data): ...       # "just in case"
    def create_user_with_retry(self, data): ... # "could be useful"

# Good - solve today's problem
class UserManager:
    def create_user(self, data): ...
```

**Ask yourself:**
- Is this solving a current requirement?
- Am I building for a hypothetical future?
- Can I add this later when actually needed?

## KISS - Keep It Simple, Stupid

**The simplest solution is usually the best.**

```javascript
// Bad - clever but complex
const getUserStatus = (user) =>
  [['active', u => u.confirmed && !u.banned],
   ['pending', u => !u.confirmed],
   ['banned', u => u.banned]]
  .find(([_, pred]) => pred(user))?.[0] ?? 'unknown';

// Good - boring but clear
function getUserStatus(user) {
  if (user.banned) return 'banned';
  if (!user.confirmed) return 'pending';
  return 'active';
}
```

**Ask yourself:**
- Can a junior developer understand this?
- Am I showing off or solving a problem?
- What's the most straightforward approach?

## DRY - Don't Repeat Yourself

**Every piece of knowledge should have a single source of truth.**

```python
# Bad - duplicated logic
def create_order(items):
    total = sum(item.price * item.qty for item in items)
    tax = total * 0.08
    return Order(subtotal=total, tax=tax, total=total + tax)

def preview_order(items):
    total = sum(item.price * item.qty for item in items)  # duplicated
    tax = total * 0.08                                     # duplicated
    return {"subtotal": total, "tax": tax, "total": total + tax}

# Good - single source of truth
def calculate_order_totals(items):
    subtotal = sum(item.price * item.qty for item in items)
    tax = subtotal * 0.08
    return {"subtotal": subtotal, "tax": tax, "total": subtotal + tax}

def create_order(items):
    totals = calculate_order_totals(items)
    return Order(**totals)

def preview_order(items):
    return calculate_order_totals(items)
```

**But avoid false DRY:**
```python
# Bad - forcing DRY where things are coincidentally similar
def process(data, type):
    if type == "user":
        # 50 lines of user logic
    elif type == "order":
        # 50 lines of completely different order logic

# Good - separate concerns even if structure looks similar
def process_user(data): ...
def process_order(data): ...
```

## SOLID Principles

### S - Single Responsibility

**A class/function should have one reason to change.**

```python
# Bad - multiple responsibilities
class User:
    def save(self): ...           # persistence
    def send_email(self): ...     # notification
    def generate_report(self): ...# reporting

# Good - separated concerns
class User: ...
class UserRepository:
    def save(self, user): ...
class UserNotifier:
    def send_email(self, user): ...
```

### O - Open/Closed

**Open for extension, closed for modification.**

```python
# Bad - modify existing code for each new type
def calculate_area(shape):
    if shape.type == "circle":
        return 3.14 * shape.radius ** 2
    elif shape.type == "rectangle":
        return shape.width * shape.height
    # Must modify this function for every new shape

# Good - extend without modifying
class Shape:
    def area(self): raise NotImplementedError

class Circle(Shape):
    def area(self): return 3.14 * self.radius ** 2

class Rectangle(Shape):
    def area(self): return self.width * self.height
```

### L - Liskov Substitution

**Subtypes must be substitutable for their base types.**

```python
# Bad - Square violates Rectangle's contract
class Rectangle:
    def set_width(self, w): self.width = w
    def set_height(self, h): self.height = h

class Square(Rectangle):
    def set_width(self, w):
        self.width = self.height = w  # Breaks expectations

# Good - separate abstractions
class Shape:
    def area(self): ...

class Rectangle(Shape): ...
class Square(Shape): ...
```

### I - Interface Segregation

**Don't force clients to depend on methods they don't use.**

```python
# Bad - fat interface
class Worker:
    def work(self): ...
    def eat(self): ...
    def sleep(self): ...

class Robot(Worker):
    def eat(self): pass   # Robots don't eat
    def sleep(self): pass # Robots don't sleep

# Good - segregated interfaces
class Workable:
    def work(self): ...

class Eatable:
    def eat(self): ...

class Human(Workable, Eatable): ...
class Robot(Workable): ...
```

### D - Dependency Inversion

**Depend on abstractions, not concretions.**

```python
# Bad - high-level depends on low-level
class OrderService:
    def __init__(self):
        self.db = MySQLDatabase()  # Tightly coupled

# Good - depend on abstraction
class OrderService:
    def __init__(self, db: Database):
        self.db = db  # Can be MySQL, Postgres, Mock, etc.
```

## Quick Reference

| Principle | One-liner | When violated |
|-----------|-----------|---------------|
| YAGNI | Build for now, not maybe | Adding unused features |
| KISS | Simple > clever | Can't explain it easily |
| DRY | One source of truth | Copy-pasting logic |
| SRP | One reason to change | Class does too much |
| OCP | Extend, don't modify | Adding if/else for types |
| LSP | Subtypes are substitutable | Overrides break contracts |
| ISP | Small, focused interfaces | Empty method implementations |
| DIP | Depend on abstractions | Hardcoded dependencies |

## Pre-Development Checklist

Before writing code, ask:

- [ ] Am I building only what's needed right now? (YAGNI)
- [ ] Is this the simplest solution? (KISS)
- [ ] Am I duplicating logic that exists elsewhere? (DRY)
- [ ] Does each component have a single responsibility? (SRP)
- [ ] Can I extend this without modifying existing code? (OCP)
- [ ] Are my abstractions properly substitutable? (LSP)
- [ ] Are my interfaces focused and minimal? (ISP)
- [ ] Am I depending on abstractions, not implementations? (DIP)

## When Principles Conflict

Principles sometimes tension with each other. Use judgment:

- **DRY vs KISS**: Don't create complex abstractions to avoid simple duplication
- **YAGNI vs OCP**: Build simple now, but leave obvious extension points
- **SRP vs KISS**: Don't over-separate into too many tiny classes

**When in doubt: choose the simpler option.**
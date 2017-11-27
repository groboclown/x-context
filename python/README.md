# Python Implementation of Contextual Program Control

For this initial test, I'm implementing it in Python to take advantage
of the `@` decorators.  For Python, though it's really only useful for
the security aspect.

The full protection would normally need to be restricted throughout the
codebase.  This implementation is fairly limited to test out the
feasibility and implementation details.

Another implementation may be attempted through promises.  Node.js would
be a good example of its use, because the promise-based wrappers around
the pyramid standard API calls would give a good entry point for
security wrappers.  Also, the promises approach allows for per-call
context intervention.

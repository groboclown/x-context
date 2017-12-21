# Open Questions on the Contextual Program Control System

## Context Forking and Parallel Systems

Constructing a system to allow for conditionally forking the current context
in a parallel system could require special handling methods.

The architecture document has been improved to answer some of the concerns
around this concept.

### Considerations for JavaScript

JavaScript permits only a single thread of execution at a time per Isolate.
However, many systems can build up threads of execution in either promises or
callbacks.

For example, a web application could have one set of requirements
for a form field event, and different requirements for text rendering.
Here, it may be better to provide a callback registration system that requires
including the base context.

Promises are another matter.  A promise chain can run potentially in separate
threads (due to underlying waits in the code).  The chain source should
inherit the context from the source method.

Unfortunately, the Node.js codebase does not provide for a means to capture
the current thread or promise.  Part of this can be managed by registering
events and promises like a *delegate service*.

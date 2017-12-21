# General Architecture

This document details the general architecture used to implement the
Contextual Program Control.  Specific implementations will change depending
upon the platform features or limitations.


## Execution Context and Unit of Execution

The execution context is the concept of the code running from a base source,
whether it be a network of spawned worker threads, futures or promises,
spawned processes across the network, or just a single thread running some code.
In this document, the term *thread* refers to the line of execution, even if it
spreads across multiple execution paths.

Unfortunately, proper handling of this cannot be guaranteed without introducing
higher level constructs into the creation of new threads.  For example, some
systems allow for *worker threads* to run some process in the background.  The
worker thread itself runs as a service in tis own context, but is tasked to
execute work for another thread, which should be done in the requesting thread's
context.  In other cases, a context may simply pass a message to a service
running in a different context, which would require no passing of the source
context.

Such changes to existing systems appear minor, but in some cases may require a
re-thinking about the approach to creating a parallel system.  Specifically,
that the *unit of execution* is its function to execute, the arguments to
said function, and the execution context.  A function cannot be executed in
isolation; it must be accompanied by its execution context.  In the sequential,
non-threaded setting, passing a unit of execution (say, a visitor callback)
does not require explicit execution context passing, because it is all shared
within its own execution.  However, once the execution responsibility passes
to a different thread which may have a different execution context, then the
need to pass the context becomes necessary.


### Execution Threads as Services

If we visualize the threads as a service, we can separate their concerns into
two categories: *delegates* and *requests*.

Delegate services have the caller delegate execution actions to the service.
These include event handlers and worker threads.  With these services, the
caller passes its active context to the service for its execution.  In this way,
the unit of execution is the function + context.

Request services accept a request for service message, possibly with a response
value.  In these services, the context is independent of the message.  The
message request itself may include a segment context, though.


## Contextual Program Service

The *service* maintains the stack state for all "threads" (alternatively, there
may be one service per thread).  Here, a thread means an independent chain
of execution flow.  Thus, a promise chain (which may run on any number
of threads or processes) constitutes a single "thread".

The service maintains a registry of root segment controllers, so that each
new thread begins with initialized root segments.  Adding or removing root
segment controllers must not affect active threads.

Service construction and initialization should happen at program startup time.
However, it can happen at any time where a new context needs execution.


## Segment Contextual Controller

The controller maintains a state, creates child controllers using parameters
passed in from subroutines (or an initial state for the root controllers),
and performs limited execution management for subroutines.

When a subroutine is executed, the execution should be sent to the service for
that thread to be run under the control of its contextual controllers.  Each
execution must run the contextual controllers as a composite function, meaning
that contextual controller A runs the execution of contextual controller B,
and so on, until the final subroutine runs.


## Segment Contextual Controller Registry

Contextual controller registration should conceptually be maintained in a
stack.  Registration should generally run like so:

```
Object registration_id := controller_registery.push_controllers(list_of_controllers)
try {
  ...
} finally {
  controller_registery.pop_controllers(registration_id)
}
```

Even if low-level stack control is made available, the registration should not
be automatically removed on a "return" call.  This loses granularity
(you can't have multiple register blocks in the same function), and has
implicit state change behavior that would be confusing to use (say, calling
a subroutine to populate the controllers; when that routine returns, the
controllers are lost).

Pushing controllers can never override existing controllers.  This will either
result in an error (strict mode) or silently ignored (silent mode).


## Segment Context

Each segment contains its own segment, which may be updated by function metadata
when that function executes.


## Gate Keeper vs. Control vs. Monitor

At the surface level, a controller can act in several ways: *gating* the entry
into a sub-context, and *controlling* the execution of a function, and
*monitoring* the function execution.

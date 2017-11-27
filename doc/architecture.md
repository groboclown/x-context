# General Architecture

This document details the general architecture used to implement the
Contextual Program Control.  Specific implementations will change depending
upon the platform features or limitations.


## Contextual Program Service

The *service* maintains the stack state for all threads (alternatively, there
may be one service per thread).

The service maintains a registry of root segment controllers, so that each
new thread begins with initialized root segments.  Adding or removing root
segment controllers must not affect active threads.

Service construction and initialization should happen at program startup time.

When a subroutine is executed, the execution should be sent to the service for
that thread to be run under the control of its contextual controllers.  Each
execution must run the contextual controllers as a composite function, meaning
that contextual controller A runs the execution of contextual controller B,
and so on, until the final subroutine runs.



## Segment Contextual Controller

The controller maintains a state, creates child controllers using parameters
passed in from subroutines (or an initial state for the root controllers),
and performs limited execution management for subroutines.

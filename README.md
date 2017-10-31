# x-context

Experiment for contextual program control.

The general concept is that, within a stack, the program control runs
within the restrictions of the stack's current context.  The context
controls runtime behavior, either by restricting what can be run, or
by adding additional logic flow.

The idea originated with an examination into how to better manage
failure states, particularly around recovering from said states.  Some
systems can include additional system logic for recovering from
out-of-disk-space errors, or perhaps will perform a hard failure
for an out-of-memory scenario, which sends a message to the appropriate
logging service, then restarts the service.

This can be expanded further with security.  In a security context,
we can limit the possible operations within a single call, because the
call knows what resources it needs access to, or to which resources
is should be limited to.  For example, a web service endpoint could
limit itself to only performing read access to a single table on a
database.  This helps to mitigate unexpected permission escalation
through a coding error, or to limit the scope of a undiscovered
security hole.

Another use case is caching results.  A context can wrap a call and
keep a cache of its returned results based on the inputs.  If the
inputs match the cache, then the cached result can be returned without
invoking the method.


## Contexts and Promises and Channels

Contextual program controls have a potential for working well within
channels and promises.

The failure states within promises would be an example of an *explicit*
CPC.

Within promises, the failure controls can potentially work much better
through a context.  In this scenario, the promise declares explicit
failure states, similar to exceptions.  However, the failure states
are accessible to the promise.  The failure context can then examine
an error and attempt a recovery.  For example, if a promise attempts
an HTTP request, but it fails due to a timeout, the failure context can
attempt to restart the promise chain at the node that failed after
a short delay.  The failure state would be reused across invocations,
so that the failure state can check on the number of retries.

From this perspective, the failure CPC is similar to an exception
handler, but it also allows for flow control.  Each chained call in
a promise enters its own context execution.


## Context and Flow Control

In standard program execution, when a function is called, its call
state is stored on the stack (return code point and arguments).  In
the case of the contextual program control, the call also captures the
entry code point and the new execution context.

The execution context can be queried from within the function, but is
immutable.

Before the function is executed, the context is queried with the
function execution state.  The context can perform any number of
operations before execution, even modifying the parameters
(*TODO is this advisable? meaning, is there any use case that would
require this*)

Likewise, when the function completes execution, the context is
queried with the execution results.  The context can inspect failure
conditions to perform corrective actions, including rerunning the
function if the error appears corrected.

I can see the implementation being better if the context is created
for the chain, and it saves state within itself for the context chain,
while per-promise invocation would have its own state object.


## Segmented Contextual Program Control

Different contextual program control scopes can co-exist at the same
time, segmented by a unique name.  For example, "security" to manage
security permissions, and "logging" to manage logging on a function
basis.

Each segmented CPC acts independently upon the program control.  They
execute depending upon either an implicit or explicit priority,
depending upon the implementation restrictions (for example, Python
`@` decorators would impose an implicit priority based on their
order on the function).


## State in Context

The context themselves must be immutable in their configuration from
the view of the executed functions.  A function running within a context
can only query the state, but cannot modify it.  However, during the
execution of the context, it may be necessary for the context to change
the state, *but never the configuration*.  For example, a caching
context will need to store the return values of the function.

The only opportunity for mutating the context configuration state is
at initialization time, before the context is pushed into the stack.


## Construction and Hierarchy within Context

The context implementation must allow for a hierarchy of segmented
contextual program controls.  Some CPC may not have a hierarchy, but
others, such as security, require this.  Even for the non-hierarchically
aware CPC, they still dictate the child context construction.

When a function is called that defines a segmented context parameter,
the information is passed to a factory method on the context.  The
context then assembles the child context, or possibly raises a failure
state due to incompatible parameters (say, a parent context that
disallows any local I/O, and the function requires I/O operations).


## Relationship to Existing Technology

The per-function context is very similar to some Aspect-Oriented
Programming concepts.  The simple AOP example of logging can also
apply to CPC.

For security purposes, the model matches how Android and iOS computing
devices manage permissions on an application level.  The CPC model is
on a finer grain level.

The failure context slightly resembles `catch` clauses in programming
languages.  However, with context flow control, the capabilities
expand far beyond what was possible with simple `catch` logic.


## Performance and Optimizations

The performance and optimization techniques are highly dependent upon
the implementation and language capabilities.

A simple implementation would introduce an extra call overhead for
every function invocation, on top of the extra context construction
logic for every active segmented CPC.

A less intrusive implementation could apply the overhead only for public
methods on a module/class.

Some CPC may require explicit invocation with every entry and exit
of a function, such as with wrapping logging around function entry
points.  For those, the overhead must be taken every time.

Other CPC may only require invocation when the functions define
parameters for that segment, such as with a simple security model.

For Java, the context states could be written into the generated
bytecode to reduce some function call overhead.

In Python, the `@` decorator syntax seems like an obvious implementation
choice, as it constructs a wrapping function around the invoked
function.  However, this can lead to function call wrapping introducing
a large overhead.  Instead, the wrappers can use a single invokable
object.


## Initial Test Implementation

### Python

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

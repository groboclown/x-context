# x-context

*Experiment for contextual program control.*

Implementations to try out the
[contextual program control concepts](doc/README.md).  Implementations exist for:

* [Python](python/README.md)
* [TypeScript](typescript/README.md)

In progress:

* [Node.js](nodejs/README.md) - augmentation to node.js product to make the
  low-level API security-aware.

## Argument

Let's say we're writing a REST service endpoint that handles a complex read
request against a database table and another REST service, and caches some
of the results to disk to speed up future requests.

This means that, right away, we know that this service endpoint should never
access any other database table, nor should it write to the table it does
access.  Likewise, it needs read/write access to a cache directory, but should
never access any other part of the file system.  It will need use the network
to call out to a REST service, but otherwise we shouldn't have
any other code invoke network APIs.

Unfortunately, we can't restrict the entire service to just these limited
actions, because other endpoints might require write access, or no access to
the file system, so we can't put hard restrictions on the service itself.

What if we can put hard constraints around the underlying API calls that
access the database, network, and the file system?  We would grant the
permissible actions at the endpoint entry, then the lower level API calls
check that the permissions allow the actions.  It's a little like granting
an App on a mobile device permissions, but now we're looking at one specific
endpoint call.

This would mean that we protect ourselves against bugs in the software that
try to do things they shouldn't be doing, or from using libraries that might
have side-effects we didn't expect.  Perhaps we do want to expand our
functionality in the future, but by putting these explicit access rights around
the endpoint, we can have a discussion about the security and functional
implications in the change.

**Contextual Program Control** aims to solve these kinds of problems in a
unified form, along with a host of other problems.


## Overview

The Contextual Program Control model maintains a segmented, contextual
hierarchy stack ("contextual stack") of controllers in parallel to each threads'
execution stack.

* *Stack* - each call into a subroutine increases the stack depth.  This
  does two things: constructs a lower level in the hierarchy for each
  segment, and allows for each segment controller to have limited control
  over the subroutine execution.
* *Segmented* - the contextual hierarchies are separated into "segments"
  to split up concerns.  Examples include logging, security, and retry on
  connection timeout or service availability.
* *Hierarchy* - for each segment of each stack level, the subroutine
  entered defines parameters that mutate the previous stack level's
  controller.  The next controller is a child of the previous controller.
* *Controller* - A controller possesses a state based on the subroutine
  stack parameters for its segment.  When a subroutine is executed, the
  controller can use that subroutine's parameters to augment its execution.
  Examples include failing if the subroutine requests permissions to use
  forbidden resources, or wrap the execution in logging, or retry the operation
  if it fails due to specific errors.

A key aspect for performance involves only running segmented context controllers
when a subroutine explicitly declares usage for that

The alternative - checking context for every subroutine call - is considered
too costly for most applications, and unduly restricts the usability of the
technology.


## Some Ideas of Uses for Contextual Program Control

* Security has already been detailed above.  This can be used with fine grained
  access, such as whitelisting URLs and read or write enabled directories.
* Like Aspect Oriented Programming, we can't forget log wrappers.
* Cached return values - the controller can capture input arguments, and use
  those to generate cached responses.  Could be handy for making a simple
  [memoized value](https://en.wikipedia.org/wiki/Memoization) implementation.
* Centralize error handling for classes of errors, with refinement for how
  kinds of errors are managed.  For example, automatic retry of a subroutine
  if a remote service call generates a timeout error.  Because controllers are
  stateful for the wrapping of subroutine execution, the retry can include
  exponential wait times.  Note that, for some platforms, the ability to retry
  an operation may be limited or not available.
* One idea that's under consideration is the ability of a subroutine to
  query the current context information.  This can allow finer grained security
  inspection, such as for SQL query for multi-statement executions or other
  violations (which all may be SQL dialect dependent).  However, this seems to
  open the program to attack vectors that could be prevented by making smarter
  controllers.
* Parameter value replacement.  A subroutine could mark an argument, say a
  file path, as replaceable through an execution context-aware list of
  token values.  This could simplify code so it didn't need to pass around
  the context, nor perform explicit replacement invocations on each parameter.

Some things it's not good for:

* Injecting values into an object.  Contextual program control does not replace
  inversion of control mechanisms.
* Indeed, anything that requires inspection of the subroutine.  The controllers
  should act only on the hierarchical state, the input parameters, and
  output parameters of the function.


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


## License

The software used to implement the concept are under [the MIT license](LICENSE).

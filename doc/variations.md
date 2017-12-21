# Variations Considered

This lists out some variations on the CPC technology, and why it was not used.

## Controller Invocation for every Subroutine

Originally, CPC would allow for calling every active segment
controller for every subroutine invocation.  This allowed for some interesting
behaviors, such has forced logging or timing of subroutines.

This would lead to major performance overhead for calling through that many
executions for every subroutine call.

It would lead to dealing with how to invoke controllers (which may themselves
invoke other functions) while within the call wrapping.  This leads to possible
recursion events, and potentials for attack vectors.  That is, if controllers
are excluded from checks, then that controller could be invoked outside the
invoking chain and avoid checks.

In nearly all cases, it means rewriting root parts of the language engine
(either the compiler or interpreter).  It also means having special access
requirements for the controller service.

It would undoubtedly lead to unexpected behavior, where adding a seemingly
simple controller at the root of the application would change the behavior
of all code it runs.  This would mean libraries could potentially break,
and performance could spike in hard-to-pin-down ways.

In the end, this idea just has too many problems to be workable.  Instead,
subroutines must mark themselves as being part of the controller service
overhead.

## Run Every Segment's Controller on Context-Sensitive Subroutine Call

Originally, every active segment's context controller would run on a
subroutine that marks itself as participating in the context control.
However, subroutines mark themselves as participating by including
metadata describing which segment they are aware of, and possibly how
they want to influence the segment hierarchy.

Because segment controllers only act on segment metadata to create
child controllers, they have nothing to do if no metadata is provided.  Even
in the case where the controller requires inspecting arguments, the
subroutine explicitly tells the controller which arguments should be
inspected.

Due to this, the controllers should only be invoked when the subroutine
declares use of a segment.  Again, this allows for more deterministic behavior
to code execution.  If the end user doesn't want to change metadata, but still
have the segment controller run, then a no-data segment definition should be
added to the subroutine.

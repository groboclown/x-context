# x-context

*Experiment for contextual program control.*

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

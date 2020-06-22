# About

Can we create a method to express security restrictions and access rights through context-like declarations that allow for static analysis of security right violations?  In some cases, this cannot be 100% decided, but if, say, we also provide runtime details (configuration), then we can conceivably do this.  It does depend upon properly implemented functions to ensure declaired restrictions are enforced or accurate.
  
Alternatively, we could potentially discover all required access rights that must be obtained when invoking a method with particular arguments.

With a well defined set of access privileges and requirements to perform desired operations, it should be possible to determine whether a desired operation is feasible, or whether it constitutes a security violation.  This can aid the developer in determining whether a security assumptionis valid, or whether a mistake was made in program construction.  With the right design tools, it can even determine these access right violations during the design phase.

## Access Requirement Declaration and Security Resolution Point

Let us examine the scenario of reading a local file from the file system.  With Unix style permissions, the priviledge to read the file is associated with the file node.  Due to this, any programmatic request to read a file cannot have its security rights established until the filename is known.  The earliest point at which this happens is here called the Security Resolution Point.  The data which is necessary to make this resolution is called the access requirement.  Functions declare the access requirements through the arguments or argument members (e.g. if a database table is an object, then the table name field would be the requirement).

It may be technically possible to discover the resolution point within the code, but for the purposes of this discussion, we shall only consider functional boundary.

Let us also assume for this document that the system under consideration has complete knowledege of the security access needs for each functional boundary.  Some of these will need to be explicitly called out by the system (such as the function that performs the file i/o), while others can be extrapolated through the call graph.

Through static examination of the code, we can discover the points where the final access requirement resolves, where it assumes the value that will eventually be passed into the function that declares the access requirement.  When all the requirements for the child function call graph is fully resolved, then it can be evaluated for correctness.  Likewise, there may also exist subgraphs with a subset of requirements that are fully resolved, for which these may also be examined for correctness without needing to resolve all the requirements.

Because we are only looking at functional boundaries, we then only need to consider the mutability of values before they are passed in call parameters.  That is to say, whether the calling function makes any changes to a parameter vefore the call.  This means value passing to other functions must consider whether the valueis changed there. It is even more difficult to determine a precise point when condintinal logic may not change a value.  In a simple approach, we can say that if a function can change a value, that it does.

Some of these access requirements can be further defined to allow a better determination earlier in the processing.    For example, even though the file read requires resolution of the filename, if the calling code does not require file access, then we have a contradinction in requirements, and thus a security violation.

## Access Requirement Objects

How can we construct a system that allows for clear definition and type-like ridity for violation discovery?

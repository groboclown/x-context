/*
 * Different promise API that allows for context wrappers.
 *
 * Promise capabilities make the context changing a little
 * different.  These have a concept of an *implicit* and
 * *explicit* context.
 *
 * Here's an interesting use case.  Module _model_ has an
 * explicit security restriction such that, when it runs, it
 * must be run in a context which allows writes to table M.
 * The caller puts a context on it to retry in case of
 * connection failure.  In both these cases, one where the
 * promise is created by the library, and the other where it's
 * created by the consumer, they both must be run in the
 * execution (stack) context of the consumer.  If the consumer
 * limits a specific promise chain to run with only read
 * permissions on table M, then the write promise must be
 * forced to fail.
 *
 * Another use case: the overall application must run within
 * a restricted security profile.  But one specific promise
 * call is wrapped in a failure retry, which is itself run inside
 * a read-only profile.  All the listed contexts must be active
 * when the promise executes.
 *
 * Because of the strange threading model in TypeScript /
 * JavaScript, the context must be handled very carefully.
 * Any part of the codebase may specify the promise execution
 * context service.  However, during execution, all the
 * "active" (to be defined below) contexts must be run.  This
 * means passing the segment context options to *all* active
 * execution contexts.
 *
 * Additionally, this code must work when the application uses
 * standard Promise classes.  In these circumstances, the
 * CPromise class should wrap the promise in a context call,
 * where possible.
 *
 * An "active" execution context service is any context which:
 *  - is specified on a specific promise.
 *  - was specified on the initial promise in the chain.
 *  - is marked as the "static" service.s
 */

export {
  ContextPromiseExecutor,
  ResolvePromiseFunc,
  RejectPromiseFunc,
  OnFulfilledFunc,
  OnRejectedFunc,
  ContextPromise,
  ContextPromiseStatic,
  ContextPromiseConstructor
} from './decl';
export { CPromise } from './join';
export { setPromise } from './promise-proxy';

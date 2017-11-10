/*
 * Usage:
 *
 * This is the basis for storing and accessing the context execution.
 * To create a segmented execution context, extend the RunContext
 * class to be the logic for when a context is entered and left.
 * Then implement the RunContextRegistration to define the
 * name and initial state of the segmented context.
 *
 * To start to use the context, you will need a ExecutionContextService
 * instance to store the registration of all the segmented contexts.
 * This stores different 'stack scopes' (called 'threadName' in the
 * source), which are accessed to get a ExecutionContextView.
 * Because this is JavaScript, there's a default thread name that
 * can be used.  With the ExecutionContextView, the 'runInContext'
 * can be called.
 */

export {
  ContextInvocation,
  ChildContextOptions,
  SegmentedContextOptions,
  RunContext,
  PreExecuteRunContext,
  PostExecuteRunContext,
  RunContextRegistration,
  SegmentContext,
  ExecutionContextView
} from './decl';


export {
  DEFAULT_THREAD_NAME,
  ExecutionContextService
} from './impl';

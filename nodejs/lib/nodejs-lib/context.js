
'use strict';

const util = require('util');

// should remove './'
const promise_context = require('./promise_context');

let errors;
function lazyErrors() {
  if (errors === undefined)
    errors = require('internal/errors');
  return errors;
}


/**
 * Wrapper for invoking the underlying function from the context controller.
 */
class ContextInvocation {
  constructor(
        scopedThis, // Object | undefined
        invoked, // Function
        args, // any[]
        argDescriptors, // IArguments | undefined
        target, // Object | undefined
        propertyKey // string | symbol | undefined
      ) {
    // TODO make these properties be private keys with
    // `get` accessors.
    this.scopedThis = scopedThis;
    this.invoked = invoked;
    this.args = args;
    this.argDescriptors = argDescriptors;
    this.target = target;
    this.propertyKey = propertyKey;
  }

  /**
   * Invoke the target method, and return its return value. This can also
   * throw any Error.
   */
  invoke() {
    const errors = lazyErrors();
    throw new errors.TypeError('ERR_METHOD_NOT_IMPLEMENTED', 'invoke');
  }
}


/**
 * Tests if a value matches the criteria for being a Segment Contextual
 * Controller.
 */
const isSegmentContextualController = function(value) {
  if (typeof value !== 'object') {
    return false;
  }
  if (typeof value['createChild'] !== 'function') {
    return false;
  }
  if (typeof value['onContext'] !== 'function') {
    return false;
  }
  return true;
};


const kSegmentsStack = Symbol('_segmentsStack');
const kFrameId = Symbol('_frame_id');

const _FRAME_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const _create_frame_id = function() {
  let ret = "";
  for (let i = 0; i < 32; i++) {
    ret += _FRAME_CHARS[Math.floor(Math.random() * _FRAME_CHARS.length)];
  }
  return ret;
}


/**
 * Stack of the segmented context controllers.
 */
class ContextControllerStack {
  constructor() {
    Object.defineProperties(this, {
      kSegmentsStack: {
        enumerable: false,
        writable: false,
        value: []
      });
  }

  /**
   * Flatten all the current controllers into a single frame, which uses the
   * given frameId.  Returns a new ContextControllerStack.
   */
  fork(frameId) {
    if (!frameId) {
      const errors = lazyErrors();
      throw new errors.Error('ERR_INVALID_ARG_VALUE', 'frameId', frameId);
    }
    let ret = new ContextControllerStack();
    // Loop in order through the stack, so that the last one wins.
    // Additionally, the kFrameId will be overwritten.
    let newSegs = {};
    for (let i = 0; i < this[kSegmentsStack].length; i++) {
      let src = this[kSegmentsStack][i];
      for (let k in src) {
        newSegs[k] = src[k];
      }
    }
    newSegs[kFrameId] = frameId;
    ret[kSegmentsStack].push(newSegs);
    return ret;
  }

  /**
   * Called when a new context is entered, which requires a
   * change in the existing stack.
   *
   * @param segmentControllers an object where each key is the segment name,
   *    and the value is the controller.
   */
  push(segmentControllers) {
    let frameId = _create_frame_id();
    let newSegs = {};
    for (let kind in segmentControllers) {
      if (segmentControllers.hasOwnProperty(kind)) {
        let controller = segmentControllers[kind];
        if (!isSegmentContextualController(controller)) {
          const errors = lazyErrors();
          throw new errors.TypeError(
            'ERR_INVALID_ARG_TYPE', 'segmentControllers', 'SegmentContextualController', controller);
        }
        newSegs[kind] = controller;
      }
    }
    newSegs[kFrameId] = frameId;
    this[kSegmentsStack].push(newSegs);
    return frameId;
  }

  pop(frameId): void {
    if (this.isEmpty) {
      const errors = lazyErrors();
      throw new errors.RangeError('ERR_INDEX_OUT_OF_RANGE');
    }
    let last = this[kSegmentsStack][this[kSegmentsStack].length - 1];
    if (last[kFrameId] !== frameId) {
      const errors = lazyErrors();
      throw new errors.Error('ERR_INVALID_ARG_VALUE', 'frameId', frameId);
    }
    this[kSegmentsStack].pop();
  }

  getSegmentController(segmentId) {
    // loop through our stack backwards
    let i = this[kSegmentsStack].length;
    while (--i >= 0) {
      if (!!this[kSegmentsStack][i][segmentId]) {
        return this[kSegmentsStack][i][segmentId];
      }
    }
    // not found
    return null;
  }

  get isEmpty(): boolean {
    return this[kSegmentsStack].length <= 0;
  }

}


const kContexts = new Symbol('_contexts');


const DEFAULT_THREAD_NAME = 'main';

/**
 * Shared, internal data model for the context controller registry and
 * execution stacks, for all the threads within this execution context.
 */
class ExecutionContextModel {
  constructor(isStrict, primaryThreadId) {
    if (!primaryThreadName) {
      primaryThreadId = DEFAULT_THREAD_NAME;
    }
    if (typeof(primaryThreadId) !== 'string') {
      const errors = lazyErrors();
      throw new errors.Error('ERR_INVALID_ARG_TYPE', 'primaryThreadId', 'string', primaryThreadId);
    }
    Object.defineProperties(this, {
      kContexts: {
        enumerable: false,
        writable: false,
        value: {}
      },
      isStrict: {
        enumerable: true,
        writable: false,
        value: isStrict
      },
      primaryThreadId: {
        enumerable: true,
        writable: false,
        value: primaryThreadId
      });
    this[kContexts][primaryThreadId] = new ContextControllerStack();
    // Initialize the main thread with a non-monitored frame.
    // This way, the thread isn't destroyed when popped.
    // Note that the frame id is not remembered, to further prevent it
    // from being popped.
    this[kContexts][primaryThreadId].push({});
  }

  /**
   * Enters a new controller map context for a given thread.  If isStrict
   * is enabled, then the segment names in the controllerMap cannot match
   * any existing registered controllers.  If the thread has not been
   * registered, then this raises an error.
   *
   * Returns the controller map frame ID, which must be used to pop the
   * controllers.
   */
  pushControllers(threadId, controllerMap) {
    if (!threadId) {
      threadId = this.primaryThreadId;
    }
    let threadContext = this[kContexts][threadId];
    if (!threadContext) {
      // Thread hasn't been created yet.  This is an explicit error condition.
      const errors = lazyErrors();
      throw new errors.Error('ERR_INVALID_ARG_VALUE', 'threadId', threadId);
    }
    if (this.isStrict) {
      for (let k in controllerMap) {
        if (controllerMap.hasOwnProperty(k) && !!threadContext.getSegmentController(k)) {
          const errors = lazyErrors();
          throw new errors.Error('ERR_INVALID_OPT_VALUE', 'controllerMap.' + k, '(already set, and in strict mode)');
        }
      }
    }
    return threadContext.push(controllerMap);
  }

  /**
   * Create a new unit of execution as an offshoot of a parent.  If the
   * newThreadId is not given, then a new one is auto-generated.  If the
   * oldThreadId is not given, then the default thread ID is used.
   *
   * Returns [new thread ID, forked frame id].
   */
  forkThread(oldThreadId, newThreadId) {
    if (!oldThreadId) {
      oldThreadId = this.primaryThreadId;
    }
    if (!this[kContexts][oldThreadId]) {
      const errors = lazyErrors();
      throw new errors.Error('ERR_INVALID_ARG_VALUE', 'oldThreadId', oldThreadId);
    }
    if (!newThreadId) {
      let i = 0;
      do {
        newThreadId = oldThreadId + '.' + (++i);
      } while (!!this[kContexts][newThreadId]);
    }
    if (typeof(newThreadId) !== 'string') {
      const errors = lazyErrors();
      throw new errors.Error('ERR_INVALID_ARG_TYPE', 'newThreadId', 'string', newThreadId);
    }
    if (!!this[kContexts][newThreadId]) {
      const errors = lazyErrors();
      throw new errors.Error('ERR_INVALID_ARG_VALUE', 'newThreadId', newThreadId);
    }
    let newFrameId = _create_frame_id();
    this[kContexts][newThreadId] = this[kContexts][oldThreadId].fork(newFrameId);
    return [newThreadId, newFrameId];
  }

  /**
   * Returns the context frame ID, which must be used for exitContext.
   */
  enterContext(threadId, segmentOptions) {
    if (!threadId) {
      threadId = this.primaryThreadId;
    }
    let context = this[kContexts][threadId];
    if (!context) {
      const errors = lazyErrors();
      throw new errors.Error('ERR_INVALID_ARG_VALUE', 'threadId', threadId);
    }
    let controllers = {};

    for (let k in segmentOptions) {
      if (segmentOptions.hasOwnProperty(k)) {
        let controller = this[kContexts].getSegmentController(k);
        // If the controller is not defined, then we just ignore
        // this option.  Should this be silent?

        if (!!controller) {
          let child = controller.createChild(segmentOptions[k]);
          if (!isSegmentContextualController(child)) {
            const errors = lazyErrors();
            throw new errors.TypeError(
              'ERR_INVALID_ARG_TYPE', 'createChild for segment ' + k, 'SegmentContextualController', controller);
          }
          controllers[k] = child;
        }
      }
    }
    return context.push(controllers);
  }

  exitContext(threadId, frameId) {
    if (!threadId) {
      threadId = this.primaryThreadId;
    }
    let context = this[kContexts][threadId];
    if (!context) {
      const errors = lazyErrors();
      throw new errors.Error('ERR_INVALID_ARG_VALUE', 'threadId', threadId);
    }
    context.pop(frameId);
    if (context.isEmpty) {
      // Nothing left in the stack for the thread.
      // Clear up the memory.
      delete this[kContexts][threadId];
    }
  }

  getSegmentController(threadId, segmentId) {
    if (!threadId) {
      threadId = this.primaryThreadId;
    }
    let context = this[kContexts][threadId];
    if (!context) {
      const errors = lazyErrors();
      throw new errors.Error('ERR_INVALID_ARG_VALUE', 'threadId', threadId);
    }
    return context.getSegmentController(segmentId);
  }
}


const kModel = new Symbol('_model');
const kRootView = new Symbol('_rootView');

/**
 * Each execution context (the tree of threads and promises related to a single
 * task) uses its own service.  These maintain the per-thread context stack,
 * and execute a unit of work with the right encapsulation of the controllers.
 *
 * The service creates views for the current thread id context.  These views
 * can be used to fork other processes.
 */
class ExecutionContextService {
  constructor() {
    let execModel = new ExecutionContextModel();
    let mainView = new ExecutionContextViewImpl(execModel, execModel.primaryThreadId, '0');

    Object.defineProperties(this, {
      kModel: {
        enumerable: false,
        writable: false,
        value: execModel
      },
      kRootView: {
        enumerable: false,
        writable: false,
        value: mainView
      });
  }

  get root() {
    return this[kRootView];
  }
}


/**
 * Simple, low-level invoking of the requested method.  Used at the
 * lowest level of the context invocation chain.
 */
class InnerContextInvocation extends ContextInvocation {
  invoke() {
    return this.invoked.apply(this.scopedThis, this.args);
  }
}


/**
 * Runs another context invocation, creating a composite function.
 */
class CompositeContextInvocation extends ContextInvocation {
  constructor(
        scopedThis, // Object | undefined,
        invoked, // Function,
        args, // any[],
        argDescriptors, // IArguments | undefined,
        target, // Object | undefined,
        propertyKey, // string | symbol | undefined,
        innerInvoke, // ContextInvocation<T>,
        innerContext, // RunContext<any>
      ) {
    super(scopedThis, invoked, args, argDescriptors, target, propertyKey);
    this.innerInvoke = innerInvoke;
    this.innerContext = innerContext;
  }

  invoke(): T {
    return this.innerContext.onContext(this.innerInvoke);
  }
}


const isExecutionContextView = function(obj) {
  if (!util.isObject(obj)) {
    return false;
  }
  if (!util.isFunction(obj.runInContext)) {
    return false;
  }
  if (!util.isFunction(obj.pushControllers)) {
    return false;
  }
  if (!util.isFunction(obj.forkAs)) {
    return false;
  }
  if (!util.isFunction(obj.forkAsUnique)) {
    return false;
  }
  return true;
}


const kThreadId = new Symbol('_threadId');
const kRootFrameId = new Symbol('_rootFrameId');

/**
 * Implementation of the context view.  This builds up the invoker chain
 * so that the correct context wrapping can work.
 */
class ExecutionContextViewImpl implements ExecutionContextView {
  constructor(model, threadId, rootFrameId) {
    Object.defineProperties(this, {
      kModel: {
        enumerable: false,
        writable: false,
        value: model
      },
      kThreadId: {
        enumerable: false,
        writable: false,
        value: threadId
      },
      kRootFrameId: {
        enumerable: false,
        writable: false,
        value: rootFrameId
      });
  }

  pushControllers(controllers) {
    // FIXME
  }

    // FIXME
  }

  /**
   * returns a view on the new thread.
   */
  forkAs(newThreadId) {
    let ret = this[kModel].forkThread(this[kThreadId], newThreadId);
    return new ExecutionContextViewImpl(this[kModel], ret[0], ret[1]);
  }

  forkAsUnique() {
    return this.forkAs(null);
  }

  runInContext(
        contexts, // SegmentedContextOptions,
        scopedThis, // Object | undefined,
        invoked, // Function,
        args, // any[],
        argDescriptors, // IArguments | undefined,
        target, // any | undefined,
        propertyKey // string | symbol | undefined
      ) {
    // mark that the new context was entered.
    let frameId = this[kModel].enterContext(this[kThreadId], contexts);

    try {
      // Create the lowest level of our invocation chain, which actually invokes
      // the requested method.
      let invoker = new InnerContextInvocation(
        scopedThis, invoked, args, argDescriptors, target, propertyKey
      );

      // We need to wrap the rcList as a series of function compositions.
      // Note that we only need to do this for the segments passed in the
      // argument.
      for (let rcKey in contexts) {
        if (!contexts.hasOwnProperty(rcKey)) {
          continue;
        }
        invoker = new CompositeContextInvocation(
          scopedThis, invoked, args, argDescriptors, target, propertyKey,
          invoker, this[kModel].getSegmentController(this[kThreadId], rcKey)
        );
      }

      //console.log(`[DEBUG ${this._threadName}]: starting invocation`);
      return invoker.invoke();
    } finally {
      this._model.exitContext(this[kThreadId], frameId);
    }
  }
}


module.exports = exports = {
  ContextInvocation,
  ExecutionContextService,
  isExecutionContextView
};


/**
 * In the case of JS, this is the parent promise of the current
 * promise chain.  Note that there is a distinct difference between the
 * thread name and the thread id.
getCurrentThreadName() {
  let threadIndex = promise_context.getContextPromiseId();
  if (threadIndex == 0) {
    return this[kModel].primaryThreadId;
  }
  return '#' + threadIndex;
}
 */

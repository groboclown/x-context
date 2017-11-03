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


import {
  ExecutionContextAlreadyRegisteredError,
  ExecutionContextNotRegisteredError,
  DuplicateExecutionContextSegmentsError,
  ExecutionContextStackEmptyError
} from './exceptions';

export abstract class ContextInvocation<T> {
  /** The 'this' value when the method is invoked */
  readonly scopedThis: Object;
  readonly invoked: Function;
  // tslint:disable-next-line:no-any
  readonly args: any[];
  readonly argDescriptors: IArguments | undefined;
  readonly target: Object | undefined;
  readonly propertyKey: string | symbol | undefined;

  constructor(
        scopedThis: Object,
        invoked: Function,
        // tslint:disable-next-line:no-any
        args: any[],
        argDescriptors: IArguments | undefined,
        target: Object | undefined,
        propertyKey: string | symbol | undefined
      ) {
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
  abstract invoke(): T;
}


export type ChildContextOptions = {
  // tslint:disable-next-line:no-any
  [name: string]: any
};


/**
 * Encapsulates the immutable state context for the current
 * execution, for a single named segment.
 */
export abstract class RunContext<SelfType extends RunContext<SelfType>> {
  abstract createChild(options: ChildContextOptions): SelfType;

  abstract onContext<T>(invoked: ContextInvocation<T>): T;
}


/**
 * Helper run context that executes before the invoked method runs.
 * This is useful for precondition checks.
 */
export abstract class PreExecuteRunContext<SelfType extends PreExecuteRunContext<SelfType>>
    extends RunContext<SelfType> {
  onContext<T>(invoked: ContextInvocation<T>): T {
    this.beforeInvocation(invoked.args);
    return invoked.invoke();
  }

  // tslint:disable-next-line:no-any
  abstract beforeInvocation(args: any[]): void;
}


/**
 * Helper run context that executes after the invoked method runs.
 */
export abstract class PostExecuteRunContext<SelfType extends PreExecuteRunContext<SelfType>>
    extends RunContext<SelfType> {
  onContext<T>(invoked: ContextInvocation<T>): T {
    let r = invoked.invoke();
    return this.afterInvocation(invoked.args, r);
  }

  // tslint:disable-next-line:no-any
  abstract afterInvocation<T>(args: any[], returned: T): T;
}


/**
 * Stored the segmentation name, and creates an initial context for
 * said segmented execution context.
 */
export interface RunContextRegistration<T extends RunContext<T>> {
  readonly kind: string;

  createInitialContext(): T;
}


/**
 * Maintains just the changed name run context.  The parents will
 * contain the context if not present here.
 * TODO make this a Map<string, RunContext<any>>
 */
export type SegmentContext = {
  // tslint:disable-next-line:no-any
  [kind: string]: RunContext<any>
};

// TODO make this a Map<string, RunContextRegistration<any>>
type SegmentContextRegistration = {
  // tslint:disable-next-line:no-any
  [kind: string]: RunContextRegistration<any>
};

// TODO make this a Map<string, Error>
type SegmentContextSource = {
  [kind: string]: Error
};

class RunContextRegistry {
  private _store: SegmentContextRegistration = {};
  private _source: SegmentContextSource = {};

  /**
   * Registers a new `RunContextRegistration` instance.
   *
   * @throws ExecutionContextAlreadyRegisteredError: a registration instance
   *    is already registered with the given `kind`.
   */
  register<T extends RunContext<T>>(reg: RunContextRegistration<T>): void {
    if (reg.kind in this._store) {
      throw new ExecutionContextAlreadyRegisteredError(
        reg.kind,
        this._source[reg.kind]
      );
    }
    let err = new Error();
    Error.captureStackTrace(err, Error);
    this._source[reg.kind] = err;
    this._store[reg.kind] = reg;
  }

  /**
   * @throws ExecutionContextNotRegisteredError
   */
  // tslint:disable-next-line:no-any
  createInitialContext<T extends RunContext<T>>(kind: string): T {
    if (!(kind in this._store)) {
      throw new ExecutionContextNotRegisteredError(kind);
    }
    return <T> this._store[kind].createInitialContext();
  }

  get kinds(): string[] {
    // simple way doesn't seem to work.
    // return Array.from(this._store.keys());
    let keys = new Array<string>();
    let key: string;
    for (key in this._store) {
      if (this._store.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys;
  }
}


/**
 * Container for all the segmented executions.
 */
class ExecutionContextContainer {
  private readonly _segmentStacks = new Array<SegmentContext>();

  /**
   * Called when a new context is entered, which requires a
   * change in the existing stack.
   */
  enterContext(contexts: SegmentContext): void {
    let newSegs: SegmentContext = {};
    for (let kind in contexts) {
      if (contexts.hasOwnProperty(kind)) {
        let context = contexts[kind];
        newSegs[kind] = context;
      }
    }
    this._segmentStacks.push(newSegs);
  }

  exitContext(): void {
    if (this.isEmpty) {
      throw new ExecutionContextStackEmptyError();
    }
    this._segmentStacks.pop();
  }

  getContextSegment<T extends RunContext<T>>(kind: string): T | undefined {
    // loop through our stack backwards
    let i = this._segmentStacks.length;
    while (--i >= 0) {
      if (kind in this._segmentStacks[i]) {
        return <T> this._segmentStacks[i][kind];
      }
    }
    // not found
    return undefined;
  }

  get isEmpty(): boolean {
    return this._segmentStacks.length <= 0;
  }
}

class ExecutionContextModel {
  // This named collection represents the per "thread" execution context.
  // JavaScript (and, thus, TypeScript) doesn't support threads.  However,
  // each promise and event has its own independent context stack.
  private readonly _contextStack: {
    [name: string]: ExecutionContextContainer
  } = {};
  private readonly _rootContexts: SegmentContext = {};
  private readonly _registry = new RunContextRegistry();

  enterContext(threadName: string, contexts: { [kind: string]: ChildContextOptions }): void {
    let rcList: SegmentContext = {};
    for (let kind in contexts) {
        if (!contexts.hasOwnProperty(kind)) {
          continue;
        }
        let options: ChildContextOptions = contexts[kind];
        if (kind in rcList) {
          throw new DuplicateExecutionContextSegmentsError(kind);
        }
        // tslint:disable-next-line:no-any
        let rc: RunContext<any> = this.getContextSegment(threadName, kind);
        rcList[kind] = rc.createChild(options);
    }
    if (!(threadName in this._contextStack)) {
      this._contextStack[threadName] = new ExecutionContextContainer();
    }
    this._contextStack[threadName].enterContext(rcList);
  }

  exitContext(threadName: string): void {
    if (!(threadName in this._contextStack)) {
      throw new ExecutionContextStackEmptyError();
    }
    this._contextStack[threadName].exitContext();
    if (this._contextStack[threadName].isEmpty) {
      // clear up our memory
      delete this._contextStack[threadName];
    }
  }

  getContextSegment<T extends RunContext<T>>(threadName: string, kind: string): T {
    // allow thread name to not have been created, to better allow setting
    // up an initial thread.
    if (threadName in this._contextStack) {
      let ret = this._contextStack[threadName].getContextSegment(kind);
      if (ret !== undefined) {
        return <T> ret;
      }
    }

    // either the thread isn't populated yet, or the context segment isn't
    // in the stack yet.
    if (kind in this._rootContexts) {
      return <T> this._rootContexts[kind];
    }

    // initialize the root context
    let r = this._registry.createInitialContext(kind);
    this._rootContexts[kind] = r;
    return <T> r;
  }

  getAllContextSegments(threadName: string): SegmentContext {
    let r: SegmentContext = {};
    for (let kind of this._registry.kinds) {
      r[kind] = this.getContextSegment(threadName, kind);
    }
    return r;
  }

  register<T extends RunContext<T>>(reg: RunContextRegistration<T>): void {
    this._registry.register(reg);
  }
}

export const DEFAULT_THREAD_NAME = 'default';

/**
 * The primary service for registering RunContext segments,
 * and for accessing the current execution context view of a
 * specific scoped stack (called here a `threadName`).
 */
export class ExecutionContextService {
  private static _default = new ExecutionContextService();
  private readonly _model = new ExecutionContextModel();

  static getDefaultInstance(): ExecutionContextService {
    return ExecutionContextService._default;
  }

  getCurrentThreadName(): string {
    // In other languages, this should be better defined.
    return DEFAULT_THREAD_NAME;
  }

  forThead(threadName: string): ExecutionContextView {
    return new ExecutionContextViewImpl(threadName, this._model);
  }

  forCurrentThread(): ExecutionContextView {
    return this.forThead(this.getCurrentThreadName());
  }

  register<T extends RunContext<T>>(reg: RunContextRegistration<T>): void {
    this._model.register(reg);
  }
}



class InnerContextInvocation<T> extends ContextInvocation<T> {
  invoke(): T {
    return this.invoked.apply(this.scopedThis, this.args);
  }
}


class CompositeContextInvocation<T> extends ContextInvocation<T> {
  readonly innerInvoke: ContextInvocation<T>;
  // tslint:disable-next-line:no-any
  readonly innerContext: RunContext<any>;

  constructor(
        scopedThis: Object,
        invoked: Function,
        // tslint:disable-next-line:no-any
        args: any[],
        argDescriptors: IArguments | undefined,
        target: Object | undefined,
        propertyKey: string | symbol | undefined,
        innerInvoke: ContextInvocation<T>,
        // tslint:disable-next-line:no-any
        innerContext: RunContext<any>
      ) {
    super(scopedThis, invoked, args, argDescriptors, target, propertyKey);
    this.innerInvoke = innerInvoke;
    this.innerContext = innerContext;
  }

  invoke(): T {
    return this.innerContext.onContext(this.innerInvoke);
  }
}


export interface ExecutionContextView {
  /**
   * Fetch a scoped execution run context.
   *
   * @param kind the segmentation to retrieve.
   */
  getActiveRunContext<T extends RunContext<T>>(kind: string): T;

  /**
   * @param contexts the new child execution context segments;
   *    these are options that will be used to create the children,
   *    based on the current segment context.
   * @param scopedThis the `this` object scope for the invoked method.
   * @param invoked the function being invoked.
   * @param args the list of arguments passed to the function.
   * @param argDescriptors an IArguments descriptor.
   * @param target the declared target for the execution.
   * @param propertyKey the name of the function invoked.
   */
  runInContext<T>(
        contexts: { [kind: string]: ChildContextOptions },
        scopedThis: Object,
        invoked: Function,
        // tslint:disable-next-line:no-any
        args: any[],
        argDescriptors?: IArguments | undefined,
        // tslint:disable-next-line:no-any
        target?: any,
        propertyKey?: string | symbol | undefined
      ): T;
}



/**
 * The public view for the execution context.  The
 */
class ExecutionContextViewImpl implements ExecutionContextView {
  private readonly _model: ExecutionContextModel;
  private readonly _threadName: string;

  constructor(threadName: string, model: ExecutionContextModel) {
    this._model = model;
    this._threadName = threadName;
  }

  public getActiveRunContext<T extends RunContext<T>>(kind: string): T {
    return this._model.getContextSegment(this._threadName, kind);
  }

  public runInContext<T>(
        contexts: { [kind: string]: ChildContextOptions }
        scopedThis: Object,
        invoked: Function,
        // tslint:disable-next-line:no-any
        args: any[],
        argDescriptors?: IArguments,
        // tslint:disable-next-line:no-any
        target?: any,
        propertyKey?: string | symbol | undefined
      ): T {
    this._model.enterContext(this._threadName, contexts);
    let invoker = new InnerContextInvocation<T>(
      scopedThis, invoked, args, argDescriptors, target, propertyKey
    );

    // We need to wrap the rcList as a series of function compositions.
    let rcMap: SegmentContext = this._model.getAllContextSegments(this._threadName);
    for (let rcKey in rcMap) {
      if (!rcMap.hasOwnProperty(rcKey)) {
        continue;
      }
      invoker = new CompositeContextInvocation<T>(
        scopedThis, invoked, args, argDescriptors, target, propertyKey,
        invoker, rcMap[rcKey]
      );
    }

    try {
      return invoker.invoke();
    } finally {
      this._model.exitContext(this._threadName);
    }
  }
}

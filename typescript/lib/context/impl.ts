

import {
  ExecutionContextAlreadyRegisteredError,
  ExecutionContextNotRegisteredError,
  NoSuchThreadExecutionContextError,
  DuplicateThreadExecutionContextError,
  DuplicateExecutionContextSegmentsError,
  ExecutionContextStackEmptyError
} from '../exceptions';

import {
  RunContextRegistration,
  SegmentContext,
  ChildContextOptions,
  RunContext,
  SegmentedContextOptions,
  ContextInvocation,
  ExecutionContextView
} from './decl';

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

  fork(): ExecutionContextContainer {
    let ret = new ExecutionContextContainer();
    for (let s of this._segmentStacks) {
      ret._segmentStacks.push(s);
    }
    return ret;
  }

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
    //console.log(`[DEBUG] context stack size ${this._segmentStacks.length}`);
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

/**
 * Shared, internal data model for the context registry and thread stacks.
 */
class ExecutionContextModel {
  // This named collection represents the per "thread" execution context.
  // JavaScript (and, thus, TypeScript) doesn't support threads.  However,
  // each promise and event has its own independent context stack.
  private readonly _contextStack: {
    [name: string]: ExecutionContextContainer
  } = {};
  private readonly _rootContexts: SegmentContext = {};
  private readonly _registry = new RunContextRegistry();

  forkThread(oldThreadName: string, newThreadName?: string | undefined): string {
    if (!(oldThreadName in this._contextStack)) {
      if (oldThreadName !== DEFAULT_THREAD_NAME) {
        throw new NoSuchThreadExecutionContextError(oldThreadName);
      }
      this._contextStack[DEFAULT_THREAD_NAME] = new ExecutionContextContainer();
    }
    if (newThreadName !== undefined && newThreadName in this._contextStack) {
      throw new DuplicateThreadExecutionContextError(newThreadName);
    }
    if (newThreadName === undefined) {
      let i = -1;
      do {
        i += 1;
        newThreadName = oldThreadName + '.' + i;
      } while (newThreadName in this._contextStack);
    }
    this._contextStack[newThreadName] =
      this._contextStack[oldThreadName].fork();
    return newThreadName;
  }

  enterContext(threadName: string, contexts: SegmentedContextOptions): void {
    //let debugKeys = '';
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
        //debugKeys += ` [${kind}]`;
        rcList[kind] = rc.createChild(options);
    }
    //console.log(`[DEBUG ${threadName}] Entering context {${debugKeys}}`);
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

  forkThreadAs(oldThreadName: string, newThreadName: string): ExecutionContextView {
    this._model.forkThread(oldThreadName, newThreadName);
    return this.forThread(newThreadName);
  }

  forkThreadAsUnique(oldThreadName: string): ExecutionContextView {
    let newThreadName = this._model.forkThread(oldThreadName, undefined);
    return this.forThread(newThreadName);
  }

  forThread(threadName: string): ExecutionContextView {
    return new ExecutionContextViewImpl(threadName, this._model);
  }

  forCurrentThread(): ExecutionContextView {
    return this.forThread(this.getCurrentThreadName());
  }

  register<T extends RunContext<T>>(reg: RunContextRegistration<T>): void {
    this._model.register(reg);
  }
}


/**
 * Simple, low-level invoking of the requested method.  Used at the
 * lowest level of the context invocation chain.
 */
class InnerContextInvocation<T> extends ContextInvocation<T> {
  invoke(): T {
    return this.invoked.apply(this.scopedThis, this.args);
  }
}


/**
 * Runs another context invocation, creating a composite function.
 */
class CompositeContextInvocation<T> extends ContextInvocation<T> {
  readonly innerInvoke: ContextInvocation<T>;
  // tslint:disable-next-line:no-any
  readonly innerContext: RunContext<any>;

  constructor(
        scopedThis: Object | undefined,
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



/**
 * Implementation of the context view.  This builds up the invoker chain
 * so that the correct context wrapping can work.
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
        contexts: SegmentedContextOptions,
        scopedThis: Object | undefined,
        invoked: Function,
        // tslint:disable-next-line:no-any
        args: any[],
        argDescriptors?: IArguments,
        // tslint:disable-next-line:no-any
        target?: any,
        propertyKey?: string | symbol | undefined
      ): T {
    // mark that the new context was entered.
    this._model.enterContext(this._threadName, contexts);

    // Create the lowest level of our invocation chain, which actually invokes
    // the requested method.
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
      //console.log(`[DEBUG ${this._threadName}]: starting invocation`);
      return invoker.invoke();
    } finally {
      this._model.exitContext(this._threadName);
    }
  }
}

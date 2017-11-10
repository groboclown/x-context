
export abstract class ContextInvocation<T> {
  /** The 'this' value when the method is invoked */
  readonly scopedThis: Object | undefined;
  readonly invoked: Function;
  // tslint:disable-next-line:no-any
  readonly args: any[];
  readonly argDescriptors: IArguments | undefined;
  readonly target: Object | undefined;
  readonly propertyKey: string | symbol | undefined;

  constructor(
        scopedThis: Object | undefined,
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


export type SegmentedContextOptions = {
  [kind: string]: ChildContextOptions
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
        contexts: SegmentedContextOptions,
        scopedThis: Object | undefined,
        invoked: Function,
        // tslint:disable-next-line:no-any
        args: any[],
        argDescriptors?: IArguments | undefined,
        // tslint:disable-next-line:no-any
        target?: any,
        propertyKey?: string | symbol | undefined
      ): T;
}

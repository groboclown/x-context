


import {
  SegmentedContextOptions,
  ExecutionContextView
} from '../context';
//import { NoExecutionContextViewDefinedError } from '../exceptions';
import {
  OnFulfilledFunc, OnRejectedFunc, PromiseExecutor, ContextPromiseExecutor,
  ResolvePromiseFunc, RejectPromiseFunc, ContextPromise
} from './decl';
import { createProxyPromise } from './promise-proxy';
import {
  isFunction
} from 'util';
import {
  isPromiseLike
} from './util';

export const createInitialPromise = <T>(
      view: ExecutionContextView,
      options: SegmentedContextOptions,
      executor: PromiseExecutor<T> | ContextPromiseExecutor<T>
    ): ContextPromise<T> => {
  return new ContextPromiseRunner<T>(createProxyPromise(new ExecutorExec<T>(
    <ContextPromiseExecutor<T>> executor, view, options
  ).create()), view, options);
};

export class ContextPromiseRunner<T> implements ContextPromise<T>, Promise<T> {
  private readonly _proxy: PromiseLike<T>;

  private readonly _view: ExecutionContextView;

  private readonly _options: SegmentedContextOptions;

  readonly [Symbol.toStringTag]: 'Promise';

  constructor(
        proxy: PromiseLike<T>,
        view: ExecutionContextView,
        options: SegmentedContextOptions
      ) {
    this._proxy = proxy;
    this._view = view;
    this._options = options;
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  // tslint:disable-next-line:no-any
  then<TResult1 = T, TResult2 = never>(arg1?: any, arg2?: any, arg3?: any): any {
    let onfulfilled: OnFulfilledFunc<T, TResult1> | undefined;
    let onrejected: OnRejectedFunc<TResult2> | undefined;
    let options: SegmentedContextOptions = this._options;

    if (arg1 !== undefined && arg1 !== null && ! isFunction(arg1)) {
      // second form: first argument is the options.
      options = <SegmentedContextOptions> arg1;
      onfulfilled = <OnFulfilledFunc<T, TResult1> | undefined> arg2 || undefined;
      onrejected = <OnRejectedFunc<TResult2> | undefined> arg3 || undefined;
    } else {
      onfulfilled = <OnFulfilledFunc<T, TResult1> | undefined> arg1 || undefined;
      onrejected = <OnRejectedFunc<TResult2> | undefined> arg2 || undefined;
    }
    let ok: ThenExec<T, TResult1>;
    if (onfulfilled !== undefined) {
      ok = new ThenExec<T, TResult1>(onfulfilled, this._view, this._options);
    } else {
      ok = new ThenExec<T, TResult1>(undefined, this._view, this._options);
    }
    if (onrejected !== undefined) {
      return new ContextPromiseRunner<TResult1 | TResult2>(
        this._proxy.then(
          ok.create(),
          new CatchExec<TResult2>(onrejected, this._view, options).create()
        ), this._view, options
      );
    }
    return new ContextPromiseRunner<TResult1 | TResult2>(
      this._proxy.then(ok.create()),
      this._view, this._options
    );
  }

  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  // tslint:disable-next-line:no-any
  catch<TResult = never>(arg1?: any, arg2?: any): any {
    // tslint:disable-next-line:no-any
    if (! ('catch' in this._proxy) || ! isFunction((<any> this._proxy)['catch'])) {
      throw new TypeError('undefined method `catch`');
    }

    let onrejected: OnRejectedFunc<TResult> | undefined;
    let options: SegmentedContextOptions = this._options;

    if (arg1 !== undefined && arg1 !== null && ! isFunction(arg1)) {
      // second form: first argument is the options.
      options = <SegmentedContextOptions> arg1;
      onrejected = <OnRejectedFunc<TResult> | undefined> arg2 || undefined;
    } else {
      onrejected = <OnRejectedFunc<TResult> | undefined> arg1 || undefined;
    }

    let catchProxy:
      // tslint:disable-next-line:no-any
      ((reason: any) => TResult | PromiseLike<TResult>) =
        // tslint:disable-next-line:no-any
        (<any> this._proxy)['catch'];
    if (onrejected !== null) {
      return new ContextPromiseRunner<T | TResult>(
        catchProxy.apply(this._proxy,
          new CatchExec<TResult>(
            onrejected, this._view, options
          ).create()
        ),
        this._view, options
      );
    }
    return new ContextPromiseRunner<T | TResult>(
      catchProxy.apply(this._proxy,
        new CatchExec<TResult>(
          undefined, this._view, this._options
        ).create()
      ),
      this._view, this._options
    );
  }
}



//---------------------------------------------------------------
// Wrappers around Promise calls.

/**
 * Top level class to run a proimse function inside a context.
 */
abstract class WrappedPromiseExec {
  protected readonly _view: ExecutionContextView;
  protected readonly _options: SegmentedContextOptions;

  constructor(view: ExecutionContextView, options: SegmentedContextOptions) {
    this._view = view;
    this._options = options;
  }

  // tslint:disable-next-line:no-any
  protected _runInContext<TResult>(func: Function, args: any[]): TResult | PromiseLike<TResult> {
    // Always appends the view as the last argument, for compatibility with the
    // ContextPromiseExecutor.
    args.push(this._view);
    return this._updateRes(this._view.runInContext(this._options, undefined, func, args));
  }

  /**
   * Update the returned value from an executed promise.  This has a large effect
   * on how the Execution Context works with respect to promises.
   *
   * If an execution context runs with security restrictions on I/O access, then
   * any action it spawns must also run in that context.
   */
  private _updateRes<TResult>(res: TResult | PromiseLike<TResult>): TResult | PromiseLike<TResult> {
    if (isPromiseLike(res)) {
      // Wrap the returned promise.
      return new ContextPromiseRunner<TResult>(res, this._view, this._options);
    }
    return res;
  }
}


class ExecutorExec<T> extends WrappedPromiseExec {
  private readonly _executor: ContextPromiseExecutor<T>;
  constructor(
        executor: ContextPromiseExecutor<T>,
        view: ExecutionContextView,
        options: SegmentedContextOptions
      ) {
    super(view, options);
    this._executor = executor;
  }

  create(): PromiseExecutor<T> {
    return (resolve: ResolvePromiseFunc<T>, reject: RejectPromiseFunc): void => {
      this._runInContext(this._executor, [resolve, reject]);
    };
  }
}


/**
 * Wraps a 'then' function part of a promise.
 */
class ThenExec<T, TResult = T> extends WrappedPromiseExec {
  private readonly _onfulfilled: OnFulfilledFunc<T, TResult> | undefined;
  constructor(
        onfulfilled: OnFulfilledFunc<T, TResult> | undefined,
        view: ExecutionContextView,
        options: SegmentedContextOptions
      ) {
    super(view, options);
    this._onfulfilled = onfulfilled;
  }

  create(): OnFulfilledFunc<T, TResult> | undefined {
    if (this._onfulfilled === undefined)  {
      return undefined;
    }
    return (value: T): TResult | PromiseLike<TResult> => {
      // Required type checking
      if (this._onfulfilled === undefined) {
        throw new TypeError();
      }
      return this._runInContext(this._onfulfilled, [value]);
    };
  }
}

/**
 * Wraps a 'catch' function part of a promise.
 */
class CatchExec<TResult = never> extends WrappedPromiseExec {
  private readonly _onrejected: OnRejectedFunc<TResult> | undefined;

  constructor(
        onrejected: OnRejectedFunc<TResult> | undefined,
        view: ExecutionContextView,
        options: SegmentedContextOptions
      ) {
    super(view, options);
    this._onrejected = onrejected;
  }

  // tslint:disable-next-line:no-any
  create(): OnRejectedFunc<TResult> | undefined {
    if (this._onrejected === undefined) {
      return undefined;
    }
    // tslint:disable-next-line:no-any
    return (reason: any): TResult | PromiseLike<TResult> => {
      // Required type checking
      if (this._onrejected === undefined) {
        throw new TypeError();
      }
      return this._runInContext(this._onrejected, [reason]);
    };
  }
}




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

export const createInitialPromise = <T>(
      view: ExecutionContextView,
      options: SegmentedContextOptions,
      executor: PromiseExecutor<T> | ContextPromiseExecutor<T>
    ): ContextPromise<T> => {
  return new ContextPromiseRunner<T>(createProxyPromise(new ExecutorExec<T>(
    <ContextPromiseExecutor<T>>executor, [view], options
  ).create()), [view], options);
};

export class ContextPromiseRunner<T> implements ContextPromise<T> {
  private readonly _proxy: PromiseLike<T>;

  // All requested views are valid for the promise.  See above for
  // use cases.  The items in the view list can change.
  private readonly _views: ExecutionContextView[];

  private readonly _options: SegmentedContextOptions;

  readonly [Symbol.toStringTag]: "Promise";

  constructor(
        proxy: PromiseLike<T>,
        initialViews: ExecutionContextView[],
        options: SegmentedContextOptions
      ) {
    this._proxy = proxy;
    this._views = [];
    for (let v of initialViews) {
      this._views.push(v);
    }
    this._options = options;
  }

  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  then<TResult1 = T, TResult2 = never>(arg1?: any, arg2?: any, arg3?: any): ContextPromise<TResult1 | TResult2> {
    let onfulfilled: OnFulfilledFunc<T, TResult1> | undefined;
    let onrejected: OnRejectedFunc<TResult2> | undefined;
    let options: SegmentedContextOptions = this._options;

    if (arg1 !== undefined && arg1 !== null && ! isFunction(arg1)) {
      // second form: first argument is the options.
      options = <SegmentedContextOptions>arg1;
      onfulfilled = <OnFulfilledFunc<T, TResult1> | undefined>arg2 || undefined;
      onrejected = <OnRejectedFunc<TResult2> | undefined>arg3 || undefined;
    } else {
      onfulfilled = <OnFulfilledFunc<T, TResult1> | undefined>arg1 || undefined;
      onrejected = <OnRejectedFunc<TResult2> | undefined>arg2 || undefined;
    }
    let ok: ThenExec<T, TResult1>;
    if (onfulfilled !== undefined) {
      ok = new ThenExec<T, TResult1>(onfulfilled, this._views, this._options);
    } else {
      ok = new ThenExec<T, TResult1>(undefined, this._views, this._options);
    }
    if (onrejected !== undefined) {
      return new ContextPromiseRunner<TResult1 | TResult2>(
        this._proxy.then(
          ok.create(),
          new CatchExec<TResult2>(onrejected, this._views, options).create()
        ), this._views, options
      );
    }
    return new ContextPromiseRunner<TResult1 | TResult2>(
      this._proxy.then(ok.create()),
      this._views, this._options
    );
  }

  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  catch<TResult = never>(arg1?: any, arg2?: any): ContextPromise<T | TResult> {
    if (! ('catch' in this._proxy) || ! isFunction((<any>this._proxy)['catch'])) {
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
      ((reason: any) => TResult | PromiseLike<TResult>) =
        (<any>this._proxy)['catch'];
    if (onrejected !== null) {
      return new ContextPromiseRunner<T | TResult>(
        catchProxy.apply(this._proxy,
          new CatchExec<TResult>(
            onrejected, this._views, this._options
          ).create()
        ),
        this._views, this._options
      );
    }
    return new ContextPromiseRunner<T | TResult>(
      catchProxy.apply(this._proxy,
        new CatchExec<TResult>(
          undefined, this._views, this._options
        ).create()
      ),
      this._views, this._options
    );
  }
}




//---------------------------------------------------------------
// Wrappers around Promise calls.

/**
 * Top level class to run a proimse function inside a context.
 */
abstract class WrappedPromiseExec {
  protected readonly _views: ExecutionContextView[];
  protected readonly _options: SegmentedContextOptions;

  constructor(views: ExecutionContextView[], options: SegmentedContextOptions) {
    this._views = views;
    this._options = options;
  }

  protected _runInContext<TResult>(func: Function, args: any[]): TResult | PromiseLike<TResult> {
    // Always appends the view as the last argument.
    if (this._views.length <= 0) {
      args.push(undefined);
      return this._updateRes(func.apply(undefined, args));
    }
    if (this._views.length === 1) {
      args.push(this._views[0]);
      return this._updateRes(this._views[0].runInContext(this._options, undefined, func, args));
    }

    // FIXME setup a single view.
    throw new Error('not implemented');
  }

  private _updateRes<TResult>(res: TResult | PromiseLike<TResult>) {
    if (res instanceof ContextPromiseRunner) {
      // FIXME update the list of views.
      throw new Error('not implemented');
    // cannot directly reference PromiseLike, because it's not an actual class.
    } else if (typeof(res) === 'object' && 'then' in <object> res) {
      // FIXME update the result to be context aware.
      throw new Error('not implemented');
    }
    return res;
  }
}


class ExecutorExec<T> extends WrappedPromiseExec {
  private readonly _executor: ContextPromiseExecutor<T>;
  constructor(
        executor: ContextPromiseExecutor<T>,
        views: ExecutionContextView[],
        options: SegmentedContextOptions
      ) {
    super(views, options);
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
        views: ExecutionContextView[],
        options: SegmentedContextOptions
      ) {
    super(views, options);
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
        views: ExecutionContextView[],
        options: SegmentedContextOptions
      ) {
    super(views, options);
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

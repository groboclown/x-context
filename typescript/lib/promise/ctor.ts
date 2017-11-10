/*
 * Implementation for the context aware PromiseConstructor implementation.
 */

import {
  ContextPromiseStatic,
  ContextPromiseExecutor,
  ContextPromise,
  DEFAULT_PROMISE_THREAD_NAME
} from './decl';
import { isPromiseLike, isContextPromiseExecutor } from './util';
import { createInitialPromise, ContextPromiseRunner } from './runner';
import {
  proxyAll,
  proxyRace,
  proxyResolveArg,
  proxyResolveNoArg,
  proxyReject
} from './promise-proxy';
import {
  SegmentedContextOptions,
  ExecutionContextService, ExecutionContextView
} from '../context';
import {
  isFunction
} from 'util';



export class ContextPromiseConstructorImpl implements ContextPromiseStatic {
  private _defaultService: ExecutionContextService | undefined = undefined;
  private _defaultThread: string | undefined = undefined;

  // Only set when a new ContextPromiseConstructor is returned from withService.
  private _declaredService: ExecutionContextService | undefined = undefined;
  private _declaredThread: string | undefined = undefined;


  // ====================================================================
  // Constructors

  constructor(service?: ExecutionContextService | undefined, threadName?: string | undefined) {
    this._defaultService = service;
    this._defaultThread = threadName;
  }

  // ====================================================================
  // State methods

  withService(service: ExecutionContextService): ContextPromiseStatic {
    if (this._declaredService === service) {
      // short circuit and save some memory.
      return this;
    }
    let ret = this._clone();
    ret._declaredService = service;
    return ret;
  }

  inThread(threadName: string): ContextPromiseStatic {
    if (this._declaredThread === threadName) {
      // short circuit and save some memory.
      return this;
    }
    let ret = this._clone();
    ret._declaredThread = threadName;
    return this;
  }

  private _clone(): ContextPromiseConstructorImpl {
    let ret = new ContextPromiseConstructorImpl();
    ret._defaultService = this._defaultService;
    ret._defaultThread = this._defaultThread;
    ret._declaredThread = this._declaredThread;
    ret._declaredService = this._declaredService;
    return ret;
  }

  // tslint:disable-next-line:no-any
  as<TResult>(arg1: any, arg2?: any): ContextPromise<TResult> {
    let options: SegmentedContextOptions = {};
    let executor: ContextPromiseExecutor<TResult> | undefined = undefined;
    if (isContextPromiseExecutor(arg1)) {
      executor = arg1;
    } else if (arg1 !== null && arg1 !== undefined && ! isFunction(arg1)) {
      options = <SegmentedContextOptions> arg1;
      executor = <ContextPromiseExecutor<TResult> | undefined> arg2;
    } else {
      throw new TypeError(
        'expected arguments (SegmentedContextOptions, ContextPromiseExecutor) or (ContextPromiseExecutor)'
      );
    }
    if (executor !== undefined) {
      return createInitialPromise(this._getView(), options, executor);
    }
    throw new TypeError('must define an executor');
  }


  defaultService(service: ExecutionContextService): void {
    this._defaultService = service;
  }

  defaultThread(threadName: string): void {
    this._defaultThread = threadName;
  }


  // ====================================================================
  // Inherited PromiseConstructor methods

  // tslint:disable-next-line:no-any
  all(...args: any[]): ContextPromise<any> {
    let pa = argParser(args);
    let augmented = [];
    for (let value of pa.values) {
      if (isPromiseLike(value)) {
        // tslint:disable-next-line:no-any
        augmented.push(new ContextPromiseRunner<any>(value, this._forkView(), pa.options));
      } else {
        augmented.push(value);
      }
    }
    // tslint:disable-next-line:no-any
    return new ContextPromiseRunner<any>(
      proxyAll(augmented),
      this._getView(),
      // the options arguments are just for the all invocation.
      {}
    );
  }


  // tslint:disable-next-line:no-any
  race(...args: any[]): ContextPromise<any> {
    let pa = argParser(args);
    let augmented = [];
    for (let value of pa.values) {
      if (isPromiseLike(value)) {
        // tslint:disable-next-line:no-any
        augmented.push(new ContextPromiseRunner<any>(value, this._forkView(), pa.options));
      } else {
        augmented.push(value);
      }
    }
    // tslint:disable-next-line:no-any
    return new ContextPromiseRunner<any>(
      proxyRace(augmented),
      this._getView(),
      // the options arguments are just for the race invocation.
      {}
    );
  }


  resolve<T>(value?: T | PromiseLike<T> | undefined): ContextPromise<T | void> {
    if (value === undefined) {
      return new ContextPromiseRunner<T>(
        proxyResolveNoArg(),
        this._getView(),
        {}
      );
    }
    if (isPromiseLike(value)) {
      return new ContextPromiseRunner<T>(
        value,
        this._getView(),
        {}
      );
    }
    return new ContextPromiseRunner<T>(
      proxyResolveArg(value),
      this._getView(),
      {}
    );
  }

  // tslint:disable-next-line:no-any
  reject(reason: any): any {
    return new ContextPromiseRunner<object>(
      proxyReject(reason),
      this._getView(),
      {}
    );
  }

  // ====================================================================
  // Private getters.
  private _getService(): ExecutionContextService {
    if (this._declaredService !== undefined) {
      return this._declaredService;
    }
    if (this._defaultService !== undefined) {
      return this._defaultService;
    }
    if (_GlobalContextPromise !== undefined && _GlobalContextPromise._defaultService !== undefined) {
      return _GlobalContextPromise._defaultService;
    }
    return ExecutionContextService.getDefaultInstance();
  }

  private _getThread(): string {
    if (this._declaredThread !== undefined) {
      return this._declaredThread;
    }
    if (this._defaultThread !== undefined) {
      return this._defaultThread;
    }
    if (_GlobalContextPromise !== undefined && _GlobalContextPromise._defaultThread !== undefined) {
      return _GlobalContextPromise._defaultThread;
    }
    return DEFAULT_PROMISE_THREAD_NAME;
  }

  private _getView(): ExecutionContextView {
    return this._getService().forThread(this._getThread());
  }

  private _forkView(): ExecutionContextView {
    return this._getService().forkThreadAsUnique(this._getThread());
  }
}

type ParsedArg = {
  // tslint:disable-next-line:no-any
  values: any[];
  options: SegmentedContextOptions;
};



const _GlobalContextPromise: ContextPromiseConstructorImpl = new ContextPromiseConstructorImpl();



// tslint:disable-next-line:no-any
const argParser = (args: any[]): ParsedArg => {
  let ret: ParsedArg = { values: [], options: {} };
  if (args.length === 2) {
    ret.options = args[0] || ret.options;
    ret.values = args[1];
  } else if (args.length === 1) {
    ret.values = args[0];
  } else {
    throw new TypeError('expected 1, 2, or 3 arguments');
  }
  return ret;
};

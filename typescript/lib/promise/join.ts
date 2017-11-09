/*
 * Combination of the context promise ctor and the runner to make the
 * final promise-like interface.
 */

import {
  SegmentedContextOptions, ExecutionContextService
} from '../context';
import {
  ContextPromise, ContextPromiseConstructor, ContextPromiseStatic,
  ContextPromiseExecutor, PromiseExecutor,
  OnFulfilledFunc, OnRejectedFunc
} from './decl';
import {
  ContextPromiseConstructorImpl
} from './ctor';
import {

} from './runner';
import {
  isFunction
} from 'util';

// The static fields must implement ContextPromiseStatic + PromiseConstructor.
// The constructors must implement ContextPromiseNew + PromiseConstructor.
export class ExecutionContextPromise<T> implements Promise<T>, ContextPromise<T> {
  private static readonly _ctor: ContextPromiseStatic = new ContextPromiseConstructorImpl();
  static readonly [Symbol.species]: Function = ExecutionContextPromise;
  readonly _proxy: ContextPromise<T>;
  readonly [Symbol.toStringTag]: "Promise";

  // ========================================================================
  // ContextPromiseNew + PromiseConstructor
  constructor(executor: ContextPromiseExecutor<T>);
  constructor(options: SegmentedContextOptions, executor: ContextPromiseExecutor<T>);
  constructor(executor: PromiseExecutor<T>);
  constructor(arg1?: any, arg2?: any) {
    let executor: ContextPromiseExecutor<T> | PromiseExecutor<T>;
    let options: SegmentedContextOptions;
    if (arg2 === undefined) {
      options = {};
      executor = arg1;
    } else {
      options = arg1;
      executor = arg2;
    }
    this._proxy = ExecutionContextPromise._ctor.as(options, executor);
  }


  // ========================================================================
  // ContextPromiseStatic + PromiseConstructor
  // Must be implemented as static.

  static defaultService(service: ExecutionContextService): void {
    ExecutionContextPromise._ctor.defaultService(service);
  }

  static defaultThread(threadName: string): void {
    ExecutionContextPromise._ctor.defaultThread(threadName);
  }

  static withService(service: ExecutionContextService): ContextPromiseStatic {
    return ExecutionContextPromise._ctor.withService(service);
  }

  static inThread(threadName: string): ContextPromiseStatic {
    return ExecutionContextPromise._ctor.inThread(threadName);
  }

  static as<T>(executor: ContextPromiseExecutor<T>): ContextPromise<T>;
  static as<T>(options: SegmentedContextOptions, executor: ContextPromiseExecutor<T>): ContextPromise<T>;
  static as<T>(
        optionsOrExecutor: SegmentedContextOptions | ContextPromiseExecutor<T>,
        executorOrUndef?: ContextPromiseExecutor<T> | undefined
      ): ContextPromise<T> {
    if (executorOrUndef === undefined) {
      return ExecutionContextPromise._ctor.as(<ContextPromiseExecutor<T>>optionsOrExecutor);
    }
    return ExecutionContextPromise._ctor.as(
      <SegmentedContextOptions>optionsOrExecutor, executorOrUndef
    );
  }

  static all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]> | Promise<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;
  static all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9]> | Promise<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
  static all<T1, T2, T3, T4, T5, T6, T7, T8>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7, T8]> | Promise<[T1, T2, T3, T4, T5, T6, T7, T8]>;
  static all<T1, T2, T3, T4, T5, T6, T7>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7]> | Promise<[T1, T2, T3, T4, T5, T6, T7]>;
  static all<T1, T2, T3, T4, T5, T6>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): ContextPromise<[T1, T2, T3, T4, T5, T6]> | Promise<[T1, T2, T3, T4, T5, T6]>;
  static all<T1, T2, T3, T4, T5>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>]): ContextPromise<[T1, T2, T3, T4, T5]> | Promise<[T1, T2, T3, T4, T5]>;
  static all<T1, T2, T3, T4>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>]): ContextPromise<[T1, T2, T3, T4]> | Promise<[T1, T2, T3, T4]>;
  static all<T1, T2, T3>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): ContextPromise<[T1, T2, T3]> | Promise<[T1, T2, T3]>;
  static all<T1, T2>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): ContextPromise<[T1, T2]> | Promise<[T1, T2]>;
  static all<T>(values: (T | PromiseLike<T>)[]): ContextPromise<T[]> | Promise<T[]>;
  static all<TAll>(values: Iterable<TAll | PromiseLike<TAll>>): ContextPromise<TAll[]>;
  static all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;
  static all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
  static all<T1, T2, T3, T4, T5, T6, T7, T8>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7, T8]>;
  static all<T1, T2, T3, T4, T5, T6, T7>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7]>;
  static all<T1, T2, T3, T4, T5, T6>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): ContextPromise<[T1, T2, T3, T4, T5, T6]>;
  static all<T1, T2, T3, T4, T5>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>]): ContextPromise<[T1, T2, T3, T4, T5]>;
  static all<T1, T2, T3, T4>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>]): ContextPromise<[T1, T2, T3, T4]>;
  static all<T1, T2, T3>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): ContextPromise<[T1, T2, T3]>;
  static all<T1, T2>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): ContextPromise<[T1, T2]>;
  static all<T>(options: SegmentedContextOptions, values: (T | PromiseLike<T>)[]): ContextPromise<T[]>;
  static all<TAll>(options: SegmentedContextOptions, values: Iterable<TAll | PromiseLike<TAll>>): ContextPromise<TAll[]>;
  static all(...args: any[]): ContextPromise<any> | Promise<any> {
    return ExecutionContextPromise._ctor.all(args);
  }

  static race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;
  static race<T1, T2, T3, T4, T5, T6, T7, T8, T9>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;
  static race<T1, T2, T3, T4, T5, T6, T7, T8>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;
  static race<T1, T2, T3, T4, T5, T6, T7>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7>;
  static race<T1, T2, T3, T4, T5, T6>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6>;
  static race<T1, T2, T3, T4, T5>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>]): ContextPromise<T1 | T2 | T3 | T4 | T5>;
  static race<T1, T2, T3, T4>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>]): ContextPromise<T1 | T2 | T3 | T4>;
  static race<T1, T2, T3>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): ContextPromise<T1 | T2 | T3>;
  static race<T1, T2>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): ContextPromise<T1 | T2>;
  static race<T>(values: (T | PromiseLike<T>)[]): ContextPromise<T>;
  static race<T>(values: Iterable<T | PromiseLike<T>>): ContextPromise<T>;
  static race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;
  static race<T1, T2, T3, T4, T5, T6, T7, T8, T9>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;
  static race<T1, T2, T3, T4, T5, T6, T7, T8>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;
  static race<T1, T2, T3, T4, T5, T6, T7>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7>;
  static race<T1, T2, T3, T4, T5, T6>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6>;
  static race<T1, T2, T3, T4, T5>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>]): ContextPromise<T1 | T2 | T3 | T4 | T5>;
  static race<T1, T2, T3, T4>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>]): ContextPromise<T1 | T2 | T3 | T4>;
  static race<T1, T2, T3>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): ContextPromise<T1 | T2 | T3>;
  static race<T1, T2>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): ContextPromise<T1 | T2>;
  static race<T>(options: SegmentedContextOptions, values: (T | PromiseLike<T>)[]): ContextPromise<T>;
  static race<T>(options: SegmentedContextOptions, values: Iterable<T | PromiseLike<T>>): ContextPromise<T> | Promise<T>;
  static race(...args: any[]): ContextPromise<any> | Promise<any> {
    return ExecutionContextPromise._ctor.race(args);
  }

  static reject(reason: any): ContextPromise<never>;
  static reject<T>(reason: any): ContextPromise<T>;
  static reject(reason: any): ContextPromise<any> | Promise<any> {
    return ExecutionContextPromise._ctor.reject(reason);
  }

  static resolve<T>(value: T | PromiseLike<T>): ContextPromise<T>;
  static resolve(): ContextPromise<void>;
  static resolve(value?: any): ContextPromise<any> {
    return ExecutionContextPromise._ctor.resolve(value);
  }

  // ========================================================================
  // ContextPromise + Promise API

  then<TResult1 = T, TResult2 = never>(arg1?: any, arg2?: any, arg3?: any): any {
    if (arg1 !== undefined && arg1 !== null && ! isFunction(arg1)) {
      return this._proxy.then(
        <SegmentedContextOptions>arg1,
        <OnFulfilledFunc<T, TResult1> | null | undefined>arg2,
        <OnRejectedFunc<TResult2> | null | undefined>arg3
      );
    }
    return this._proxy.then(
      <OnFulfilledFunc<T, TResult1> | null | undefined>arg1,
      <OnRejectedFunc<TResult2> | null | undefined>arg2
    );
  }


  catch<TResult = never>(arg1?: any, arg2?: any): any {
    if (arg1 !== undefined && arg1 !== null && ! isFunction(arg1)) {
      return this._proxy.catch(
        <SegmentedContextOptions>arg1,
        <OnRejectedFunc<TResult> | null | undefined>arg2
      );
    }
    return this._proxy.catch(
      <OnRejectedFunc<TResult> | null | undefined>arg1
    );
  }

}

export const CPromise: ContextPromiseConstructor & PromiseConstructor = ExecutionContextPromise;

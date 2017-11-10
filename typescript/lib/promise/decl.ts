/*
 * Declarations that are public, and some helper methods.
 */

import {
  SegmentedContextOptions,
  ExecutionContextService, ExecutionContextView
} from '../context';


export const DEFAULT_PROMISE_THREAD_NAME = 'PromiseThread';

// ============================================================================
// Helper types to make usage much easier.
export interface ResolvePromiseFunc<T> extends Function {
  (value?: T | PromiseLike<T>): void;
}

export interface RejectPromiseFunc extends Function {
  // tslint:disable-next-line:no-any
  (reason?: any): void;
}

export interface PromiseExecutor<T> extends Function {
  (resolve: ResolvePromiseFunc<T>, reject: RejectPromiseFunc): void;
}

export interface ContextPromiseExecutor<T> extends Function {
  (
    resolve: ResolvePromiseFunc<T>,
    reject: RejectPromiseFunc,
    view: ExecutionContextView
  ): void;
}

export interface OnFulfilledFunc<T, TResult> extends Function {
  (value: T): TResult | PromiseLike<TResult>;
}

export interface OnRejectedFunc<TResult> extends Function {
  // tslint:disable-next-line:no-any
  (reason: any): TResult | PromiseLike<TResult>
}



// ============================================================================


export interface ContextPromise<T> extends Promise<T> {
  /**
   * Attaches callbacks for the resolution and/or rejection of the Promise.
   * @param onfulfilled The callback to execute when the Promise is resolved.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of which ever callback is executed.
   */
  // tslint:disable-next-line:max-line-length
  then<TResult1 = T, TResult2 = never>(onfulfilled?: OnFulfilledFunc<T, TResult1> | undefined | null, onrejected?: OnRejectedFunc<TResult2> | undefined | null): ContextPromise<TResult1 | TResult2>;
  // tslint:disable-next-line:max-line-length
  then<TResult1 = T, TResult2 = never>(options: SegmentedContextOptions, onfulfilled?: OnFulfilledFunc<T, TResult1> | undefined | null, onrejected?: OnRejectedFunc<TResult2> | undefined | null): ContextPromise<TResult1 | TResult2>;

  /**
   * Attaches a callback for only the rejection of the Promise.
   * @param onrejected The callback to execute when the Promise is rejected.
   * @returns A Promise for the completion of the callback.
   */
  // tslint:disable-next-line:max-line-length no-any
  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): ContextPromise<T | TResult>;
  // tslint:disable-next-line:max-line-length no-any
  catch<TResult = never>(options: SegmentedContextOptions, onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): ContextPromise<T | TResult>;
}


// ============================================================================

export interface ContextPromiseNew {
  /**
   * Creates a new Promise.
   * @param executor A callback used to initialize the promise. This callback is passed two arguments:
   * a resolve callback used resolve the promise with a value or the result of another promise,
   * and a reject callback used to reject the promise with a provided reason or error.
   */
  new <T>(executor: ContextPromiseExecutor<T>): ContextPromise<T>;

  /**
   * Creates a new Promise with a segmented context options.
   * @param executor A callback used to initialize the promise. This callback is passed two arguments:
   * a resolve callback used resolve the promise with a value or the result of another promise,
   * and a reject callback used to reject the promise with a provided reason or error.
   */
  new <T>(options: SegmentedContextOptions, executor: ContextPromiseExecutor<T>): ContextPromise<T>;

  // Original, from PromiseConstructor
  /**
   * Creates a new Promise.
   * @param executor A callback used to initialize the promise. This callback is passed two arguments:
   * a resolve callback used resolve the promise with a value or the result of another promise,
   * and a reject callback used to reject the promise with a provided reason or error.
   */
  // tslint:disable-next-line:max-line-length no-any
  new <T>(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): ContextPromise<T>;
}



/**
 * The same thing as a PromiseConstructor, but without the 'new' statments.
 * At this particular verison, it is not compatible with the PromiseConstructor.
 */
export interface ContextPromiseStatic {

  defaultService(service: ExecutionContextService): void;

  defaultThread(threadName: string): void;

  // =======================================================================
  // Chain calls.

  /**
   * Sets the active service for a chain of calls.
   */
  withService(service: ExecutionContextService): ContextPromiseStatic;

  inThread(threadName: string): ContextPromiseStatic;

  // replaces a "new" statement, while chaining with other calls.
  as<T>(executor: ContextPromiseExecutor<T>): ContextPromise<T>;
  as<T>(options: SegmentedContextOptions, executor: ContextPromiseExecutor<T>): ContextPromise<T>;

  // =======================================================================
  // Original versions, but with a new return type.

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4, T5, T6, T7, T8>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4, T5, T6, T7>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4, T5, T6>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): ContextPromise<[T1, T2, T3, T4, T5, T6]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4, T5>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>]): ContextPromise<[T1, T2, T3, T4, T5]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>]): ContextPromise<[T1, T2, T3, T4]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): ContextPromise<[T1, T2, T3]>;

  all<T1, T2>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): ContextPromise<[T1, T2]>;

  all<T>(values: (T | PromiseLike<T>)[]): ContextPromise<T[]>;

  all<TAll>(values: Iterable<TAll | PromiseLike<TAll>>): ContextPromise<TAll[]>;



  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4, T5, T6, T7, T8, T9>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4, T5, T6, T7, T8>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4, T5, T6, T7>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4, T5, T6>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4, T5>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>]): ContextPromise<T1 | T2 | T3 | T4 | T5>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>]): ContextPromise<T1 | T2 | T3 | T4>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): ContextPromise<T1 | T2 | T3>;

  race<T1, T2>(values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): ContextPromise<T1 | T2>;

  race<T>(values: (T | PromiseLike<T>)[]): ContextPromise<T>;

  race<T>(values: Iterable<T | PromiseLike<T>>): ContextPromise<T>;

  // tslint:disable-next-line:no-any
  reject(reason: any): ContextPromise<never>;

  // tslint:disable-next-line:no-any
  reject<T>(reason: any): ContextPromise<T>;

  resolve<T>(value: T | PromiseLike<T>): ContextPromise<T>;

  resolve(): ContextPromise<void>;

  // =======================================================================
  // Context specific versions

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4, T5, T6, T7, T8>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4, T5, T6, T7>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): ContextPromise<[T1, T2, T3, T4, T5, T6, T7]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4, T5, T6>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): ContextPromise<[T1, T2, T3, T4, T5, T6]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4, T5>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>, T5 | PromiseLike<T5>]): ContextPromise<[T1, T2, T3, T4, T5]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3, T4>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike <T4>]): ContextPromise<[T1, T2, T3, T4]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2, T3>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): ContextPromise<[T1, T2, T3]>;

  // tslint:disable-next-line:max-line-length
  all<T1, T2>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): ContextPromise<[T1, T2]>;

  // tslint:disable-next-line:max-line-length
  all<TAll>(options: SegmentedContextOptions, values: Iterable<TAll | PromiseLike<TAll>>): ContextPromise<TAll[]>;

  // tslint:disable-next-line:max-line-length
  all<T>(options: SegmentedContextOptions, values: (T | PromiseLike<T>)[]): ContextPromise<T[]>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>, T10 | PromiseLike<T10>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4, T5, T6, T7, T8, T9>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>, T9 | PromiseLike<T9>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4, T5, T6, T7, T8>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>, T8 | PromiseLike<T8>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4, T5, T6, T7>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>, T7 | PromiseLike<T7>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6 | T7>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4, T5, T6>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>, T6 | PromiseLike<T6>]): ContextPromise<T1 | T2 | T3 | T4 | T5 | T6>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4, T5>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>, T5 | PromiseLike<T5>]): ContextPromise<T1 | T2 | T3 | T4 | T5>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3, T4>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>, T4 | PromiseLike<T4>]): ContextPromise<T1 | T2 | T3 | T4>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2, T3>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>, T3 | PromiseLike<T3>]): ContextPromise<T1 | T2 | T3>;

  // tslint:disable-next-line:max-line-length
  race<T1, T2>(options: SegmentedContextOptions, values: [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): ContextPromise<T1 | T2>;

  race<T>(options: SegmentedContextOptions, values: (T | PromiseLike<T>)[]): ContextPromise<T>;

  race<T>(options: SegmentedContextOptions, values: Iterable<T | PromiseLike<T>>): ContextPromise<T>;

}


export type ContextPromiseConstructor = ContextPromiseNew & ContextPromiseStatic;

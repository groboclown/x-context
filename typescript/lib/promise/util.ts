/*
 * Some utility functions.
 */

import {
  isObject, isFunction
} from 'util';
import {
  PromiseExecutor, ContextPromiseExecutor
} from './decl';

// tslint:disable-next-line:no-any
export const isPromiseLike = <T>(o: any): o is PromiseLike<T> => {
  if (o === null || o === undefined || ! isObject(o)) {
    return false;
  }
  return ('then' in o && isFunction(o.then));
};


export const isPromiseExecutor = <T>(o: any): o is PromiseExecutor<T> => {
  if (o === null || o === undefined || ! isFunction(o)) {
    return false;
  }
  // Can we inspect the declared arguments?
  return true;
};


export const isContextPromiseExecutor = <T>(o: any): o is ContextPromiseExecutor<T> => {
  if (o === null || o === undefined || ! isFunction(o)) {
    return false;
  }
  // Can we inspect the declared arguments?
  return true;
};



import { PromiseExecutor } from './decl';


// make a local copy of the promise class.
// This allows it to also be changeable by the user
// to instead reference some other promise library,
// such as bluebird or Q.
let _PC: PromiseConstructor = Promise;

/**
 * Sets the underlying Promise implementation used by the
 * context-aware promise classes.
 */
export const setPromise = (c: PromiseConstructor): void => {
  if (c === null || c === undefined) {
    throw new TypeError('argument must be a PromiseConstructor');
  }
  _PC = c;
};

export const createProxyPromise = <T>(c: PromiseExecutor<T>): Promise<T> => {
  return new _PC(c);
};

export const proxyAll = <T>(promises: any): Promise<T> => {
  let a: Promise<any> = _PC.all(promises);
  return <Promise<T>>a;
};

export const proxyRace = <T>(promises: any): Promise<T> => {
  let a: Promise<any> = _PC.race(promises);
  return <Promise<T>>a;
};

export const proxyResolveArg = <T>(t: T): Promise<T> => {
  return _PC.resolve(t);
};

export const proxyResolveNoArg = <T>(): Promise<T> => {
  let a: any = _PC.resolve();
  return <Promise<T>>a;
};

export const proxyReject = <T>(t: T): Promise<T> => {
  return _PC.reject(t);
};

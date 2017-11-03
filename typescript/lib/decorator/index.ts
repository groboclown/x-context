/*
 * Decorators for adding execution context.
 *
 * Note that decorators can ONLY be used on classes (as they
 * are currently proposed; for more details, see
 * https://www.typescriptlang.org/docs/handbook/decorators.html).
 *
 * As such, these have a more limited role they can play.
 */

import {
  ChildContextOptions, ExecutionContextService
} from '../context';

export type DecoratorFunction = {
  // tslint:disable-next-line:no-any
  (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>): void;
};


/**
 * Helpers to create custom decorators that force the method
 * to run in the new child execution context.
 */
export const createContextWrapperDecoratorFunction = (
      newContexts: { [kind: string]: ChildContextOptions },
      contextService?: ExecutionContextService
    ): DecoratorFunction => {
  let cs = contextService || ExecutionContextService.getDefaultInstance();

  // tslint:disable-next-line:no-any
  return (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>): void => {
    let method = descriptor.value;

    // NOTE: Do not use arrow syntax here. Use a function expression in
    // order to use the correct value of `this` in this method (see notes below)
    // tslint:disable-next-line:no-any only-arrow-functions
    descriptor.value = function(...args: any[]): any {
      if (method !== undefined) {
        let view = cs.forCurrentThread();
        // tslint:disable-next-line:no-invalid-this
        return view.runInContext(newContexts, this, method, args, arguments, target, propertyName);
      }
      return undefined;
    };
  };
};

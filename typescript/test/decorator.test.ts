/* tslit:disable:no-import-side-effect no-unused no-unused-expression */
import 'jest';

import {
  RunContext,
  ChildContextOptions,
  ContextInvocation,
  RunContextRegistration,
  ExecutionContextService
} from '../lib/context';
import {
  createContextWrapperDecoratorFunction
} from '../lib/decorator';



describe('run in context', () => {
  class SimpleRunContext extends RunContext<SimpleRunContext> {
    readonly created: SimpleRunContext[];
    beforeContext: int = 0;
    afterContext: int = 0;

    constructor(created: SimpleRunContext[]) {
      super();
      this.created = created;
      console.log('creating context, size = ' + created.length);
      this.created.push(this);
    }

    createChild(options: ChildContextOptions): SimpleRunContext {
      return new SimpleRunContext(this.created);
    }

    onContext<T>(invoked: ContextInvocation<T>): T {
      console.log('Entering onContext');
      this.calledContext++;
      let r = invoked.invoke();
      this.afterContext++;
      console.log('Leaving onContext');
      return r;
    }
  }
  class SimpleRunContextRegistration implements RunContextRegistration<SimpleRunContext> {
    readonly kind: string = 'simple';
    readonly created: SimpleRunContext[] = [];

    createInitialContext(): T {
      return new SimpleRunContext(this.created);
    }
  }

  it('one context', () => {
    let service = new ExecutionContextService();
    let simpleReg = new SimpleRunContextRegistration();
    service.register(simpleReg);

    const simpleCall = (i: int): Function => {
      console.log('decorator call ' + i);
      return createContextWrapperDecoratorFunction(
        { simple: {} },
        service
      );
    };

    class OC1 {
      key: int = 2;

      @simpleCall(1)
      runIt(count: int): void {
        console.log(`Called runIt ${count} from ${this.key}`);
        if (count > 1) {
          this.runIt(count - 1);
        }
      }
    }

    (new OC1()).runIt(3);

    // 3 calls + 1 initial context
    expect(simpleReg.created.length).toEqual(4);
  });
});

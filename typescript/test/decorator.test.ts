/* tslit:disable:no-import-side-effect no-unused no-unused-expression */
import 'jest';

import {
  RunContext,
  /*ChildContextOptions,*/
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
    beforeContext: number = 0;
    afterContext: number = 0;

    constructor(created: SimpleRunContext[]) {
      super();
      this.created = created;
      //console.log('creating context, size = ' + created.length);
      this.created.push(this);
    }

    createChild(/*options: ChildContextOptions*/): SimpleRunContext {
      return new SimpleRunContext(this.created);
    }

    onContext<T>(invoked: ContextInvocation<T>): T {
      //console.log('Entering onContext');
      this.beforeContext++;
      let r = invoked.invoke();
      this.afterContext++;
      //console.log('Leaving onContext');
      return r;
    }
  }
  class SimpleRunContextRegistration implements RunContextRegistration<SimpleRunContext> {
    readonly kind: string = 'simple';
    readonly created: SimpleRunContext[] = [];

    createInitialContext(): SimpleRunContext {
      return new SimpleRunContext(this.created);
    }
  }

  it('one context, double call', () => {
    let service = new ExecutionContextService();
    let simpleReg = new SimpleRunContextRegistration();
    service.register(simpleReg);

    const simpleCall = (i: number): Function => {
      // console.log('decorator call ' + i);
      return createContextWrapperDecoratorFunction(
        { simple: { key: i } },
        service
      );
    };

    class OC1 {
      key: number = 2;
      callCount = 0;

      @simpleCall(1)
      runIt(count: number): void {
        //console.log(`Called runIt ${count} from ${this.key}`);
        this.callCount++;
        if (count > 1) {
          this.runIt(count - 1);
        }
        if (count > 2) {
          this.runIt(count - 2);
        }
      }
    }

    let oc = new OC1();
    oc.runIt(3);

    // 4 calls + 1 initial context
    expect(oc.callCount).toEqual(4);
    expect(simpleReg.created.length).toEqual(5);
    expect(simpleReg.created[0].beforeContext).toEqual(0);
    expect(simpleReg.created[0].afterContext).toEqual(0);
    expect(simpleReg.created[1].beforeContext).toEqual(1);
    expect(simpleReg.created[1].afterContext).toEqual(1);
    expect(simpleReg.created[2].beforeContext).toEqual(1);
    expect(simpleReg.created[2].afterContext).toEqual(1);
    expect(simpleReg.created[3].beforeContext).toEqual(1);
    expect(simpleReg.created[3].afterContext).toEqual(1);
    expect(simpleReg.created[4].beforeContext).toEqual(1);
    expect(simpleReg.created[4].afterContext).toEqual(1);
  });
});

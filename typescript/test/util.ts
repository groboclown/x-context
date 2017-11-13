

import {
  RunContext,
  ContextInvocation,
  RunContextRegistration
} from '../lib/context';
import {
  ExecutionContextEnteredError
} from '../lib/exceptions';

let DEBUG = false;
export const enableDebug = () => {
  DEBUG = true;
};
export const disableDebug = () => {
  DEBUG = false;
};

export const debug = (text: string): void => {
  if (DEBUG) {
    console.log(`[TEST] ${text}`);
  }
}

export class SimpleRunContext extends RunContext<SimpleRunContext> {
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
    debug(`Simple context: creating child`);
    return new SimpleRunContext(this.created);
  }

  onContext<T>(invoked: ContextInvocation<T>): T {
    debug('Entering onContext');
    this.beforeContext++;
    let r = invoked.invoke();
    this.afterContext++;
    debug('Leaving onContext');
    return r;
  }
}


export class SimpleRunContextRegistration implements RunContextRegistration<SimpleRunContext> {
  readonly kind: string = 'simple';
  readonly created: SimpleRunContext[] = [];

  createInitialContext(): SimpleRunContext {
    debug(`Simple context registration: creating initial context`);
    return new SimpleRunContext(this.created);
  }
}

export type SecurityArea = 'IO' | 'URL' | 'CREDENTIALS';

export type SecurityOptions = {
  forbidden: SecurityArea[] | undefined;
  uses: SecurityArea[] | undefined;
};

export class SecuritySimulationContext implements RunContext<SecuritySimulationContext> {
  private readonly forbidden: SecurityArea[];
  private readonly uses: SecurityArea[];

  constructor(options: SecurityOptions) {
    this.forbidden = options.forbidden || [];
    this.uses = options.uses || [];
  }

  createChild(options: SecurityOptions): SecuritySimulationContext {
    debug(`Security context: creating child`);
    let forbidden = options.forbidden || [];
    for (let f of this.forbidden) {
      if (! (f in forbidden)) {
        forbidden.push(f);
      }
    }
    let uses = options.uses || [];
    for (let u of this.uses) {
      if (! (u in uses)) {
        uses.push(u);
      }
    }
    return new SecuritySimulationContext({
      forbidden: forbidden,
      uses: uses
    });
  }

  onContext<T>(invoked: ContextInvocation<T>): T {
    debug(`Security context for ${this.uses}; forbidden ${this.forbidden}`);
    for (let u of this.uses) {
      this._checkForbidden(u);
    }
    debug(`Security context allowing execution`);
    return invoked.invoke();
  }

  private _checkForbidden(s: SecurityArea): void {
    for (let f of this.forbidden) {
      if (f === s) {
        throw new ExecutionContextEnteredError(
          `security error trying to use forbidden access rights ${s}`);
      }
    }
  }
}

export class SecuritySimulationContextRegistration implements RunContextRegistration<SecuritySimulationContext> {
  readonly kind: string = 'security';

  createInitialContext(): SecuritySimulationContext {
    return new SecuritySimulationContext({ forbidden: undefined, uses: undefined });
  }
}

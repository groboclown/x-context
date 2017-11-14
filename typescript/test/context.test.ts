/* tslit:disable:no-import-side-effect no-unused no-unused-expression */
import 'jest';

import {
  ExecutionContextService, DEFAULT_THREAD_NAME,
  RunContext,
  ContextInvocation,
  RunContextRegistration,
  ChildContextOptions,
} from '../lib/context';
import {
  ExecutionContextEnteredError,
  ExecutionContextAlreadyRegisteredError
} from '../lib/exceptions';

import {
  debug, disableDebug,
  SimpleRunContextRegistration,
  SecuritySimulationContextRegistration,
  PropertiesRunContext
} from './util';

describe('context unit calls', () => {
  disableDebug();
  it('forThread, forCurrentThread', () => {
    let service = new ExecutionContextService();
    let reg = new SimpleRunContextRegistration();
    service.register(reg);

    let currentView = service.forCurrentThread();
    let defaultView = service.forThread(DEFAULT_THREAD_NAME);
    expect(currentView).toBeDefined();
    expect(currentView).toEqual(defaultView);
  });

  it('forkThreadAsUnique', () => {
    let service = new ExecutionContextService();
    let reg = new SimpleRunContextRegistration();
    service.register(reg);

    let defaultView = service.forThread(DEFAULT_THREAD_NAME);
    let forkedView = service.forkThreadAsUnique(DEFAULT_THREAD_NAME);
    expect(defaultView).toBeDefined();
    expect(forkedView).toBeDefined();

    // TODO check that they are different names.
  });

  it('ExecutionContextAlreadyRegisteredError', () => {
    let service = new ExecutionContextService();
    let reg = new SimpleRunContextRegistration();
    service.register(reg);
    expect(() => {
      service.register(reg);
    }).toThrow(ExecutionContextAlreadyRegisteredError);
  });

  it('Create context when options given', () => {
    let service = new ExecutionContextService();
    let reg = new SimpleRunContextRegistration();
    service.register(reg);
    service.forCurrentThread().runInContext(
      {'simple': {}},
      undefined,
      () => {},
      []
    );
    // 2: 1 for initial context, 1 for child.
    expect(reg.created.length).toEqual(2);
  });

  it('Create context when options not given', () => {
    let service = new ExecutionContextService();
    let reg = new SimpleRunContextRegistration();
    service.register(reg);
    service.forCurrentThread().runInContext(
      {},
      undefined,
      () => {
        // sub context; shouldn't create a child, because we don't
        // specify an option for it, so the original wil be inherited.
        service.forCurrentThread().runInContext({}, undefined, () => {}, []);
      },
      []
    );
    // 1 for initial context.
    expect(reg.created.length).toEqual(1);

    // the initial context was reused for each entered context.
    expect(reg.created[0].beforeContext).toEqual(2);
    expect(reg.created[0].afterContext).toEqual(2);
  });
});

describe('context errors', () => {
  disableDebug();

  it('security ok', () => {
    let service = new ExecutionContextService();
    service.register(new SecuritySimulationContextRegistration());

    // First call is defining the security forbidden access.
    service.forCurrentThread().runInContext(
      {
        'security': {
          'forbidden': ['IO']
        }
      },
      undefined, () => {
        // Second call is defining what is used.
        service.forCurrentThread().runInContext(
          {
            'security': {
              'uses': ['URL']
            }
          },
          undefined, () => {
            debug('Running with URL, forbidden against IO');
          }, []
        );
      }, []
    );
  });

  it('security fail', () => {
    let service = new ExecutionContextService();
    service.register(new SecuritySimulationContextRegistration());

    // First call is defining the security forbidden access.
    expect(() => {
      service.forCurrentThread().runInContext(
        {
          'security': {
            'forbidden': ['IO']
          }
        },
        undefined, () => {
          // Second call is defining what is used.
          debug('Starting inner call to context.');
          service.forCurrentThread().runInContext(
            {
              'security': {
                'uses': ['IO']
              }
            },
            undefined, () => {
              debug('Should not reach here');
            }, []
          );
        }, []
      );
    }).toThrow(ExecutionContextEnteredError);
  });
});


describe('Exception retry in invoked method', () => {
  class RetryRunContext extends RunContext<RetryRunContext> {
    private readonly retryMax: number;
    retryAttempts: number = 0;

    constructor(max: number) {
      super();
      this.retryMax = max;
    }

    createChild(options: ChildContextOptions): RetryRunContext {
      let max = this.retryMax;
      if ('retries' in options) {
        max = options['retries'];
      }
      return new RetryRunContext(max);
    }

    onContext<T>(invoked: ContextInvocation<T>): T {
      let attempts = 0;
      while (true) {
        attempts++;
        this.retryAttempts++;
        try {
          return invoked.invoke();
        } catch (e) {
          if (attempts >= this.retryMax) {
            throw e;
          }
        }
      }
    }
  }

  class RetryRunContextRegistration implements RunContextRegistration<RetryRunContext> {
    readonly kind: string = 'retry';

    createInitialContext(): RetryRunContext {
      return new RetryRunContext(3);
    }
  }

  it('Retry and Fail', () => {
    let service = new ExecutionContextService();
    service.register(new RetryRunContextRegistration());

    // use default retry count (3)
    let retries = 0;
    expect(() => {
      service.forCurrentThread().runInContext({}, undefined, () => {
        retries++;
        throw new Error();
      }, []);
    }).toThrow(Error);
    expect(retries).toEqual(3);
  });

  it('Retry and Pass', () => {
    let service = new ExecutionContextService();
    service.register(new RetryRunContextRegistration());

    // use default retry count (3)
    let retries = 0;
    service.forCurrentThread().runInContext({}, undefined, () => {
      if (++retries < 2) {
        throw new Error();
      }
    }, []);
    expect(retries).toEqual(2);
  })
});



describe('simple sql injection attack', () => {
  class SqlAccessRunContextRegistration implements RunContextRegistration<PropertiesRunContext> {
    readonly kind: string = 'sql-access';

    createInitialContext(): PropertiesRunContext {
      return new PropertiesRunContext({});
    }
  }

  it('Simulate Sql Parse Problem', () => {
    let service = new ExecutionContextService();
    service.register(new SqlAccessRunContextRegistration());

    const mySqlWriteValue = (value: string) => {
      let context: PropertiesRunContext = service.forCurrentThread().getActiveRunContext('sql-access');
      // This can do other security checks, like ensuring that the requested
      // table has write access.
      if (context.options['readonly'] === true) {
        throw new ExecutionContextEnteredError(
          `Method doesn't have access permissions to write to my-value (value: ${value})`);
      }
      // Perform write.
    };

    // Should pass without error
    service.forCurrentThread().runInContext(
      {'sql-access': { 'readonly': false }},
      undefined,
      mySqlWriteValue, ['a']
    );

    expect(() => {
      service.forCurrentThread().runInContext(
        {'sql-access': { 'readonly': true }},
        undefined,
        mySqlWriteValue, ['a']
      );
    }).toThrow(ExecutionContextEnteredError);
  });
});

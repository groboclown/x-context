/* tslit:disable:no-import-side-effect no-unused no-unused-expression */
import 'jest';

import {
  ExecutionContextService, DEFAULT_THREAD_NAME
} from '../lib/context';
import {
  ExecutionContextEnteredError,
  ExecutionContextAlreadyRegisteredError
} from '../lib/exceptions';

import {
  debug, disableDebug,
  SimpleRunContextRegistration,
  SecuritySimulationContextRegistration
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

/* tslit:disable:no-import-side-effect no-unused no-unused-expression */
import 'jest';

import {
  ExecutionContextService
} from '../lib/context';
import {
  CPromise, setPromise
} from '../lib/promise';
import {
  SimpleRunContextRegistration, debug
} from './util';

describe('context unit calls', () => {
  setPromise(Promise);
  it('Run a CPromise w/ `as` and `then`', () => {
    let service = new ExecutionContextService();
    let reg = new SimpleRunContextRegistration();
    service.register(reg);
    return Promise.all([CPromise
        .withService(service)
        .as({'simple': {}}, (resolve) => {
          debug('first context');
          resolve(1);
        })
        .then({}, () => {
          debug('second context');
        })
        // There is an implicit call on the final object that the 'then'
        // returns.
      ])
      // Assertions for the promise test code above.
      .then(() => {
        debug('assertion context');
        // 3 calls + initial context = 4
        expect(reg.created.length).toEqual(4);

        expect(reg.created[0].beforeContext).toEqual(0);
        expect(reg.created[0].afterContext).toEqual(0);

        expect(reg.created[1].beforeContext).toEqual(1);
        expect(reg.created[1].afterContext).toEqual(1);

        expect(reg.created[2].beforeContext).toEqual(1);
        expect(reg.created[2].afterContext).toEqual(1);

        expect(reg.created[3].beforeContext).toEqual(1);
        expect(reg.created[3].afterContext).toEqual(1);
      });
  });
});

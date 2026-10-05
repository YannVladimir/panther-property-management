import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** MSW node server — intercepts real `fetch` calls at the network boundary, per the plan's
 * explicit instruction to mock the backend rather than DataContext/AuthContext internals. */
export const server = setupServer(...handlers);

import { createApp } from './app';
import { ConnectionManager } from './core/realtime/connection-manager';

export { ConnectionManager };
export default { fetch: createApp().fetch };

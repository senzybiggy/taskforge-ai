export type Route =
  | { name: 'overview' }
  | { name: 'marketplace' }
  | { name: 'tasks' }
  | { name: 'task'; taskId: string }
  | { name: 'transactions' }
  | { name: 'settings' };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/^\//, '');
  const [section, id] = path.split('/');
  switch (section) {
    case 'marketplace':
      return { name: 'marketplace' };
    case 'tasks':
      return id ? { name: 'task', taskId: decodeURIComponent(id) } : { name: 'tasks' };
    case 'transactions':
      return { name: 'transactions' };
    case 'settings':
      return { name: 'settings' };
    default:
      return { name: 'overview' };
  }
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case 'overview':
      return '#/overview';
    case 'marketplace':
      return '#/marketplace';
    case 'tasks':
      return '#/tasks';
    case 'task':
      return `#/tasks/${encodeURIComponent(route.taskId)}`;
    case 'transactions':
      return '#/transactions';
    case 'settings':
      return '#/settings';
  }
}

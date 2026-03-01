import { setState, subscribe } from './store.js';

const routes = new Map();

/**
 * Register a route.
 * @param {string} name
 * @param {() => Promise<{render: (container: HTMLElement) => void, destroy?: () => void}>} loader
 */
export function register(name, loader) {
  routes.set(name, loader);
}

let currentView = null;
let container   = null;

export function init(viewContainer) {
  container = viewContainer;

  // Handle bottom-nav clicks
  document.querySelectorAll('[data-route]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.route));
  });

  subscribe('route', render);
}

export async function navigate(route) {
  setState({ route });
  updateNav(route);
}

async function render(route) {
  if (!container || !routes.has(route)) return;

  currentView?.destroy?.();
  container.innerHTML = '';

  try {
    const loader = routes.get(route);
    currentView  = await loader();
    currentView.render(container);
  } catch (err) {
    container.innerHTML = `<p style="padding:24px;color:#e94560">Failed to load view: ${err.message}</p>`;
  }
}

function updateNav(route) {
  document.querySelectorAll('[data-route]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.route === route);
  });
}

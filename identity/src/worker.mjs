// The verified recovery module remains the authentication implementation.
// Editable client assets are served only after that module validates the request.
import recovered from '../recovered/worker.js';
import client from './client/id-next.js?raw';
import styles from './client/id-next.css?raw';

const build = __JRVX_SOURCE_BUILD__;
const pages = new Set(['/', '/index.html', '/email']);
const assets = new Map([
  ['/assets/id-next.js', client],
  ['/assets/id-next.css', styles]
]);

export default {
  async fetch(request, env, ctx) {
    const response = await recovered.fetch(request, env, ctx);
    const path = new URL(request.url).pathname;
    const headers = new Headers(response.headers);
    headers.set('x-jrvx-source-build', build);
    let body = response.body;
    if (request.method === 'GET' && response.status === 200) {
      if (assets.has(path)) {
        await response.body?.cancel();
        body = assets.get(path);
      } else if (pages.has(path)) {
        // These are fixed, bounded application templates, not upstream content.
        body = (await response.text()).replace(/(\/assets\/id-next\.(?:js|css))(?:\?v=[^"\s<]*)?/g, '$1?v=' + build);
      } else if (path === '/api/health') {
        body = JSON.stringify({ ...await response.json(), sourceBuild: build });
      }
    }
    if (typeof body === 'string') {
      headers.delete('content-length');
      headers.delete('content-encoding');
      headers.delete('etag');
    }
    return new Response(body, { status: response.status, statusText: response.statusText, headers });
  },
  scheduled(controller, env, ctx) {
    return recovered.scheduled(controller, env, ctx);
  }
};

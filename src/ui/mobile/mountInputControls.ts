import { createApp } from 'vue';
import App from '../App.vue';

export function mountMobileControls() {
  const existing = document.getElementById('ui-root');
  const mountEl = existing ?? (() => {
    const el = document.createElement('div');
    el.id = 'ui-root';
    document.body.appendChild(el);
    return el;
  })();

  createApp(App).mount(mountEl);
}



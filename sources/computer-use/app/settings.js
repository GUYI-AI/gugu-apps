import { startPageContext } from './page-context.js';
import { createPermissionGuide } from './permission-guide.js';

const gugu = window.gugu;
const guide = createPermissionGuide(document.getElementById('permissions'), { gugu });
void startPageContext({ read: () => gugu.getContext(), subscribe: receive => gugu.onContextChanged(receive),
  accept(context) { guide.setLocale(context.locale); void guide.check(); },
  reject() { void guide.check(); } });

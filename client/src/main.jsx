import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

const container = document.getElementById('root');
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Pre-rendered pages already contain the HTML: attach to it instead of re-rendering.
if (container.firstElementChild) hydrateRoot(container, app);
else createRoot(container).render(app);

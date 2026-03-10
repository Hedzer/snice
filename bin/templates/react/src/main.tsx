import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import 'snice/components/theme/theme.css';
import './styles/global.css';

// Import snice web component registrations
import 'snice/components/layout/snice-layout';
import 'snice/components/button/snice-button';
import 'snice/components/card/snice-card';
import 'snice/components/input/snice-input';
import 'snice/components/alert/snice-alert';
import 'snice/components/avatar/snice-avatar';
import 'snice/components/empty-state/snice-empty-state';
import 'snice/components/spinner/snice-spinner';
import 'snice/components/badge/snice-badge';
import 'snice/components/switch/snice-switch';
import 'snice/components/divider/snice-divider';
import 'snice/components/tabs/snice-tabs';
import 'snice/components/tabs/snice-tab';
import 'snice/components/login/snice-login';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

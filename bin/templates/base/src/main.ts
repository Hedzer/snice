import { initialize } from './router';
import './styles/global.css';

// Import snice layout
import 'snice/components/layout/snice-layout';

// Import snice components
import 'snice/components/button/snice-button';
import 'snice/components/card/snice-card';

// Import custom components
import './components/counter-button';
import './components/feature-card';

// Import controllers
import './controllers/counter-controller';

// Import pages
import './pages/home-page';
import './pages/about-page';
import './pages/not-found-page';

// Initialize router
initialize();
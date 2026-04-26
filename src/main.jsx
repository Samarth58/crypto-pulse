import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { CoinProvider } from './contexts/CoinContext.jsx';
import { WatchlistProvider } from './contexts/WatchlistContext.jsx';
import { PortfolioProvider } from './contexts/PortfolioContext.jsx';
import { AlertProvider } from './contexts/AlertContext.jsx';
import { ToastProvider } from './components/ui/ToastProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AlertProvider>
          <WatchlistProvider>
            <PortfolioProvider>
              <CoinProvider>
                <App />
              </CoinProvider>
            </PortfolioProvider>
          </WatchlistProvider>
        </AlertProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);

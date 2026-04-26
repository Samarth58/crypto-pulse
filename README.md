# Crypto Pulse

A cryptocurrency market dashboard built with React and Tailwind CSS. This project provides a near real-time (60s refresh cycle) overview of the crypto market, including interactive charts, a portfolio simulator, and a smart alert system.

## Project Overview

Crypto Pulse is a web application that tracks near real-time (60s refresh cycle) cryptocurrency data using the CoinGecko API. It is designed to provide a clean, responsive interface for monitoring price action, managing a simulated portfolio, and setting market alerts.

## Features

### 📊 Market Tracking & Charts
- **Search & Filter**: Efficient client-side filtering by asset name or symbol.
- **Interactive Charts**: Optional candlestick charts (Lightweight Charts) with fallback to line charts (Recharts).
- **Multiple Timeframes**: Analyze price action across 24h, 7d, 30d, and 1y intervals.
- **Sparklines**: Quick-view trend indicators for every asset in the main table.

### 💼 Portfolio Simulator
- **Asset Allocation**: Track simulated holdings with live market valuation.
- **Performance Analytics**: View aggregated growth charts and profit/loss metrics.
- **Persistence**: Holdings are saved locally to maintain data between sessions.

### 🚨 Smart Alerts
- **Polling-Based Triggers**: Alerts are evaluated on each 60s data update cycle for price targets or 24h percentage changes.
- **Expiry & Repeat**: Customizable alert expiration (1h to 7d) and recurring notification settings.
- **Toast Notifications**: Non-intrusive updates when alert conditions are met during data polling.

### 🔍 Deep Insights
- **Market Dominance**: Live calculation of a coin's share relative to global market cap.
- **Supply Metrics**: Progress bars showing circulating vs. total supply.
- **DCA Calculator**: Tool to simulate Dollar Cost Averaging strategies.
- **Structured About Section**: Detailed coin metadata, including launch dates and project links.

### 🛠 UI & UX
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop viewports.
- **Usability**: Sticky table headers for improved navigation during long list scrolling.
- **Loading & Error States**: Integrated skeleton loaders and defensive error handling for a seamless experience.

## Tech Stack

- **Frontend**: React 18, Tailwind CSS
- **State Management**: React Hooks, Context API
- **Charts**: Lightweight Charts (Candle), Recharts (Line/Portfolio)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **API**: CoinGecko (Public API)

## Architecture Highlights

- **Centralized API Layer**: A dedicated service layer handles all API requests with built-in retry logic and error normalization.
- **Custom Hooks**: Encapsulated logic for data fetching, polling, and theme management (`useCryptoData`, `useGlobalStats`, etc.).
- **Polling Strategy**: Implements a 60-second auto-refresh cycle when the window is focused, ensuring fresh data without excessive API calls.
- **Performance Optimization**: Strategic use of `useMemo` and `useCallback` to minimize re-renders during high-frequency data updates.
- **Data Persistence**: Uses `localStorage` to persist theme preferences, alerts, portfolio holdings, and watchlists.
- **Defensive Programming**: Extensive use of optional chaining and fallbacks to handle varied API response structures.

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/crypto-pulse.git
   cd crypto-pulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm run dev
   ```
   *Note: The application uses the CoinGecko Public API. No API key is strictly required for development, though rate limits apply.*

## API Note
This project uses the CoinGecko Public API. It is subject to rate limiting depending on usage. If you encounter rate limit errors, wait a moment before refreshing.

## Deployment & Demo

- **Live Demo**: [Click here to view the project](https://your-deployment-link.vercel.app)
- **Repository**: [Source Code](https://github.com/yourusername/crypto-pulse)

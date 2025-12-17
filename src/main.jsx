import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Import AG Grid Styles
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import ErrorBoundary from './components/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)

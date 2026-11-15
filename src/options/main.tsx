import React from 'react'
import ReactDOM from 'react-dom/client'
import Options from './Options.tsx'
import { ErrorBoundary } from '../components/ErrorBoundary.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Options />
    </ErrorBoundary>
  </React.StrictMode>,
)

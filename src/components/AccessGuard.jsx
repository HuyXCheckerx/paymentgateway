import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const AccessGuard = ({ children }) => {
  const [searchParams] = useSearchParams();
  
  // Check if any required parameters exist
  const hasRequiredParams = 
    searchParams.get('data') || 
    searchParams.get('orderId') || 
    searchParams.get('amount') ||
    searchParams.get('currency');
  
  if (!hasRequiredParams) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              This payment gateway requires valid order parameters to access. 
              Please initiate your payment from the main store.
            </p>
            <button
              onClick={() => window.location.href = 'https://cryoner.store'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Store
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return children;
};

export default AccessGuard;

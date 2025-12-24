import React, { useState } from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { CheckCircle, XCircle, Loader, Wifi, Settings } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const ConnectionTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomUrl, setShowCustomUrl] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const testConnection = async (urlToTest?: string) => {
    setIsLoading(true);
    setTestResult(null);

    const testUrl = urlToTest || API_BASE_URL;

    try {
      console.log(`Testing connection to: ${testUrl}`);
      
      // Test basic connectivity first
      const response = await fetch(`${testUrl}/health`, {
        method: 'GET',
        mode: 'cors',
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: 'Backend connection successful!',
          details: data,
        });
      } else {
        setTestResult({
          success: false,
          message: `Backend responded with status: ${response.status} - ${response.statusText}`,
        });
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      
      let errorMessage = 'Connection failed';
      let troubleshooting: string[] = [];
      
      if (error.message?.includes('CORS')) {
        errorMessage = 'CORS error - backend is not allowing requests from this domain';
        troubleshooting = [
          'Backend service is running but CORS is not configured properly',
          'Check Render logs for CORS configuration errors'
        ];
      } else if (error.message?.includes('fetch') || error.name === 'TypeError') {
        errorMessage = 'Network error - cannot reach the backend server (404 Not Found)';
        troubleshooting = [
          'The Render service might not be deployed yet',
          'Service name might be different from "predictit-api"',
          'Build or deployment might have failed',
          'Check your Render dashboard for service status'
        ];
      } else {
        errorMessage = error.message || 'Unknown connection error';
      }

      setTestResult({
        success: false,
        message: errorMessage,
        details: { troubleshooting }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomUrlTest = () => {
    if (customUrl.trim()) {
      testConnection(customUrl.trim());
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          Backend Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Button onClick={() => testConnection()} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowCustomUrl(!showCustomUrl)}
            className="text-sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Test Different URL
          </Button>
        </div>

        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Current Backend URL:</strong> {API_BASE_URL}
        </div>

        {showCustomUrl && (
          <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <label className="text-sm font-medium text-blue-800">
              Test Custom Render URL:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://your-service-name.onrender.com"
                className="flex-1 px-3 py-2 border border-blue-300 rounded text-sm"
              />
              <Button 
                onClick={handleCustomUrlTest} 
                disabled={isLoading || !customUrl.trim()}
                size="sm"
              >
                Test
              </Button>
            </div>
            <p className="text-xs text-blue-600">
              If your Render service has a different name, test it here
            </p>
          </div>
        )}

        {testResult && (
          <div className={`flex items-start gap-2 p-3 rounded-lg ${
            testResult.success 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 mt-0.5" />
            )}
            <div>
              <p className="font-medium">{testResult.message}</p>
              {testResult.details && (
                <pre className="text-xs mt-2 opacity-75">
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {testResult && !testResult.success && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-2">Troubleshooting Steps:</h4>
            
            {testResult.details?.troubleshooting ? (
              <ul className="text-sm text-blue-700 space-y-1 mb-3">
                {testResult.details.troubleshooting.map((step: string, index: number) => (
                  <li key={index}>• {step}</li>
                ))}
              </ul>
            ) : (
              <ul className="text-sm text-blue-700 space-y-1 mb-3">
                <li>• Check if the backend is deployed and running on Render</li>
                <li>• Verify the service name matches 'predictit-api'</li>
                <li>• Check Render logs for any startup errors</li>
                <li>• Ensure CORS is properly configured for your domain</li>
              </ul>
            )}
            
            <div className="bg-white border border-blue-300 rounded p-2 mt-3">
              <p className="text-xs text-blue-600 font-medium mb-1">Quick Checks:</p>
              <p className="text-xs text-blue-600">
                1. Go to your Render dashboard<br/>
                2. Look for a service named "predictit-api"<br/>
                3. Check if it shows "Live" status<br/>
                4. If not deployed yet, deploy from your GitHub repo<br/>
                5. If service name is different, update the frontend API URL
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
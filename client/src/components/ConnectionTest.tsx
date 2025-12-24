import React, { useState } from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { CheckCircle, XCircle, Loader, Wifi } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const ConnectionTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // Test basic connectivity
      const response = await fetch(`${API_BASE_URL}/health`, {
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
          message: `Backend responded with status: ${response.status}`,
        });
      }
    } catch (error: any) {
      let errorMessage = 'Connection failed';
      
      if (error.message?.includes('CORS')) {
        errorMessage = 'CORS error - backend is not allowing requests from this domain';
      } else if (error.message?.includes('fetch')) {
        errorMessage = 'Network error - cannot reach the backend server';
      } else {
        errorMessage = error.message || 'Unknown connection error';
      }

      setTestResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
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
        <div className="flex items-center gap-4">
          <Button onClick={testConnection} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <span className="text-sm text-gray-600">
            Backend URL: {API_BASE_URL}
          </span>
        </div>

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
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check if the backend is deployed and running on Render</li>
              <li>• Verify the service name matches 'predictit-api'</li>
              <li>• Check Render logs for any startup errors</li>
              <li>• Ensure CORS is properly configured for your domain</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
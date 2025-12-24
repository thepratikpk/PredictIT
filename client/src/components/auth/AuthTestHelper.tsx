import React, { useState } from 'react';
import { Button } from '../Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

/**
 * AuthTestHelper - A development component for testing authentication scenarios
 * This component should only be used in development/testing environments
 */
export const AuthTestHelper: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { login, register, logout, isLoading } = useAuthStore();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const testCases = [
    {
      name: 'Valid Login',
      action: () => login('test@example.com', 'password123'),
      description: 'Test successful login'
    },
    {
      name: 'Account Not Found',
      action: () => login('nonexistent@example.com', 'password123'),
      description: 'Test login with non-existent email'
    },
    {
      name: 'Wrong Password',
      action: () => login('test@example.com', 'wrongpassword'),
      description: 'Test login with incorrect password'
    },
    {
      name: 'Invalid Email Format',
      action: () => login('invalid-email', 'password123'),
      description: 'Test login with invalid email format'
    },
    {
      name: 'Empty Credentials',
      action: () => login('', ''),
      description: 'Test login with empty fields'
    },
    {
      name: 'Short Password',
      action: () => login('test@example.com', '123'),
      description: 'Test login with short password'
    },
    {
      name: 'Valid Registration',
      action: () => register('John Doe', 'newuser@example.com', 'password123'),
      description: 'Test successful registration'
    },
    {
      name: 'Duplicate Email',
      action: () => register('Jane Doe', 'test@example.com', 'password123'),
      description: 'Test registration with existing email'
    },
    {
      name: 'Short Name',
      action: () => register('J', 'test2@example.com', 'password123'),
      description: 'Test registration with short name'
    },
    {
      name: 'Invalid Email Registration',
      action: () => register('John Doe', 'invalid-email', 'password123'),
      description: 'Test registration with invalid email'
    }
  ];

  const runTest = async (testCase: typeof testCases[0]) => {
    try {
      await testCase.action();
      toast.success(`✅ ${testCase.name}: Success`);
    } catch (error: any) {
      toast.error(`❌ ${testCase.name}: ${error.message}`);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2"
        >
          🧪 Auth Tests
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="border-purple-200 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-purple-900">
              🧪 Auth Test Helper
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              ✕
            </Button>
          </div>
          <p className="text-xs text-gray-600">
            Test authentication scenarios (Dev only)
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {testCases.map((testCase, index) => (
              <div key={index} className="border-b border-gray-100 pb-2 last:border-b-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runTest(testCase)}
                  disabled={isLoading}
                  className="w-full text-left justify-start text-xs p-2 h-auto"
                >
                  <div>
                    <div className="font-medium">{testCase.name}</div>
                    <div className="text-gray-500 text-xs">{testCase.description}</div>
                  </div>
                </Button>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full text-xs"
            >
              🚪 Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
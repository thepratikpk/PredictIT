import React from 'react';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import { 
  Brain, 
  ArrowRight, 
  CheckCircle,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  hasProgress?: boolean;
  currentStep?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onGetStarted, 
  onSignIn, 
  onSignUp,
  hasProgress, 
  currentStep 
}) => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">PredictIT</span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {!isAuthenticated ? (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={onSignIn}
                    className="text-gray-600 hover:text-gray-900 text-sm sm:text-base px-2 sm:px-4"
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={onSignUp}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50 text-sm sm:text-base px-2 sm:px-4 hidden sm:inline-flex"
                  >
                    Sign Up
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-32">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-32">{user?.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={logout}
                    className="text-gray-600 hover:text-gray-900 text-sm sm:text-base px-2 sm:px-4"
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </div>
              )}
              
              <Button 
                onClick={onGetStarted}
                className="bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base px-3 sm:px-4"
              >
                {hasProgress ? 'Continue' : 'Get Started'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="overflow-y-auto">
        {/* Hero Section */}
        <section className="py-12 sm:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Resume Banner */}
              {hasProgress && (
                <div className="mb-6 sm:mb-8 max-w-md mx-auto">
                  <Card className="border-blue-200 bg-blue-50 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-blue-900">Continue Your Pipeline</p>
                            <p className="text-xs text-blue-700">Step {currentStep} of 5</p>
                          </div>
                        </div>
                        <Button 
                          onClick={onGetStarted}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Resume
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                {isAuthenticated ? (
                  <>
                    Welcome back,
                    <span className="block text-slate-900">
                      {user?.name?.split(' ')[0]}! 👋
                    </span>
                  </>
                ) : (
                  <>
                    Build ML Models
                    <span className="block text-slate-900">
                      Without Code
                    </span>
                  </>
                )}
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
                {isAuthenticated ? (
                  hasProgress ? 
                    "Continue building your machine learning pipeline or start a new project." :
                    "Ready to build your next machine learning model? Let's get started with your data."
                ) : (
                  "Transform your data into intelligent predictions with our visual ML pipeline builder. No coding required, no complex setup—just upload, configure, and build."
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-12 px-4">
                <Button 
                  onClick={onGetStarted}
                  size="lg"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg w-full sm:w-auto"
                >
                  {hasProgress ? 'Continue Building' : isAuthenticated ? 'Start New Pipeline' : 'Start Building Free'}
                  <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                </Button>
              </div>

              {/* Trust indicators */}
              {!isAuthenticated && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-500 px-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    Free to use
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    No coding required
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section - REMOVED */}

        {/* How it Works */}
        <section id="how-it-works" className="py-12 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 px-4">
                Build ML models in 4 simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                { 
                  step: 1, 
                  title: "Upload Data", 
                  desc: "CSV or Excel files"
                },
                { 
                  step: 2, 
                  title: "Preprocess", 
                  desc: "Clean and prepare data"
                },
                { 
                  step: 3, 
                  title: "Train Model", 
                  desc: "Automated training"
                },
                { 
                  step: 4, 
                  title: "Get Results", 
                  desc: "View predictions"
                }
              ].map((item) => (
                <div key={item.step} className="text-center relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl mx-auto mb-4 sm:mb-6 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600 px-2">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 bg-slate-900">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ready to get started?
            </h2>
            <p className="text-lg sm:text-xl text-slate-300 mb-6 sm:mb-8">
              Build your first ML model in minutes.
            </p>
            
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-white text-slate-900 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 font-semibold text-base sm:text-lg shadow-xl w-full sm:w-auto"
            >
              Start Building Now
              <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold">PredictIT</span>
            </div>
            
            <div className="border-t border-gray-800 pt-6">
              <p className="text-gray-400 mb-2">Made with ❤️ by Pratik Kochare</p>
              <a 
                href="https://portfolio-pratik-kochare.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors underline"
              >
                View Portfolio
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
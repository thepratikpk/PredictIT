import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  Brain, 
  Upload, 
  Settings, 
  BarChart3, 
  ArrowRight, 
  CheckCircle,
  Zap,
  Shield,
  Code,
  Database,
  TrendingUp,
  Users,
  User,
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
              <span className="ml-2 text-xl font-bold text-gray-900">PredictIT</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              {!isAuthenticated ? (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={onSignIn}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={onSignUp}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Sign Up
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={logout}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
              
              <Button 
                onClick={onGetStarted}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                {hasProgress ? 'Continue Pipeline' : 'Get Started'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="overflow-y-auto">
        {/* Hero Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Resume Banner */}
              {hasProgress && (
                <div className="mb-8 max-w-md mx-auto">
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

              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
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
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                {isAuthenticated ? (
                  hasProgress ? 
                    "Continue building your machine learning pipeline or start a new project." :
                    "Ready to build your next machine learning model? Let's get started with your data."
                ) : (
                  "Transform your data into intelligent predictions with our visual ML pipeline builder. No coding required, no complex setup—just upload, configure, and deploy."
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button 
                  onClick={onGetStarted}
                  size="lg"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                >
                  {hasProgress ? 'Continue Building' : isAuthenticated ? 'Start New Pipeline' : 'Start Building Free'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                {!isAuthenticated && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="px-8 py-4 text-lg border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Watch Demo
                  </Button>
                )}
              </div>

              {/* Trust indicators */}
              {!isAuthenticated && (
                <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    No credit card required
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    Free tier available
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    Deploy in minutes
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section - REMOVED */}

        {/* How it Works */}
        <section id="how-it-works" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                How it works
              </h2>
              <p className="text-xl text-gray-600">
                Our streamlined process gets you from raw data to trained models quickly
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { 
                  step: 1, 
                  title: "Import Data", 
                  desc: "Upload CSV, Excel, or connect to databases",
                  icon: Database
                },
                { 
                  step: 2, 
                  title: "Preprocess", 
                  desc: "Clean, transform, and prepare your data",
                  icon: Settings
                },
                { 
                  step: 3, 
                  title: "Configure", 
                  desc: "Set up training parameters and validation",
                  icon: Zap
                },
                { 
                  step: 4, 
                  title: "Train", 
                  desc: "Automated model training and optimization",
                  icon: TrendingUp
                }
              ].map((item, index) => (
                <div key={item.step} className="text-center relative">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-6 shadow-lg">
                    {item.step}
                  </div>
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  
                  {index < 3 && (
                    <div className="hidden md:block absolute top-8 left-full w-full">
                      <div className="w-full h-0.5 bg-gray-200"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-slate-900">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to transform your data?
            </h2>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Join the next generation of data scientists building ML models without barriers.
            </p>
            
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-white text-slate-900 hover:bg-gray-100 px-8 py-4 font-semibold text-lg shadow-xl"
            >
              Start Building Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <div className="flex items-center justify-center gap-8 mt-8 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                No setup required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Cancel anytime
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold">PredictIT</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Democratizing machine learning by making it accessible to everyone, 
              regardless of technical background.
            </p>
            
            <div className="border-t border-gray-800 pt-8">
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
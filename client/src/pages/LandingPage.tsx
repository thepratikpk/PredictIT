import React from 'react';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { 
  Brain, 
  Upload, 
  Settings, 
  BarChart3, 
  ArrowRight, 
  CheckCircle,
  Users,
  Clock
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  hasProgress?: boolean;
  currentStep?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onGetStarted, 
  onSignIn, 
  hasProgress, 
  currentStep 
}) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">MLBuilder</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={onSignIn}
                className="text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Button>
              <Button 
                onClick={onGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
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
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-900">Continue Pipeline</p>
                            <p className="text-xs text-green-700">Step {currentStep} of 5</p>
                          </div>
                        </div>
                        <Button 
                          onClick={onGetStarted}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Resume
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Build Machine Learning Models
                <span className="block text-blue-600">Without Writing Code</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Upload your data, configure your model, and get predictions in minutes. 
                Our intuitive interface makes machine learning accessible to everyone.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={onGetStarted}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  {hasProgress ? 'Continue Building' : 'Start Building'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="px-8 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  View Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Everything you need to build ML models
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From data upload to model deployment, we provide all the tools you need.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Data Upload</h3>
                  <p className="text-gray-600">
                    Simply upload your CSV or Excel files and we'll handle the rest.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Settings className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Configuration</h3>
                  <p className="text-gray-600">
                    Automated preprocessing and intelligent model selection.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Results</h3>
                  <p className="text-gray-600">
                    Get model performance metrics and make predictions immediately.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How it works
              </h2>
              <p className="text-lg text-gray-600">
                Build your ML model in 5 simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {[
                { step: 1, title: "Upload Data", desc: "CSV or Excel files" },
                { step: 2, title: "Preprocess", desc: "Clean and prepare data" },
                { step: 3, title: "Split Data", desc: "Train/test division" },
                { step: 4, title: "Train Model", desc: "Automated training" },
                { step: 5, title: "Get Results", desc: "Predictions & insights" }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">2,500+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              
              <div>
                <div className="flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">10,000+</div>
                <div className="text-gray-600">Models Created</div>
              </div>
              
              <div>
                <div className="flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">3 min</div>
                <div className="text-gray-600">Average Build Time</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to build your first model?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users building ML models without code.
            </p>
            
            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 font-semibold"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Free forever plan
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-semibold">MLBuilder</span>
              </div>
              <p className="text-gray-400">
                Making machine learning accessible to everyone.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Documentation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact</li>
                <li>Status</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MLBuilder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
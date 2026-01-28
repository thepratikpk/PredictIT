import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import {
  ArrowRight,
  CheckCircle,
  LogOut,
  Upload,
  Settings,
  BarChart3,
  Sparkles,
  PlayCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  hasProgress?: boolean;
  currentStep?: number;
}

// MD3 Step indicator
const StepIndicator = ({ step, title, description, icon: Icon }: {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
}) => (
  <motion.div
    className="flex items-start gap-4"
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.3, delay: step * 0.1 }}
  >
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-md-primary-container flex items-center justify-center">
      <Icon className="w-5 h-5 text-md-primary" />
    </div>
    <div>
      <h3 className="font-medium text-md-on-surface mb-1">{title}</h3>
      <p className="text-sm text-md-on-surface-variant">{description}</p>
    </div>
  </motion.div>
);

// MD3 Feature card
const FeatureCard = ({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.25 }}
  >
    <Card variant="outlined" className="h-full p-6 hover:bg-gray-50 transition-colors duration-200">
      <div className="w-10 h-10 rounded-full bg-md-primary-container flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-md-primary" />
      </div>
      <h3 className="font-medium text-md-on-surface mb-2">{title}</h3>
      <p className="text-sm text-md-on-surface-variant">{description}</p>
    </Card>
  </motion.div>
);

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
      {/* Header - Clean MD3 style */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-md-outline-variant">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-md-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-medium text-md-on-surface">PredictIT</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!isAuthenticated ? (
                <>
                  <Button variant="ghost" onClick={onSignIn}>
                    Sign in
                  </Button>
                  <Button variant="outline" onClick={onSignUp} className="hidden sm:inline-flex">
                    Sign up
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-md-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-md-on-surface hidden sm:block">{user?.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <Button onClick={onGetStarted}>
                {hasProgress ? 'Continue' : 'Get started'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section - Clean & Minimal */}
        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* Resume banner */}
            {hasProgress && (
              <motion.div
                className="mb-8 inline-flex"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card variant="filled" className="px-4 py-3 inline-flex items-center gap-3">
                  <PlayCircle className="w-5 h-5 text-md-primary" />
                  <span className="text-sm text-md-on-surface">
                    Continue from Step {currentStep}
                  </span>
                  <Button size="sm" onClick={onGetStarted}>
                    Resume
                  </Button>
                </Card>
              </motion.div>
            )}

            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl font-normal text-md-on-surface mb-6 tracking-tight"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isAuthenticated ? (
                <>Welcome back, {user?.name?.split(' ')[0]}</>
              ) : (
                <>Build ML models{' '}<span className="text-md-primary">without code</span></>
              )}
            </motion.h1>

            <motion.p
              className="text-lg text-md-on-surface-variant mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {isAuthenticated ? (
                hasProgress ?
                  "Your pipeline is waiting. Continue building or start fresh." :
                  "Ready to train your next model? Upload your data to begin."
              ) : (
                "Upload your data, configure preprocessing, and train machine learning models — all through a simple visual interface."
              )}
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 justify-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Button size="lg" onClick={onGetStarted}>
                {hasProgress ? 'Continue building' : 'Start for free'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            {!isAuthenticated && (
              <motion.div
                className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-md-on-surface-variant"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>No coding required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Instant results</span>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-md-surface-dim">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl font-normal text-md-on-surface mb-3">
                Everything you need
              </h2>
              <p className="text-md-on-surface-variant">
                A complete toolkit for building ML pipelines
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FeatureCard
                icon={Upload}
                title="Smart data upload"
                description="Drag and drop CSV or Excel files with automatic column detection."
              />
              <FeatureCard
                icon={Settings}
                title="Easy preprocessing"
                description="Apply StandardScaler or MinMaxScaler normalization with one click."
              />
              <FeatureCard
                icon={BarChart3}
                title="Clear results"
                description="View accuracy metrics, confusion matrices, and make predictions."
              />
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl font-normal text-md-on-surface mb-3">
                How it works
              </h2>
              <p className="text-md-on-surface-variant">
                Four simple steps to your first model
              </p>
            </motion.div>

            <div className="space-y-6">
              <StepIndicator
                step={1}
                title="Upload your data"
                description="Import a CSV or Excel file containing your dataset"
                icon={Upload}
              />
              <div className="ml-5 border-l-2 border-md-outline-variant h-6" />
              <StepIndicator
                step={2}
                title="Preprocess"
                description="Choose scaling method to normalize your features"
                icon={Settings}
              />
              <div className="ml-5 border-l-2 border-md-outline-variant h-6" />
              <StepIndicator
                step={3}
                title="Configure & train"
                description="Select your model, target column, and features"
                icon={Sparkles}
              />
              <div className="ml-5 border-l-2 border-md-outline-variant h-6" />
              <StepIndicator
                step={4}
                title="View results"
                description="See accuracy, confusion matrix, and make predictions"
                icon={BarChart3}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-md-surface-dim">
          <div className="max-w-2xl mx-auto text-center px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl font-normal text-md-on-surface mb-4">
                Ready to get started?
              </h2>
              <p className="text-md-on-surface-variant mb-8">
                Build your first ML model in minutes
              </p>

              <Button size="lg" onClick={onGetStarted}>
                Start building
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer - Minimal */}
      <footer className="py-8 border-t border-md-outline-variant">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-md-primary rounded flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium text-md-on-surface">PredictIT</span>
            </div>

            <p className="text-sm text-md-on-surface-variant">
              Made by{' '}
              <a
                href="https://portfolio-pratik-kochare.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-md-primary hover:underline"
              >
                Pratik Kochare
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
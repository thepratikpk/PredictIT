import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Settings, Split, Brain, BarChart3, CheckCircle, Loader2 } from 'lucide-react';
import { usePipelineStore } from '../store/pipelineStore';

const pipelineSteps = [
  { 
    id: 'data', 
    icon: Database, 
    label: 'Data Loading', 
    color: 'from-blue-500 to-blue-600',
    description: 'Processing your dataset'
  },
  { 
    id: 'preprocessing', 
    icon: Settings, 
    label: 'Preprocessing', 
    color: 'from-green-500 to-green-600',
    description: 'Scaling and transforming features'
  },
  { 
    id: 'splitting', 
    icon: Split, 
    label: 'Data Splitting', 
    color: 'from-yellow-500 to-yellow-600',
    description: 'Creating train/test sets'
  },
  { 
    id: 'training', 
    icon: Brain, 
    label: 'Model Training', 
    color: 'from-purple-500 to-purple-600',
    description: 'Training your ML model'
  },
  { 
    id: 'evaluation', 
    icon: BarChart3, 
    label: 'Evaluation', 
    color: 'from-orange-500 to-orange-600',
    description: 'Calculating performance metrics'
  }
];

export const AnimatedPipelineFlow: React.FC = () => {
  const { animationState, isRunning } = usePipelineStore();

  const getCurrentStepIndex = () => {
    const phaseMap = {
      'idle': -1,
      'uploading': 0,
      'preprocessing': 1,
      'splitting': 2,
      'training': 3,
      'evaluating': 4,
      'complete': 5
    };
    return phaseMap[animationState.currentPhase] || -1;
  };

  const currentStepIndex = getCurrentStepIndex();

  if (!isRunning && animationState.currentPhase === 'idle') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl"
      >
        <div className="text-center mb-8">
          <motion.h2 
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Training Your ML Model
          </motion.h2>
          <p className="text-gray-600 dark:text-gray-300">
            {animationState.message}
          </p>
        </div>

        {/* Pipeline Flow */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: '0%' }}
              animate={{ 
                width: currentStepIndex >= 0 ? `${((currentStepIndex + 1) / pipelineSteps.length) * 100}%` : '0%'
              }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          </div>

          {/* Pipeline Steps */}
          <div className="flex justify-between items-center relative z-10">
            {pipelineSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center">
                  {/* Step Circle */}
                  <motion.div
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center mb-3 border-4
                      ${isCompleted 
                        ? 'bg-green-500 border-green-500' 
                        : isActive 
                          ? `bg-gradient-to-br ${step.color} border-white shadow-lg` 
                          : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                      }
                    `}
                    animate={isActive ? {
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(59, 130, 246, 0.7)',
                        '0 0 0 10px rgba(59, 130, 246, 0)',
                        '0 0 0 0 rgba(59, 130, 246, 0)'
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <CheckCircle className="w-8 h-8 text-white" />
                        </motion.div>
                      ) : isActive ? (
                        <motion.div
                          key="loading"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 className="w-8 h-8 text-white" />
                        </motion.div>
                      ) : (
                        <Icon className={`w-8 h-8 ${isPending ? 'text-gray-400' : 'text-white'}`} />
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Step Label */}
                  <motion.div
                    className="text-center"
                    animate={isActive ? { y: [0, -2, 0] } : {}}
                    transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                  >
                    <h3 className={`text-sm font-semibold mb-1 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 
                      isCompleted ? 'text-green-600 dark:text-green-400' : 
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.label}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-20">
                      {step.description}
                    </p>
                  </motion.div>

                  {/* Floating Particles for Active Step */}
                  {isActive && (
                    <div className="absolute">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-blue-400 rounded-full"
                          animate={{
                            x: [0, Math.random() * 40 - 20],
                            y: [0, Math.random() * 40 - 20],
                            opacity: [1, 0],
                            scale: [0, 1, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: 'easeOut'
                          }}
                          style={{
                            left: '50%',
                            top: '50%'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(animationState.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${animationState.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Data Flow Animation */}
        <div className="mt-6 relative overflow-hidden h-8">
          <motion.div
            className="absolute flex items-center space-x-2"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                  scale: [0.5, 1, 0.5],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
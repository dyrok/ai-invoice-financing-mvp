import React from 'react';
import { CheckCircle, Loader2, Brain, FileText, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface AIProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface AIProcessingStatusProps {
  currentStep: string;
  confidence?: number;
  extractedData?: any;
  isVisible: boolean;
}

export function AIProcessingStatus({ currentStep, confidence, extractedData, isVisible }: AIProcessingStatusProps) {
  if (!isVisible) return null;

  const steps: AIProcessingStep[] = [
    {
      id: 'upload',
      label: 'Document Upload',
      status: 'completed',
      icon: FileText,
      description: 'File received and validated'
    },
    {
      id: 'ocr',
      label: 'Genkit OCR Processing',
      status: currentStep.includes('OCR') || currentStep.includes('AI') ? 'processing' : 
             (currentStep.includes('completed') || currentStep.includes('assessment')) ? 'completed' : 'pending',
      icon: Brain,
      description: 'AI extracting text and data from document'
    },
    {
      id: 'extraction',
      label: 'Data Extraction',
      status: currentStep.includes('extraction') || currentStep.includes('completed') ? 'completed' :
             currentStep.includes('AI') ? 'processing' : 'pending',
      icon: CheckCircle,
      description: 'Structuring invoice information'
    },
    {
      id: 'risk',
      label: 'Risk Assessment',
      status: currentStep.includes('assessment') || currentStep.includes('offer') ? 'processing' :
             currentStep.includes('completed') ? 'completed' : 'pending',
      icon: Shield,
      description: 'AI analyzing creditworthiness and payment risk'
    }
  ];

  const getStatusIcon = (step: AIProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'error':
        return <div className="h-4 w-4 rounded-full bg-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-900">
          <Brain className="h-5 w-5" />
          <span>Genkit AI Processing</span>
          {confidence && (
            <Badge className="bg-green-100 text-green-800 ml-auto">
              {Math.round(confidence * 100)}% Confidence
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-blue-100">
                <Icon className={`h-5 w-5 ${
                  step.status === 'completed' ? 'text-green-600' : 
                  step.status === 'processing' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      step.status === 'completed' ? 'text-green-700' :
                      step.status === 'processing' ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {step.label}
                    </span>
                    {getStatusIcon(step)}
                  </div>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {extractedData && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">AI Extraction Preview</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Buyer:</span>
                <span className="ml-2 font-medium">{extractedData.buyer}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium">${extractedData.amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-blue-600 bg-blue-50 rounded-lg p-2">
          Powered by Google Genkit AI • Secure & Private Processing
        </div>
      </CardContent>
    </Card>
  );
}
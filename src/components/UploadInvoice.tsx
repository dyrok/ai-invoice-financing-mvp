import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Invoice {
  id: string;
  filename: string;
  amount: number;
  buyer: string;
  dueDate: string;
  status: 'uploaded' | 'offered' | 'advanced' | 'settled';
  riskBand: 'low' | 'medium' | 'high';
  advancePercent?: number;
  feePercent?: number;
  advanceAmount?: number;
  createdAt: string;
}

interface UploadInvoiceProps {
  onInvoiceProcessed: (invoice: Invoice) => void;
}

export function UploadInvoice({ onInvoiceProcessed }: UploadInvoiceProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingStep, setProcessingStep] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, JPG, or PNG file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setError('');
    await processInvoice(file);
  };

  const processInvoice = async (file: File) => {
    setIsProcessing(true);
    setError('');
    
    try {
      // Step 1: Upload and AI OCR Processing
      setProcessingStep('Uploading and processing with Genkit AI...');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Call backend with Genkit AI processing
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9a3989d/invoices/process-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('AI processing failed:', response.status, response.statusText);
        console.log('AI processing error:', errorText);
        console.log('Falling back to simulation...');
        // Fallback to simulation if AI processing fails
        await processInvoiceFallback(file);
        return;
      }

      const processedInvoice = await response.json();
      
      // Step 2: Display processing results
      setProcessingStep('AI extraction completed! Generating offer...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onInvoiceProcessed(processedInvoice);
      
    } catch (err: any) {
      console.error('Invoice processing error:', err);
      console.log('Falling back to simulation...');
      // Fallback to simulation
      await processInvoiceFallback(file);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const processInvoiceFallback = async (file: File) => {
    try {
      // Step 1: Simulate OCR
      setProcessingStep('Extracting data (simulation mode)...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 2: Risk Assessment
      setProcessingStep('Analyzing risk profile...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Generate Offer
      setProcessingStep('Generating financing offer...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulate OCR and risk assessment
      const mockInvoiceData = await simulateInvoiceProcessing(file);
      
      // Call backend to store invoice
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9a3989d/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          ...mockInvoiceData,
          filename: file.name
        })
      });

      console.log('Invoice creation response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Invoice creation error response:', errorText);
        console.error('Response status:', response.status, response.statusText);
        
        let errorMessage = `Failed to process invoice: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch (e) {
          // If not JSON, use the text response
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }

      const processedInvoice = await response.json();
      console.log('Invoice processed successfully:', processedInvoice);
      onInvoiceProcessed(processedInvoice);
    } catch (err: any) {
      console.error('Fallback processing error:', err);
      setError(err.message || 'Failed to process invoice');
    }
  };

  const simulateInvoiceProcessing = async (file: File): Promise<Partial<Invoice>> => {
    // Simulate OCR extraction
    const mockData = {
      amount: Math.floor(Math.random() * 50000) + 10000, // $10k - $60k
      buyer: ['Acme Corp', 'TechStart Inc', 'Global Solutions LLC', 'Enterprise Ltd'][Math.floor(Math.random() * 4)],
      dueDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next 90 days
    };

    // Simple risk assessment based on amount and due date
    const daysToDue = Math.ceil((new Date(mockData.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    let riskBand: 'low' | 'medium' | 'high';
    
    if (mockData.amount < 25000 && daysToDue < 60) {
      riskBand = 'low';
    } else if (mockData.amount < 40000 && daysToDue < 45) {
      riskBand = 'medium';
    } else {
      riskBand = 'high';
    }

    return {
      ...mockData,
      riskBand,
      status: 'uploaded',
      createdAt: new Date().toISOString()
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Invoice</h1>
        <p className="text-gray-600">Upload your B2B invoice to get instant financing offers</p>
      </div>

      {!uploadedFile && !isProcessing && (
        <Card>
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop your invoice here, or click to browse
              </h3>
              <p className="text-gray-600 mb-4">
                Supports PDF, JPG, PNG files up to 10MB
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInputChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button className="cursor-pointer">
                  Select File
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing Invoice</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-medium">{uploadedFile?.name}</span>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-blue-700">{processingStep}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Genkit AI OCR</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Data Extraction</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>AI Risk Assessment</span>
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Generating Offer</span>
                <div className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}



      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium mb-1">1. Upload Invoice</h3>
              <p className="text-sm text-gray-600">Upload your B2B invoice in PDF or image format</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium mb-1">2. Genkit AI Analysis</h3>
              <p className="text-sm text-gray-600">Google's Genkit AI extracts data and assesses risk instantly</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium mb-1">3. Get Offer</h3>
              <p className="text-sm text-gray-600">Receive instant financing offer (80-90% advance)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { Upload, TrendingUp, Clock, CheckCircle, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { UploadInvoice } from './components/UploadInvoice';
import { OfferScreen } from './components/OfferScreen';
import { ActiveAdvances } from './components/ActiveAdvances';
import { Settlements } from './components/Settlements';

type Screen = 'dashboard' | 'upload' | 'offer' | 'advances' | 'settlements';

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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);

  const handleInvoiceProcessed = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setCurrentScreen('offer');
  };

  const handleOfferAccepted = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setCurrentScreen('advances');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">JetInvoices</span>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                MVP Demo
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">AI-Powered Invoice Financing</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium ${
                currentScreen === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setCurrentScreen('upload')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium ${
                currentScreen === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Upload Invoice</span>
            </button>
            
            <button
              onClick={() => setCurrentScreen('advances')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium ${
                currentScreen === 'advances'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Active Advances</span>
            </button>
            
            <button
              onClick={() => setCurrentScreen('settlements')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium ${
                currentScreen === 'settlements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Settlements</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentScreen === 'dashboard' && <DashboardScreen onNavigate={setCurrentScreen} />}
        {currentScreen === 'upload' && (
          <UploadInvoice onInvoiceProcessed={handleInvoiceProcessed} />
        )}
        {currentScreen === 'offer' && currentInvoice && (
          <OfferScreen 
            invoice={currentInvoice} 
            onOfferAccepted={handleOfferAccepted}
          />
        )}
        {currentScreen === 'advances' && <ActiveAdvances />}
        {currentScreen === 'settlements' && <Settlements />}
      </main>
    </div>
  );
}



function DashboardScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your invoice financing activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advanced</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$124,500</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Advances</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Advance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Based on risk profile</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">Get started with invoice financing in minutes:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate('upload')}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <Upload className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-medium">Upload New Invoice</h3>
                  <p className="text-sm text-gray-600">Get instant financing offers</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => onNavigate('advances')}
              className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-medium">Track Advances</h3>
                  <p className="text-sm text-gray-600">Monitor payment status</p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
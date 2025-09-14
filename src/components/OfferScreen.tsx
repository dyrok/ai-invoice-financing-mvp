import React, { useState } from 'react';
import { TrendingUp, Calendar, Building, DollarSign, Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
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

interface OfferScreenProps {
  invoice: Invoice;
  onOfferAccepted: (invoice: Invoice) => void;
}

export function OfferScreen({ invoice, onOfferAccepted }: OfferScreenProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState('');

  // Calculate offer terms based on risk band
  const calculateOffer = () => {
    let advancePercent: number;
    let feePercent: number;

    switch (invoice.riskBand) {
      case 'low':
        advancePercent = 90;
        feePercent = 2.5;
        break;
      case 'medium':
        advancePercent = 85;
        feePercent = 3.0;
        break;
      case 'high':
        advancePercent = 80;
        feePercent = 3.5;
        break;
      default:
        advancePercent = 85;
        feePercent = 3.0;
    }

    const advanceAmount = Math.floor((invoice.amount * advancePercent) / 100);
    const fee = Math.floor((invoice.amount * feePercent) / 100);

    return {
      advancePercent,
      feePercent,
      advanceAmount,
      fee,
      netReceived: advanceAmount,
      remainingAmount: invoice.amount - advanceAmount - fee
    };
  };

  const offer = calculateOffer();
  const daysToDue = Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const handleAcceptOffer = async () => {
    setIsAccepting(true);
    setError('');

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9a3989d/invoices/${invoice.id}/accept-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          advancePercent: offer.advancePercent,
          feePercent: offer.feePercent,
          advanceAmount: offer.advanceAmount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to accept offer');
      }

      const updatedInvoice = await response.json();
      onOfferAccepted(updatedInvoice);

    } catch (err: any) {
      console.error('Accept offer error:', err);
      setError(err.message || 'Failed to accept offer');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financing Offer</h1>
        <p className="text-gray-600">Review your instant financing offer based on AI risk assessment</p>
      </div>

      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Invoice Details</span>
            <Badge className={getRiskBadgeColor(invoice.riskBand)}>
              {getRiskIcon(invoice.riskBand)}
              <span className="ml-1 capitalize">{invoice.riskBand} Risk</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Buyer</p>
                <p className="font-medium">{invoice.buyer}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Invoice Amount</p>
                <p className="font-medium">${invoice.amount.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                <p className="text-xs text-gray-500">({daysToDue} days)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financing Offer */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <TrendingUp className="h-5 w-5 mr-2" />
            Your Financing Offer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Advance Amount</p>
                <p className="text-3xl font-bold text-green-600">${offer.advanceAmount.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{offer.advancePercent}% of invoice value</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Financing Fee</p>
                <p className="text-3xl font-bold text-blue-600">${offer.fee.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{offer.feePercent}% of invoice value</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h3 className="font-medium text-gray-900 mb-3">Payment Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">You receive today:</span>
                <span className="font-medium text-green-600">${offer.netReceived.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Financing fee:</span>
                <span className="font-medium">${offer.fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining on payment:</span>
                <span className="font-medium">${offer.remainingAmount.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-medium">
                  <span>Total invoice value:</span>
                  <span>${invoice.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleAcceptOffer}
              disabled={isAccepting}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              size="lg"
            >
              {isAccepting ? 'Processing...' : 'Accept Offer & Get Funded'}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-3"
              onClick={() => {
                if (confirm('Are you sure you want to decline this offer?')) {
                  window.location.href = '#dashboard';
                }
              }}
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Buyer Credit Profile</span>
              <Badge className={getRiskBadgeColor(invoice.riskBand)}>
                {invoice.riskBand === 'low' ? 'Excellent' : 
                 invoice.riskBand === 'medium' ? 'Good' : 'Fair'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Payment Terms</span>
              <Badge variant="outline">
                {daysToDue} day terms
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Invoice Amount</span>
              <Badge variant="outline">
                ${invoice.amount.toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• Funds will be transferred to your account within 2 business hours of acceptance</p>
            <p>• Fee is deducted from the remaining amount when buyer pays</p>
            <p>• Non-recourse financing - we assume buyer payment risk</p>
            <p>• 24/7 payment tracking and notifications included</p>
            <p>• No hidden fees or additional charges</p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
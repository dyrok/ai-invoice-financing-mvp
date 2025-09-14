import React, { useState, useEffect } from 'react';
import { CheckCircle, DollarSign, Calendar, Building, TrendingUp, Download, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Settlement {
  id: string;
  invoiceId: string;
  filename: string;
  buyer: string;
  invoiceAmount: number;
  advanceAmount: number;
  feeAmount: number;
  feePercent: number;
  remainingAmount: number;
  settlementAmount: number;
  paidDate: string;
  createdAt: string;
  riskBand: 'low' | 'medium' | 'high';
  daysToPay: number;
}

export function Settlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9a3989d/settlements`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settlements');
      }

      const data = await response.json();
      setSettlements(data);
    } catch (err: any) {
      console.error('Fetch settlements error:', err);
      setError(err.message || 'Failed to load settlements');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary stats
  const totalSettled = settlements.reduce((sum, settlement) => sum + settlement.invoiceAmount, 0);
  const totalFees = settlements.reduce((sum, settlement) => sum + settlement.feeAmount, 0);
  const totalAdvanced = settlements.reduce((sum, settlement) => sum + settlement.advanceAmount, 0);
  const avgDaysToPay = settlements.length > 0 
    ? Math.round(settlements.reduce((sum, settlement) => sum + settlement.daysToPay, 0) / settlements.length)
    : 0;

  const getRiskBadge = (risk: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[risk as keyof typeof colors]}>{risk}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settlements</h1>
          <p className="text-gray-600">View your completed invoice settlements</p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settlements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settlements</h1>
        <p className="text-gray-600">View your completed invoice settlements and payment history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settled</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSettled.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{settlements.length} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advanced</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAdvanced.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Provided upfront</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalSettled > 0 ? ((totalFees / totalSettled) * 100).toFixed(1) : 0}% avg rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Days to Pay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDaysToPay}</div>
            <p className="text-xs text-muted-foreground">Payment timeline</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Settlements Table */}
      {settlements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Settlements Yet</h3>
            <p className="text-gray-600 mb-4">Your completed settlements will appear here</p>
            <Button onClick={() => window.location.href = '#upload'}>Upload First Invoice</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Settlement History</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const csvContent = settlements.map(s => 
                  `${s.filename},${s.buyer},${s.invoiceAmount},${s.advanceAmount},${s.feeAmount},${s.settlementAmount},${s.paidDate}`
                ).join('\n');
                const blob = new Blob([`Filename,Buyer,Invoice Amount,Advanced,Fee,Settlement,Paid Date\n${csvContent}`], 
                  { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'settlements_report.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Invoice Amount</TableHead>
                  <TableHead>Advanced</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Net Settlement</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{settlement.filename}</p>
                        <p className="text-sm text-gray-500">ID: {settlement.invoiceId.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{settlement.buyer}</span>
                      </div>
                    </TableCell>
                    <TableCell>${settlement.invoiceAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">${settlement.advanceAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">
                          {((settlement.advanceAmount / settlement.invoiceAmount) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">${settlement.feeAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{settlement.feePercent}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-green-600">${settlement.settlementAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Final payment</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{new Date(settlement.paidDate).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">{settlement.daysToPay} days</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRiskBadge(settlement.riskBand)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">On-time payments</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average days early</span>
                <span className="text-sm font-medium">3.2 days</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment reliability</span>
                <Badge className="bg-green-100 text-green-800">Excellent</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Low risk invoices</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-sm font-medium">65%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Medium risk invoices</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-sm font-medium">25%</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">High risk invoices</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                  <span className="text-sm font-medium">10%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
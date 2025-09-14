import React, { useState, useEffect } from 'react';
import { Clock, Building, DollarSign, Calendar, CheckCircle, Eye, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Advance {
  id: string;
  invoiceId: string;
  filename: string;
  buyer: string;
  invoiceAmount: number;
  advanceAmount: number;
  feePercent: number;
  dueDate: string;
  status: 'active' | 'overdue' | 'paid';
  createdAt: string;
  riskBand: 'low' | 'medium' | 'high';
}

export function ActiveAdvances() {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMarking, setIsMarking] = useState<string | null>(null);

  useEffect(() => {
    fetchAdvances();
  }, []);

  const fetchAdvances = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9a3989d/advances`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      console.log('Advances response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Advances fetch error response:', errorText);
        throw new Error(`Failed to fetch advances: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Advances data received:', data);
      setAdvances(data);
    } catch (err: any) {
      console.error('Fetch advances error:', err);
      setError(err.message || 'Failed to load advances');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsPaid = async (advanceId: string) => {
    setIsMarking(advanceId);
    setError('');

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9a3989d/advances/${advanceId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error('Failed to mark as paid');
      }

      // Refresh the advances list
      await fetchAdvances();
    } catch (err: any) {
      console.error('Mark paid error:', err);
      setError(err.message || 'Failed to mark as paid');
    } finally {
      setIsMarking(null);
    }
  };

  const getStatusBadge = (advance: Advance) => {
    const daysToDue = Math.ceil((new Date(advance.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (advance.status === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    } else if (daysToDue < 0) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    } else if (daysToDue <= 7) {
      return <Badge className="bg-yellow-100 text-yellow-800">Due Soon</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[risk as keyof typeof colors]}>{risk}</Badge>;
  };

  // Calculate summary stats
  const totalAdvanced = advances.reduce((sum, advance) => sum + advance.advanceAmount, 0);
  const activeCount = advances.filter(a => a.status === 'active').length;
  const overdueCount = advances.filter(a => {
    const daysToDue = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysToDue < 0 && a.status === 'active';
  }).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Advances</h1>
          <p className="text-gray-600">Track your current invoice advances</p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Active Advances</h1>
        <p className="text-gray-600">Track your current invoice advances and payment status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Advanced</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAdvanced.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{advances.length} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Advances</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setError('');
                fetchAdvances();
              }}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Advances Table */}
      {advances.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Advances</h3>
            <p className="text-gray-600 mb-4">Upload an invoice to get started with financing</p>
            <Button onClick={() => window.location.href = '#upload'}>Upload Invoice</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Advance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Advanced</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advances.map((advance) => {
                  const daysToDue = Math.ceil((new Date(advance.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <TableRow key={advance.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{advance.filename}</p>
                          <p className="text-sm text-gray-500">ID: {advance.invoiceId.slice(0, 8)}...</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span>{advance.buyer}</span>
                        </div>
                      </TableCell>
                      <TableCell>${advance.invoiceAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">${advance.advanceAmount.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{advance.feePercent}% fee</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{new Date(advance.dueDate).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">
                            {daysToDue >= 0 ? `${daysToDue} days` : `${Math.abs(daysToDue)} days overdue`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRiskBadge(advance.riskBand)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(advance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {advance.status === 'active' && (
                              <DropdownMenuItem
                                onClick={() => markAsPaid(advance.id)}
                                disabled={isMarking === advance.id}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {isMarking === advance.id ? 'Marking...' : 'Mark as Paid'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              className="justify-start h-auto p-4" 
              variant="outline"
              onClick={() => window.location.href = '#upload'}
            >
              <div className="text-left">
                <p className="font-medium">Upload New Invoice</p>
                <p className="text-sm text-gray-600">Get more working capital</p>
              </div>
            </Button>
            <Button 
              className="justify-start h-auto p-4" 
              variant="outline"
              onClick={() => {
                const csvContent = advances.map(a => 
                  `${a.filename},${a.buyer},${a.invoiceAmount},${a.advanceAmount},${a.dueDate},${a.status}`
                ).join('\n');
                const blob = new Blob([`Filename,Buyer,Invoice Amount,Advance Amount,Due Date,Status\n${csvContent}`], 
                  { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'advances_report.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <div className="text-left">
                <p className="font-medium">Download Report</p>
                <p className="text-sm text-gray-600">Export advance summary</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
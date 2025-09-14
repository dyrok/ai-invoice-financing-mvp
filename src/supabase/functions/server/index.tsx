import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { GenkitAIService } from './genkit-service.tsx';

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Initialize Genkit AI service
const genkitService = new GenkitAIService(Deno.env.get('GOOGLE_GENKIT_API_KEY') || '');

// Middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}));
app.use('*', logger(console.log));

// Default demo user for all requests
const DEFAULT_USER_ID = 'demo-user-123';

// Initialize sample data on startup
createSampleData(DEFAULT_USER_ID).catch(console.error);

// Helper function to create sample data
async function createSampleData(userId: string) {
  try {
    // Check if sample data already exists
    const existingAdvances = await kv.getByPrefix(`user:${userId}:advance:`);
    if (existingAdvances.length > 0) {
      console.log('Sample data already exists for user:', userId);
      return; // Sample data already exists
    }

    // Create sample advances
    const sampleAdvances = [
      {
        id: crypto.randomUUID(),
        invoiceId: crypto.randomUUID(),
        userId,
        filename: 'INV-2024-001.pdf',
        buyer: 'Acme Corp',
        invoiceAmount: 25000,
        advanceAmount: 22500,
        feePercent: 2.5,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        riskBand: 'low'
      },
      {
        id: crypto.randomUUID(),
        invoiceId: crypto.randomUUID(),
        userId,
        filename: 'INV-2024-002.pdf',
        buyer: 'TechStart Inc',
        invoiceAmount: 18000,
        advanceAmount: 15300,
        feePercent: 3.0,
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        riskBand: 'medium'
      }
    ];

    // Create sample settlements
    const sampleSettlements = [
      {
        id: crypto.randomUUID(),
        invoiceId: crypto.randomUUID(),
        userId,
        filename: 'INV-2024-003.pdf',
        buyer: 'Global Solutions LLC',
        invoiceAmount: 35000,
        advanceAmount: 31500,
        feeAmount: 875,
        feePercent: 2.5,
        remainingAmount: 2625,
        settlementAmount: 2625,
        paidDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        riskBand: 'low',
        daysToPay: 28
      },
      {
        id: crypto.randomUUID(),
        invoiceId: crypto.randomUUID(),
        userId,
        filename: 'INV-2024-004.pdf',
        buyer: 'Enterprise Ltd',
        invoiceAmount: 42000,
        advanceAmount: 33600,
        feeAmount: 1470,
        feePercent: 3.5,
        remainingAmount: 6930,
        settlementAmount: 6930,
        paidDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        riskBand: 'high',
        daysToPay: 53
      }
    ];

    // Store sample advances
    for (const advance of sampleAdvances) {
      await kv.set(`advance:${advance.id}`, advance);
      await kv.set(`user:${userId}:advance:${advance.id}`, advance.id);
    }

    // Store sample settlements
    for (const settlement of sampleSettlements) {
      await kv.set(`settlement:${settlement.id}`, settlement);
      await kv.set(`user:${userId}:settlement:${settlement.id}`, settlement.id);
    }

    console.log('Sample data created for user:', userId);
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// Process invoice with Genkit AI endpoint
app.post('/make-server-f9a3989d/invoices/process-ai', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const userId = DEFAULT_USER_ID; // Use default user

    console.log('AI processing request - File:', file?.name, 'UserId:', userId);

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    console.log(`Processing invoice ${file.name} with Genkit AI for user ${userId}`);

    // Convert file to buffer for AI processing
    const fileBuffer = await file.arrayBuffer();
    
    // Process document with Genkit AI
    const aiResult = await genkitService.processInvoiceDocument(fileBuffer, file.name);
    
    if (!aiResult.success) {
      return c.json({ error: aiResult.error }, 500);
    }

    // Assess risk with AI
    const riskAssessment = await genkitService.assessInvoiceRisk(aiResult.extractedData);
    
    if (!riskAssessment.success) {
      return c.json({ error: riskAssessment.error }, 500);
    }

    // Create invoice with AI-extracted data
    const invoiceId = crypto.randomUUID();
    const invoice = {
      id: invoiceId,
      userId,
      filename: file.name,
      amount: aiResult.extractedData.amount,
      buyer: aiResult.extractedData.buyer,
      dueDate: aiResult.extractedData.dueDate,
      riskBand: riskAssessment.riskBand,
      status: 'uploaded',
      createdAt: new Date().toISOString(),
      aiProcessing: {
        confidence: aiResult.confidence,
        processingTime: aiResult.processingTime,
        extractedData: aiResult.extractedData,
        riskAssessment: riskAssessment
      }
    };

    await kv.set(`invoice:${invoiceId}`, invoice);
    await kv.set(`user:${userId}:invoice:${invoiceId}`, invoiceId);

    return c.json(invoice);
  } catch (error) {
    console.error('AI invoice processing error:', error);
    return c.json({ error: 'Failed to process invoice with AI' }, 500);
  }
});

// Create invoice endpoint (fallback for manual entry)
app.post('/make-server-f9a3989d/invoices', async (c) => {
  try {
    const body = await c.req.json();
    console.log('Creating invoice with data:', body);
    const { filename, amount, buyer, dueDate, riskBand } = body;
    const userId = DEFAULT_USER_ID; // Use default user

    if (!filename || !amount || !buyer || !dueDate || !riskBand) {
      console.error('Missing required invoice fields:', { filename, amount, buyer, dueDate, riskBand });
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const invoiceId = crypto.randomUUID();
    const invoice = {
      id: invoiceId,
      userId,
      filename,
      amount,
      buyer,
      dueDate,
      riskBand,
      status: 'uploaded',
      createdAt: new Date().toISOString()
    };

    console.log('Storing invoice:', invoiceId);
    await kv.set(`invoice:${invoiceId}`, invoice);
    await kv.set(`user:${userId}:invoice:${invoiceId}`, invoiceId);

    console.log('Invoice created successfully:', invoiceId);
    return c.json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    return c.json({ error: `Failed to create invoice: ${error.message}` }, 500);
  }
});

// Accept offer endpoint
app.post('/make-server-f9a3989d/invoices/:invoiceId/accept-offer', async (c) => {
  try {
    const invoiceId = c.req.param('invoiceId');
    const body = await c.req.json();
    const { advancePercent, feePercent, advanceAmount } = body;
    const userId = DEFAULT_USER_ID; // Use default user

    const invoice = await kv.get(`invoice:${invoiceId}`);
    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404);
    }

    // Update invoice status
    const updatedInvoice = {
      ...invoice,
      status: 'advanced',
      advancePercent,
      feePercent,
      advanceAmount
    };

    await kv.set(`invoice:${invoiceId}`, updatedInvoice);

    // Create advance record
    const advanceId = crypto.randomUUID();
    const advance = {
      id: advanceId,
      invoiceId,
      userId,
      filename: invoice.filename,
      buyer: invoice.buyer,
      invoiceAmount: invoice.amount,
      advanceAmount,
      feePercent,
      dueDate: invoice.dueDate,
      status: 'active',
      createdAt: new Date().toISOString(),
      riskBand: invoice.riskBand
    };

    await kv.set(`advance:${advanceId}`, advance);
    await kv.set(`user:${userId}:advance:${advanceId}`, advanceId);

    return c.json(updatedInvoice);
  } catch (error) {
    console.error('Accept offer error:', error);
    return c.json({ error: 'Failed to accept offer' }, 500);
  }
});

// Get advances endpoint
app.get('/make-server-f9a3989d/advances', async (c) => {
  try {
    const userId = DEFAULT_USER_ID; // Use default user
    console.log('Getting advances for userId:', userId);

    const advanceKeys = await kv.getByPrefix(`user:${userId}:advance:`);
    console.log('Found advance keys:', advanceKeys.length);
    
    const advances = [];

    for (const advanceId of advanceKeys) {
      console.log('Processing advance ID:', advanceId);
      const advance = await kv.get(`advance:${advanceId}`);
      if (advance) {
        advances.push(advance);
      } else {
        console.warn('Advance not found for ID:', advanceId);
      }
    }

    console.log('Total advances found:', advances.length);

    // Sort by creation date (newest first)
    advances.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json(advances);
  } catch (error) {
    console.error('Get advances error:', error);
    return c.json({ error: `Failed to get advances: ${error.message}` }, 500);
  }
});

// Mark advance as paid endpoint
app.post('/make-server-f9a3989d/advances/:advanceId/mark-paid', async (c) => {
  try {
    const advanceId = c.req.param('advanceId');
    const userId = DEFAULT_USER_ID; // Use default user

    const advance = await kv.get(`advance:${advanceId}`);
    if (!advance) {
      return c.json({ error: 'Advance not found' }, 404);
    }

    // Update advance status
    const updatedAdvance = {
      ...advance,
      status: 'paid'
    };
    await kv.set(`advance:${advanceId}`, updatedAdvance);

    // Create settlement record
    const settlementId = crypto.randomUUID();
    const feeAmount = Math.floor((advance.invoiceAmount * advance.feePercent) / 100);
    const remainingAmount = advance.invoiceAmount - advance.advanceAmount - feeAmount;
    const daysToPay = Math.ceil((Date.now() - new Date(advance.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    const settlement = {
      id: settlementId,
      invoiceId: advance.invoiceId,
      userId,
      filename: advance.filename,
      buyer: advance.buyer,
      invoiceAmount: advance.invoiceAmount,
      advanceAmount: advance.advanceAmount,
      feeAmount,
      feePercent: advance.feePercent,
      remainingAmount,
      settlementAmount: remainingAmount,
      paidDate: new Date().toISOString(),
      createdAt: advance.createdAt,
      riskBand: advance.riskBand,
      daysToPay
    };

    await kv.set(`settlement:${settlementId}`, settlement);
    await kv.set(`user:${userId}:settlement:${settlementId}`, settlementId);

    return c.json({ success: true });
  } catch (error) {
    console.error('Mark paid error:', error);
    return c.json({ error: 'Failed to mark as paid' }, 500);
  }
});

// Get settlements endpoint
app.get('/make-server-f9a3989d/settlements', async (c) => {
  try {
    const userId = DEFAULT_USER_ID; // Use default user

    const settlementKeys = await kv.getByPrefix(`user:${userId}:settlement:`);
    const settlements = [];

    for (const settlementId of settlementKeys) {
      const settlement = await kv.get(`settlement:${settlementId}`);
      if (settlement) {
        settlements.push(settlement);
      }
    }

    // Sort by paid date (newest first)
    settlements.sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());

    return c.json(settlements);
  } catch (error) {
    console.error('Get settlements error:', error);
    return c.json({ error: 'Failed to get settlements' }, 500);
  }
});

// Health check endpoint
app.get('/make-server-f9a3989d/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Debug endpoint to check what data exists
app.get('/make-server-f9a3989d/debug/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const advanceKeys = await kv.getByPrefix(`user:${userId}:advance:`);
    const settlementKeys = await kv.getByPrefix(`user:${userId}:settlement:`);
    const invoiceKeys = await kv.getByPrefix(`user:${userId}:invoice:`);
    
    return c.json({
      userId,
      advanceKeys: advanceKeys.length,
      settlementKeys: settlementKeys.length,
      invoiceKeys: invoiceKeys.length,
      advanceKeysData: advanceKeys,
      settlementKeysData: settlementKeys,
      invoiceKeysData: invoiceKeys
    });
  } catch (error) {
    console.error('Debug error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Debug endpoint to check session validity
app.get('/make-server-f9a3989d/debug/session/:token', async (c) => {
  try {
    const token = c.req.param('token');
    console.log('Debugging session token:', token.substring(0, 10) + '...');
    
    const session = await kv.get(`session:${token}`);
    
    return c.json({
      tokenPrefix: token.substring(0, 10) + '...',
      sessionFound: !!session,
      sessionData: session ? {
        userId: session.userId,
        email: session.email,
        name: session.name,
        createdAt: session.createdAt
      } : null
    });
  } catch (error) {
    console.error('Session debug error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Start server
Deno.serve(app.fetch);
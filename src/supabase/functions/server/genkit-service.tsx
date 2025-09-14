import { Hono } from 'npm:hono';

// Mock Genkit AI service for document processing
// In a real implementation, this would integrate with Google's Genkit AI
export class GenkitAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async processInvoiceDocument(fileBuffer: ArrayBuffer, filename: string): Promise<any> {
    try {
      // Simulate AI document processing
      console.log(`Processing document: ${filename} with Genkit AI`);
      
      // In a real implementation, this would:
      // 1. Convert the document to text using OCR
      // 2. Extract structured data using AI
      // 3. Validate the extracted information
      // 4. Return structured invoice data
      
      // For now, we'll simulate the processing with realistic data
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      
      const extractedData = await this.simulateGenkitExtraction(filename);
      
      return {
        success: true,
        extractedData,
        confidence: 0.95,
        processingTime: 2.1
      };
    } catch (error) {
      console.error('Genkit AI processing error:', error);
      return {
        success: false,
        error: 'Failed to process document with AI',
        extractedData: null
      };
    }
  }

  private async simulateGenkitExtraction(filename: string) {
    // Simulate AI extraction with varied but realistic data
    const companies = ['Acme Corporation', 'TechStart Inc', 'Global Solutions LLC', 'Enterprise Ltd', 'InnovateCorp', 'Digital Dynamics'];
    const amounts = [15000, 25000, 35000, 45000, 55000, 65000];
    const terms = [30, 45, 60, 90];
    
    const randomCompany = companies[Math.floor(Math.random() * companies.length)];
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)] + Math.floor(Math.random() * 10000);
    const randomTerms = terms[Math.floor(Math.random() * terms.length)];
    
    // Generate invoice number from filename or create one
    const invoiceNumber = filename.includes('INV') 
      ? filename.split('.')[0] 
      : `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    return {
      invoiceNumber,
      buyer: randomCompany,
      amount: randomAmount,
      currency: 'USD',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + randomTerms * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: `Net ${randomTerms}`,
      description: 'Professional services rendered',
      sellerInfo: {
        name: 'Your Company Name',
        address: '123 Business St, City, State 12345',
        taxId: 'TAX123456789'
      },
      buyerInfo: {
        name: randomCompany,
        address: '456 Corporate Ave, Business City, State 54321'
      },
      lineItems: [
        {
          description: 'Professional Services',
          quantity: 1,
          unitPrice: randomAmount,
          total: randomAmount
        }
      ],
      subtotal: randomAmount,
      tax: 0,
      total: randomAmount,
      extractedFields: {
        confidence: {
          buyer: 0.98,
          amount: 0.96,
          dueDate: 0.94,
          invoiceNumber: 0.99
        }
      }
    };
  }

  async assessInvoiceRisk(invoiceData: any): Promise<any> {
    try {
      console.log('Assessing invoice risk with Genkit AI');
      
      // Simulate AI risk assessment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const riskFactors = this.calculateRiskFactors(invoiceData);
      const riskScore = this.calculateRiskScore(riskFactors);
      const riskBand = this.determineRiskBand(riskScore);
      
      return {
        success: true,
        riskScore,
        riskBand,
        riskFactors,
        recommendation: this.generateRecommendation(riskBand, riskFactors)
      };
    } catch (error) {
      console.error('Risk assessment error:', error);
      return {
        success: false,
        error: 'Failed to assess risk',
        riskScore: 0.5,
        riskBand: 'medium'
      };
    }
  }

  private calculateRiskFactors(invoiceData: any) {
    const daysToDue = Math.ceil((new Date(invoiceData.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return {
      amount: invoiceData.amount,
      daysToDue,
      buyerProfile: Math.random() * 0.3 + 0.7, // Simulate buyer creditworthiness (0.7-1.0)
      invoiceAge: 0, // New invoice
      paymentHistory: Math.random() * 0.2 + 0.8, // Simulate payment history (0.8-1.0)
      industryRisk: Math.random() * 0.3 + 0.6 // Simulate industry risk (0.6-0.9)
    };
  }

  private calculateRiskScore(factors: any): number {
    // Weighted risk calculation
    let score = 0.8; // Base score
    
    // Amount factor (higher amounts = slightly higher risk)
    if (factors.amount > 50000) score -= 0.1;
    else if (factors.amount > 30000) score -= 0.05;
    
    // Days to due factor (longer terms = higher risk)
    if (factors.daysToDue > 60) score -= 0.1;
    else if (factors.daysToDue > 45) score -= 0.05;
    
    // Buyer profile impact
    score *= factors.buyerProfile;
    
    // Payment history impact
    score *= factors.paymentHistory;
    
    // Industry risk impact
    score *= factors.industryRisk;
    
    return Math.max(0.1, Math.min(1.0, score));
  }

  private determineRiskBand(riskScore: number): 'low' | 'medium' | 'high' {
    if (riskScore >= 0.8) return 'low';
    if (riskScore >= 0.6) return 'medium';
    return 'high';
  }

  private generateRecommendation(riskBand: string, factors: any) {
    const recommendations = {
      low: {
        advancePercent: 90,
        feePercent: 2.5,
        message: 'Excellent risk profile. Recommended for maximum advance.'
      },
      medium: {
        advancePercent: 85,
        feePercent: 3.0,
        message: 'Good risk profile with standard terms.'
      },
      high: {
        advancePercent: 80,
        feePercent: 3.5,
        message: 'Higher risk profile requires conservative advance terms.'
      }
    };
    
    return recommendations[riskBand as keyof typeof recommendations];
  }
}
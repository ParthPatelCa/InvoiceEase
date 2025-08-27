import OpenAI from 'openai'
import { DocumentProcessorServiceClient } from '@google-cloud/documentai'
import { ImageAnnotatorClient } from '@google-cloud/vision'

// Types for extracted invoice data
export interface ExtractedInvoiceData {
  invoice_number: string
  invoice_date: string
  vendor_name: string
  vendor_address: string
  total_amount: string
  tax_amount: string
  description: string
  currency: string
  payment_terms: string
  extracted_from: string
  extraction_method: 'digital' | 'ocr' // Track how the data was extracted
  line_items?: Array<{
    description: string
    quantity: number
    unit_price: string
    total: string
  }>
}

// Initialize clients (only if credentials are available)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

const visionClient = process.env.GOOGLE_APPLICATION_CREDENTIALS ? new ImageAnnotatorClient() : null

const documentAIClient = (
  process.env.GOOGLE_APPLICATION_CREDENTIALS && 
  process.env.GOOGLE_CLOUD_PROJECT_ID && 
  process.env.GOOGLE_CLOUD_PROCESSOR_ID
) ? new DocumentProcessorServiceClient() : null

/**
 * Extract text from PDF using pdf-parse (for digital PDFs)
 * Returns an object with text and detection of whether it's scanned
 */
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<{ text: string; isScanned: boolean }> {
  try {
    console.log('PDF Processor - Extracting text from PDF buffer of size:', pdfBuffer.length)
    
    // Dynamic import to avoid build-time issues
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(pdfBuffer)
    const text = data.text || ''
    
    console.log('PDF Processor - Extracted text length:', text.length)
    
    // Simple heuristic to detect scanned PDFs:
    // If text is very short relative to number of pages, it's likely scanned
    const textPerPage = text.length / (data.numpages || 1)
    const isScanned = textPerPage < 100 || text.trim().length < 50
    
    console.log('PDF Processor - Text per page:', textPerPage, 'isScanned:', isScanned)
    
    return { text, isScanned }
  } catch (error) {
    console.error('PDF Processor - Error extracting text from PDF:', error)
    throw error
  }
}

/**
 * Extract text from scanned PDF using Google Vision API OCR
 */
async function extractTextWithOCR(pdfBuffer: Buffer): Promise<string> {
  if (!visionClient) {
    throw new Error('Google Vision API not configured. Please set GOOGLE_APPLICATION_CREDENTIALS.')
  }

  try {
    console.log('PDF Processor - Using Google Vision OCR for scanned PDF...')
    
    // For PDFs, we need to convert to image first or use Document AI
    // For now, let's use Document AI if available, otherwise throw error
    if (documentAIClient && process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_PROCESSOR_ID) {
      return await extractTextWithDocumentAI(pdfBuffer)
    }
    
    throw new Error('PDF OCR requires Google Document AI. Please configure GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_PROCESSOR_ID.')
    
  } catch (error) {
    console.error('PDF Processor - OCR extraction failed:', error)
    throw error
  }
}

/**
 * Extract text using Google Document AI OCR
 */
async function extractTextWithDocumentAI(pdfBuffer: Buffer): Promise<string> {
  if (!documentAIClient || !process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_PROCESSOR_ID) {
    throw new Error('Google Document AI not configured')
  }

  try {
    console.log('PDF Processor - Using Google Document AI OCR...')
    
    const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/us/processors/${process.env.GOOGLE_CLOUD_PROCESSOR_ID}`
    
    const request = {
      name,
      rawDocument: {
        content: pdfBuffer.toString('base64'),
        mimeType: 'application/pdf',
      },
    }

    const [result] = await documentAIClient.processDocument(request)
    const document = result.document
    
    if (!document?.text) {
      throw new Error('No text extracted from Document AI')
    }
    
    console.log('PDF Processor - Document AI extraction successful, length:', document.text.length)
    return document.text
    
  } catch (error) {
    console.error('PDF Processor - Document AI extraction failed:', error)
    throw error
  }
}

/**
 * Use OpenAI GPT-4o mini to extract structured data from PDF text
 */
async function extractInvoiceDataWithAI(pdfText: string, filename: string, extractionMethod: 'digital' | 'ocr' = 'digital'): Promise<ExtractedInvoiceData[]> {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }

  try {
    console.log('PDF Processor - Extracting invoice data with OpenAI...', { extractionMethod })
    
    const prompt = `
Extract invoice data from the following PDF text. Return a JSON array of invoice objects, even if there's only one invoice.

Each invoice object should have this exact structure:
{
  "invoice_number": "string",
  "invoice_date": "YYYY-MM-DD",
  "vendor_name": "string", 
  "vendor_address": "string",
  "total_amount": "decimal as string",
  "tax_amount": "decimal as string", 
  "description": "brief description of services/products",
  "currency": "USD/EUR/etc",
  "payment_terms": "string like '30 days' or 'Due on receipt'",
  "line_items": [
    {
      "description": "string",
      "quantity": number,
      "unit_price": "decimal as string", 
      "total": "decimal as string"
    }
  ]
}

Rules:
- If a field is not found, use "N/A" for strings, "0.00" for amounts
- Always return valid JSON array
- Extract ALL invoices if multiple are present
- For dates, convert to YYYY-MM-DD format
- For amounts, remove currency symbols and return just the number as string

PDF Text:
${pdfText}
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "You are an expert at extracting structured data from invoices. Always return valid JSON arrays."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 2000,
    })

    const aiResponse = response.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    console.log('PDF Processor - AI response length:', aiResponse.length)

    // Parse the JSON response
    let extractedData: ExtractedInvoiceData[]
    try {
      // Clean the response (remove markdown code blocks if present)
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      extractedData = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('PDF Processor - Failed to parse AI response as JSON:', parseError)
      console.error('PDF Processor - AI response:', aiResponse)
      throw new Error('AI returned invalid JSON format')
    }

    // Ensure it's an array
    if (!Array.isArray(extractedData)) {
      extractedData = [extractedData]
    }

    // Add metadata to each invoice
    extractedData.forEach(invoice => {
      invoice.extracted_from = filename
      invoice.extraction_method = extractionMethod
    })

    console.log('PDF Processor - Successfully extracted', extractedData.length, 'invoices')
    return extractedData

  } catch (error) {
    console.error('PDF Processor - AI extraction failed:', error)
    throw error
  }
}

/**
 * Generate fallback mock data if AI extraction fails
 */
function generateFallbackData(filename: string): ExtractedInvoiceData[] {
  console.log('PDF Processor - Generating fallback mock data')
  
  const mockData: ExtractedInvoiceData = {
    invoice_number: `INV-${Date.now()}`,
    invoice_date: new Date().toISOString().split('T')[0],
    vendor_name: 'Extracted Invoice Data (Partial)',
    vendor_address: 'Unable to extract vendor address',
    total_amount: '0.00',
    tax_amount: '0.00',
    description: `Data extracted from ${filename} - AI processing failed, manual review needed`,
    currency: 'USD',
    payment_terms: 'N/A',
    extracted_from: filename,
    extraction_method: 'digital',
    line_items: []
  }
  
  return [mockData]
}

/**
 * Main function to process a PDF invoice using smart conditional workflow
 * Digital PDFs use pdf-parse + OpenAI
 * Scanned PDFs use Google Document AI/Vision API + OpenAI
 */
export async function processPDFInvoice(buffer: Buffer, filename: string): Promise<{ extractedData: ExtractedInvoiceData[], csvData: string }> {
  try {
    console.log('PDF Processor - Starting invoice processing for:', filename)
    
    // First try to extract text and detect if it's scanned
    const { text: pdfText, isScanned } = await extractTextFromPDF(buffer)
    console.log('PDF Processor - Extracted text length:', pdfText.length, 'isScanned:', isScanned)
    
    // Use appropriate extraction method based on detection
    let finalText = pdfText
    let extractionMethod: 'digital' | 'ocr' = 'digital'
    
    if (isScanned) {
      console.log('PDF Processor - Detected scanned PDF, using OCR...')
      extractionMethod = 'ocr'
      
      // Try Document AI first (better for invoices), fall back to Vision API
      try {
        finalText = await extractTextWithDocumentAI(buffer)
        console.log('PDF Processor - Document AI extraction successful, text length:', finalText.length)
      } catch (docAiError) {
        console.warn('PDF Processor - Document AI failed, falling back to Vision API:', docAiError)
        finalText = await extractTextWithOCR(buffer)
        console.log('PDF Processor - Vision API extraction successful, text length:', finalText.length)
      }
    }
    
    // Use OpenAI to extract structured invoice data
    const extractedData = await extractInvoiceDataWithAI(finalText, filename, extractionMethod)
    
    // Convert to CSV format
    const csvData = convertToCSV(extractedData)
    
    console.log('PDF Processor - Successfully processed invoice with', extractedData.length, 'items using', extractionMethod, 'method')
    
    return { extractedData, csvData }
    
  } catch (error) {
    console.error('PDF Processor - Error processing PDF:', error)
    throw error
  }
}

/**
 * Convert extracted data to CSV format
 */
export function convertToCSV(invoices: ExtractedInvoiceData[]): string {
  const headers = [
    'Invoice Number',
    'Date',
    'Vendor Name', 
    'Vendor Address',
    'Description',
    'Total Amount',
    'Tax Amount',
    'Currency',
    'Payment Terms',
    'Source File'
  ]

  const rows = [headers.join(',')]

  invoices.forEach(invoice => {
    const row = [
      `"${invoice.invoice_number}"`,
      `"${invoice.invoice_date}"`,
      `"${invoice.vendor_name}"`,
      `"${invoice.vendor_address}"`,
      `"${invoice.description}"`,
      `"${invoice.total_amount}"`,
      `"${invoice.tax_amount}"`,
      `"${invoice.currency}"`,
      `"${invoice.payment_terms}"`,
      `"${invoice.extracted_from}"`
    ]
    rows.push(row.join(','))
  })

  return rows.join('\n')
}

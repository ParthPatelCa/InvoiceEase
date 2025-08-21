'use client'

import { useState, useCallback } from 'react'

interface FileUploadProps {
  onFileUpload: (file: File) => void
  isUploading?: boolean
}

export function FileUpload({ onFileUpload, isUploading = false }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const pdfFile = files.find(file => file.type === 'application/pdf')
    
    if (pdfFile) {
      onFileUpload(pdfFile)
    }
  }, [onFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      onFileUpload(file)
    }
  }, [onFileUpload])

  return (
    <div className="mb-8">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-lg font-medium text-foreground">
              Processing your invoice...
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This may take a few moments
            </p>
          </div>
        ) : (
          <>
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-foreground">
              Upload PDF Invoice
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isDragOver 
                ? 'Drop your PDF file here' 
                : 'Drag and drop a PDF file here, or click to select'
              }
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Maximum file size: 20MB
            </p>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer disabled:opacity-50"
            >
              Choose PDF file
            </label>
          </>
        )}
      </div>
    </div>
  )
}

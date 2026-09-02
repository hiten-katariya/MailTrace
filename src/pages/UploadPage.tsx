import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadCase } from '../mocks/api';
import { Dropzone } from '../components/upload/Dropzone';
import { PipelineProgress } from '../components/upload/PipelineProgress';
import { Upload, Shield, RefreshCw } from 'lucide-react';
import { IngestResponse } from '../types/api';

interface UploadPageProps {
  onCaseCreated: (caseId: string) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onCaseCreated }) => {
  const queryClient = useQueryClient();
  const [ingestResult, setIngestResult] = useState<IngestResponse | null>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadCase,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setIngestResult(data);
    },
  });

  const handleFileSelected = (fileInfo: {
    name: string;
    size?: number;
    sampleType?: 'phishing' | 'bec' | 'spoof' | 'clean';
  }) => {
    uploadMutation.mutate(fileInfo);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-soc-border">
        <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
          <Upload className="w-5 h-5 text-cyan-400" />
          <span>INGEST & ANALYZE RAW .EML TRANSMISSION</span>
        </h1>
        <p className="text-xs text-soc-text-dim mt-0.5">
          Submit suspicious raw email files for automated multi-signal header forensics, NLP classification, IP geolocation, and threat correlation.
        </p>
      </div>

      {/* Main Upload / Pipeline Area */}
      {ingestResult ? (
        <div className="space-y-4">
          <PipelineProgress
            filename={ingestResult.filename || 'uploaded_email.eml'}
            caseId={ingestResult.case_id}
            fileHash={ingestResult.file_hash}
            onComplete={(id) => onCaseCreated(id)}
          />

          <div className="text-center">
            <button
              onClick={() => setIngestResult(null)}
              className="text-xs font-mono text-slate-400 hover:text-cyan-300 underline"
            >
              ← Submit Another .EML File
            </button>
          </div>
        </div>
      ) : (
        <Dropzone
          onFileSelected={handleFileSelected}
          isProcessing={uploadMutation.isPending}
        />
      )}
    </div>
  );
};

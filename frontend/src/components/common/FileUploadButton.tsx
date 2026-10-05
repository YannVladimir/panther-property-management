import React, { useRef } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { useUploadFileMutation } from '../../api/files';
import { useToast } from '../../context/ToastContext';

interface FileUploadButtonProps {
  /** Storage sub-folder — keeps uploads organized server-side (e.g. "client-documents", "damage-photos"). */
  folder: string;
  onUploaded: (result: { url: string; originalFilename: string; sizeLabel: string }) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  className?: string;
}

/** Real upload to POST /api/v1/files — replaces every former "paste a URL" / local-preview-only input. */
export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  folder,
  onUploaded,
  accept,
  multiple = false,
  label = 'Upload File',
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadFileMutation();
  const { error: toastError } = useToast();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      try {
        const result = await uploadMutation.mutateAsync({ file, folder });
        onUploaded(result);
      } catch {
        toastError('Upload Failed', `Could not upload ${file.name}.`);
      }
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <label
      className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors ${
        uploadMutation.isPending ? 'opacity-60 pointer-events-none' : ''
      } ${className}`}
    >
      {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
      {uploadMutation.isPending ? 'Uploading…' : label}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </label>
  );
};

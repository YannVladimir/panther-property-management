import { useMutation } from '@tanstack/react-query';
import { apiUpload, UploadedFile } from './client';

export function useUploadFileMutation() {
  return useMutation({
    mutationFn: ({ file, folder }: { file: File; folder: string }) => apiUpload(file, folder),
  });
}

export type { UploadedFile };

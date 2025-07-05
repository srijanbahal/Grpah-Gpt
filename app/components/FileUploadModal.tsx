import { useRef } from 'react';
import { Button } from '@/components/ui/button';

export default function FileUploadModal({
  open,
  onClose,
  onFileSelect,
}: {
  open: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-lg font-semibold mb-4">Upload File</h2>
        <div className="flex flex-col gap-3">
          <Button onClick={() => fileInputRef.current?.click()}>Upload PDF</Button>
          <Button onClick={() => fileInputRef.current?.click()}>Upload Photo</Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
              onClose();
            }}
          />
        </div>
        <Button variant="ghost" className="mt-4 w-full" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}
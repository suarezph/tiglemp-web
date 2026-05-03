import { useRef, type ChangeEvent } from 'react';
import { ExternalLink, FileText, Trash2, Upload } from 'lucide-react';
import type { PartnerDocument } from '@/types/api';
import { Button } from '@/components/ui/button';

const formatBytes = (bytes: number | null | undefined) => {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

type DocumentsUploaderProps = {
  existing?: PartnerDocument[];
  staged: File[];
  onStagedChange: (files: File[]) => void;
};

export function DocumentsUploader({
  existing = [],
  staged,
  onStagedChange,
}: DocumentsUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    if (picked.length === 0) return;
    onStagedChange([...staged, ...picked]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeStaged = (idx: number) => {
    onStagedChange(staged.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Supporting documents (optional)</p>
          <p className="text-xs text-muted-foreground">
            Upload business permits, IDs, certifications, etc.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          Add files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFiles}
        />
      </div>

      <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Document upload to storage isn't wired yet — staged files are listed
        below for review but won't be saved until the API endpoint is ready.
      </div>

      {existing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Already attached
          </p>
          <ul className="divide-y rounded-md border bg-background">
            {existing.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <FileText className="size-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      doc.documentType,
                      doc.mimeType,
                      formatBytes(doc.sizeBytes),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                {doc.publicUrl && (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    title="Open document"
                  >
                    <a
                      href={doc.publicUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <ExternalLink />
                      <span className="sr-only">Open</span>
                    </a>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {staged.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Staged ({staged.length})
          </p>
          <ul className="divide-y rounded-md border bg-background">
            {staged.map((file, idx) => (
              <li
                key={`${file.name}-${idx}`}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <FileText className="size-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[file.type || 'unknown', formatBytes(file.size)]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStaged(idx)}
                  title="Remove"
                >
                  <Trash2 />
                  <span className="sr-only">Remove</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {existing.length === 0 && staged.length === 0 && (
        <p className="text-sm text-muted-foreground italic py-2">
          No documents.
        </p>
      )}
    </div>
  );
}

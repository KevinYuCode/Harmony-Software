import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@harmony/ui/components/table'
import { Button } from '@harmony/ui/components/button'
import { FileText, MoreHorizontal } from 'lucide-react'

export interface DocumentTag {
  label: string
  color: string
}

export interface DocumentItem {
  id: string
  name: string
  dateModified: Date
  size: number
  tag?: DocumentTag
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(1)} MB`
  }
  return `${(bytes / 1_000).toFixed(1)} KB`
}

function formatDate(date: Date): string {
  const month = date.toLocaleString('en-US', { month: 'short' })
  const day = date.getDate()
  const time = date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${month} ${day}, ${time}`
}

interface DocumentTableProps {
  documents: DocumentItem[]
  onAction?: (document: DocumentItem) => void
}

export function DocumentTable({ documents, onAction }: DocumentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[45%]">Name</TableHead>
          <TableHead>Date Modified</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
              No documents
            </TableCell>
          </TableRow>
        ) : (
          documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 text-muted-foreground">
                    <FileText className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <span className="truncate max-w-[500px]" title={doc.name}>
                    {doc.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(doc.dateModified)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatFileSize(doc.size)}
              </TableCell>
              <TableCell>
                {doc.tag ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: doc.tag.color }}
                    />
                    {doc.tag.label}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm italic">None</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onAction?.(doc)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

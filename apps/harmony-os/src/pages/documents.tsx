import { Layout } from '../components/layout'
import { DocumentTable, type DocumentItem } from '../components/document-table'

const sampleDocuments: DocumentItem[] = [
  {
    id: '1',
    name: 'Employment Standards Act, 2000, S.O. 2000, c. 41 _ ontario.ca',
    dateModified: new Date('2025-03-27T10:37:00'),
    size: 3_700_000,
    tag: { label: 'Statutes', color: '#ef4444' },
  },
  {
    id: '2',
    name: 'James v Hollypark Organization Inc.pdf',
    dateModified: new Date('2025-03-27T10:37:00'),
    size: 220_400,
    tag: { label: 'Case Law', color: '#f59e0b' },
  },
  {
    id: '3',
    name: 'Shore v Ladner Downs.pdf',
    dateModified: new Date('2025-03-27T10:37:00'),
    size: 174_800,
    tag: { label: 'Case Law', color: '#f59e0b' },
  },
  {
    id: '4',
    name: 'BOARD RESOLUTION (STANDALONE).docx',
    dateModified: new Date('2025-03-25T15:13:00'),
    size: 6_900,
  },
  {
    id: '5',
    name: 'Tagg Industries v. Rieder, 2018 ONSC 5727 (CanLII).pdf',
    dateModified: new Date('2025-03-24T23:25:00'),
    size: 244_400,
  },
  {
    id: '6',
    name: 'Doyle v. London Life Ins. Co., 1985 CanLII 301 (BC CA).pdf',
    dateModified: new Date('2025-03-24T23:25:00'),
    size: 43_700,
  },
]

export function DocumentsPage() {
  return (
    <Layout
      title="Documents"
      description="Browse reference materials and compliance resources."
    >
      <div>
        <div className="rounded-lg border border-border bg-card">
          <DocumentTable
            documents={sampleDocuments}
            onAction={(doc) => alert(`Action on: ${doc.name}`)}
          />
        </div>
      </div>
    </Layout>
  )
}

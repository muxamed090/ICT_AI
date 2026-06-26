"use client"

import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import SearchBar from './SearchBar'

// ----- Types -----

export interface DataTableColumn<T> {
  key: string
  header: string
  sortable?: boolean
  searchable?: boolean
  render?: (row: T) => React.ReactNode
  accessor?: (row: T) => string | number
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  searchPlaceholder?: string
  pageSize?: number
  toolbar?: React.ReactNode
  emptyMessage?: string
  rowKey: (row: T) => string
}

// ----- Helpers -----

function getAccessorValue<T>(row: T, col: DataTableColumn<T>): string | number {
  if (col.accessor) return col.accessor(row)
  const val = (row as Record<string, unknown>)[col.key]
  if (val === null || val === undefined) return ''
  return String(val)
}

// ----- Component -----

export default function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Search…',
  pageSize = 10,
  toolbar,
  emptyMessage = 'No data found.',
  rowKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)

  // Searchable columns
  const searchableCols = columns.filter((c) => c.searchable)

  // Filter
  const filtered = useMemo(() => {
    if (!search || searchableCols.length === 0) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      searchableCols.some((col) => String(getAccessorValue(row, col)).toLowerCase().includes(q))
    )
  }, [data, search, searchableCols])

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const col = columns.find((c) => c.key === sortKey)
    if (!col) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = getAccessorValue(a, col)
      const bVal = getAccessorValue(b, col)
      let cmp = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal
      } else {
        cmp = String(aVal).localeCompare(String(bVal))
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir, columns])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paginated = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  const handleSearch = (v: string) => {
    setSearch(v)
    setPage(0)
  }

  return (
    <div className="space-y-3">
      {/* Toolbar row */}
      <div className="flex flex-wrap gap-2 items-center">
        {searchableCols.length > 0 && (
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            className="flex-1 min-w-[160px]"
          />
        )}
        {toolbar}
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05] text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`py-2.5 pr-3 ${col.sortable ? 'cursor-pointer hover:text-white transition-colors select-none' : ''}`}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <span className="flex items-center gap-0.5">
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc'
                          ? <ChevronUp className="h-2.5 w-2.5" />
                          : <ChevronDown className="h-2.5 w-2.5" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {paginated.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-white/[0.01] transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 pr-3">
                      {col.render ? col.render(row) : String(getAccessorValue(row, col))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer: count + pagination */}
      <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-1">
        <span>
          {sorted.length} result{sorted.length !== 1 ? 's' : ''}
          {search && ` (filtered from ${data.length})`}
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="p-1 rounded hover:bg-white/[0.05] disabled:opacity-30 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <span className="px-1.5">
              {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="p-1 rounded hover:bg-white/[0.05] disabled:opacity-30 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

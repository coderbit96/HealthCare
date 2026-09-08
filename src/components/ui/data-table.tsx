"use client";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search as SearchIcon } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { EmptyState, Skeleton } from "./feedback";
import { Input, Select } from "./form";

export type Column<T> = {
  key: string;
  header: string;
  /** Cell renderer. Falls back to the raw `sortValue` when omitted. */
  render?: (row: T) => ReactNode;
  /** Returning a value here makes the column sortable. */
  sortValue?: (row: T) => string | number;
  /** Hidden below `md` so mobile keeps only the essential columns. */
  secondary?: boolean;
  align?: "left" | "right";
};

export type Filter = { key: string; label: string; options: { value: string; label: string }[] };

export function DataTable<T>({
  rows, columns, loading, getRowId, searchable = true, searchPlaceholder = "Search…", searchKeys, filters, pageSize = 10,
  rowActions, bulkActions, emptyMessage = "Nothing to show yet.", caption,
}: {
  rows: T[] | undefined;
  columns: Column<T>[];
  loading?: boolean;
  getRowId: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (row: T) => string;
  filters?: Filter[];
  pageSize?: number;
  rowActions?: (row: T) => ReactNode;
  bulkActions?: (selectedIds: string[], clear: () => void) => ReactNode;
  emptyMessage?: string;
  caption: string;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" }>();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  // §40: debounce search so filtering doesn't run on every keystroke. Resetting the page
  // happens in the change handlers rather than an effect, to avoid a cascading re-render.
  useEffect(() => { const timer = setTimeout(() => { setDebounced(query); setPage(1); }, 250); return () => clearTimeout(timer); }, [query]);

  const filtered = useMemo(() => {
    let result = rows ?? [];
    if (debounced && searchKeys) {
      const needle = debounced.toLowerCase();
      result = result.filter(row => searchKeys(row).toLowerCase().includes(needle));
    }
    for (const [key, value] of Object.entries(active)) {
      if (!value) continue;
      const column = columns.find(c => c.key === key);
      if (column?.sortValue) result = result.filter(row => String(column.sortValue!(row)) === value);
    }
    if (sort) {
      const column = columns.find(c => c.key === sort.key);
      if (column?.sortValue) {
        result = [...result].sort((a, b) => {
          const left = column.sortValue!(a), right = column.sortValue!(b);
          const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
          return sort.direction === "asc" ? comparison : -comparison;
        });
      }
    }
    return result;
  }, [rows, debounced, searchKeys, active, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pageIds = paged.map(getRowId);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every(id => selected.includes(id));
  const clearSelection = () => setSelected([]);

  const toggleSort = (key: string) => { setPage(1); setSort(current => current?.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }); };

  return (
    <div className="grid gap-4">
      {(searchable || filters?.length) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {searchable && searchKeys && (
            <div className="relative flex-1">
              <SearchIcon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
              <Input aria-label={`Search ${caption}`} className="pl-10" placeholder={searchPlaceholder} value={query} onChange={event => setQuery(event.target.value)} />
            </div>
          )}
          {filters?.map(filter => (
            <Select key={filter.key} aria-label={filter.label} className="sm:w-48" value={active[filter.key] ?? ""} onChange={event => { setPage(1); setActive({ ...active, [filter.key]: event.target.value }); }}>
              <option value="">{filter.label}: All</option>
              {filter.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          ))}
        </div>
      )}

      {bulkActions && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-brand-soft px-4 py-2.5">
          <span className="text-sm font-semibold text-brand-strong">{selected.length} selected</span>
          <div className="ml-auto flex gap-2">{bulkActions(selected, clearSelection)}</div>
        </div>
      )}

      <div className="overflow-x-auto rounded-panel border border-line bg-surface">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line text-left">
              {bulkActions && (
                <th scope="col" className="w-10 px-4 py-3">
                  <input type="checkbox" aria-label="Select all rows on this page" className="size-4 accent-brand" checked={allOnPageSelected}
                    onChange={event => setSelected(event.target.checked ? [...new Set([...selected, ...pageIds])] : selected.filter(id => !pageIds.includes(id)))} />
                </th>
              )}
              {columns.map(column => (
                <th key={column.key} scope="col" aria-sort={sort?.key === column.key ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
                  className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle", column.align === "right" && "text-right", column.secondary && "hidden md:table-cell")}>
                  {column.sortValue ? (
                    <button onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1 transition hover:text-ink">
                      {column.header}
                      {sort?.key === column.key ? (sort.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUp size={13} className="opacity-25" />}
                    </button>
                  ) : column.header}
                </th>
              ))}
              {rowActions && <th scope="col" className="w-16 px-4 py-3"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {loading || !rows ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b border-line last:border-0">
                  {bulkActions && <td className="px-4 py-3.5"><Skeleton className="size-4" /></td>}
                  {columns.map(column => <td key={column.key} className={cn("px-4 py-3.5", column.secondary && "hidden md:table-cell")}><Skeleton className="h-4 w-24" /></td>)}
                  {rowActions && <td className="px-4 py-3.5"><Skeleton className="h-4 w-8" /></td>}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr><td colSpan={columns.length + (bulkActions ? 1 : 0) + (rowActions ? 1 : 0)}><EmptyState message={filtered.length === 0 && (debounced || Object.values(active).some(Boolean)) ? "No results match your search or filters." : emptyMessage} /></td></tr>
            ) : paged.map(row => {
              const id = getRowId(row);
              return (
                <tr key={id} className="border-b border-line transition last:border-0 hover:bg-canvas">
                  {bulkActions && (
                    <td className="px-4 py-3.5">
                      <input type="checkbox" aria-label={`Select row ${id}`} className="size-4 accent-brand" checked={selected.includes(id)}
                        onChange={event => setSelected(event.target.checked ? [...selected, id] : selected.filter(item => item !== id))} />
                    </td>
                  )}
                  {columns.map(column => (
                    <td key={column.key} className={cn("px-4 py-3.5 text-ink", column.align === "right" && "text-right", column.secondary && "hidden md:table-cell")}>
                      {column.render ? column.render(row) : String(column.sortValue?.(row) ?? "")}
                    </td>
                  ))}
                  {rowActions && <td className="px-4 py-3.5 text-right">{rowActions(row)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows && filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-ink-muted">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}><ChevronLeft size={15} />Previous</Button>
            <span className="text-sm font-medium text-ink-muted" aria-live="polite">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next<ChevronRight size={15} /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

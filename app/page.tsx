"use client"

import * as React from "react"
import * as XLSX from "xlsx"

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function Home() {
  const [headers, setHeaders] = React.useState<string[]>([])
  const [rows, setRows] = React.useState<Array<Array<string | number>>>([])
  const [query, setQuery] = React.useState("")
  const [fileName, setFileName] = React.useState("")

  const handleFile = async (file: File) => {
    if (!file) return
    setFileName(file.name)

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })
    const firstSheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[firstSheetName]

    // Get a 2D array; defval keeps empty cells as ""
    const data: Array<Array<string | number>> = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    }) as Array<Array<string | number>>

    if (!data || data.length === 0) {
      setHeaders([])
      setRows([])
      return
    }

    // Use first row as headers; fallback to generic names if needed
    const firstRow = data[0] || []
    const inferredHeaders = firstRow.map((v, i) => (String(v || "").trim() ? String(v) : `Column ${i + 1}`))

    // Remaining rows are data
    const bodyRows = data.slice(1)
    // Normalize row lengths to headers length
    const normalizedRows = bodyRows.map(r => {
      const next = [...r]
      if (next.length < inferredHeaders.length) {
        next.length = inferredHeaders.length
      }
      return next.map(c => (c === undefined || c === null ? "" : c))
    })

    setHeaders(inferredHeaders)
    setRows(normalizedRows)
  }

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0]
    if (f) void handleFile(f)
  }

  const filtered = React.useMemo(() => {
    if (!query.trim()) return rows
    const q = query.toLowerCase()
    return rows.filter(row => row.some(cell => String(cell ?? "").toLowerCase().includes(q)))
  }, [rows, query])

  // Highlight matching query text within cell content
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const renderHighlighted = React.useCallback(
    (text: string) => {
      if (!query.trim()) return text
      const pattern = new RegExp(`(${escapeRegExp(query)})`, "gi")
      const parts = text.split(pattern)
      return parts.map((part, idx) =>
        pattern.test(part) ? (
          <mark key={idx} className="bg-yellow-300 text-black px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        )
      )
    },
    [query]
  )

  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={onInputChange}
          className="border border-blue-300 rounded px-2 py-1 bg-white text-blue-900 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <input
          className="border border-yellow-400 rounded px-2 py-1 w-full sm:w-64 bg-yellow-100 placeholder:text-yellow-700/70 focus:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Search across all cells"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setQuery("")}
          className="px-3 py-1 rounded border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-400 active:bg-rose-200"
        >
          Clear
        </button>
      </div>

      <Table className="border border-gray-300 rounded-md overflow-hidden shadow-sm">
        {fileName ? (
          <TableCaption>
            {fileName} — {filtered.length} row{filtered.length === 1 ? "" : "s"}
          </TableCaption>
        ) : (
          <TableCaption>Upload an .xlsx file to display its contents</TableCaption>
        )}
        <TableHeader className="bg-blue-50">
          <TableRow className="bg-blue-50">
            {headers.map((h, i) => (
              <TableHead key={i} className="border border-blue-200 bg-blue-50 text-blue-900">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r, ri) => (
            <TableRow
              key={ri}
              className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              {headers.map((_, ci) => (
                <TableCell key={ci} className="border border-gray-200">
                  {renderHighlighted(String(r[ci] ?? ""))}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {headers.length > 0 && filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={headers.length} className="text-center text-gray-600">
                No matching rows
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

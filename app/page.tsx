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

  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={onInputChange}
        />
        <input
          className="border rounded px-2 py-1 w-full sm:w-64"
          placeholder="Search across all cells"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Table>
        {fileName ? (
          <TableCaption>
            {fileName} — {filtered.length} row{filtered.length === 1 ? "" : "s"}
          </TableCaption>
        ) : (
          <TableCaption>Upload an .xlsx file to display its contents</TableCaption>
        )}
        <TableHeader>
          <TableRow>
            {headers.map((h, i) => (
              <TableHead key={i}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r, ri) => (
            <TableRow key={ri}>
              {headers.map((_, ci) => (
                <TableCell key={ci}>{String(r[ci] ?? "")}</TableCell>
              ))}
            </TableRow>
          ))}
          {headers.length > 0 && filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={headers.length}>No matching rows</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

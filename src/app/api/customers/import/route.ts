export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { supabase, now } from '@/lib/supabase'
import * as XLSX from 'xlsx'

// Allowed tag values (Turkish)
const ALLOWED_TAGS = [
  'Otel',
  'Restoran',
  'Hastane',
  'Klinik',
  'Villa',
  'Spor Kulübü',
  'Yurt',
  'Diğer',
] as const

type AllowedTag = (typeof ALLOWED_TAGS)[number]

// Column mapping: Turkish Excel headers → Customer fields
const COLUMN_MAP: Record<string, string> = {
  Ad: 'name',
  Telefon: 'phone',
  Adres: 'address',
  Etiket: 'tag',
  Notlar: 'notes',
}

interface ImportError {
  row: number
  message: string
}

// POST /api/customers/import - Import customers from Excel file
export async function POST(request: NextRequest) {
  try {
    // --- 1. Get the uploaded file from FormData ---
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Lütfen bir Excel dosyası yükleyin' },
        { status: 400 }
      )
    }

    // Validate file extension
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Desteklenmeyen dosya formatı. Lütfen .xlsx, .xls veya .csv dosyası yükleyin' },
        { status: 400 }
      )
    }

    // --- 2. Parse the Excel file ---
    const bytes = await file.arrayBuffer()
    const workbook = XLSX.read(bytes, { type: 'array' })

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { error: 'Excel dosyasında sayfa bulunamadı' },
        { status: 400 }
      )
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Excel dosyası boş veya veri içermiyor' },
        { status: 400 }
      )
    }

    // --- 3. Map Turkish headers to fields ---
    const mappedRows = rows.map((row) => {
      const mapped: Record<string, unknown> = {}
      for (const [header, field] of Object.entries(COLUMN_MAP)) {
        if (row[header] !== undefined) {
          mapped[field] = row[header]
        }
      }
      return mapped
    })

    // --- 4. Fetch existing customers for duplicate check ---
    const { data: existingCustomers, error: fetchError } = await supabase
      .from('Customer')
      .select('name')

    if (fetchError) {
      console.error('Error fetching existing customers:', fetchError)
      return NextResponse.json(
        { error: 'Müşteri içe aktarılırken hata oluştu' },
        { status: 500 }
      )
    }

    const existingNameSet = new Set(
      (existingCustomers ?? []).map((c: any) => c.name.toLowerCase().trim())
    )

    // --- 5. Validate rows ---
    const errors: ImportError[] = []
    const validRows: { id: string; name: string; phone: string | null; address: string | null; tag: string | null; notes: string | null }[] = []
    let skipped = 0

    for (let i = 0; i < mappedRows.length; i++) {
      const rowNum = i + 2 // Row number in Excel (1-indexed, +1 for header)
      const row = mappedRows[i]

      // Validate: "Ad" (name) is required
      const rawName = row.name
      if (!rawName || typeof rawName !== 'string' || rawName.trim() === '') {
        skipped++
        errors.push({
          row: rowNum,
          message: 'Müşteri adı (Ad) boş olamaz - satır atlandı',
        })
        continue
      }

      const name = rawName.trim()

      // Validate: tag (Etiket) against allowed values
      const rawTag = row.tag
      let tag: string | null = null
      if (rawTag !== undefined && rawTag !== null && String(rawTag).trim() !== '') {
        const tagStr = String(rawTag).trim()
        const matchedTag = ALLOWED_TAGS.find(
          (t) => t.toLowerCase() === tagStr.toLowerCase()
        )
        if (!matchedTag) {
          errors.push({
            row: rowNum,
            message: `Geçersiz etiket: "${tagStr}". İzin verilen değerler: ${ALLOWED_TAGS.join(', ')}`,
          })
          // Skip invalid tag but continue processing the row (set tag to null)
          tag = null
        } else {
          tag = matchedTag // Use the correctly-cased version
        }
      }

      // Validate: duplicate name (case-insensitive)
      if (existingNameSet.has(name.toLowerCase())) {
        skipped++
        errors.push({
          row: rowNum,
          message: `"${name}" adlı müşteri zaten mevcut - satır atlandı`,
        })
        continue
      }

      // Process phone
      const rawPhone = row.phone
      const phone = rawPhone !== undefined && rawPhone !== null && String(rawPhone).trim() !== ''
        ? String(rawPhone).trim()
        : null

      // Process address
      const rawAddress = row.address
      const address = rawAddress !== undefined && rawAddress !== null && String(rawAddress).trim() !== ''
        ? String(rawAddress).trim()
        : null

      // Process notes
      const rawNotes = row.notes
      const notes = rawNotes !== undefined && rawNotes !== null && String(rawNotes).trim() !== ''
        ? String(rawNotes).trim()
        : null

      // Add to valid rows with generated ID and track name for intra-batch duplicate check
      validRows.push({ id: crypto.randomUUID(), name, phone, address, tag, notes })
      existingNameSet.add(name.toLowerCase()) // Prevent duplicates within the same batch
    }

    // --- 6. Create all valid customers ---
    let imported = 0

    if (validRows.length > 0) {
      const { error: insertError } = await supabase
        .from('Customer')
        .insert(validRows.map((row) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          address: row.address,
          tag: row.tag,
          notes: row.notes,
          createdAt: now(),
          updatedAt: now(),
        })))

      if (insertError) {
        console.error('Error inserting customers:', insertError)
        return NextResponse.json(
          { error: 'Müşteri içe aktarılırken hata oluştu' },
          { status: 500 }
        )
      }

      imported = validRows.length
    }

    // --- 7. Return result ---
    return NextResponse.json({
      imported,
      skipped,
      errors,
    })
  } catch (error) {
    console.error('Error importing customers:', error)

    // Handle XLSX parsing errors
    if (error instanceof Error && error.message.includes('Unsupported')) {
      return NextResponse.json(
        { error: 'Desteklenmeyen dosya formatı' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Müşteri içe aktarılırken hata oluştu' },
      { status: 500 }
    )
  }
}

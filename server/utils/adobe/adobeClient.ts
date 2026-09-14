import { ServicePrincipalCredentials, PDFServices } from '@adobe/pdfservices-node-sdk'

let pdfServicesInstance: PDFServices | null = null

/**
 * Mengambil atau menginisialisasi instance resmi Adobe PDFServices SDK.
 * Memvalidasi keberadaan ADOBE_CLIENT_ID dan ADOBE_CLIENT_SECRET.
 */
export const getAdobePdfServices = (): PDFServices => {
  const config = useRuntimeConfig()
  const clientId = (config.adobeClientId || process.env.ADOBE_CLIENT_ID || '').trim()
  const clientSecret = (config.adobeClientSecret || process.env.ADOBE_CLIENT_SECRET || '').trim()

  if (!clientId || !clientSecret) {
    throw new Error(
      'Kredensial Adobe PDF Extract API belum dikonfigurasi. Harap isi ADOBE_CLIENT_ID dan ADOBE_CLIENT_SECRET pada berkas .env.'
    )
  }

  // Jika belum diinisialisasi, buat instance baru dengan ServicePrincipalCredentials
  if (!pdfServicesInstance) {
    const credentials = new ServicePrincipalCredentials({
      clientId,
      clientSecret
    })

    pdfServicesInstance = new PDFServices({ credentials })
  }

  return pdfServicesInstance
}

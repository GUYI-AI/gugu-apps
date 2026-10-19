// PDF.js, set up once for a page: the legacy build in the bundle (vendor/pdfjs, from vendor/build.mjs), its worker
// beside it, CMaps and standard fonts from the bundle (no CDN: script-src 'self'). No eval and no WebAssembly — the
// App's CSP allows neither — so fonts are drawn without compiled paths and JPEG 2000 uses the JS decoder.
import * as pdfjs from '../vendor/pdfjs/pdf.min.mjs'

const here = (path) => new URL(`../vendor/pdfjs/${path}`, import.meta.url).href
pdfjs.GlobalWorkerOptions.workerSrc = here('pdf.worker.min.mjs')

export { pdfjs }

/** Opens a PDF's bytes. */
export function openPdf(bytes) {
  return pdfjs.getDocument({
    data: bytes,
    isEvalSupported: false,
    useWasm: false,
    wasmUrl: here('wasm/'),
    cMapUrl: here('cmaps/'),
    cMapPacked: true,
    standardFontDataUrl: here('standard_fonts/'),
  }).promise
}

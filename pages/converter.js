import { useState, useCallback, useRef, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Navbar from '../components/Navbar'
import { convertImageToDotArt, loadImageFromFile, detectSubjectBounds } from '../lib/dotArt'
import { Sparkles, Copy, Check, Upload, Image as ImageIcon } from 'lucide-react'

export default function Converter() {
  const router = useRouter()
  const [image, setImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [lines, setLines] = useState([])
  const [dims, setDims] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState(null) // 'instagram', 'youtube', 'whatsapp'

  // Settings
  const [invert, setInvert] = useState(false)
  const [minInk, setMinInk] = useState(true)
  const [outline, setOutline] = useState(false)
  const [zoom, setZoom] = useState(6.4)
  const [clipboardCols, setClipboardCols] = useState(60)
  const [fitScreen, setFitScreen] = useState(true)
  const [containerWidth, setContainerWidth] = useState(400)

  // Crop states
  const [cropLeft, setCropLeft] = useState(0)
  const [cropRight, setCropRight] = useState(0)
  const [cropTop, setCropTop] = useState(0)
  const [cropBottom, setCropBottom] = useState(0)

  const fileInputRef = useRef(null)
  const previewContainerRef = useRef(null)

  useEffect(() => {
    if (!previewContainerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    resizeObserver.observe(previewContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Braille character width is about 0.6 * font-size
  const autoZoom = dims ? Math.max(0.5, Math.min(14, (containerWidth - 40) / (dims.cols * 0.6))) : 6.4

  const handleClipboardColsChange = (val) => {
    setClipboardCols(val)
    if (image && selectedFormat === 'clipboard') {
      runConversion(image, 'clipboard', { clipboardCols: val }, false)
    }
  }

  const runConversion = useCallback((img, format, customOpts = {}, shouldCopy = false) => {
    if (!img || !format) return
    setBusy(true)
    
    // Instagram: 24 cols (48 dots) - adjusted for small screen mobile comments
    // YouTube: 27 cols (54 dots)
    // Instagram DM: 22 cols (44 dots)
    // WhatsApp: 21 cols (42 dots)
    // Clipboard: Resolution adjusted by slider
    const isClipboard = format === 'clipboard'
    const currentClipboardCols = customOpts.hasOwnProperty('clipboardCols') ? customOpts.clipboardCols : clipboardCols
    let cols = isClipboard
      ? currentClipboardCols
      : format === 'instagram'
        ? 24
        : format === 'youtube'
          ? 27
          : format === 'instagram_dm'
            ? 22
            : 21

    const finalOpts = {
      mode: 'braille',
      outputCols: cols,
      invert: customOpts.hasOwnProperty('invert') ? customOpts.invert : invert,
      minInk: customOpts.hasOwnProperty('minInk') ? customOpts.minInk : minInk,
      outline: customOpts.hasOwnProperty('outline') ? customOpts.outline : outline,
      contrast: 100, // High-quality Braille HD settings as the default
      brightness: 100,
      gamma: 3.0,
      threshold: 100,
      ditherAmount: 0.75,
      ditherMode: 'floyd-steinberg',
      unlimited: true,
      // Crop parameters
      cropLeft: customOpts.hasOwnProperty('cropLeft') ? customOpts.cropLeft : cropLeft,
      cropRight: customOpts.hasOwnProperty('cropRight') ? customOpts.cropRight : cropRight,
      cropTop: customOpts.hasOwnProperty('cropTop') ? customOpts.cropTop : cropTop,
      cropBottom: customOpts.hasOwnProperty('cropBottom') ? customOpts.cropBottom : cropBottom,
    }

    setTimeout(() => {
      const result = convertImageToDotArt(img, finalOpts)
      setLines(result.lines)
      setDims({ cols: result.cols, rows: result.rows })
      setBusy(false)
      
      // Only copy when explicitly requested by a button click
      if (shouldCopy) {
        const text = result.lines.join('\n')
        copyToClipboard(text)
      }
    }, 50)
  }, [invert, minInk, outline, clipboardCols, cropLeft, cropRight, cropTop, cropBottom])

  const copyToClipboard = async (textToCopy) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = textToCopy
        textArea.style.top = "0"
        textArea.style.left = "0"
        textArea.style.position = "fixed"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCopyBtnClick = () => {
    copyToClipboard(lines.join('\n'))
  }

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const img = await loadImageFromFile(file)
    setImage(img)
    setPreviewUrl(img.src)

    // Detect subject bounds automatically on upload
    const bounds = detectSubjectBounds(img)
    setCropLeft(bounds.cropLeft)
    setCropRight(bounds.cropRight)
    setCropTop(bounds.cropTop)
    setCropBottom(bounds.cropBottom)

    // Set a reasonable default clipboard column width based on image size
    const maxCols = Math.floor(img.width / 2)
    const defaultCols = Math.min(80, Math.max(30, maxCols))
    setClipboardCols(defaultCols)

    if (selectedFormat) {
      runConversion(img, selectedFormat, { 
        clipboardCols: defaultCols,
        cropLeft: bounds.cropLeft,
        cropRight: bounds.cropRight,
        cropTop: bounds.cropTop,
        cropBottom: bounds.cropBottom
      }, false) // Do not copy to clipboard on upload
    }
  }

  const handleFormatSelect = (format) => {
    setSelectedFormat(format)
    if (image) {
      runConversion(image, format, {}, true) // Copy to clipboard on format button click!
    }
  }

  const updateSetting = (key, value) => {
    const setters = {
      invert: setInvert,
      minInk: setMinInk,
      outline: setOutline,
    }
    if (setters[key]) {
      setters[key](value)
    }
    if (image && selectedFormat) {
      runConversion(image, selectedFormat, { [key]: value }, false) // Do not copy on setting change
    }
  }

  const onDrag = (e) => {
    e.preventDefault()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }

  return (
    <>
      <Head>
        <title>Dot Art Converter - Spialr</title>
        <meta name="description" content="Generate beautiful Unicode Braille dot art optimized for Instagram, YouTube, and WhatsApp comments." />
      </Head>

      <Navbar />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', minHeight: 'calc(100vh - 130px)' }}>
        {/* Back Button */}
        <div style={{ marginBottom: 24, textAlign: 'left' }}>
          <button 
            onClick={() => router.push('/')}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text-dim)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 0.2s var(--spring)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface3)';
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface2)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 20,
            background: 'var(--gradient-subtle)',
            border: '1px solid rgba(220, 39, 67, 0.3)',
            fontSize: 13,
            color: 'var(--accent)',
            marginBottom: 16,
            fontWeight: 500,
          }}>
            <Sparkles size={14} /> Unicode Braille Dot Art Generator
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}>
            Image to <span className="gradient-text">Dot Art</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
            Convert any image into a text-based Dithered dot representation optimized for comments and DMs.
          </p>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 30 }}>
          {/* Dropzone */}
          <div 
            onDragEnter={onDrag}
            onDragOver={onDrag}
            onDragLeave={onDrag}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: dragActive ? '2px dashed var(--accent)' : '2px dashed var(--border-bright)',
              borderRadius: '16px',
              padding: '32px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragActive ? 'var(--surface2)' : 'linear-gradient(135deg, var(--surface) 0%, rgba(220, 39, 67, 0.01) 100%)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.25s var(--spring)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              maxWidth: 400,
              margin: '0 auto',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = dragActive ? 'var(--accent)' : 'var(--border-bright)'}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {previewUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{
                  position: 'relative',
                  width: 160,
                  height: 160,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  border: '3px solid white',
                  background: 'var(--surface2)',
                }}>
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  {/* Left crop boundary overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${cropLeft * 100}%`,
                    background: 'rgba(0, 0, 0, 0.55)',
                    pointerEvents: 'none',
                    borderRight: '1px dashed var(--accent)',
                  }} />
                  {/* Right crop boundary overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: `${cropRight * 100}%`,
                    background: 'rgba(0, 0, 0, 0.55)',
                    pointerEvents: 'none',
                    borderLeft: '1px dashed var(--accent)',
                  }} />
                  {/* Top crop boundary overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: `${cropLeft * 100}%`,
                    right: `${cropRight * 100}%`,
                    height: `${cropTop * 100}%`,
                    background: 'rgba(0, 0, 0, 0.55)',
                    pointerEvents: 'none',
                    borderBottom: '1px dashed var(--accent)',
                  }} />
                  {/* Bottom crop boundary overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: `${cropLeft * 100}%`,
                    right: `${cropRight * 100}%`,
                    height: `${cropBottom * 100}%`,
                    background: 'rgba(0, 0, 0, 0.55)',
                    pointerEvents: 'none',
                    borderTop: '1px dashed var(--accent)',
                  }} />
                </div>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  transition: 'all 0.2s',
                }}>
                  Replace image
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  background: 'var(--gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 6px 16px rgba(220, 39, 67, 0.2)',
                }}>
                  <Upload size={22} />
                </div>
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Upload image</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Drag & drop here or click to browse</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.7, marginTop: 8 }}>Supports JPG, PNG, WEBP</div>
                </div>
              </>
            )}
          </div>



          {/* Format Copy Buttons */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
              Choose Format & Copy
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}>
              <button 
                className={`btn ${selectedFormat === 'instagram' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleFormatSelect('instagram')}
                disabled={!image}
                style={{ width: '100%', padding: '14px 20px', borderRadius: 12 }}
              >
                Copy to Instagram
              </button>
              <button 
                className={`btn ${selectedFormat === 'youtube' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleFormatSelect('youtube')}
                disabled={!image}
                style={{ width: '100%', padding: '14px 20px', borderRadius: 12 }}
              >
                Copy to YouTube
              </button>
              <button 
                className={`btn ${selectedFormat === 'whatsapp' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleFormatSelect('whatsapp')}
                disabled={!image}
                style={{ width: '100%', padding: '14px 20px', borderRadius: 12 }}
              >
                Copy to WhatsApp
              </button>
              <button 
                className={`btn ${selectedFormat === 'instagram_dm' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleFormatSelect('instagram_dm')}
                disabled={!image}
                style={{ width: '100%', padding: '14px 20px', borderRadius: 12 }}
              >
                Copy to Instagram DM
              </button>
              <button 
                className={`btn ${selectedFormat === 'clipboard' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleFormatSelect('clipboard')}
                disabled={!image}
                style={{ width: '100%', padding: '14px 20px', borderRadius: 12 }}
              >
                Copy to Clipboard
              </button>
            </div>
            {!image && (
              <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8, textAlign: 'center', fontWeight: 500 }}>
                * Upload an image first to enable format copying
              </div>
            )}
            {selectedFormat === 'clipboard' && image && (
              <div className="fade-in" style={{
                marginTop: 20,
                padding: 16,
                borderRadius: 12,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    📋 Clipboard Resolution (Columns): {clipboardCols}
                  </span>
                </div>
                <input 
                  type="range"
                  min={16}
                  max={Math.max(100, Math.floor(image.width / 2))}
                  step={2}
                  value={clipboardCols}
                  onChange={(e) => handleClipboardColsChange(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  Drag to scale the copied image size. More columns equal more detail but might wrap on smaller screens.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Display generated dot art */}
        {selectedFormat && image && (
          <div className="fade-in card" style={{ padding: 20, background: '#12140f', color: '#eef0ea', border: '1px solid #23302a' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              borderBottom: '1px solid #23302a',
              paddingBottom: 12,
            }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selectedFormat === 'instagram' 
                    ? 'Instagram Format' 
                    : selectedFormat === 'youtube' 
                      ? 'YouTube Format' 
                      : selectedFormat === 'instagram_dm' 
                        ? 'Instagram DM Format' 
                        : selectedFormat === 'clipboard'
                          ? 'Clipboard (Full Resolution) Format'
                          : 'WhatsApp Format'}
                </span>
                {dims && (
                  <div style={{ fontSize: 11, color: '#8a8f80', marginTop: 2 }}>
                    Resolution: {dims.cols} × {dims.rows} characters
                  </div>
                )}
              </div>
              <button 
                onClick={handleCopyBtnClick}
                style={{
                  background: copied ? '#49ffa3' : 'transparent',
                  border: '1px solid #1f7a52',
                  color: copied ? '#0b0d0e' : '#49ffa3',
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Art'}
              </button>
            </div>

            {/* Braille Display Screen */}
            <div 
              ref={previewContainerRef}
              style={{
                position: 'relative',
                overflow: 'auto',
                background: '#eef0ea',
                color: '#12140f',
                padding: '16px 20px',
                borderRadius: 8,
                minHeight: 200,
                display: 'block',
                textAlign: 'center',
              }}
            >
              {busy ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 168 }}>
                  <div className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: '#12140f' }} />
                </div>
              ) : (
                <pre style={{
                  fontFamily: 'monospace',
                  fontSize: `${fitScreen ? autoZoom : zoom}px`,
                  lineHeight: 1,
                  letterSpacing: 0,
                  whiteSpace: 'pre',
                  margin: '0 auto',
                  display: 'inline-block',
                  textAlign: 'left',
                }}>{lines.join('\n')}</pre>
              )}
            </div>

            {/* Quick settings below output */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              marginTop: 16,
              borderTop: '1px solid #23302a',
              paddingTop: 16,
              fontSize: 13,
              color: '#8a8f80',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={invert} onChange={(e) => updateSetting('invert', e.target.checked)} style={{ accentColor: '#49ffa3' }} />
                <span>Invert (light background)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={minInk} onChange={(e) => updateSetting('minInk', e.target.checked)} style={{ accentColor: '#49ffa3' }} />
                <span>Fix alignment spacing</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={outline} onChange={(e) => updateSetting('outline', e.target.checked)} style={{ accentColor: '#49ffa3' }} />
                <span>Outline Mode (Line Art)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={fitScreen} onChange={(e) => setFitScreen(e.target.checked)} style={{ accentColor: '#49ffa3' }} />
                <span>Auto-fit to screen</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', opacity: fitScreen ? 0.6 : 1 }}>
                <span>Zoom:</span>
                <input 
                  type="range" 
                  min={0.5} 
                  max={20} 
                  step={0.1}
                  value={fitScreen ? autoZoom : zoom} 
                  disabled={fitScreen}
                  onChange={(e) => setZoom(parseFloat(e.target.value))} 
                  style={{ accentColor: '#49ffa3', width: 80, cursor: fitScreen ? 'not-allowed' : 'pointer' }} 
                />
                <span>{(fitScreen ? autoZoom : zoom).toFixed(1)}px</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

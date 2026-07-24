import { Camera, Upload, PencilLine, ChevronRight } from 'lucide-react'
import { useStore } from '../state/store'

export function AddSheet() {
  const { addSheet, closeAdd, startScan, startUpload, startManual } = useStore()
  if (!addSheet) return null

  return (
    <div className="scrim" onClick={closeAdd}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__title">Add to record</div>
        <div className="sheet__opts">
          <button className="choice" onClick={startScan}>
            <span className="choice__icon">
              <Camera size={21} />
            </span>
            <span style={{ flex: 1 }}>
              <span className="choice__title" style={{ display: 'block' }}>
                Capture a document
              </span>
              <span className="choice__sub" style={{ display: 'block' }}>
                Photograph a report, prescription or scan — we read the details for you.
              </span>
            </span>
            <ChevronRight size={18} className="chev" />
          </button>

          <label className="choice">
            <span className="choice__icon">
              <Upload size={20} />
            </span>
            <span style={{ flex: 1 }}>
              <span className="choice__title" style={{ display: 'block' }}>
                Upload a file
              </span>
              <span className="choice__sub" style={{ display: 'block' }}>
                Choose a PDF or photo from this device — we read the details for you.
              </span>
            </span>
            <ChevronRight size={18} className="chev" />
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={startUpload}
              style={{ display: 'none' }}
            />
          </label>

          <button className="choice" onClick={startManual}>
            <span className="choice__icon choice__icon--ghost">
              <PencilLine size={20} />
            </span>
            <span style={{ flex: 1 }}>
              <span className="choice__title" style={{ display: 'block' }}>
                Add a record manually
              </span>
              <span className="choice__sub" style={{ display: 'block' }}>
                Enter a medication, result or visit by hand.
              </span>
            </span>
            <ChevronRight size={18} className="chev" />
          </button>
        </div>
        <button className="sheet__cancel" onClick={closeAdd}>
          Cancel
        </button>
      </div>
    </div>
  )
}

import { useIronLog } from '../context/IronLogContext'

export function Modal() {
  const { modal, closeModal, confirmModal } = useIronLog()
  return (
    <div
      className={`modal-overlay${modal.open ? ' open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal()
      }}
      role="presentation"
    >
      <div className="modal">
        <div className="modal-title">{modal.title}</div>
        <div className="modal-text">{modal.text}</div>
        <div className="modal-btns">
          <button type="button" className="modal-btn" onClick={closeModal}>
            CANCEL
          </button>
          <button type="button" className="modal-btn primary" onClick={confirmModal}>
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  )
}

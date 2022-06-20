import styles from "./Modal.module.css";

/**
 * @typedef {Object} ModalProps
 * @property {JSX.Element} children - The content of the modal.
 * @property {boolean} isOpen is the modal visible
 * @property {() => void} onClose - Callback to close the modal.
 * @param {ModalProps} { children, isOpen, onClose }
 * @returns {JSX.Element} The modal.
 */
export default function Modal({ isOpen, onClose, children }) {
  return (
    <>
      {isOpen && (
        <>
          <div className={styles.background} onClick={onClose} />
          <div className={styles["content-area"]}>{children}</div>
        </>
      )}
    </>
  );
}

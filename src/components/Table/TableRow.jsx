import styles from './Table.module.css'

export default function TableRow({ children }) {
  return (
    <div role="row" className={styles.row}>{children}</div>
  )
}

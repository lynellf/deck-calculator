import { concatStyles } from './common'
import styles from './Table.module.css'

export default function TableContainer({ children, className = '' }) {
  return (
    <div role="table" className={concatStyles(styles.table, className)}>
      {children}
    </div>
  )
}

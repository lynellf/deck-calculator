import styles from './Table.module.css'
import { concatStyles } from './common'

export default function TableCell({ children, className = '' }) {
  return (
    <div role="cell" className={concatStyles(styles.cell, className)}>
      {children}
    </div>
  )
}

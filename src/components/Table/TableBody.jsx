import styles from './Table.module.css'
import { concatStyles } from './common'

export default function TableBody({ children, className = '' }) {
  return (
    <div role="rowgroup" className={concatStyles(styles.body, className)}>
      {children}
    </div>
  )
}

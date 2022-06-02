import styles from './TableHead'
import { concatStyles } from './common'

export default function TableHead({ children, className = '' }) {
  return (
    <div role="rowgroup" className={concatStyles(styles.header, className)}>
      {children}
    </div>
  )
}

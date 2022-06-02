import styles from './Table.module.css'

export default function HeaderCell({ children }) {
  return (
    <div role="columnheader" className={styles['header-cell']}>{children}</div>
  )
}

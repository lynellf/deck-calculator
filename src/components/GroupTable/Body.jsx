import styles from './GroupTable.module.css'
import { Body as TableBody, Row, Cell } from '../Table'

export default function Body({
  data = [],
  probabilities = [],
  handleChange = console.log,
  otherGroup = { name: '', count: 0 },
  otherProbs = [],
  handleRemove = console.log
}) {
  return (
    <TableBody>
      {data.map((item, index) => (
        <Row key={index}>
          <Cell>
            <input
              placeholder={`Card Group ${index}`}
              type="text"
              className={styles['cell-input']}
              value={item.name}
              onChange={handleChange('name', index)}
            />
          </Cell>
          <Cell>
            <input
              type="number"
              className={styles['cell-input']}
              onChange={handleChange('count', index)}
              value={item?.count}
              min="0"
            />
          </Cell>

          {probabilities?.[index]?.map((prob, cellIndex) => (
            <Cell
              key={cellIndex}
              className={`${styles['flex-table__cell']} ${prob.rank === 2 ? styles['cell-color-2'] : ''
                }`}
            >
              {prob?.value ?? 0}
            </Cell>
          ))}
          <Cell>
            <span role="button" className={styles['btn-text']} onClick={handleRemove(item.name)}>
              ➖
            </span>
          </Cell>
        </Row>
      ))}
      <Row>
        <Cell>{otherGroup.name}</Cell>
        <Cell>{otherGroup.count}</Cell>
        {otherProbs.map((prob, index) => (
          <Cell
            key={index}
            className={`${prob.rank === 2 ? styles['cell-color-2'] : ''
              }`}
          >
            {prob?.value ?? 0}
          </Cell>
        ))}
        <Cell />
      </Row>
    </TableBody>
  )
}

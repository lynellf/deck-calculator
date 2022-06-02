import { Head as Header, Row, HeaderCell } from '../Table'
export default function Head({ headers }) {
  return (
    <Header>
      <Row>
        <HeaderCell>
          <span>Name</span>
        </HeaderCell>
        <HeaderCell>
          <span>Quantity</span>
        </HeaderCell>
        {headers.map((cellValue, i) => (
          <HeaderCell key={`${i}_${cellValue}`}>
            <span>{cellValue}</span>
          </HeaderCell>
        ))}
      </Row>
    </Header>
  )
}

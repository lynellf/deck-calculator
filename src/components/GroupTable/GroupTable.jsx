import Body from './Body'
import Head from './Head'
import { Table } from '../Table'

export default function FlexTable({
  headers,
  data,
  probabilities,
  handleChange,
  otherGroup,
  otherProbs,
  handleRemove
}) {
  return (
    <Table>
      <Head headers={headers ?? []} />
      <Body
        data={data ?? []}
        probabilities={probabilities}
        handleChange={handleChange}
        otherGroup={otherGroup}
        otherProbs={otherProbs}
        handleRemove={handleRemove}
      />
    </Table>
  )
}

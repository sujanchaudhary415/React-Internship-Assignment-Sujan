import { Component } from 'react'
import DataTableComponent from './Component/DataTableComponent'

type Props = {}

type State = {}

export default class App extends Component<Props, State> {
  state = {}

  render() {
    return (
      <div>
        <DataTableComponent/>
      </div>
    )
  }
}
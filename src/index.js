import React from './react';


class Todos extends React.Component {
  constructor(props) {
    super(props)
    this.state = { list: [], text: '' }
  }
  onChange = (event) => {
    this.setState({
      text: event.target.value
    })
  }
  handleClick = () => {
    let text = this.state.text
    this.setState({
      list: [...this.state.list, text], text: ''
    })
  }

  onDel = (index) => {
    this.setState({
      list: [...this.state.list.slice(0, index), ...this.state.list.slice(index + 1)]
    });
  }

  render() {
    let input = React.createElement('input', { onKeyup: this.onChange, value: this.state.text });
    let button = React.createElement('button', { onClick: this.handleClick }, '+')
    let lists = this.state.list.map((item, index) => React.createElement(
      'li',
      {},
      item,
      React.createElement('button', { onClick: () => this.onDel(index) }, 'X')
    ))


    return React.createElement('div', {}, input, button, React.createElement('ul', {}, ...lists))
  }
}

let element = React.createElement(Todos, { name: 'todos' })

React.render(element, document.getElementById('root'));


import React from './react';

// function sayHello() {
//   console.log(1111111)
// }

// let element = React.createElement(
//   'button',
//   { id: 'sayHello', style: { color: 'red', backgroundColor: 'green' }, onClick: sayHello },
//   'say', React.createElement('b', {}, 'hello')
// )

class Counter extends React.Component {
  constructor(props) {
    super(props)
    this.state = { number: 0 }
  }
  // componentWillMount() {
  //   console.log('Counter componentWillMount')
  // }
  // componentDidMount() {
  //   console.log('Counter componentDidMount')
  //   setInterval(() => {
  //     this.setState({ number: this.state.number + 1 })

  //   }, 1000);
  // }
  // shouldComponentUpdate(nextState, nextProps) {
  //   return true
  // }
  // componentDidUpdate() {
  //   console.log('Counter componentDidUpdate')

  // }
  increment = () => {
    this.setState({
      number: this.state.number + 1
    })
  }

  render() {
    // console.log('render')
    let p = React.createElement('p', {}, this.props.name, this.state.number)
    let button = React.createElement('button', { onClick: this.increment }, '+')
    return React.createElement(
      'div',
      { id: 'counter', style: { color: this.state.number % 2 === 0 ? 'red' : 'green', backgroundColor: this.state.number % 2 === 0 ? 'green' : 'red' } },
      p, button
    )
    // return this.state.number

  }
}

let element = React.createElement(Counter, { name: '计数器' })

React.render(element, document.getElementById('root'));


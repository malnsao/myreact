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
    this.state = { odd: true }
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({
        odd: !this.state.odd
      })
    }, 1000);

  }


  render() {
    if (this.state.odd) {
      return React.createElement(
        'ul',
        { key: 'wrapper' },
        React.createElement('li', { key: 'A' }, 'A'),
        React.createElement('li', { key: 'B' }, 'B'),
        React.createElement('li', { key: 'C' }, 'C'),
        React.createElement('li', { key: 'D' }, 'D'),
      )
    } else {
      return React.createElement(
        'ul',
        { key: 'wrapper' },
        React.createElement('span', { key: 'A' }, 'A1'),
        React.createElement('li', { key: 'C' }, 'C1'),
        React.createElement('li', { key: 'B' }, 'B1'),
        React.createElement('li', { key: 'E' }, 'E1'),
        React.createElement('li', { key: 'F' }, 'F1'),

      )
    }

  }
}

let element = React.createElement(Counter, { name: '计数器' })

React.render(element, document.getElementById('root'));


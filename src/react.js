import $ from 'jquery'
import { createUnit } from './unit'
import { createElement } from './element'
import { Component } from './component'


let React = {
    render,
    createElement,
    Component,
    rootIndex: 0
}

function render(element, container) {
    let unit = createUnit(element)
    let HTMLString = unit.getHTMLString(React.rootIndex)
    $(container).html(HTMLString)
    $(document).trigger('mounted')
}

export default React

import { Element } from './element'
import $ from 'jquery'
let diffQueue = [];
let updateDepth = 0
const types = {
    MOVE: 'MOVE',
    INSERT: 'INSERT',
    REMOVE: 'REMOVE'
}
class Unit {
    constructor(element) {
        this._currentElement = element
    }
    getHTMLString() { }
}

class TextUnit extends Unit {
    getHTMLString(reactid) {
        this._reactid = reactid
        return `<span data-reactid='${reactid}'>${this._currentElement}</span>`
    }
    update(nextElement) {
        if (this._currentElement !== nextElement) {
            this._currentElement = nextElement
            $(`[data-reactid="${this._reactid}"]`).html(this._currentElement)
        }

    }
}

class NativeUnit extends Unit {
    getHTMLString(reactid) {
        this._reactid = reactid
        let { type, props } = this._currentElement;
        let tagStart = `<${type} data-reactid="${this._reactid}"`;
        let childString = ''
        let tagEnd = `</${type}>`
        this._renderChildrenUnits = []
        for (const propName in props) {
            if (/^on[A-Z]/.test(propName)) {
                let eventName = propName.slice(2).toLowerCase()
                $(document).delegate(`[data-reactid="${this._reactid}"]`, `${eventName}.${this._reactid}`, props[propName])
            } else if (propName === 'style') {
                let styleObj = props[propName]
                let styles = Object.entries(styleObj).map(([attr, value]) => {
                    return `${attr.replace(/[A-Z]/g, (matched) => `-${matched.toLowerCase()}`)}:${value}`
                }).join(';')
                tagStart += (` style="${styles}" `)
            } else if (propName === 'className') {
                tagStart += (` class="${props[propName]}" `)
            } else if (propName === 'children') {
                let children = props[propName];
                // eslint-disable-next-line no-loop-func
                children.forEach((child, index) => {
                    let childUnit = createUnit(child)
                    childUnit._mountIndex = index
                    this._renderChildrenUnits.push(childUnit)
                    let childGetHTMLString = childUnit.getHTMLString(`${this._reactid}.${index}`)
                    childString += childGetHTMLString
                });
            } else {
                tagStart += (` ${propName}=${props[propName]} `)
            }
        }
        return tagStart + ">" + childString + tagEnd
    }
    update(nextElement) {
        let oldProps = this._currentElement.props;
        let newProps = nextElement.props;
        this.updateDOMProperties(oldProps, newProps)
        this.updateDOMChildren(nextElement.props.children)

    }
    updateDOMChildren(newChildrenElements) {
        updateDepth++
        this.diff(diffQueue, newChildrenElements)
        updateDepth--
        if (updateDepth === 0) {
            this.patch(diffQueue)
            diffQueue = []
        }

    }
    patch(diffQueue) {
        let deleteChildren = [];
        let deleteMap = {}
        for (let i = 0; i < diffQueue.length; i++) {
            let difference = diffQueue[i]
            if (difference.type === types.MOVE || difference.type === types.REMOVE) {
                let fromIndex = difference.fromIndex
                let oldChild = $(difference.parentNode.children().get(fromIndex))
                deleteMap[fromIndex] = oldChild
                deleteChildren.push(oldChild)
            }
        }
        $.each(deleteChildren, (idx, item) => $(item).remove())

        for (let i = 0; i < diffQueue.length; i++) {
            let difference = diffQueue[i]
            switch (difference.type) {
                case types.INSERT:
                    this.insertChildAt(difference.parentNode, difference.toIndex, $(difference.htmlString))
                    break
                case types.MOVE:
                    this.insertChildAt(difference.parentNode, difference.toIndex, deleteMap[difference.fromIndex])
                    break
                default:
                    break
            }
        }
    }
    insertChildAt(parentNode, index, node) {
        let oldChild = parentNode.children().get(index)
        oldChild ? node.insertBefore(oldChild) : node.appendTo(parentNode)
    }
    diff(diffQueue, newChildrenElements) {
        let oldChildrenMap = this.getOldChildrenMap(this._renderChildrenUnits)
        let { newChildrenUnits, newChildrenUnitMap } = this.getNewChildrenMap(oldChildrenMap, newChildrenElements)
        let lastIndex = 0;
        for (let i = 0; i < newChildrenUnits.length; i++) {
            let newUnit = newChildrenUnits[i]
            let newKey = (newUnit._currentElement.props && newUnit._currentElement.props.key) || i.toString()
            let oldChildUnit = oldChildrenMap[newKey]
            if (oldChildUnit === newUnit) {
                if (oldChildUnit._mountIndex < lastIndex) {
                    diffQueue.push({
                        parentId: `${this._reactid}`,
                        parentNode: $(`[data-reactid="${this._reactid}"]`),
                        type: types.MOVE,
                        fromIndex: oldChildUnit._mountIndex,
                        toIndex: i
                    })
                }
                lastIndex = Math.max(lastIndex, oldChildUnit._mountIndex)
            } else {
                if (oldChildUnit) {
                    diffQueue.push({
                        parentId: `${this._reactid}`,
                        parentNode: $(`[data-reactid="${this._reactid}"]`),
                        type: types.REMOVE,
                        fromIndex: oldChildUnit._mountIndex,
                    })
                    $(document).undelegate(`.${oldChildUnit._reactid}`)
                }
                diffQueue.push({
                    parentId: `${this._reactid}`,
                    parentNode: $(`[data-reactid="${this._reactid}"]`),
                    type: types.INSERT,
                    toIndex: i,
                    htmlString: newUnit.getHTMLString(`${this._reactid}.${i}`)
                })
            }
            newUnit._mountIndex = i
        }
        for (const oldKey in oldChildrenMap) {
            let oldChild = oldChildrenMap[oldKey]
            if (!newChildrenUnitMap.hasOwnProperty(oldKey)) {
                diffQueue.push({
                    parentId: `${this._reactid}`,
                    parentNode: $(`[data-reactid="${this._reactid}"]`),
                    type: types.REMOVE,
                    fromIndex: oldChild._mountIndex,
                })
                this._renderChildrenUnits = this._renderChildrenUnits.filter(item => item !== oldChild)
                $(document).undelegate(`.${oldChild._reactid}`)
            }
        }
    }
    getNewChildrenMap(oldChildrenMap, newChildrenElements) {
        let newChildrenUnits = []
        let newChildrenUnitMap = {}
        newChildrenElements.forEach((newElement, index) => {
            let newKey = (newElement.props && newElement.props.key) || index.toString();
            let oldUnit = oldChildrenMap[newKey]
            let oldElement = oldUnit && oldUnit._currentElement
            if (shouldDeepCompare(oldElement, newElement)) {
                oldUnit.update(newElement)
                newChildrenUnits.push(oldUnit)
                newChildrenUnitMap[newKey] = oldUnit
            } else {
                let nextUnit = createUnit(newElement)
                newChildrenUnits.push(nextUnit)
                newChildrenUnitMap[newKey] = nextUnit
                this._renderChildrenUnits[index] = nextUnit

            }
        })
        return { newChildrenUnits, newChildrenUnitMap }
    }
    getOldChildrenMap(childrenUnits = []) {
        let map = {}
        for (let i = 0; i < childrenUnits.length; i++) {
            let key = (childrenUnits[i]._currentElement.props && childrenUnits[i]._currentElement.props.key) || i.toString()
            map[key] = childrenUnits[i]
        }
        return map
    }
    updateDOMProperties(oldProps, newProps) {
        let propName
        for (propName in oldProps) {
            if (!newProps.hasOwnProperty(propName)) {
                $(`[data-reactid="${this._reactid}"]`).removeAttr(propName)
            }
            if (/^on[A-Z]/.test(propName)) {
                $(document).undelegate(`.${this._reactid}`)
            }
        }
        for (propName in newProps) {
            if (/^on[A-Z]/.test(propName)) {
                let eventName = propName.slice(2).toLowerCase()
                $(document).delegate(`[data-reactid="${this._reactid}"]`, `${eventName}.${this._reactid}`, newProps[propName])
            } else if (propName === 'style') {
                let styleObj = newProps[propName]
                Object.entries(styleObj).map(([attr, value]) => {
                    $(`[data-reactid="${this._reactid}"]`).css(attr, value)
                })
            } else if (propName === 'className') {
                $(`[data-reactid="${this._reactid}"]`).attr('class', newProps[propName])
            } else if (propName === 'children') {
                continue
            } else {
                $(`[data-reactid="${this._reactid}"]`).prop(propName, newProps[propName])
            }
        }
    }
}

class CompositeUnit extends Unit {
    update(nextElement, partialState) {
        this._currentElement = nextElement || this._currentElement;
        let nextState = Object.assign(this._componentInstance.state, partialState)
        let nextProps = this._currentElement.props
        if (this._componentInstance.shouldComponentUpdate && !this._componentInstance.shouldComponentUpdate(nextProps, nextState)) {
            return
        }
        let preRenderUnitInstance = this._renderUnitInstance;
        let preRenderElement = preRenderUnitInstance._currentElement
        let nextRenderElement = this._componentInstance.render()
        if (shouldDeepCompare(preRenderElement, nextRenderElement)) {
            preRenderUnitInstance.update(nextRenderElement)
            this._componentInstance.componentDidUpdate && this._componentInstance.componentDidUpdate()
        } else {
            this._renderUnitInstance = createUnit(nextRenderElement)
            let nextHTMLString = this._renderUnitInstance.getHTMLString(this._reactid)
            $(`[data-reactid="${this._reactid}"]`).replaceWith(nextHTMLString)
        }
    }
    getHTMLString(reactid) {
        this._reactid = reactid
        let { type: Component, props } = this._currentElement
        let componentInstance = this._componentInstance = new Component(props);

        componentInstance._currentUnit = this;

        componentInstance.componentWillMount && componentInstance.componentWillMount()

        let renderElement = componentInstance.render();

        let renderUnitInstance = this._renderUnitInstance = createUnit(renderElement)

        $(document).on('mounted', () => {
            componentInstance.componentDidMount && componentInstance.componentDidMount()
        })

        return renderUnitInstance.getHTMLString(this._reactid)
    }
}

function shouldDeepCompare(oldElement, newElement) {
    if (oldElement != null && newElement != null) {
        let oldType = typeof oldElement;
        let newType = typeof newElement;
        if ((oldType === 'string' || oldType === 'number') && (newType === 'string' || newType === 'number')) {
            return true
        }
        if (oldElement instanceof Element && newElement instanceof Element) {
            return oldElement.type === newElement.type
        }
    }
    return false
}

function createUnit(element) {
    if (typeof element === 'string' || typeof element === 'number') {
        return new TextUnit(element)
    }
    if (element instanceof Element && typeof element.type === 'string') {
        return new NativeUnit(element)
    }
    if (element instanceof Element && typeof element.type === 'function') {
        return new CompositeUnit(element)
    }
}

export {
    createUnit
}
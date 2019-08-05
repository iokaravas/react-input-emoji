// vendors
import React, { Component } from 'react'
import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'
import PropTypes from 'prop-types'

import './styles.css'

export default class ReactEmojiInput extends Component {
  state = {
    html: '',
    showPicker: false,
    allEmojiStyle: {}
  }

  constructor (props) {
    super(props)

    this.textInput = React.createRef()
  }

  componentWillReceiveProps (nextProps) {
    const { value } = this.props

    if (value !== nextProps.value) {
      this.setState({ html: nextProps.value })
    }
  }

  componentDidMount () {
    this.handleContentEditableInputCopyAndPaste()
    this.getAllEmojiStyle()
  }

  getAllEmojiStyle = () => {
    const allEmojiButton = document.querySelectorAll('.emoji-mart-category-list > li > button')

    const allEmojiStyle = {}

    allEmojiButton.forEach(emojiButton => {
      const label = emojiButton.getAttribute('aria-label')
      const [emoji] = label.split(',')

      const emojiSpanEl = emojiButton.querySelector('span')

      const style = this.replaceAll(emojiSpanEl.style.cssText, '"', "'")

      allEmojiStyle[emoji] = style
    })

    console.log(allEmojiStyle)
    this.setState({ allEmojiStyle })
  }

  toggleShowPicker = () => {
    this.setState({ showPicker: !this.state.showPicker })
  }

  emitChange = () => {
    const html = this.textInput.current.innerHTML

    this.setState({ html })

    if (typeof this.props.onChange === 'function') {
      this.props.onChange(html)
    }
  }

  pasteHtmlAtCaret = (html) => {
    var sel, range
    if (window.getSelection) {
      // IE9 and non-IE
      sel = window.getSelection()
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0)
        range.deleteContents()

        // Range.createContextualFragment() would be useful here but is
        // non-standard and not supported in all browsers (IE9, for one)
        var el = document.createElement('div')
        el.innerHTML = html
        var frag = document.createDocumentFragment(); var node; var lastNode
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node)
        }
        range.insertNode(frag)

        // Preserve the selection
        if (lastNode) {
          range = range.cloneRange()
          range.setStartAfter(lastNode)
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
        }
      }
    } else if (document.selection && document.selection.type !== 'Control') {
      // IE < 9
      document.selection.createRange().pasteHTML(html)
    }
  }

  replaceAll = (str, find, replace) => {
    return str.replace(new RegExp(find, 'g'), replace)
  }

  getImage = (emoji) => {
    console.log('emoji', emoji)
    let shortNames = `${emoji.short_names}`

    shortNames = this.replaceAll(shortNames, ',', ', ')

    const emojiSpanEl = document.querySelector(
      `[aria-label="${emoji.native}, ${shortNames}"] > span`
    )

    if (!emojiSpanEl) return ''

    const style = this.replaceAll(emojiSpanEl.style.cssText, '"', "'")

    return `<img style="${style}" data-emoji="${emoji.native}" src="http://upload.wikimedia.org/wikipedia/commons/c/ce/Transparent.gif" />`
  }

  replaceAllTextEmojis = (text) => {
    let allEmojis = this.getAllEmojisFromText(text)

    if (allEmojis) {
      allEmojis = [...new Set(allEmojis)] // remove duplicates
      const { allEmojiStyle } = this.state
      allEmojis.forEach(emoji => {
        const style = allEmojiStyle[emoji]

        if (!style) return

        text = this.replaceAll(
          text,
          emoji,
          `<img style="${style}" data-emoji="${emoji}" src="http://upload.wikimedia.org/wikipedia/commons/c/ce/Transparent.gif" />`
        )
      })
    }

    return text
  }

  handleSelectEmoji = (emoji) => {
    this.textInput.current.focus()

    this.pasteHtmlAtCaret(this.getImage(emoji))

    this.textInput.current.focus()

    this.emitChange()
    this.toggleShowPicker()
  }

  getAllEmojisFromText = (text) => {
    return text.match(
      /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/g
    )
  }

  handleContentEditableInputCopyAndPaste = () => {
    const self = this
    this.textInput.current.addEventListener('copy', function (e) {
      // var selectedText = window.getSelection()
      // var range = selectedText.getRangeAt(0)
      // var selectedTextReplacement = range.toString()
      // e.clipboardData.setData('text/plain', selectedTextReplacement)
      // e.preventDefault() // default behaviour is to copy any selected text
      const selectedText = window.getSelection()

      let container = document.createElement('div')

      for (let i = 0, len = selectedText.rangeCount; i < len; ++i) {
        container.appendChild(selectedText.getRangeAt(i).cloneContents())
      }

      container = replaceEmojiToString(container)
      console.log('container.innerText', container.innerText)
      e.clipboardData.setData('text', container.innerText)
      e.preventDefault()

      function replaceEmojiToString (container) {
        const images = container.querySelectorAll('img')

        images.forEach(image => {
          image.outerHTML = image.dataset.emoji
        })

        return container
      }
    })

    // Paste fix for contenteditable
    this.textInput.current.addEventListener('paste', function (e) {
      e.preventDefault()
      let content
      if (window.clipboardData) {
        content = window.clipboardData.getData('Text')
        content = self.replaceAllTextEmojis(content)
        if (window.getSelection) {
          var selObj = window.getSelection()
          var selRange = selObj.getRangeAt(0)
          selRange.deleteContents()
          selRange.insertNode(document.createTextNode(content))
        }
      } else if (e.clipboardData) {
        content = e.clipboardData.getData('text/plain')
        content = self.replaceAllTextEmojis(content)
        document.execCommand('insertHTML', false, content)
      }
    })
  }

  render () {
    const { showPicker, html } = this.state
    const placeholder = 'Type a message'

    return (
      <div className='react-emoji'>
        <div className='react-emoji-picker--container'>
          <div className='react-emoji-picker--wrapper'>
            <div
              className={
                `react-emoji-picker${
                  showPicker ? ' react-emoji-picker__show' : ''
                }`
              }
            >
              <Picker
                showPreview={false}
                showSkinTones={false}
                set='apple'
                onSelect={this.handleSelectEmoji}
              />
            </div>
          </div>
        </div>
        <div className='react-emoji-input--container'>
          <div className='react-emoji-input--wrapper'>
            <div
              className='react-emoji-input--placeholder'
              style={{
                visibility: html ? 'hidden' : 'visible'
              }}
            >
              {placeholder}
            </div>
            <div
              ref={this.textInput}
              contentEditable
              className='react-emoji-input--input'
              onInput={this.emitChange}
              onBlur={this.emitChange}
            />
          </div>
        </div>
        <button
          className={
            `react-emoji-input--button${
              showPicker ? ' react-emoji-input--button__show' : ''
            }`
          }
          onClick={this.toggleShowPicker}>
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24'><path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10' /><path d='M8 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 8 7M16 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 16 7M15.232 15c-.693 1.195-1.87 2-3.349 2-1.477 0-2.655-.805-3.347-2H15m3-2H6a6 6 0 1 0 12 0' /></svg>
        </button>
      </div>
    )
  }
}

ReactEmojiInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func
}
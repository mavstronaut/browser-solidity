'use strict'

var EventManager = require('../lib/eventManager')

var ace = require('brace')
require('../mode-solidity.js')

function Editor () {
  var editor = ace.edit('input')
  document.getElementById('input').editor = editor // required to access the editor during tests
  var event = new EventManager()
  this.event = event
  var sessions = {}
  var sourceAnnotations = []
  var readOnlySessions = {}
  var currentSession

  var emptySession = createSession('')

  function createSession (content) {
    var s = new ace.EditSession(content, 'ace/mode/javascript')
    s.setUndoManager(new ace.UndoManager())
    s.setTabSize(4)
    s.setUseSoftTabs(true)
    return s
  }

  function switchSession (path) {
    currentSession = path
    editor.setSession(sessions[currentSession])
    editor.setReadOnly(readOnlySessions[currentSession])
    editor.focus()
  }

  this.open = function (path, content) {
    if (!sessions[path]) {
      var session = createSession(content)
      sessions[path] = session
      readOnlySessions[path] = false
    }
    switchSession(path)
  }

  this.openReadOnly = function (path, content) {
    if (!sessions[path]) {
      var session = createSession(content)
      sessions[path] = session
      readOnlySessions[path] = true
    }
    switchSession(path)
  }

  this.get = function (path) {
    if (currentSession === path) {
      return editor.getValue()
    }
  }

  this.current = function (path) {
    if (editor.getSession() === emptySession) {
      return
    }
    return currentSession
  }

  this.discard = function (path) {
    if (currentSession !== path) {
      delete sessions[path]
    }
  }

  this.resize = function () {
    editor.resize()
    var session = editor.getSession()
    session.setUseWrapMode(document.querySelector('#editorWrap').checked)
    if (session.getUseWrapMode()) {
      var characterWidth = editor.renderer.characterWidth
      var contentWidth = editor.container.ownerDocument.getElementsByClassName('ace_scroller')[0].clientWidth

      if (contentWidth > 0) {
        session.setWrapLimit(parseInt(contentWidth / characterWidth, 10))
      }
    }
  }

  this.addMarker = function (range, cssClass) {
    return editor.session.addMarker(range, cssClass)
  }

  this.removeMarker = function (markerId) {
    editor.session.removeMarker(markerId)
  }

  this.clearAnnotations = function () {
    sourceAnnotations = []
    editor.getSession().clearAnnotations()
  }

  this.addAnnotation = function (annotation) {
    sourceAnnotations[sourceAnnotations.length] = annotation
    this.setAnnotations(sourceAnnotations)
  }

  this.setAnnotations = function (sourceAnnotations) {
    editor.getSession().setAnnotations(sourceAnnotations)
  }

  this.gotoPosition = function (line, col) {
    editor.focus()
    editor.gotoLine(line, col, true)
  }

  // Do setup on initialisation here
  editor.on('changeSession', function () {
    event.trigger('sessionSwitched', [])

    editor.getSession().on('change', function () {
      event.trigger('contentChanged', [])
    })
  })

  // Unmap ctrl-t & ctrl-f
  editor.commands.bindKeys({ 'ctrl-t': null })
  editor.commands.bindKeys({ 'ctrl-f': null })

  editor.resize(true)
}

module.exports = Editor

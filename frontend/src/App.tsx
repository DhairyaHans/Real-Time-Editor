import { useRef, useState } from 'react'
import './App.css'
import BoldIcon from './assets/icons/type-bold.svg?react'
import ItalicIcon from './assets/icons/type-italic.svg?react'
import UnderlineIcon from './assets/icons/type-underline.svg?react'
// import RedoIcon from './assets/icons/redo.svg?react'
// import UndoIcon from './assets/icons/undo.svg?react'
import { marked } from 'marked'
import { useEffect } from 'react'
import { socket } from './socket-client'

/**
 * Undo and Redo will be handled later
 */

type RemoteCursor = {
  user: string
  cursorPos: number
  row: number
  col: number
}

function App() {
  const [myName, setMyName] = useState("")
  const [mdContent, setContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [cursorColorMap, setCursorColorMap] = useState(new Map<string, string>())
  const [usersCursorPositions, setUsersCursorPositions] = useState(new Map<string, RemoteCursor>())

  // const [undoStates, setUndoStates] = useState<string[]>([])
  // const [redoStates, setRedoStates] = useState<string[]>([])

  // const undoContent = () => {
  //   setRedoStates(prev => [...prev, mdContent])

  //   setUndoStates(prev => {
  //     const copy = [...prev]
  //     const last = copy.pop() ?? ''
  //     setContent(last)
  //     return copy
  //   })

  //   socket.emit('undo', null)
  // }

  // const handleRemoteUndo = () => {
  //   setRedoStates(prev => [...prev, mdContent])

  //   setUndoStates(prev => {
  //     const copy = [...prev]
  //     const last = copy.pop() ?? ''
  //     setContent(last)
  //     return copy
  //   })
  // }

  // const redoContent = () => {
  //   setUndoStates(prev => [...prev, mdContent])

  //   setRedoStates(prev => {
  //     const copy = [...prev]
  //     const last = copy.pop() ?? mdContent
  //     setContent(last)
  //     return copy
  //   })

  //   socket.emit('redo', null)
  // }

  // const handleRemoteRedo = () => {
  //   setUndoStates(prev => [...prev, mdContent])

  //   setRedoStates(prev => {
  //     const copy = [...prev]
  //     const last = copy.pop() ?? mdContent
  //     setContent(last)
  //     return copy
  //   })
  // }

  const updateUserCursorColorMapping = (user: string, color?: string) => {
    setCursorColorMap(prev => {
      if (prev.has(user)) return prev

      const newMap = new Map(prev)
      newMap.set(user, color ?? getRandomHexColor())
      return newMap
    })
  }

  const changeEditorContentHandler = (newContent: string) => {
    // setUndoStates(prev => [...prev, mdContent])
    setContent(newContent)
  }

  // const renderRemoteCursors = () => {
  //   const mirror = mirrorRef.current
  //   const overlay = overlayRef.current

  //   if (!mirror || !overlay) return

  //   mirror.innerHTML = ''
  //   overlay.innerHTML = ''

  //   const fragment = document.createDocumentFragment()
    
  //   let lastPosition = 0

  //   const cursors = [...usersCursorPositions.values()]
  //     .sort((a, b) => a.cursorPos - b.cursorPos)

  //   console.log("dasdkashjkdhaskdhaskdhas", cursors)

  //   for(const cursor of cursors){
  //     const textBefore = mdContent.slice(
  //       lastPosition, 
  //       cursor.cursorPos
  //     )
  //     console.log(`textBefore - ${textBefore}`)
  //     fragment.appendChild(
  //       document.createTextNode(textBefore)
  //     ) 
  //     const marker = document.createElement('span')

  //     marker.className = 'cursorAnchor'
  //     marker.dataset.user = cursor.user
  //     marker.textContent = `\u200B`
      
  //     fragment.appendChild(marker)

  //     lastPosition = cursor.cursorPos
  //   }
  //   fragment.appendChild(
  //     document.createTextNode(
  //       mdContent.slice(lastPosition)
  //     )
  //   )
  //   mirror.appendChild(fragment)


  //   // Now find each marker's position
  //   for(const cursor of cursors){
  //     const marker = mirror.querySelector(
  //       `.cursorAnchor[data-user="${cursor.user}"]`
  //     ) as HTMLElement | null

  //     if (!marker) continue

  //     const rect = marker.getBoundingClientRect()
  //     const mirrorRect = mirror.getBoundingClientRect()

  //     const cursorElement = document.createElement('div')

  //     cursorElement.className = 'remoteCursor'
  //     cursorElement.dataset.user = cursor.user
      
  //     cursorElement.style.left = 
  //       `${rect.left - mirrorRect.left}px`
      
  //     cursorElement.style.top = 
  //       `${rect.top - mirrorRect.top}px`
      
  //     cursorElement.style.height = 
  //       `${rect.height}px`
      
  //     cursorElement.style.backgroundColor = 
  //       cursorColorMap.get(cursor.user) ?? '#ffffff'

  //     const label = document.createElement(`span`)

  //     label.className = 'remoteCursorLabel'
  //     label.textContent = cursor.user

  //     cursorElement.appendChild(label)

  //     overlay.appendChild(cursorElement)

  //   }
  // }

  const renderRemoteCursors = () => {
    const mirror = mirrorRef.current
    const overlay = overlayRef.current

    if (!mirror || !overlay) return

    mirror.innerHTML = ''
    overlay.innerHTML = ''

    const cursors = [...usersCursorPositions.values()]
        .sort((a, b) => a.cursorPos - b.cursorPos)

    for (const cursor of cursors) {
        const before = mdContent.slice(0, cursor.cursorPos)
        const after = mdContent.slice(cursor.cursorPos)

        const textNodeBefore = document.createTextNode(before)
        const textNodeAfter = document.createTextNode(after)

        mirror.appendChild(textNodeBefore)
        mirror.appendChild(textNodeAfter)

        const range = document.createRange()

        range.setStart(
            textNodeBefore,
            textNodeBefore.length
        )

        range.collapse(true)

        const rect = range.getBoundingClientRect()
        const mirrorRect = mirror.getBoundingClientRect()

        const cursorElement = document.createElement('div')

        cursorElement.className = 'remoteCursor'
        cursorElement.dataset.user = cursor.user

        cursorElement.style.left =
            `${rect.left - mirrorRect.left}px`

        cursorElement.style.top =
            `${rect.top - mirrorRect.top}px`

        cursorElement.style.height =
            `${rect.height || 20}px`

        cursorElement.style.backgroundColor =
            cursorColorMap.get(cursor.user) ?? '#ffffff'

        const label = document.createElement('span')

        label.className = 'remoteCursorLabel'
        label.textContent = cursor.user

        cursorElement.appendChild(label)
        overlay.appendChild(cursorElement)

        mirror.innerHTML = ''
    }
}

  const wrapSelection = (before: string, after: string) => {
    const textArea = textareaRef.current;
    if (!textArea) return

    console.log(textArea)
    const start = textArea.selectionStart
    const end = textArea.selectionEnd
    
    console.log(`start - ${start}, end - ${end}`)

    const selected = mdContent.slice(start, end)

    console.log(`selected - ${selected}`)

    const updatedContent = `${mdContent.slice(0, start)}${before}${selected}${after}${mdContent.slice(end)}`

    setContent(updatedContent)
    socket.emit("editor-change", updatedContent)

    textArea.focus()
    const startOffset = before.length

    setTimeout(()=> {
      textArea.setSelectionRange(start + startOffset, start + startOffset)
    }, 0)
  }

  const getRandomHexColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

  const updateCursorPosition = () => {
    const textArea = textareaRef.current;
    if (!textArea) return

    const text = textArea.value

    const cursorPos = textArea.selectionStart

    // Split the text into lines
    const lines = text.substring(0, cursorPos).split('\n')

    // Row is the number of lines
    const row = lines.length

    // Column is the length of the last line
    const col = lines[lines.length-1].length 

    console.log(`Cursor position - ${row}, ${col}`)

    socket.emit('cursor-position', ({cursorPos, row, col}))
  }

  useEffect(() => {
    renderRemoteCursors()
  }, [
    mdContent,
    usersCursorPositions,
    cursorColorMap
  ])
  // renderCursorIndicators = (cursor: {user: string, cursorPos:string, row:string, col:string}) => {
  //   const cursorColor = cursorColorMap.get(cursor.user) ?? '#ffffff'
  //   const textArea = textareaRef.current;
  //   if (!textArea) return
    
  //   // Draw the cursor indicator at the specified position

    

  // }

  useEffect(() => {
    // connect oncec  
    socket.connect()

    socket.on("connect", () => {
      console.log(`Conencted - ${socket.id}`)
      if (socket.id){
        const user = `User_${socket.id.substring(0, 5)}`
        setMyName(user)
        updateUserCursorColorMapping(user, '#d5b5f0')
      }
    })

    socket.on("update-editor", (data: string) => {
      console.log(`data - ${data}`)
      changeEditorContentHandler(data)
    })

    // socket.on("undo-event", handleRemoteUndo)

    // socket.on("redo-event", handleRemoteRedo)

    socket.on("disconnect", () => {
      console.log(`Disconnected`)
    })

    socket.on("update-cursors", (data: {user:string, cursorPos:number, row:number, col:number}) => {
      console.log(`received updates for cursor for user - ${data.user} - ${data.row}, ${data.col}, ${data.cursorPos}`)
      updateUserCursorColorMapping(data.user)
      setUsersCursorPositions(prev => {
        const next = new Map(prev)
        next.set(data.user, data)
        return next
      })
    })

    // cleanup 
    return () => {
      socket.off("update-editor")
      socket.off("update-cursors")
      socket.disconnect()
    }
  }, [])
  
  return (
    <div className="app">
      <h1>Real Time File Editor</h1>
      <div className='clayyy'>
      </div>
      <div className="main">
        <div className="toolbar">
          <button
            onClick={() => wrapSelection('**', '**')}
          >
            <BoldIcon />
          </button>
          <button
            onClick={() => wrapSelection('*', '*')}
          >
            <ItalicIcon/>
          </button>
          <button
            onClick={() => wrapSelection('<u>', '</u>')}
          >
            <UnderlineIcon/>
          </button>
          {/* <button
            onClick={() => {
              undoContent()
            }}
            disabled={(undoStates.length === 0)}
          >
            <UndoIcon />
          </button>
          <button
            onClick={() => {
              redoContent()
            }}
            disabled={(redoStates.length===0)}
          >
            <RedoIcon />
          </button> */}
        </div>
        <div className='editorContainer'>
          <div className="editorWrapper">
            <textarea
              ref={textareaRef}
              className='editor'
              value={mdContent}
              onChange={(e) => {
                changeEditorContentHandler(e.target.value)
                console.log("EDITOR CHANGE EVENT CAPTURED")
                socket.emit("editor-change", e.target.value)
                requestAnimationFrame(() => {
                    updateCursorPosition()
                })
              }}
              onMouseUp={() => {
                  requestAnimationFrame(updateCursorPosition)
              }}

              onKeyUp={() => {
                  requestAnimationFrame(updateCursorPosition)
              }}
            />
            <div
              ref={mirrorRef}
              className="editorMirror"
            ></div>
            <div 
              ref={overlayRef} 
              className="editorOverlay"
            ></div>
          </div>
          <div 
            className="editorPreview" 
            dangerouslySetInnerHTML={{__html: marked(mdContent)}}
          />
        </div>
      </div>
    </div>
  )
}

export default App

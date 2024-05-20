import { ref } from 'vue'
import { LEFT_MOUSE_BTN } from '@/constants'
import type { NoteOff, NoteOnCallback } from 'xen-midi'

export function usePlayNote(noteOn: NoteOnCallback) {
  const isMousePressed = ref(false)
  const noteOffs: Map<number, NoteOff> = new Map()

  function start(index: number) {
    noteOffs.set(index, noteOn(index,0,0))
  }

  function end(index: number) {
    if (noteOffs.has(index)) {
      noteOffs.get(index)!()
      noteOffs.delete(index)
    }
  }

  function onTouchEnd(event: TouchEvent, index: number) {
    event.preventDefault()
    end(index)
  }

  function onTouchStart(event: TouchEvent, index: number) {
    event.preventDefault()
    // Make sure that we start a new note.
    end(index)

    start(index)
  }

  function onMouseDown(event: MouseEvent, index: number) {
    if (event.button !== LEFT_MOUSE_BTN) {
      return
    }
    event.preventDefault()
    isMousePressed.value = true
    start(index)
  }

  function onMouseUp(event: MouseEvent, index: number) {
    if (event.button !== LEFT_MOUSE_BTN) {
      return
    }
    event.preventDefault()
    isMousePressed.value = false
    end(index)
  }

  function onMouseEnter(event: MouseEvent, index: number) {
    if (!isMousePressed.value) {
      return
    }
    event.preventDefault()
    start(index)
  }

  function onMouseLeave(event: MouseEvent, index: number) {
    if (!isMousePressed.value) {
      return
    }
    event.preventDefault()
    end(index)
  }

  function onUnmounted(){
    noteOffs.forEach((off) => {
      if (off !== null) {
        off()
      }
    })
  }

  return{
    onMouseEnter,
    onMouseDown,
    onMouseUp,
    onTouchStart,
    onTouchEnd,
    onMouseLeave,
    onUnmounted  
  }
}

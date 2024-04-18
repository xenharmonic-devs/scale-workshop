import { APP_TITLE } from '@/constants'
import { midiNoteNumberToName } from '@/utils'
import { BaseExporter, type ExporterParams } from '@/exporters/base'
import { ftom, mtof } from 'xen-dev-utils'

export default class KontaktExporter extends BaseExporter {
  static tuningMaxSize = 128
  static baseFrequency = mtof(0)

  appTitle: string

  constructor(params: ExporterParams) {
    super(params)
    if (params.sourceText === undefined) {
      throw new Error('Missing text lines')
    }
    this.appTitle = params.appTitle || APP_TITLE
  }

  getFileContents() {
    const newline = this.params.newline
    const baseMidiNote = this.params.scale.baseMidiNote

    // assemble the kontakt script contents
    let file = '{**************************************' + newline
    file += this.params.name + newline
    file +=
      'MIDI note ' +
      baseMidiNote.toString() +
      ' (' +
      midiNoteNumberToName(baseMidiNote, this.params.midiOctaveOffset) +
      ') = ' +
      this.params.scale.baseFrequency.toString() +
      ' Hz' +
      newline
    file += 'Created using ' + this.appTitle + newline + newline
    file += this.params.scaleUrl + newline
    file += '****************************************}' + newline + newline

    file += 'on init' + newline
    file += 'declare %keynum[' + KontaktExporter.tuningMaxSize + ']' + newline
    file += 'declare %tune[' + KontaktExporter.tuningMaxSize + ']' + newline
    file += 'declare $bend' + newline
    file += 'declare $key' + newline + newline

    for (let i = 0; i < KontaktExporter.tuningMaxSize; i++) {
      const [noteNumber, cents] = ftom(this.params.scale.getFrequency(i))

      // if we're out of range of the default Kontakt tuning, leave note as default tuning
      if (noteNumber < 0 || noteNumber >= KontaktExporter.tuningMaxSize) {
        file += '%keynum[' + i + '] := ' + i + newline
        file += '%tune[' + i + '] := 0' + newline
      }

      // success, we're in range of another note, so we'll change the tuning +/- 50c
      else {
        file += '%keynum[' + i + '] := ' + noteNumber + newline
        file += '%tune[' + i + '] := ' + (cents * 1000).toFixed() + newline
      }
    }

    file += 'end on' + newline + newline

    file += 'on note' + newline
    file += '$key := %keynum[$EVENT_NOTE]' + newline
    file += '$bend := %tune[$EVENT_NOTE]' + newline
    file += 'change_note ($EVENT_ID, $key)' + newline
    file += 'change_tune ($EVENT_ID, $bend, 0)' + newline
    file += 'end on' + newline

    return file
  }

  saveFile() {
    super.saveFile(this.params.filename + '.txt', this.getFileContents())
  }
}

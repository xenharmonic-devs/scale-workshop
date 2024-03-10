export type ImportResult = {
  sourceText: string
  name?: string
  baseMidiNote?: number
  baseFrequency?: number
}

export abstract class TextImporter {
  event: Event

  constructor(event: Event) {
    this.event = event
  }

  abstract parseText(input: string, filename: string): ImportResult

  parse() {
    if (this.event.target == null) {
      throw new Error('Missing event target element')
    }
    const target: HTMLInputElement = this.event.target as HTMLInputElement
    if (target.files === null) {
      throw new Error('Missing files')
    }
    const files: FileList = target.files
    if (!files.length) {
      throw new Error('Missing file')
    }
    const reader = new FileReader()

    return new Promise<ImportResult>((resolve, reject) => {
      reader.addEventListener('load', () =>
        resolve(this.parseText(reader.result as string, files[0].name))
      )
      reader.addEventListener('error', reject)
      reader.readAsText(files[0])
    })
  }
}

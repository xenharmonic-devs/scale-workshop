export type NoteOff = () => void
export type NoteOnCallback = (index: number) => NoteOff
export interface FokkerBlockFactor {
  id: number
  numberOfLargeSteps: number
  sizeOfLargeStep: number
  sizeOfSmallStep: number
  rotation: number
}

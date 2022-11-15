import { ClickupState, SpaceLListFile, User } from '../util/typings/clickup'
import { Event, EventEmitter } from 'vscode'

class AppStateChangeEventEmitter extends EventEmitter<void> {
  constructor() {
    super()
  }
}

export let appStateChangeEventEmitter: AppStateChangeEventEmitter = new AppStateChangeEventEmitter()

const initAppState = {
  clickup: null,
  crntSpace: null,
  crntSpaceId: '',
  crntWorkspaceId: '',
  isLoading: true,
  me: null,
}

type TAppState = {
  clickup: ClickupState | null
  crntSpace: SpaceLListFile | null
  me: User | null
  isLoading: Boolean
}

export let AppState: TAppState = {
  ...initAppState,
}

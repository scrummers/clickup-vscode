import { ClickupState, SpaceLListFile, StateSpaceList, User } from '../util/typings/clickup'
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
  crntWorkspaceId: '',
  spaceList: null,
  isLoading: true,
  me: null,
}

type TAppState = {
  clickup: ClickupState | null
  crntSpace: SpaceLListFile | null
  spaceList: StateSpaceList[] | null
  me: User | null
  isLoading: Boolean
}

export let AppState: TAppState = {
  ...initAppState,
}

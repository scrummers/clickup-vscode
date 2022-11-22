import { ClickupState, Priority, SpaceLListFile, StateSpaceList, Status, Tag, Teams, User } from '../util/typings/clickup'
import { EventEmitter } from 'vscode'

class AppStateChangeEventEmitter extends EventEmitter<void> {
  constructor() {
    super()
  }
}

export let appStateChangeEventEmitter: AppStateChangeEventEmitter = new AppStateChangeEventEmitter()

export const initAppState = {
  crntWorkspace: null,
  crntSpace: null,
  crntWorkspaceId: '',
  crntSpaceId: '',
  spaceList: [],
  spaceTags: [],
  spaceMembers: [],
  spacePriorities: [],
  listMembers: [],
  isLoading: true,
  me: null,
}

export type TAppState = {
  crntWorkspace: Teams | null
  crntSpace: SpaceLListFile | null
  crntSpaceId: string
  spaceList: StateSpaceList[]
  spaceTags: Tag[]
  spaceMembers: User[]
  spacePriorities: Priority[]
  listMembers: User[]
  me: User | null
  isLoading: Boolean
}

export const resetState = () => {
  AppState = {
    ...initAppState
  }
}

export let AppState: TAppState = {
  ...initAppState,
}

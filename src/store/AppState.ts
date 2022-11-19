import { ClickupState, Priority, SpaceLListFile, StateSpaceList, Status, Tag, Teams, User } from '../util/typings/clickup'
import { EventEmitter } from 'vscode'

class AppStateChangeEventEmitter extends EventEmitter<void> {
  constructor() {
    super()
  }
}

export let appStateChangeEventEmitter: AppStateChangeEventEmitter = new AppStateChangeEventEmitter()

const initAppState = {
  clickup: null,
  crntWorkspace: null,
  crntSpace: null,
  crntWorkspaceId: '',
  crntSpaceId: '',
  spaceList: [],
  spaceTags: [],
  spaceMembers: [],
  spacePriorities: [],
  listMembers: [],
  listStatus: [],
  isLoading: true,
  me: null,
}

export type TAppState = {
  clickup: ClickupState | null
  crntWorkspace: Teams | null
  crntSpace: SpaceLListFile | null
  crntSpaceId: string
  spaceList: StateSpaceList[]
  spaceTags: Tag[]
  spaceMembers: User[]
  spacePriorities: Priority[]
  listMembers: User[]
  listStatus: Status[]
  me: User | null
  isLoading: Boolean
}

export let AppState: TAppState = {
  ...initAppState,
}

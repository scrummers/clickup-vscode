import { ClickupState, SpaceLListFile, StateSpaceList, Status, Tag, Teams, User } from '../util/typings/clickup'
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
  spaceList: null,
  spaceTags: [],
  spaceMembers: [],
  spacePriorities: [],
  listMembers: [],
  listStatus: [],
  isLoading: true,
  me: null,
}

type TAppState = {
  clickup: ClickupState | null
  crntWorkspace: Teams | null
  crntSpace: SpaceLListFile | null
  crntSpaceId: string
  spaceList: StateSpaceList[] | null
  spaceTags: Tag[]
  spaceMembers: User[]
  spacePriorities: any
  listMembers: User[]
  listStatus: Status[]
  me: User | null
  isLoading: Boolean
}

export let AppState: TAppState = {
  ...initAppState,
}

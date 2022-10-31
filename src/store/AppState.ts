import { ClickupState, SpaceLListFile, User } from '../util/typings/clickup'

const initAppState = {
  clickup: null,
  crntSpace: null,
  crntSpaceId: '',
  crntWorkspaceId: '',
  isLoading: false,
  me: null
}

type AppState = {
  clickup: ClickupState | null
  crntSpace: SpaceLListFile | null
  me: User | null
}

export let AppState: AppState = {
  ...initAppState,
}

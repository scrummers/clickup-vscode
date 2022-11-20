export type User = {
  id: number
  username: string
  color: string // hex value
  profilePicture: string
  profileInfo?: any
  email?: any
  initials?: any
}

// equal to Workspace
export type Teams = {
  id: string
  name: string
  color: string
  avatar: string
  members: {
    invited_by: User,
    user: User
  }[]
}

export type Space = {
  id: string // 790
  name: string
  private: boolean
  statuses: Status[]
  multiple_assignees: boolean
  features: {
    priorities: any
    due_dates: {
      enabled: boolean
      start_date: boolean
      remap_due_dates: boolean
      remap_closed_due_date: boolean
    }
    time_tracking: {
      enabled: boolean
    }
    tags: {
      enabled: boolean
    }
    time_estimates: {
      enabled: boolean
    }
    checklists: {
      enabled: boolean
    }
    custom_fields: {
      enabled: boolean
    }
    remap_dependencies: {
      enabled: boolean
    }
    dependency_warning: {
      enabled: boolean
    }
    portfolios: {
      enabled: boolean
    }
  }
  access?: boolean // exist in Get folder API
}

export type SpaceLListFile = {
  id: string // 790
  name: string
  private: boolean
  statuses: Status[]
  multiple_assignees: boolean
  features: {
    priorities: any
    due_dates: {
      enabled: boolean
      start_date: boolean
      remap_due_dates: boolean
      remap_closed_due_date: boolean
    }
    time_tracking: {
      enabled: boolean
    }
    tags: {
      enabled: boolean
    }
    time_estimates: {
      enabled: boolean
    }
    checklists: {
      enabled: boolean
    }
    custom_fields: {
      enabled: boolean
    }
    remap_dependencies: {
      enabled: boolean
    }
    dependency_warning: {
      enabled: boolean
    }
    portfolios: {
      enabled: boolean
    }
  }
  access?: boolean // exist in Get folder API
  root_lists: ListExtend[]
  folders: FolderExtend[]
}

export type List = {
  id: string // '124'
  name: string
  orderindex: number
  content: string
  status: {
    status: string // 'red'
    color: string // hex value
    hide_label: boolean
  }
  statuses: Status[]
  priority: {
    priority: string // 'high'
    color: string
  }
  assignee: User | null //TODO:
  task_count: any | null
  due_date: string // '1567780450202'
  start_date: string | null
  folder: Folder
  space: Space
  archived: boolean
  override_statuses: boolean
  permission_level: string // 'create'
}

export type ListExtend = {
  id: string // '124'
  name: string
  orderindex: number
  content: string
  status: {
    status: string // 'red'
    color: string // hex value
    hide_label: boolean
  }
  priority: {
    priority: string // 'high'
    color: string
  }
  assignee: any | null //TODO:
  task_count: any | null
  due_date: string // '1567780450202'
  start_date: string | null
  folder: Folder
  space: Space
  archived: boolean
  override_statuses: boolean
  permission_level: string // 'create'
  tasks: Task[]
}

export type Tag = {
  creator: number, // user id
  name: string,
  tag_bg: string // # hash color
  tag_fg: string // # hash color
}

export type Priority = {
  id: string,
  priority: string // 'urgent', 'high', 'normal',
  color: string, // '#f50000'
  orderindex: string // '1', '2', '3', '4'
}

export type Task = {
  id: string
  custom_id: string
  name: string
  text_content: string
  description: string
  status: {
    status: string // 'in progress
    color: string
    orderindex: number
    type: string
  }
  orderindex: string
  date_created: string
  date_updated: string
  date_closed: string
  creator: User
  assignees: User[] // List of user id
  checklists: string[]
  tags: Tag[]
  parent: string
  priority: Priority
  due_date: string
  start_date: string
  time_estimate: string
  time_spent: string
  custom_fields: any // TODO:need to fill
  list: List
  folder: {
    id: string
  }
  space: {
    id: string
  }
  url: string,
  archived: boolean
}
/*
export type CreateTask = {
  name: string
  description: string
  assignee: number[]
  tags: string[]
  status: string
  priority: number
  due_date: number
  due_date_time: boolean
  time_estimate: boolean
  start_date:  number
  start_date_time: boolean
  notify_all: boolean
  parent: string|null
  links_to: string|null
  check_required_custom_fields: boolean
}
*/
export type Folder = {
  id: string
  name: string
  orderindex: number
  override_statuses: boolean
  hidden: boolean
  space: Space
  task_count: string // "0"
  lists: List[]
  access?: boolean // get list api
}

export type FolderExtend = {
  id: string
  name: string
  orderindex: number
  override_statuses: boolean
  hidden: boolean
  space: Space
  task_count: string // "0"
  lists: ListExtend[]
  access?: boolean // get list api
}

export type ClickupState = {
  workspaces: Teams[]
  spaces: Space[]
  folders: Folder[]
  tasks: Task[]
  lists: List[]
  current: {
    workspace: string | null
    space: string | null
  }
}

export type Status = {
  id: string
  status: string // "todo", "complete", "done" <- user defined
  type: string // "open", "closed", "custom" <- clickup internal type
  orderindex: number // 0, 1,
  color: string // hex value
}

/**
 * APP
 */

export enum EnumTodoLabel {
  today = 'Today',
  overdue = 'Overdue',
  next = 'Next',
  noDueDate = 'No Due Date',
  allTask = '*',
}

// export type TreeViewTodoData = {
//   [key in keyof typeof EnumTodoLabel]: {
//     tasks: Task[]
//   }
// }

export enum EnumTreeLevel {
  First,
  Second,
  Third,
}

export type TaskTreeViewData = {
  label: string
  folderId?: string
  listId?: string
  // level: EnumTreeLevel
  tasks: Task[]
}

export type TodoTasksMap = {
  [key in string]: Task[]
}

/* will use later */

// type TaskCustomFieldFilters = {
//   field_id: string
//   value: string
//   operator: string
// }

/**
 * State
 */
export interface StateSpaceList extends ListExtend {
  label: string,
  foldername: string | null
  folderId: string | null,
}


/**
 * API body schema
 */
export type ApiNewTaskSchema = {
  name: string
  description: string
  assignees: number[]
  tags: string[]
  status: string
  priority: number | null
  due_date: number | null
  due_date_time: boolean | null
  time_estimate: number | null
  start_date: number | null
  start_date_time: boolean | null
  notify_all: boolean
  parent: string | null
  links_to?: string | null
  check_required_custom_fields?: boolean
  custom_fields?: {
    id: string
    value: string
  }[] //TaskCustomFieldFilters
}

export type ApiUpdateTaskSchema = {
  name: string
  description: string
  status: string // 'in progress' 
  priority: number | null// 1
  // tags: string[]
  due_date: number | null// 1508369194377
  due_date_time: boolean
  time_estimate?: number | null //8640000
  start_date: number | null // 1567780450202
  start_date_time: boolean
  parent: string
  assignees: {
    add: number[]
    rem: number[]
  }
  archived: boolean
  tags?: string[]
}

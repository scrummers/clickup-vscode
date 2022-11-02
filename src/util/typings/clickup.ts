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
  members: User[]
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
  tags: string[]
  parent: string
  priority: string
  due_date: string
  start_date: string
  time_estimate: string
  time_spent: string
  custom_fields: any // TODO:need to fill
  list: {
    id: string
  }
  folder: {
    id: string
  }
  space: {
    id: string
  }
  url: string
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
  status: string // "todo", "complete",
  type: string // "open", "closed",
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
  allTask = '*'
}

// export type TreeViewTodoData = {
//   [key in keyof typeof EnumTodoLabel]: {
//     tasks: Task[]
//   }
// }

export type TaskTreeViewData = [
  {
    label: string
    tasks: Task[]
  }
]

export type TreeViewAllTasksData = {
  [key in string]: {
    label: string
    tasks: Task[]
  }
}

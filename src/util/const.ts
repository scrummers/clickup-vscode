import { ApiNewTaskSchema, ApiUpdateTaskSchema } from "./typings/clickup"

type TInit = {
  newTask: ApiNewTaskSchema,
  updateTask: ApiUpdateTaskSchema
}

export const INIT: TInit = {
  newTask: {
    name: '',
    description: '',
    assignees: [],
    tags: [],
    status: '',
    priority: 1,
    due_date: 0,
    due_date_time: false,
    time_estimate: 0,
    start_date: 0,
    start_date_time: false,
    notify_all: false,
    parent: null,
    links_to: null,
    check_required_custom_fields: false,
    custom_fields: [],
  },
  updateTask: {
    name: '',
    description: '',
    status: '',
    priority: [],
    due_date: [],
    due_date_time: false,
    time_estimate: [],
    start_date: [],
    start_date_time: false,
    parent: '',
    assignees: { add: [], rem: [] },
    achived: false,
  },
}

export type MultStepGroup={
  multi_quene: MultStepCell[]
  return_label:string[]
}

export type MultStepCell={
    title: string,
    items: string[],
    placeholder?: string,
    prompt?:  string
    inputBox_Set: boolean,
}
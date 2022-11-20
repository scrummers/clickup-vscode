import CloseIcon from '@mui/icons-material/Close'
import FlagIcon from '@mui/icons-material/Flag'
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Theme,
  useTheme,
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import React, { ChangeEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { List, Priority, Status, Tag, User } from '../../src/util/typings/clickup'
import { MessagesContext } from '../context/MessageContext'
import { getDate, getNameById } from '../util/helper'

type InputOptions = {
  lists: List[]
  statuses: Status[]
  tags: Tag[]
  teams: User[]
  priorities: Priority[]
}

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
}

function getStyles(name: string, allNames: readonly string[], theme: Theme) {
  return {
    fontWeight: allNames.indexOf(name) === -1 ? theme.typography.fontWeightRegular : theme.typography.fontWeightMedium,
  }
}

type TaskDate = 'start_date' | 'due_date'

interface NewTask {
  listId: string
  name: string
  description: string
  assignees: User[]
  start_date: string | null
  due_date: string | null
  priority: Priority | null
  tags: Tag[]
  status: Status | null
}

export const AddTask = () => {
  const receivedMessages = useContext(MessagesContext)

  const theme = useTheme()
  const [inputOptions, setInputOptions] = useState<InputOptions>({
    lists: [],
    statuses: [],
    tags: [],
    teams: [],
    priorities: [],
  })
  const [newTask, setNewTask] = useState<NewTask>({
    name: '',
    listId: '',
    description: '',
    assignees: [],
    start_date: null,
    due_date: null,
    priority: null,
    tags: [],
    status: null,
  })
  const [showDateInput, setShowDateInput] = useState<{ [key in TaskDate]: boolean }>({
    start_date: false,
    due_date: false,
  })

  const toggleShowDateInput = (field: TaskDate & keyof NewTask, bool?: boolean) => {
    const _showDateInput = { ...showDateInput, [field]: bool !== undefined ? bool : !showDateInput[field] }
    setShowDateInput(_showDateInput)

    const _updatedTask = { ...newTask } as NewTask
    const timestamp = dayjs().unix()
    _updatedTask[field] = _showDateInput[field] ? (timestamp * 1000).toString() : null
    setNewTask(_updatedTask)
  }

  const onTextChange = (e: ChangeEvent<HTMLInputElement> | any) => {
    const field = (e.target.id || e.target.name) as keyof NewTask
    const value = e.target.value
    const _task = { ...newTask }

    if (field in _task && inputOptions) {
      switch (field) {
        case 'status':
          const statusValue = inputOptions.statuses.find((o) => o.status === value)
          if (statusValue) {
            _task[field] = statusValue
          } else {
            _task[field] = null
          }
          break
        case 'priority':
          if (value === 'none') {
            _task[field] = null as any
          } else {
            const priorityValue = inputOptions.priorities.find((o) => o.id === value)
            if (priorityValue) {
              _task[field] = priorityValue
            }
          }
          break
        case 'assignees':
          const aids = value as number[]

          const assignees = inputOptions.teams.reduce((prev, crnt) => {
            if (aids.includes(crnt.id)) {
              return [...prev, crnt]
            }
            return prev
          }, [] as User[])

          _task[field] = assignees
          break
        case 'tags':
          const tnames = value as string[]

          const tags = inputOptions.tags.reduce((prev, crnt) => {
            if (tnames.includes(crnt.name)) {
              return [...prev, crnt]
            }
            return prev
          }, [] as Tag[])

          _task[field] = tags
          break
        case 'start_date':
        case 'due_date':
          if (!value) {
            setShowDateInput({ ...showDateInput, [field]: false })
            _task[field] = null
            break
          }
          const timestamp = dayjs(value).unix()
          _task[field] = (+timestamp * 1000).toString()
          break
        default:
          _task[field] = value
      }
    }
    setNewTask(_task as any)
  }

  const onLeave = () => {
    vscode.postMessage<CloseMessage>({
      type: 'CLOSE',
    })
  }

  const onSave = () => {
    // call api
    vscode.postMessage<CreateTaskMessage>({
      type: 'CREATE',
      payload: JSON.stringify(newTask),
    })
  }

  useEffect(() => {
    const data = JSON.parse(initData)

    setInputOptions({
      lists: data.lists,
      statuses: data.statuses, // default empty []
      tags: data.tags,
      teams: data.teams,
      priorities: data.priorities,
    })

  }, [])

  useEffect(() => {
    if (receivedMessages.length > 0) {
      const message = JSON.parse(receivedMessages[0])
      if (message.success) {
        onLeave()
      }
    }
  }, [receivedMessages])

  useEffect(() => {
    if (newTask.listId) {
      const list = inputOptions.lists.find((l) => l.id === newTask.listId)
      if (list && list.statuses) {
        setInputOptions({
          ...inputOptions,
          statuses: list.statuses,
        })
        setNewTask({
          ...newTask,
          status: list.statuses[0],
        })
      }
    }
  }, [newTask.listId])

  // useEffect(() => {
  //   console.log({ newTask })
  // }, [newTask])

  if (!newTask) {
    return null
  }

  return (
    // <Container maxWidth="sm">
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="w-96 h-full p-4 rounded-lg border-2 border-slate-700 relative">
        <div className="position">
          {/* <Stack direction="row" spacing={1} style={{ position: 'absolute' }} className="top-2 right-2">
            <Button color="success" onClick={onSave} variant="contained" size="small">
              Create
            </Button> */}
          {/* <ButtonGroup variant="contained" aria-label="Disabled elevation buttons" size="small">
                <Button color="success"  onClick={onSave}>Save</Button>
                <Button color="success"  onClick={onSave}>Save & Leave</Button>
              </ButtonGroup> */}
          {/* <Button onClick={onLeave} variant="text" size="small">
              Cancel
            </Button>
          </Stack> */}
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-lg text-slate-300">Task</div>
            <div className="my-2">
              <TextField
                id="name"
                label="Task name"
                defaultValue={newTask.name}
                fullWidth
                onChange={onTextChange}
                size="small"
              />
            </div>
            {/* <span className="text-sm px-2 py-1 bg-slate-500 rounded-sm shrink"> in {newTask.list.name}</span> */}
          </div>

          <div>
            <label className="text-xs text-slate-300 uppercase">description</label>
            <div className="my-2">
              <TextField
                id="description"
                label="Task description"
                defaultValue={newTask.description}
                fullWidth
                multiline
                onChange={onTextChange}
                size="small"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 uppercase">List (Required)</label>
            <Select
              name="listId"
              required
              id="listId"
              labelId="listId"
              className="capitalize"
              value={newTask!.listId}
              onChange={onTextChange}
              fullWidth
              size="small"
            >
              {inputOptions?.lists.map((option) => (
                <MenuItem key={option.id} value={option.id} className="capitalize">
                  {option.name}
                </MenuItem>
              ))}
            </Select>
          </div>

          {newTask.status && (
            <div>
              <label className="text-xs text-slate-300 uppercase">status</label>
              <Select
                name="status"
                id="status"
                labelId="task-status"
                className="capitalize"
                value={newTask!.status.status}
                onChange={onTextChange}
                fullWidth
                size="small"
              >
                {inputOptions?.statuses.map((option) => (
                  <MenuItem key={option.id} value={option.status} className="capitalize">
                    {option.status}
                  </MenuItem>
                ))}
              </Select>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-300 uppercase">priority</label>
            <Select
              name="priority"
              id="priority"
              labelId="priority"
              className="capitalize"
              value={newTask!.priority ? newTask!.priority.id : 'none'}
              onChange={onTextChange}
              fullWidth
              size="small"
            >
              <MenuItem key="no-priority" value="none" className="capitalize">
                No priority
              </MenuItem>
              {inputOptions?.priorities.map((option) => (
                <MenuItem key={option.id} value={option.id} className="capitalize">
                  <FlagIcon style={{ color: option.color }} />
                  {option.priority}
                </MenuItem>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-300 uppercase">Assignees</label>
            <Select
              labelId="task-assignees"
              name="assignees"
              id="assignees"
              multiple
              value={newTask!.assignees.length > 0 ? newTask!.assignees.map((a) => a.id) : []}
              onChange={onTextChange}
              input={<OutlinedInput />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={getNameById(inputOptions!.teams, 'id', 'username', value)} />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
              fullWidth
              size="small"
            >
              {inputOptions?.teams.map((t) => (
                <MenuItem
                  key={t.id}
                  value={t.id}
                  style={getStyles(
                    t.username,
                    newTask!.assignees.map((a) => a.username),
                    theme
                  )}
                >
                  {t.username}
                </MenuItem>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs text-slate-300 uppercase">tags</label>
            <Select
              labelId="tags"
              name="tags"
              id="tags"
              multiple
              value={newTask!.tags.length > 0 ? newTask!.tags.map((a) => a.name) : []}
              onChange={onTextChange}
              input={<OutlinedInput />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} className="capitalize" />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
              fullWidth
              size="small"
            >
              {inputOptions?.tags.map((t) => (
                <MenuItem
                  key={t.name}
                  value={t.name}
                  className="capitalize"
                  style={getStyles(
                    t.name,
                    newTask!.tags.map((a) => a.name),
                    theme
                  )}
                >
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </div>

          <div className={`flex flex-col space-y-4`}>
            <div className="w-full text-sm">
              <label className="text-xs text-slate-300 uppercase">start date</label>
              {showDateInput?.start_date ? (
                <div className="flex space-x-2">
                  <TextField
                    id="start_date"
                    name="start_date"
                    className="flex-grow"
                    type="datetime-local"
                    onChange={onTextChange}
                    defaultValue={getDate(+newTask.start_date!)}
                    fullWidth
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  <IconButton
                    color="secondary"
                    aria-label="Cancel Date"
                    size="small"
                    className="w-10 h-10"
                    onClick={() => toggleShowDateInput('start_date', false)}
                  >
                    <CloseIcon />
                  </IconButton>
                </div>
              ) : (
                <div>
                  <Button fullWidth onClick={() => toggleShowDateInput('start_date')}>
                    Add +
                  </Button>
                </div>
              )}
            </div>

            <div className="w-full text-sm">
              {showDateInput?.due_date ? (
                <div className="flex space-x-2">
                  <TextField
                    id="due_date"
                    name="due_date"
                    type="datetime-local"
                    onChange={onTextChange}
                    defaultValue={getDate(+newTask.due_date!)}
                    // defaultValue={initDate(newTask.due_date, 'due_date')}
                    fullWidth
                    size="small"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  <IconButton
                    color="secondary"
                    aria-label="Cancel Date"
                    size="small"
                    className="w-10 h-10"
                    onClick={() => toggleShowDateInput('due_date', false)}
                  >
                    <CloseIcon />
                  </IconButton>
                </div>
              ) : (
                <div>
                  <Button fullWidth onClick={() => toggleShowDateInput('due_date')}>
                    Add +
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center item-center">
            <Button onClick={onSave} variant="contained" color="success" fullWidth>
              Create Task
            </Button>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  )
}

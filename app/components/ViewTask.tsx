import dayjs from 'dayjs'
import React, { ChangeEvent, useContext, useEffect, useRef, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import FlagIcon from '@mui/icons-material/Flag'
import {
  Box,
  Button,
  ButtonGroup,
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
import { List, Priority, Status, Tag, User } from '../../src/util/typings/clickup'
import { getDate, getNameById } from '../util/helper'
import { MessagesContext } from '../context/MessageContext'

type InputOptions = {
  lists: List[]
  status: Status[]
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

type TaskEx = Task & {
  start_date: string | null
  due_date: string | null
  priority: Priority | null
}

export const ViewTask = () => {
  const receivedMessages = useContext(MessagesContext)

  const theme = useTheme()
  const inputOptions = useRef<InputOptions>()
  const [task, setTask] = useState<TaskEx>()
  const [isEditMode, setIsEditMode] = useState(true)
  const [updatedTask, setUpdatedTask] = useState<TaskEx>()
  const [showDateInput, setShowDateInput] = useState<{ [key in TaskDate]: boolean }>({
    start_date: false,
    due_date: false,
  })

  const toggleEditMode = () => setIsEditMode(!isEditMode)
  const toggleShowDateInput = (field: TaskDate & keyof TaskEx, bool?: boolean) => {
    const _showDateInput = { ...showDateInput, [field]: bool !== undefined ? bool : !showDateInput[field] }
    setShowDateInput(_showDateInput)

    if (!_showDateInput[field]) {
      const _updatedTask = { ...updatedTask } as TaskEx
      _updatedTask[field] = null as any
      setUpdatedTask(_updatedTask)
    }
  }
  const onCancel = () => {
    setUpdatedTask(task)
    setIsEditMode(false)
  }

  const onTextChange = (e: ChangeEvent<HTMLInputElement> | any) => {
    const field = (e.target.id || e.target.name) as keyof TaskEx
    const value = e.target.value
    const _task = { ...updatedTask }

    if (field in _task && inputOptions.current) {
      switch (field) {
        case 'status':
          const statusValue = inputOptions.current.status.find((o) => o.status === value)
          _task[field] = statusValue
          break
        case 'priority':
          if (value === 'none') {
            _task[field] = null as any
          } else {
            const priorityValue = inputOptions.current.priorities.find((o) => o.id === value)
            if (priorityValue) {
              _task[field] = priorityValue
            }
          }
          break
        case 'assignees':
          const aids = value as number[]

          const assignees = inputOptions.current.teams.reduce((prev, crnt) => {
            if (aids.includes(crnt.id)) {
              return [...prev, crnt]
            }
            return prev
          }, [] as User[])

          _task[field] = assignees
          break
        case 'tags':
          const tnames = value as string[]

          const tags = inputOptions.current.tags.reduce((prev, crnt) => {
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
            _task[field] = null as any
            break
          }
          const timestamp = dayjs(value).unix()
          _task[field] = (+timestamp * 1000).toString()
          break
        default:
          _task[field] = value
      }
    }
    setUpdatedTask(_task as any)
    console.log({ _task })
  }

  const onSave = () => {
    // call api

    vscode.postMessage<UpdateTaskMessage>({
      type: 'UPDATE',
      payload: JSON.stringify(updatedTask),
    })
  }

  useEffect(() => {
    const data = JSON.parse(initData)
    setTask(data.task)
    setUpdatedTask(data.task)

    inputOptions.current = {
      lists: data.lists,
      status: data.status,
      tags: data.tags,
      teams: data.teams,
      priorities: data.priorities,
    }

    setShowDateInput({
      start_date: !!data.task.start_date,
      due_date: !!data.task.due_date,
    })

    console.log(data)
  }, [])

  useEffect(() => {
    if (receivedMessages.length > 0) {
      const message = JSON.parse(receivedMessages[0])
      if (message.success) {
        vscode.postMessage<CloseMessage>({
          type: 'CLOSE',
        })
      }
    }
  }, [receivedMessages])

  if (!task) return <div>Loading</div>

  return (
    // <Container maxWidth="sm">
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="w-96 h-full p-4 rounded-lg border-2 border-slate-700 relative">
        <div className="position">
          {!isEditMode && (
            <Button
              onClick={toggleEditMode}
              className="absolute top-2 right-2"
              variant="contained"
              size="small"
              style={{ position: 'absolute' }}
            >
              Edit
            </Button>
          )}
          {isEditMode && (
            <Stack direction="row" spacing={1} style={{ position: 'absolute' }} className="top-2 right-2">
              <Button color="success" onClick={onSave} variant="contained" size="small">
                Update
              </Button>
              {/* <ButtonGroup variant="contained" aria-label="Disabled elevation buttons" size="small">
                <Button color="success"  onClick={onSave}>Save</Button>
                <Button color="success"  onClick={onSave}>Save & Leave</Button>
              </ButtonGroup> */}
              <Button onClick={onCancel} variant="text" size="small">
                Cancel
              </Button>
            </Stack>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-lg text-slate-300">Task</div>
            {!isEditMode ? (
              <div className="text-xl">{task.name}</div>
            ) : (
              <div className="my-2">
                <TextField
                  id="name"
                  label="Task name"
                  defaultValue={task.name}
                  fullWidth
                  onChange={onTextChange}
                  size="small"
                />
              </div>
            )}
            <span className="text-sm px-2 py-1 bg-slate-500 rounded-sm shrink"> in {task.list.name}</span>
          </div>

          <div>
            <label className="text-xs text-slate-300 uppercase">description</label>
            {!isEditMode ? (
              !task.description ? (
                <div className=" bg-slate-800 p-2 rounded-sm text-slate-500 capitalize">no description</div>
              ) : (
                <div className=" bg-slate-800 p-2 rounded-sm">{task.description}</div>
              )
            ) : (
              <div className="my-2">
                <TextField
                  id="description"
                  label="Task description"
                  defaultValue={task.description}
                  fullWidth
                  multiline
                  onChange={onTextChange}
                  size="small"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-300 uppercase">status</label>
            {!isEditMode ? (
              <div
                className=" bg-slate-800 p-2 rounded-sm uppercase text-slate-800 font-bold"
                style={{ background: task.status.color }}
              >
                {task.status.status}
              </div>
            ) : (
              <Select
                name="status"
                id="status"
                labelId="task-status"
                className="capitalize"
                value={updatedTask!.status.status}
                onChange={onTextChange}
                fullWidth
                size="small"
              >
                {inputOptions.current?.status.map((option) => (
                  <MenuItem key={option.id} value={option.status} className="capitalize">
                    {option.status}
                  </MenuItem>
                ))}
              </Select>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-300 uppercase">priority</label>
            {!isEditMode ? (
              !task.priority ? (
                <div className=" bg-slate-800 p-2 rounded-sm text-slate-500 capitalize">no priority</div>
              ) : (
                <div className=" bg-slate-800 p-2 rounded-sm capitalize">
                  <FlagIcon style={{ color: task.priority.color }} />
                  {task.priority.priority}
                </div>
              )
            ) : (
              <Select
                name="priority"
                id="priority"
                labelId="priority"
                className="capitalize"
                value={updatedTask!.priority ? updatedTask!.priority.id : 'none'}
                onChange={onTextChange}
                fullWidth
                size="small"
              >
                <MenuItem key="no-priority" value="none" className="capitalize">
                  No priority
                </MenuItem>
                {inputOptions.current?.priorities.map((option) => (
                  <MenuItem key={option.id} value={option.id} className="capitalize">
                    <FlagIcon style={{ color: option.color }} />
                    {option.priority}
                  </MenuItem>
                ))}
              </Select>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-300 uppercase">Assignees</label>
            {!isEditMode ? (
              task.assignees.length === 0 ? (
                <div className=" bg-slate-800 p-2 rounded-sm text-slate-500 capitalize">no Assignees</div>
              ) : (
                <div className="text-sm space-x-1 space-y-1 mt-1">
                  {task.assignees.map((a) => (
                    <div key={a.username} className="p-2 h-10">
                      <span className="w-full h-full text-xs rounded-full p-2" style={{ background: a.color }}>
                        {a.initials}
                      </span>{' '}
                      {a.username}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <Select
                labelId="task-assignees"
                name="assignees"
                id="assignees"
                multiple
                value={updatedTask!.assignees.length > 0 ? updatedTask!.assignees.map((a) => a.id) : []}
                onChange={onTextChange}
                input={<OutlinedInput />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={getNameById(inputOptions.current!.teams, 'id', 'username', value)} />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
                fullWidth
                size="small"
              >
                {inputOptions.current?.teams.map((t) => (
                  <MenuItem
                    key={t.id}
                    value={t.id}
                    style={getStyles(
                      t.username,
                      updatedTask!.assignees.map((a) => a.username),
                      theme
                    )}
                  >
                    {t.username}
                  </MenuItem>
                ))}
              </Select>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-300 uppercase">tags</label>
            {!isEditMode ? (
              task.tags.length === 0 ? (
                <div className=" bg-slate-800 p-2 rounded-sm text-slate-500 capitalize">no tags</div>
              ) : (
                <div className="text-sm space-x-1 space-y-1">
                  {task.tags.map((t) => (
                    <span key={t.name} className="px-4 py-1 bg-slate-500 rounded-full">
                      {t.name}
                    </span>
                  ))}
                </div>
              )
            ) : (
              <Select
                labelId="tags"
                name="tags"
                id="tags"
                multiple
                value={updatedTask!.tags.length > 0 ? updatedTask!.tags.map((a) => a.name) : []}
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
                {inputOptions.current?.tags.map((t) => (
                  <MenuItem
                    key={t.name}
                    value={t.name}
                    className="capitalize"
                    style={getStyles(
                      t.name,
                      updatedTask!.tags.map((a) => a.name),
                      theme
                    )}
                  >
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          </div>

          <div className={`flex ${isEditMode ? 'flex-col space-y-4' : 'space-x-2'}`}>
            <div className="w-full text-sm">
              <label className="text-xs text-slate-300 uppercase">start date</label>
              {!isEditMode ? (
                <div className="bg-slate-800 p-2 rounded-sm">{getDate(+task.start_date, true)}</div>
              ) : showDateInput?.start_date ? (
                <div className="flex space-x-2">
                  <TextField
                    id="start_date"
                    name="start_date"
                    className="flex-grow"
                    type="datetime-local"
                    onChange={onTextChange}
                    defaultValue={getDate(+updatedTask!.start_date)}
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
              <label className="text-xs text-slate-300 uppercase">due date</label>
              {!isEditMode ? (
                <div className="bg-slate-800 p-2 rounded-sm">{getDate(+task.start_date, true)}</div>
              ) : showDateInput?.due_date ? (
                <div className="flex space-x-2">
                  <TextField
                    id="due_date"
                    name="due_date"
                    type="datetime-local"
                    onChange={onTextChange}
                    defaultValue={getDate(+updatedTask!.due_date)}
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
            {isEditMode && (
              <Button variant="contained" color="error">
                Delete Task
              </Button>
            )}
          </div>
        </div>
      </div>
    </LocalizationProvider>
  )
}

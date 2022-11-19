import React from 'react'
import { Home } from '../components/Home'
import { AddTask } from '../components/AddTask'
import { UpdateTask } from '../components/UpdateTask'
import { ViewTask } from '../components/ViewTask'

export type RouteConfigComponentProps = Pick<RouteConfig, 'routes'>

export type RouteConfig = {
  path: string
  component: React.ComponentType<RouteConfigComponentProps>
  exact?: boolean
  routes?: RouteConfig[]
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    component: Home,
    exact: true,
  },
  {
    path: '/view-task',
    component: ViewTask,
  },
  {
    path: '/add-task',
    component: AddTask,
  },
  {
    path: '/update-task',
    component: UpdateTask,
  },
]

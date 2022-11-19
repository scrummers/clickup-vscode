import React from 'react'
import { Route } from 'react-router-dom'
import { RouteConfig } from './config'

export const RouteWithSubRoutes = (route: any) => {
  return (
    <Route path={route.path}>
      <route.component routes={route.routes} />
    </Route>
  )
}

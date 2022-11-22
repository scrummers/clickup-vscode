import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'

export const Home = () => {
  const history = useHistory()

  useEffect(() => {
    history.push(initRoute)
  }, [])

  return <div>ClickUp</div>
}

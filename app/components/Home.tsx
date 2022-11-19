import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { CommonMessage } from '../../src/util/typings/message'
import { MessagesContext } from '../context/MessageContext'

export const Home = () => {
  const history = useHistory()

  useEffect(() => {
    history.push(initRoute)
  }, [])

  return <div>ClickUp</div>
}

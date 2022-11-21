import React, { useCallback, useEffect, useState } from 'react'
import { MemoryRouter as Router, Link, Switch } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { CommonMessage, Message, ReloadMessage } from '../../src/util/typings/message'
import { routes } from '../routes/config'
import { RouteWithSubRoutes } from '../routes/RouteWithSubRoutes'
import { MessagesContext } from '../context/MessageContext'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
})

export const App = () => {
  const [messagesFromExtension, setMessagesFromExtension] = useState<MessageEvent<Message>[]>([])

  const handleMessagesFromExtension = useCallback(
    (event: MessageEvent<Message>) => {
      // if (event.data.type === 'COMMON' || event.data.type === 'INIT') {
      //   const message = event.data as CommonMessage
      //   setMessagesFromExtension([...messagesFromExtension, message.payload])
      // }
      setMessagesFromExtension([...messagesFromExtension, event])
    },
    [messagesFromExtension]
  )

  useEffect(() => {
    window.addEventListener('message', (event: MessageEvent<Message>) => {
      handleMessagesFromExtension(event)
    })

    return () => {
      window.removeEventListener('message', handleMessagesFromExtension)
    }
  }, [handleMessagesFromExtension])

  const handleReloadWebview = () => {
    // @ts-ignore
    vscode.postMessage<ReloadMessage>({
      type: 'RELOAD',
    })
  }

  useEffect(() => {
    if (messagesFromExtension.length > 0) {
      setMessagesFromExtension([])
    }
  }, [messagesFromExtension])

  return (
    <Router initialEntries={['/', '/addTask', '/updateTask']}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline enableColorScheme />
        <main className="py-4 scale-90 origin-top-left">
          {/* <button onClick={handleReloadWebview}>Reload Webview</button> */}
          <MessagesContext.Provider value={messagesFromExtension}>
            <Switch>
              {routes!.map((route, i) => (
                <RouteWithSubRoutes key={i} {...route} />
              ))}
            </Switch>
          </MessagesContext.Provider>
        </main>
      </ThemeProvider>
    </Router>
  )
}

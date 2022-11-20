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
  const [messagesFromExtension, setMessagesFromExtension] = useState<string[]>([])

  const handleMessagesFromExtension = useCallback(
    (event: MessageEvent<Message>) => {
      if (event.data.type === 'COMMON') {
        const message = event.data as CommonMessage
        setMessagesFromExtension([...messagesFromExtension, message.payload])
      }
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

  return (
    <Router initialEntries={['/', '/addTask', '/updateTask']}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline enableColorScheme/>
        <main className='py-4'>
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

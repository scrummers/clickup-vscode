import React, { useEffect } from 'react'
// import { Client } from '../../src/clients/Client'
import { Box, Container, TextField } from '@mui/material'
import { CommonMessage } from '../../src/util/typings/message'

export const AddTask = () => {
  useEffect(() => {
    vscode.postMessage<CommonMessage>({
      type: 'COMMON',
      payload: 'hi',
    })
  }, [])

  return (
    <Container maxWidth="sm">
      <Box component="form" noValidate autoComplete="off" sx={{ p: 4 }}>
        <div className="space-y-4">
          <h1 className="text-2xl py-8">Task</h1>
        </div>
      </Box>
    </Container>
  )
}

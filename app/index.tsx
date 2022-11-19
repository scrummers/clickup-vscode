import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './components/App'
import './index.css'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

declare const initData: string;

ReactDOM.render(<App />, document.getElementById('root'))

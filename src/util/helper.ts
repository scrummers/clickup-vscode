import * as dayjs from 'dayjs'
import path = require('path')

type IconPath = {
    light: string
    dark: string
}

export const getDate = (timestamp: number): string => {
    return dayjs(timestamp).format('DD/MM/YYYY')
}

export const getIcon = (filename: string): IconPath => {
    return {
        light: path.join(__filename, '..', '..', 'resources', 'light', filename),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', filename)
    }
}
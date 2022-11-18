import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import path = require('path')
dayjs.extend(utc)

type IconPath = {
    light: string
    dark: string
}

export const getDate = (timestamp: number): string => {
    return dayjs(timestamp).utc().local().format('DD/MM/YYYY @h:mma')
}

export const getUtcTodayStart = (): number => {
    const date = new Date().setHours(0, 0, 0, 0)
    return dayjs(date).utc().unix() * 1000
}

export const getUtcTodayEnd = (): number => {
    const date = new Date().setHours(23, 59, 0, 0)
    return dayjs(date).utc().unix() * 1000
}

export const getIcon = (filename: string): IconPath => {
    return {
        light: path.join(__filename, '..', '..', 'resources', 'light', filename),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', filename)
    }
}
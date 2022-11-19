/* tslint:disable */ 
import path from 'path'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
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
    const resourcePath = path.join(__filename, '..', '..', '..', '..', 'resources')
    return {
        light: path.join(resourcePath, 'light', filename),
        dark: path.join(resourcePath, 'dark', filename)
    }
}
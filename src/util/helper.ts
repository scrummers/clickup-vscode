import * as dayjs from 'dayjs'

export const getDate = (timestamp: number): string => {
    return dayjs(timestamp).format('DD/MM/YYYY') 
}

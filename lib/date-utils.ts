import { startOfDay, endOfDay, addHours, addMinutes, subHours, subMinutes } from 'date-fns'

/*
 * Constants for Indian Standard Time (IST)
 * IST is UTC + 5:30
 */
const IST_OFFSET_HOURS = 5
const IST_OFFSET_MINUTES = 30
const IST_TIMEZONE = 'Asia/Kolkata'

/**
 * Get the current date in IST.
 * This returns a Date object that represents the current time in IST.
 * Note: The Date object itself is time-zone agnostic (unix timestamp),
 * but this is useful when we need "now" relative to the server time.
 */
/**
 * Get the current date in IST.
 * This returns a Date object that represents the current time in IST.
 * Note: The Date object itself is time-zone agnostic (unix timestamp),
 * but this is effectively UTC-shifted by +5:30.
 */
export function getCurrentDate(): Date {
    // Add 5 hours 30 minutes to current UTC time to get IST "wall clock" time
    return new Date(Date.now() + (5.5 * 60 * 60 * 1000))
}

export const getISTDate = getCurrentDate;

/**
 * Get the start of the day in UTC, corresponding to 00:00:00 IST.
 * 00:00 IST = 18:30 UTC (previous day)
 * @param date - The date string (YYYY-MM-DD) or Date object
 */
export function startOfDayIST(date: Date | string): Date {
    const d = new Date(date)

    // Set to midnight UTC first to normalize input
    // If input is YYYY-MM-DD string, it's parsed as UTC midnight
    if (typeof date === 'string') {
        // Ensure we parse the date string as if it's a date in IST
        // We can just take the string components to avoid timezone confusion
        const targetDate = new Date(date)
        // Reset to midnight UTC
        targetDate.setUTCHours(0, 0, 0, 0)

        // 00:00 IST is 18:30 UTC previous day
        // So subtracting 5.5 hours from 00:00 gives us the UTC timestamp
        const utcStart = subMinutes(subHours(targetDate, IST_OFFSET_HOURS), IST_OFFSET_MINUTES)
        return utcStart
    }

    // If it's a Date object, assume it represents the target day
    // We want to find the midnight of THAT day in IST, expressed as UTC

    // 1. Get the ISO string in IST to find the YYYY-MM-DD
    const istDateStr = d.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE }) // YYYY-MM-DD

    // 2. Create UTC midnight for that date
    const utcMidnight = new Date(`${istDateStr}T00:00:00.000Z`)

    // 3. Subtract 5:30 to get IST midnight in UTC
    return subMinutes(subHours(utcMidnight, IST_OFFSET_HOURS), IST_OFFSET_MINUTES)
}

/**
 * Get the end of the day in UTC, corresponding to 23:59:59.999 IST.
 * 00:00 IST (Next Day) = 18:30 UTC (Current Day) -> so 23:59:59 IST is 18:29:59 UTC
 * @param date - The date string (YYYY-MM-DD) or Date object
 */
export function endOfDayIST(date: Date | string): Date {
    const start = startOfDayIST(date)
    // Add 24 hours - 1ms
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
    return end
}

/**
 * Format a date string or object to "DD MMM YYYY" in IST.
 */
export function formatDateIST(date: Date | string): string {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-IN', {
        timeZone: IST_TIMEZONE,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

/**
 * Format a date string or object to "DD MMM YYYY, hh:mm a" in IST.
 */
export function formatDateTimeIST(date: Date | string): string {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleString('en-IN', {
        timeZone: IST_TIMEZONE,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
}

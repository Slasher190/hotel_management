// Returns YYYY-MM-DD in IST
export function getLocalDateISOString(date = new Date()): string {
    const d = new Date(date)
    // Add 5 hours 30 minutes to get IST "wall clock" time in UTC object
    const istOffset = 5.5 * 60 * 60 * 1000
    const istDate = new Date(d.getTime() + istOffset)
    return istDate.toISOString().split('T')[0]
}

// Returns YYYY-MM-DDTHH:mm in IST (compatible with datetime-local input)
export function getLocalDateTimeISOString(date = new Date()): string {
    const d = new Date(date)
    // Add 5 hours 30 minutes to get IST
    const istOffset = 5.5 * 60 * 60 * 1000
    const istDate = new Date(d.getTime() + istOffset)
    return istDate.toISOString().slice(0, 16)
}

export function maskIdNumber(idNumber: string | null | undefined, idType?: string): string {
    if (!idNumber) return 'N/A'
    if (idNumber.length >= 4) {
        return `XXXX XXXX ${idNumber.substring(idNumber.length - 4)}`
    }
    return idNumber
}

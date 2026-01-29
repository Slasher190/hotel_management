export function getLocalDateISOString(date = new Date()): string {
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - (offset * 60 * 1000))
    return localDate.toISOString().split('T')[0]
}

export function getLocalDateTimeISOString(date = new Date()): string {
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - (offset * 60 * 1000))
    return localDate.toISOString().slice(0, 16)
}

export function maskIdNumber(idNumber: string | null | undefined, idType?: string): string {
    if (!idNumber) return 'N/A'
    if (idNumber.length >= 4) {
        return `XXXX XXXX ${idNumber.substring(idNumber.length - 4)}`
    }
    return idNumber
}

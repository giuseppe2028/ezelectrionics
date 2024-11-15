import { User, Role } from "./components/user"
const DATE_ERROR = "Input date is not compatible with the current date"

/**
 * Represents a utility class.
 */
class Utility {
    /**
     * Checks if a user is a manager.
     * @param {User} user - The user to check.
     * @returns True if the user is a manager, false otherwise.
     */
    static isManager(user: User): boolean {
        return user.role === Role.MANAGER
    }
    /**
     * Checks if a user is a customer.
     * @param {User} user - The user to check.
     * @returns True if the user is a customer, false otherwise.
     */
    static isCustomer(user: User): boolean {
        return user.role === Role.CUSTOMER
    }

    static isAdmin(user: User): boolean {
        return user.role === Role.ADMIN
    }

    static getDateString(date?: Date): string {
        date = date || new Date()
        const year = String(date.getUTCFullYear()).padStart(4, "0")
        // Date.getUTCMonth is 0-based
        const month = String(date.getUTCMonth() + 1).padStart(2, "0")
        const day = String(date.getUTCDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
    }
}

class DateError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = DATE_ERROR
        this.customCode = 400
    }
}

export { Utility, DateError }

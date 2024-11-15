import { test, expect, jest, describe, afterEach, beforeEach } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { UserAlreadyExistsError, UserIsAdminError, UserNotAdminError, UserNotFoundError } from "../../src/errors/userError"
import { User, Role } from "../../src/components/user"
import { Utility } from "../../src/utilities"

describe("User Controller Unit Tests", () => {

    let controller: UserController
    beforeEach(() => {
        controller = new UserController()
    })
    afterEach(() => {
        jest.clearAllMocks()
    })

    const testUser = { //Define a test user object
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: Role.CUSTOMER,
        address: "address",
        birthdate: "1999/09/09"
    }

    describe("Create User", () => {

        test("Successfully", async () => {
            jest.spyOn(UserDAO.prototype, "createUser")
                .mockResolvedValueOnce(true)

            const response = await controller.createUser(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role
            )

            expect(UserDAO.prototype.createUser)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.createUser)
                .toHaveBeenCalledWith(
                    testUser.username,
                    testUser.name,
                    testUser.surname,
                    testUser.password,
                    testUser.role
                )
            expect(response)
                .toBe(true)
        })

        test("Duplicate user", async () => {
            jest.spyOn(UserDAO.prototype, "createUser")
                .mockRejectedValueOnce(new UserAlreadyExistsError)

            const response = await controller.createUser(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role
            ).catch((err) => err)

            expect(UserDAO.prototype.createUser)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.createUser)
                .toHaveBeenCalledWith(testUser.username,
                    testUser.name,
                    testUser.surname,
                    testUser.password,
                    testUser.role
                )

            expect(response)
                .toBeInstanceOf(UserAlreadyExistsError)
            expect(response.customMessage)
                .toBe("The username already exists")
        })

    })

    describe("Get all users", () => {
        test("Succesfully", async () => {
            const testUser1: User = new User("User1", "Name1", "Surname1", Role.CUSTOMER, "Address1", "2000/01/01")
            const testUser2: User = new User("User2", "Name2", "Surname2", Role.MANAGER, "Address2", "1999/12/31")
            const userlist: User[] = [testUser1, testUser2]
            jest.spyOn(UserDAO.prototype, "getUsers")
                .mockResolvedValueOnce(userlist)

            const response = await controller.getUsers()

            expect(UserDAO.prototype.getUsers)
                .toHaveBeenCalledTimes(1)
            expect(response)
                .toBe(userlist)
        })

        test("Empty list", async () => {
            const userlist: User[] = []
            jest.spyOn(UserDAO.prototype, "getUsers")
                .mockResolvedValueOnce(userlist)

            const response = await controller.getUsers()

            expect(UserDAO.prototype.getUsers)
                .toHaveBeenCalledTimes(1)
            expect(response)
                .toBe(userlist)
        })
    })

    describe("Get users by Role", () => {
        test("It should return customers", async () => {
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.role,
                testUser.address,
                testUser.birthdate
            )
            const testUser2: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.role,
                testUser.address,
                testUser.birthdate
            )
            const userList: User[] = [testUser1, testUser2]
            jest.spyOn(UserDAO.prototype, "getUsersByRole")
                .mockResolvedValueOnce(userList)

            const response = await controller.getUsersByRole("Customer")

            expect(UserDAO.prototype.getUsersByRole)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.getUsersByRole)
                .toHaveBeenCalledWith("Customer")
            expect(response)
                .toBe(userList)
        })
    })

    describe("Get users by Username", () => {
        test("User is self", async () => {
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.role,
                testUser.address,
                testUser.birthdate
            )
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
                .mockResolvedValueOnce(testUser1)
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValue(false)

            const response = await controller.getUserByUsername(testUser1, testUser1.username)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(1)
            expect(Utility.isAdmin)
                .toHaveBeenCalledWith(testUser1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledWith(testUser.username)
            expect(response)
                .toBe(testUser1)
        })

        test("User is Admin", async () => {
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.role,
                testUser.address,
                testUser.birthdate
            )
            const testUserAdmin: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.ADMIN,
                testUser.address,
                testUser.birthdate
            )
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
                .mockResolvedValueOnce(testUser1)
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValue(true)

            const response = await controller.getUserByUsername(testUserAdmin, testUser.username)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(1)
            expect(Utility.isAdmin)
                .toHaveBeenCalledWith(testUserAdmin)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledWith(testUser.username)
            expect(response)
                .toBe(testUser1)
        })

        test("User is not self nor Admin", async () => {
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.CUSTOMER,
                testUser.address,
                testUser.birthdate
            )
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValue(false)

            await expect(controller.getUserByUsername(
                testUser1,
                "Not same username"
            )).rejects.toBeInstanceOf(UserNotAdminError)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(1)
            expect(Utility.isAdmin)
                .toHaveBeenCalledWith(testUser1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(0)
        })

        test("User not found", async () => {
            const testUserAdmin: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.ADMIN,
                testUser.address,
                testUser.birthdate
            )
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
                .mockRejectedValue(new UserNotFoundError)
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValue(true)

            await expect(controller.getUserByUsername(
                testUserAdmin,
                "Not same username"
            )).rejects.toBeInstanceOf(UserNotFoundError)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(1)
            expect(Utility.isAdmin)
                .toHaveBeenCalledWith(testUserAdmin)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledWith("Not same username")
        })
    })

    describe("Delete User by Username", () => {
        test("User is self", async () => {
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.CUSTOMER,
                testUser.address,
                testUser.birthdate
            )
            jest.spyOn(Utility, "isAdmin")
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
            jest.spyOn(UserDAO.prototype, "deleteUser")
                .mockResolvedValueOnce(true)

            const response = await controller.deleteUser(testUser1, testUser1.username)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(0)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(0)
            expect(UserDAO.prototype.deleteUser)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.deleteUser)
                .toHaveBeenCalledWith(testUser1.username)
            expect(response)
                .toBe(true)
        })

        test("User is not Admin", async () => {
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.CUSTOMER,
                testUser.address,
                testUser.birthdate
            )
            const testUserNotAdmin: User = new User(
                "Not an Admin username",
                testUser.name,
                testUser.surname,
                Role.CUSTOMER,
                testUser.address,
                testUser.birthdate
            )
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValue(false)
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
            jest.spyOn(UserDAO.prototype, "deleteUser")

            await expect(controller.deleteUser(
                testUserNotAdmin,
                testUser1.username
            )).rejects.toBeInstanceOf(UserNotAdminError)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(0)
            expect(UserDAO.prototype.deleteUser)
                .toHaveBeenCalledTimes(0)
        })

        test("User is Admin deleting Customer", async () => {
            const testUserAdmin: User = new User(
                "ADMIN username",
                testUser.name,
                testUser.surname,
                Role.ADMIN,
                testUser.address,
                testUser.birthdate
            )
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.CUSTOMER,
                testUser.address,
                testUser.birthdate
            )
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
                .mockResolvedValue(testUser1)
            jest.spyOn(UserDAO.prototype, "deleteUser")
                .mockResolvedValueOnce(true)

            const response = await controller.deleteUser(testUserAdmin, testUser1.username)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(2)
            expect(Utility.isAdmin)
                .toHaveBeenNthCalledWith(1, testUserAdmin)
            expect(Utility.isAdmin)
                .toHaveBeenNthCalledWith(2, testUser1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledWith(testUser1.username)
            expect(UserDAO.prototype.deleteUser)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.deleteUser)
                .toHaveBeenCalledWith(testUser1.username)
            expect(response)
                .toBe(true)
        })

        test("User is Admin deleting Manager", async () => {
            const testUserAdmin: User = new User(
                "ADMIN username",
                testUser.name,
                testUser.surname,
                Role.ADMIN,
                testUser.address,
                testUser.birthdate
            )
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.MANAGER,
                testUser.address,
                testUser.birthdate
            )
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
                .mockResolvedValue(testUser1)
            jest.spyOn(UserDAO.prototype, "deleteUser")
                .mockResolvedValueOnce(true)

            const response = await controller.deleteUser(testUserAdmin, testUser1.username)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(2)
            expect(Utility.isAdmin)
                .toHaveBeenNthCalledWith(1, testUserAdmin)
            expect(Utility.isAdmin)
                .toHaveBeenNthCalledWith(2, testUser1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledWith(testUser1.username)
            expect(UserDAO.prototype.deleteUser)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.deleteUser)
                .toHaveBeenCalledWith(testUser1.username)
            expect(response)
                .toBe(true)
        })

        test("User is Admin deleting Admin", async () => {
            const testUserAdmin: User = new User(
                "ADMIN username",
                testUser.name,
                testUser.surname,
                Role.ADMIN,
                testUser.address,
                testUser.birthdate
            )
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.CUSTOMER,
                testUser.address,
                testUser.birthdate
            )
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
                .mockResolvedValue(testUser1)
            jest.spyOn(UserDAO.prototype, "deleteUser")

            await expect(controller.deleteUser(
                testUserAdmin, testUser1.username
            )).rejects.toBeInstanceOf(UserIsAdminError)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(2)
            expect(Utility.isAdmin)
                .toHaveBeenNthCalledWith(1, testUserAdmin)
            expect(Utility.isAdmin)
                .toHaveBeenNthCalledWith(2, testUser1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledWith(testUser1.username)
            expect(UserDAO.prototype.deleteUser)
                .toHaveBeenCalledTimes(0)
        })

        test("User is Admin deleting non-existing User", async () => {
            const testUserAdmin: User = new User(
                "ADMIN username",
                testUser.name,
                testUser.surname,
                Role.ADMIN,
                testUser.address,
                testUser.birthdate
            )
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.CUSTOMER,
                testUser.address,
                testUser.birthdate
            )
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValue(true)
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
                .mockRejectedValue(new UserNotFoundError)
            jest.spyOn(UserDAO.prototype, "deleteUser")

            await expect(controller.deleteUser(
                testUserAdmin, testUser1.username
            )).rejects.toBeInstanceOf(UserNotFoundError)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(1)
            expect(Utility.isAdmin)
                .toHaveBeenCalledWith(testUserAdmin)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.deleteUser)
                .toHaveBeenCalledTimes(0)
        })
    })

    describe("Delete all non-admin Users", () => {
        test("Successfully", async () => {
            jest.spyOn(UserDAO.prototype, "deleteAll")
                .mockResolvedValue(true)

            const response = await controller.deleteAll()

            expect(UserDAO.prototype.deleteAll)
                .toHaveBeenCalledTimes(1)
            expect(response)
                .toBe(true)
        })
    })

    describe("Update user information", () => {
        test("User is self", async () => {
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.CUSTOMER,
                testUser.address,
                testUser.birthdate
            )
            const testUserUpdate: User = new User(
                testUser1.username,
                "new name",
                "new surname",
                testUser1.role,
                "new address",
                "1912/12/12"
            )
            jest.spyOn(Utility, "isAdmin")
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
            jest.spyOn(UserDAO.prototype, "updateUserInfo")
                .mockResolvedValue(testUserUpdate)

            const response = await controller.updateUserInfo(
                testUser1,
                testUserUpdate.name,
                testUserUpdate.surname,
                testUserUpdate.address,
                testUserUpdate.birthdate,
                testUser1.username
            )

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(0)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(0)
            expect(UserDAO.prototype.updateUserInfo)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.updateUserInfo)
                .toHaveBeenCalledWith(
                    testUserUpdate.name,
                    testUserUpdate.surname,
                    testUserUpdate.address,
                    testUserUpdate.birthdate,
                    testUserUpdate.username,
                )
            expect(response)
                .toBe(testUserUpdate)
        })

        test("User is not self", async () => {
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.CUSTOMER,
                testUser.address,
                testUser.birthdate
            )
            const testUserUpdate: User = new User(
                "different username",
                "new name",
                "new surname",
                Role.CUSTOMER,
                "new address",
                "1912/12/12"
            )
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValue(false)
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
            jest.spyOn(UserDAO.prototype, "updateUserInfo")

            await expect(controller.updateUserInfo(
                testUser1,
                testUserUpdate.name,
                testUserUpdate.surname,
                testUserUpdate.address,
                testUserUpdate.birthdate,
                testUserUpdate.username
            )).rejects.toBeInstanceOf(UserNotAdminError)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(1)
            expect(Utility.isAdmin)
                .toHaveBeenCalledWith(testUser1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(0)
            expect(UserDAO.prototype.updateUserInfo)
                .toHaveBeenCalledTimes(0)
        })

        test("User is Admin updating Customer info", async () => {
            const testUserAdmin: User = new User(
                "Admin username",
                testUser.name,
                testUser.surname,
                Role.ADMIN,
                testUser.address,
                testUser.birthdate
            )
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.CUSTOMER,
                testUser.address,
                testUser.birthdate
            )
            const testUserUpdate: User = new User(
                testUser1.username,
                "new name",
                "new surname",
                testUser1.role,
                "new address",
                "1912/12/12"
            )
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
                .mockResolvedValue(testUser1)
            jest.spyOn(UserDAO.prototype, "updateUserInfo")
                .mockResolvedValue(testUserUpdate)

            const response = await controller.updateUserInfo(
                testUserAdmin,
                testUserUpdate.name,
                testUserUpdate.surname,
                testUserUpdate.address,
                testUserUpdate.birthdate,
                testUser1.username
            )

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(2)
            expect(Utility.isAdmin)
                .toHaveBeenNthCalledWith(1, testUserAdmin)
            expect(Utility.isAdmin)
                .toHaveBeenNthCalledWith(2, testUser1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledWith(testUser1.username)
            expect(UserDAO.prototype.updateUserInfo)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.updateUserInfo)
                .toHaveBeenCalledWith(
                    testUserUpdate.name,
                    testUserUpdate.surname,
                    testUserUpdate.address,
                    testUserUpdate.birthdate,
                    testUserUpdate.username,
                )
            expect(response)
                .toBe(testUserUpdate)
        })

        test("User is Admin updating Manager info", async () => {
            const testUserAdmin: User = new User(
                "Admin username",
                testUser.name,
                testUser.surname,
                Role.ADMIN,
                testUser.address,
                testUser.birthdate
            )
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.MANAGER,
                testUser.address,
                testUser.birthdate
            )
            const testUserUpdate: User = new User(
                testUser1.username,
                "new name",
                "new surname",
                testUser1.role,
                "new address",
                "1912/12/12"
            )
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false)
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
                .mockResolvedValue(testUser1)
            jest.spyOn(UserDAO.prototype, "updateUserInfo")
                .mockResolvedValue(testUserUpdate)

            const response = await controller.updateUserInfo(
                testUserAdmin,
                testUserUpdate.name,
                testUserUpdate.surname,
                testUserUpdate.address,
                testUserUpdate.birthdate,
                testUser1.username
            )

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(2)
            expect(Utility.isAdmin)
                .toHaveBeenNthCalledWith(1, testUserAdmin)
            expect(Utility.isAdmin)
                .toHaveBeenNthCalledWith(2, testUser1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledWith(testUser1.username)
            expect(UserDAO.prototype.updateUserInfo)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.updateUserInfo)
                .toHaveBeenCalledWith(
                    testUserUpdate.name,
                    testUserUpdate.surname,
                    testUserUpdate.address,
                    testUserUpdate.birthdate,
                    testUserUpdate.username,
                )
            expect(response)
                .toBe(testUserUpdate)
        })

        test("User is Admin updating Admin info", async () => {
            const testUserAdmin: User = new User(
                "Admin username",
                testUser.name,
                testUser.surname,
                Role.ADMIN,
                testUser.address,
                testUser.birthdate
            )
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.ADMIN,
                testUser.address,
                testUser.birthdate
            )
            const testUserUpdate: User = new User(
                testUser1.username,
                "new name",
                "new surname",
                testUser1.role,
                "new address",
                "1912/12/12"
            )
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
                .mockResolvedValue(testUser1)
            jest.spyOn(UserDAO.prototype, "updateUserInfo")

            await expect(controller.updateUserInfo(
                testUserAdmin,
                testUserUpdate.name,
                testUserUpdate.surname,
                testUserUpdate.address,
                testUserUpdate.birthdate,
                testUser1.username
            )).rejects.toBeInstanceOf(UserIsAdminError)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(2)
            expect(Utility.isAdmin)
                .toHaveBeenNthCalledWith(1, testUserAdmin)
            expect(Utility.isAdmin)
                .toHaveBeenNthCalledWith(2, testUser1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledWith(testUser1.username)
            expect(UserDAO.prototype.updateUserInfo)
                .toHaveBeenCalledTimes(0)
        })

        test("User is Admin updating non-existing User info", async () => {
            const testUserAdmin: User = new User(
                "Admin username",
                testUser.name,
                testUser.surname,
                Role.ADMIN,
                testUser.address,
                testUser.birthdate
            )
            const testUser1: User = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                Role.CUSTOMER,
                testUser.address,
                testUser.birthdate
            )
            const testUserUpdate: User = new User(
                testUser1.username,
                "new name",
                "new surname",
                testUser1.role,
                "new address",
                "1912/12/12"
            )
            jest.spyOn(Utility, "isAdmin")
                .mockReturnValue(true)
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
                .mockRejectedValue(new UserNotFoundError)
            jest.spyOn(UserDAO.prototype, "updateUserInfo")

            await expect(controller.updateUserInfo(
                testUserAdmin,
                testUserUpdate.name,
                testUserUpdate.surname,
                testUserUpdate.address,
                testUserUpdate.birthdate,
                testUser1.username
            )).rejects.toBeInstanceOf(UserNotFoundError)

            expect(Utility.isAdmin)
                .toHaveBeenCalledTimes(1)
            expect(Utility.isAdmin)
                .toHaveBeenCalledWith(testUserAdmin)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledTimes(1)
            expect(UserDAO.prototype.getUserByUsername)
                .toHaveBeenCalledWith(testUser1.username)
        })
    })
})

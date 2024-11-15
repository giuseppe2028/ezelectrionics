import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Role, User } from "../../src/components/user"
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError"

describe("UserDAO Unit Tests", () => {
    let userDAO: UserDAO
    beforeEach(() => {
        userDAO = new UserDAO()
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

    describe("Check if User is authenticated", () => {
        test("Password accepted", async () => {
            const salt = Buffer.from("salt")
            const size = 16
            const hashedPassword = Buffer.from("hashedPassword")
            jest.spyOn(db, "get").mockImplementation((_sql, _params, callback) => {
                callback(null, {
                    username: testUser.username,
                    password: hashedPassword,
                    salt: salt
                })
                return {} as Database
            });
            jest.spyOn(crypto, "scryptSync").mockImplementation((_password, _salt, _keylen) => {
                return hashedPassword
            })
            jest.spyOn(crypto, "timingSafeEqual").mockImplementation((_password, _hashedPassword) => {
                return true
            })

            const result = await userDAO.getIsUserAuthenticated(
                testUser.username,
                testUser.password,
            )
            expect(result).toBe(true)
            expect(db.get).toBeCalledTimes(1)
            expect(crypto.scryptSync).toBeCalledTimes(1)
            expect(crypto.scryptSync).toBeCalledWith(testUser.password, salt, size)
            expect(crypto.timingSafeEqual).toBeCalledTimes(1)
            expect(crypto.timingSafeEqual).toBeCalledWith(hashedPassword, hashedPassword)
        })

        test("Password rejected", async () => {
            const salt = Buffer.from("salt")
            const size = 16
            const hashedPassword = Buffer.from("hashedPassword")
            jest.spyOn(db, "get").mockImplementation((_sql, _params, callback) => {
                callback(null, {
                    username: testUser.username,
                    password: hashedPassword,
                    salt: salt
                })
                return {} as Database
            });
            jest.spyOn(crypto, "scryptSync").mockImplementation((_password, _salt, _keylen) => {
                return hashedPassword
            })
            jest.spyOn(crypto, "timingSafeEqual").mockImplementation((_password, _hashedPassword) => {
                return false
            })

            const result = await userDAO.getIsUserAuthenticated(
                testUser.username,
                testUser.password,
            )
            expect(result).toBe(false)
            expect(db.get).toBeCalledTimes(1)
            expect(crypto.scryptSync).toBeCalledTimes(1)
            expect(crypto.scryptSync).toBeCalledWith(testUser.password, salt, size)
            expect(crypto.timingSafeEqual).toBeCalledTimes(1)
            expect(crypto.timingSafeEqual).toBeCalledWith(hashedPassword, hashedPassword)
        })

        test("Unknown user", async () => {
            jest.spyOn(db, "get").mockImplementation((_sql, _params, callback) => {
                callback(null, null)
                return {} as Database
            });
            jest.spyOn(crypto, "scryptSync")
            jest.spyOn(crypto, "timingSafeEqual")

            const result = await userDAO.getIsUserAuthenticated(
                testUser.username,
                testUser.password,
            )
            expect(result).toBe(false)
            expect(db.get).toBeCalledTimes(1)
            expect(crypto.scryptSync).toBeCalledTimes(0)
            expect(crypto.timingSafeEqual).toBeCalledTimes(0)
        })
    })

    describe("Create User", () => {
        test("New User", async () => {
            const salt = Buffer.from("salt")
            const size = 16
            jest.spyOn(db, "run").mockImplementation((_sql, _params, callback) => {
                callback(null)
                return {} as Database
            });
            jest.spyOn(crypto, "randomBytes").mockImplementation((_size) => {
                return salt
            })
            jest.spyOn(crypto, "scryptSync").mockImplementation((_password, _salt, _keylen) => {
                return Buffer.from("hashedPassword")
            })
            const result = await userDAO.createUser(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role
            )
            expect(result).toBe(true)
            expect(db.run).toBeCalledTimes(1)
            expect(crypto.randomBytes).toBeCalledTimes(1)
            expect(crypto.randomBytes).toBeCalledWith(size)
            expect(crypto.scryptSync).toBeCalledTimes(1)
            expect(crypto.scryptSync).toBeCalledWith(testUser.password, salt, size)
        })

        test("Duplicate User", async () => {
            const salt = Buffer.from("salt")
            const size = 16
            jest.spyOn(db, "run").mockImplementation((_sql, _params, callback) => {
                callback({
                    message: "UNIQUE constraint failed: users.username"
                })
                return {} as Database
            });
            jest.spyOn(crypto, "randomBytes").mockImplementation((_size) => {
                return salt
            })
            jest.spyOn(crypto, "scryptSync").mockImplementation((_password, _salt, _keylen) => {
                return Buffer.from("hashedPassword")
            })
            await expect(userDAO.createUser(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role
            )).rejects.toBeInstanceOf(UserAlreadyExistsError)
            expect(db.run).toBeCalledTimes(1)
            expect(crypto.randomBytes).toBeCalledTimes(1)
            expect(crypto.randomBytes).toBeCalledWith(size)
            expect(crypto.scryptSync).toBeCalledTimes(1)
            expect(crypto.scryptSync).toBeCalledWith(testUser.password, salt, size)
        })
    })

    describe("Get Users", () => {
        test("Empty list", async () => {
            jest.spyOn(db, "all").mockImplementation((_sql, callback) => {
                callback(null, [])
                return {} as Database
            });
            const result = await userDAO.getUsers()
            expect(result).toEqual([])
            expect(db.all).toBeCalledTimes(1)
        })

        test("Populated list", async () => {
            const users = [
                {
                    ...testUser,
                    username: "User1"
                },
                {
                    ...testUser,
                    username: "User2"
                },
                {
                    ...testUser,
                    username: "User3"
                },
                {
                    ...testUser,
                    username: "User4"
                }
            ]
            jest.spyOn(db, "all").mockImplementation((_sql, callback) => {
                callback(null, users)
                return {} as Database
            });
            const result = await userDAO.getUsers()
            expect(result).toEqual(
                users.map(user => new User(
                    user.username,
                    user.name,
                    user.surname,
                    user.role,
                    user.address,
                    user.birthdate
                ))
            )
            expect(db.all).toBeCalledTimes(1)
        })
    })

    describe("Get Users by Role", () => {
        test("Empty list", async () => {
            jest.spyOn(db, "all").mockImplementation((_sql, _params, callback) => {
                callback(null, [])
                return {} as Database
            });
            const result = await userDAO.getUsersByRole(Role.CUSTOMER)
            expect(result).toEqual([])
            expect(db.all).toBeCalledTimes(1)
            expect(db.all).toBeCalledWith(expect.anything(), [Role.CUSTOMER], expect.anything())
        })

        test("Populated list", async () => {
            const users = [
                {
                    ...testUser,
                    username: "User1"
                },
                {
                    ...testUser,
                    username: "User2"
                },
                {
                    ...testUser,
                    username: "User3"
                },
                {
                    ...testUser,
                    username: "User4"
                }
            ]
            jest.spyOn(db, "all").mockImplementation((_sql, _params, callback) => {
                callback(null, users)
                return {} as Database
            });
            const result = await userDAO.getUsersByRole(Role.CUSTOMER)
            expect(result).toEqual(
                users.map(user => new User(
                    user.username,
                    user.name,
                    user.surname,
                    user.role,
                    user.address,
                    user.birthdate
                ))
            )
            expect(db.all).toBeCalledTimes(1)
            expect(db.all).toBeCalledWith(expect.anything(), [Role.CUSTOMER], expect.anything())
        })
    })

    describe("Get Users by Username", () => {
        const user = {
            ...testUser,
            username: "this_username"
        }
        test("Found", async () => {
            jest.spyOn(db, "get").mockImplementation((_sql, _params, callback) => {
                callback(null, user)
                return {} as Database
            });
            const result = await userDAO.getUserByUsername(user.username)
            expect(result).toEqual(new User(
                user.username,
                user.name,
                user.surname,
                user.role,
                user.address,
                user.birthdate
            ))
            expect(db.get).toBeCalledTimes(1)
            expect(db.get).toBeCalledWith(expect.anything(), [user.username], expect.anything())
        })

        test("Not found", async () => {
            jest.spyOn(db, "get").mockImplementation((_sql, _params, callback) => {
                callback(null, null)
                return {} as Database
            });
            await expect(userDAO.getUserByUsername(user.username))
                .rejects.toBeInstanceOf(UserNotFoundError)
            expect(db.get).toBeCalledTimes(1)
            expect(db.get).toBeCalledWith(expect.anything(), [user.username], expect.anything())
        })
    })

    describe("Delete User", () => {
        const user = {
            ...testUser,
            username: "this_username"
        }
        test("Found", async () => {
            jest.spyOn(db, "run").mockImplementation((_sql, _params, callback) => {
                callback.bind({changes: 1})(null)
                return {} as Database
            });
            const result = await userDAO.deleteUser(user.username)
            expect(result).toEqual(true)
            expect(db.run).toBeCalledTimes(1)
            expect(db.run).toBeCalledWith(expect.anything(), [user.username], expect.anything())
        })

        test("Not found", async () => {
            jest.spyOn(db, "run").mockImplementation((_sql, _params, callback) => {
                callback.bind({changes: 0})(null)
                return {} as Database
            });
            await expect(userDAO.deleteUser(user.username))
                .rejects.toBeInstanceOf(UserNotFoundError)
            expect(db.run).toBeCalledTimes(1)
            expect(db.run).toBeCalledWith(expect.anything(), [user.username], expect.anything())
        })
    })

    describe("Delete All", () => {
        test("Successfully", async () => {
            jest.spyOn(db, "run").mockImplementation((_sql, callback) => {
                callback(null)
                return {} as Database
            });
            const result = await userDAO.deleteAll()
            expect(result).toEqual(true)
            expect(db.run).toBeCalledTimes(1)
            expect(db.run).toBeCalledWith(expect.anything(), expect.anything())
        })
    })

    describe("Update User info", () => {
        test("User found", async () => {
            const user = new User(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.role,
                testUser.address,
                testUser.birthdate
            )
            jest.spyOn(db, "run").mockImplementation((_sql, _params, callback) => {
                callback.bind({changes: 1})(null)
                return {} as Database
            });
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(user)
            const result = await userDAO.updateUserInfo(
                testUser.name,
                testUser.surname,
                testUser.address,
                testUser.birthdate,
                testUser.username
            )
            expect(result).toEqual(user)
            expect(db.run).toBeCalledTimes(1)
            expect(db.run).toBeCalledWith(expect.anything(), [
                testUser.name,
                testUser.surname,
                testUser.address,
                testUser.birthdate,
                testUser.username
            ], expect.anything())
            expect(UserDAO.prototype.getUserByUsername).toBeCalledTimes(1)
            expect(UserDAO.prototype.getUserByUsername).toBeCalledWith(user.username)
        })

        test("User not found", async () => {
            jest.spyOn(db, "run").mockImplementation((_sql, _params, callback) => {
                callback.bind({changes: 0})(null)
                return {} as Database
            });
            jest.spyOn(UserDAO.prototype, "getUserByUsername")
            await expect(userDAO.updateUserInfo(
                testUser.name,
                testUser.surname,
                testUser.address,
                testUser.birthdate,
                testUser.username
            )).rejects.toBeInstanceOf(UserNotFoundError)
            expect(db.run).toBeCalledTimes(1)
            expect(db.run).toBeCalledWith(expect.anything(), [
                testUser.name,
                testUser.surname,
                testUser.address,
                testUser.birthdate,
                testUser.username
            ], expect.anything())
            expect(UserDAO.prototype.getUserByUsername).toBeCalledTimes(0)
        })
    })
})

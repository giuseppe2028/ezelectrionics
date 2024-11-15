import { describe, test, expect, jest, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { User, Role } from "../../src/components/user"
import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
import { UserAlreadyExistsError, UserIsAdminError, UserNotAdminError, UserNotFoundError } from "../../src/errors/userError"

const baseURL = "/ezelectronics"

jest.mock("../../src/routers/auth")

afterEach(() => {
    jest.clearAllMocks()
})
describe("User Routes Unit Tests", () => {
    describe("POST /users - Create a new User", () => {
        test("New User", async () => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            jest.spyOn(UserController.prototype, "createUser")
                .mockResolvedValue(true)

            const response = await request(app).post(`${baseURL}/users`).send(testUser)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({})
            expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role
            )
        })

        test("User already exists", async () => {
            const testUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            jest.spyOn(UserController.prototype, "createUser")
                .mockRejectedValue(new UserAlreadyExistsError)

            const response1 = await request(app).post(`${baseURL}/users`).send(testUser)
            expect(response1.status).toBe(409)
            expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role
            )
        })

        test("Bad parameters", async () => {
            const testUser = {
                role: "bad-role"
            }
            jest.spyOn(UserController.prototype, "createUser")

            const response = await request(app).post(`${baseURL}/users`).send(testUser)
            expect(response.status).toBe(422)
            expect(response.body).toHaveProperty("error")
            expect(response.body.error).toMatch("\*\*username\*\*")
            expect(response.body.error).toMatch("\*\*name\*\*")
            expect(response.body.error).toMatch("\*\*surname\*\*")
            expect(response.body.error).toMatch("\*\*password\*\*")
            expect(response.body.error).toMatch("\*\*role\*\*")
            expect(UserController.prototype.createUser).toHaveBeenCalledTimes(0)
        })
    })

    describe("GET /users - Get all Users", () => {
        const testUser = new User("test", "test", "test", Role.MANAGER, "test", "test")
        const testUser1 = new User("test1", "test", "test", Role.MANAGER, "test", "test")
        const userlist = [testUser, testUser1]

        test("As Admin", async () => {
            jest.spyOn(Authenticator.prototype, 'isAdmin').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValue(userlist)

            const response = await request(app).get(`${baseURL}/users`).send()
            expect(response.status).toBe(200)
            expect(response.body).toEqual(userlist)
            expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUsers).toHaveBeenCalledWith()
        })

        test("As not Admin", async () => {
            jest.spyOn(Authenticator.prototype, 'isAdmin').mockImplementation((_req, res, _next) => {
                return res.status(401).end()
            })
            jest.spyOn(UserController.prototype, "getUsers")

            const response = await request(app).get(`${baseURL}/users`).send()
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(0)
        })
    })

    describe("GET /users/roles/:role - Get all Users by Role", () => {
        const testUser = new User("test", "test", "test", Role.MANAGER, "test", "test")
        const testUser1 = new User("test1", "test", "test", Role.MANAGER, "test", "test")
        const userlist = [testUser, testUser1]

        test("As Admin", async () => {
            jest.spyOn(Authenticator.prototype, 'isAdmin').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValue(userlist)

            const response = await request(app).get(`${baseURL}/users/roles/Manager`).send()
            expect(response.status).toBe(200)
            expect(response.body).toEqual(userlist)
            expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith("Manager")
        })

        test("As not Admin", async () => {
            jest.spyOn(Authenticator.prototype, 'isAdmin').mockImplementation((_req, res, _next) => {
                return res.status(401).end()
            })
            jest.spyOn(UserController.prototype, "getUsersByRole")

            const response = await request(app).get(`${baseURL}/users/roles/Manager`).send()
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(0)
        })

        test("Bad role", async () => {
            jest.spyOn(Authenticator.prototype, 'isAdmin').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "getUsersByRole")

            const response = await request(app).get(`${baseURL}/users/roles/bad-role`).send()
            expect(response.status).toBe(422)
            expect(response.body).toHaveProperty("error")
            expect(response.body.error).toMatch("\*\*role\*\*")
            expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(0)
        })
    })

    describe("GET /users/:username - Get an User by Username", () => {
        const testUser = new User("test", "test", "test", Role.MANAGER, "test", "test")

        test("As logged in User", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValue(testUser)

            const response = await request(app).get(`${baseURL}/users/${testUser.username}`).send()
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledWith(undefined, testUser.username)
        })

        test("As not logged in User", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, res, _next) => {
                return res.status(401).end()
            })
            jest.spyOn(UserController.prototype, "getUserByUsername")

            const response = await request(app).get(`${baseURL}/users/${testUser.username}`).send()
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(0)
        })

        test("Non-existing User", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValue(new UserNotFoundError)

            const response = await request(app).get(`${baseURL}/users/${testUser.username}`).send()
            expect(response.status).toBe(404)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledWith(undefined, testUser.username)
        })

        test("Not same User nor Admin", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValue(new UserNotAdminError)

            const response = await request(app).get(`${baseURL}/users/${testUser.username}`).send()
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledWith(undefined, testUser.username)
        })
    })

    describe("DELETE /users/:username - Delete an User", () => {
        const testUser = new User("test", "test", "test", Role.MANAGER, "test", "test")

        test("As logged in User", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValue(true)

            const response = await request(app).delete(`${baseURL}/users/${testUser.username}`).send()
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(undefined, testUser.username)
        })

        test("As not logged in User", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, res, _next) => {
                return res.status(401).end()
            })
            jest.spyOn(UserController.prototype, "deleteUser")

            const response = await request(app).delete(`${baseURL}/users/${testUser.username}`).send()
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(0)
        })

        test("Non-existing User", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValue(new UserNotFoundError)

            const response = await request(app).delete(`${baseURL}/users/${testUser.username}`).send()
            expect(response.status).toBe(404)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(undefined, testUser.username)
        })

        test("Not same User nor Admin", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValue(new UserNotAdminError)

            const response = await request(app).delete(`${baseURL}/users/${testUser.username}`).send()
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(undefined, testUser.username)
        })

        test("To-be-deleted User is Admin", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValue(new UserIsAdminError)

            const response = await request(app).delete(`${baseURL}/users/${testUser.username}`).send()
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.deleteUser).toHaveBeenCalledWith(undefined, testUser.username)
        })
    })

    describe("DELETE /users - Delete every non-Admin User", () => {
        test("As Admin", async () => {
            jest.spyOn(Authenticator.prototype, 'isAdmin').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValue(true)

            const response = await request(app).delete(`${baseURL}/users`).send()
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.deleteAll).toHaveBeenCalledWith()
        })

        test("As not Admin", async () => {
            jest.spyOn(Authenticator.prototype, 'isAdmin').mockImplementation((_req, res, _next) => {
                return res.status(401).end()
            })
            jest.spyOn(UserController.prototype, "deleteAll")

            const response = await request(app).delete(`${baseURL}/users`).send()
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isAdmin).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(0)
        })
    })

    describe("PATCH /users/:username - Update User information", () => {
        const testUser1 = new User("test", "test1", "test1", Role.MANAGER, "test1", "2023-09-15")
        const testUserupdate = {
            name: "test1",
            surname: "test1",
            address: "test1",
            birthdate: "2023-09-15",
            username: "test",
        }

        test("As logged in User", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, 'updateUserInfo').mockResolvedValue(testUser1)

            const response = await request(app).patch(`${baseURL}/users/${testUserupdate.username}`).send(testUserupdate)
            expect(response.status).toBe(200)
            expect(response.body).toEqual(testUser1)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(
                undefined,
                testUserupdate.name,
                testUserupdate.surname,
                testUserupdate.address,
                testUserupdate.birthdate,
                testUserupdate.username
            )
        })

        test("As not logged in User", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, res, _next) => {
                return res.status(401).end()
            })
            jest.spyOn(UserController.prototype, 'updateUserInfo')

            const response = await request(app).patch(`${baseURL}/users/${testUserupdate.username}`).send(testUserupdate)
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(0)
        })

        test("Not same User nor Admin", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, 'updateUserInfo').mockRejectedValue(new UserNotAdminError)

            const response = await request(app).patch(`${baseURL}/users/${testUserupdate.username}`).send(testUserupdate)
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(
                undefined,
                testUserupdate.name,
                testUserupdate.surname,
                testUserupdate.address,
                testUserupdate.birthdate,
                testUserupdate.username
            )
        })

        test("To-be-updated User is Admin", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, 'updateUserInfo').mockRejectedValue(new UserIsAdminError)

            const response = await request(app).patch(`${baseURL}/users/${testUserupdate.username}`).send(testUserupdate)
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(
                undefined,
                testUserupdate.name,
                testUserupdate.surname,
                testUserupdate.address,
                testUserupdate.birthdate,
                testUserupdate.username
            )
        })

        test("With bad date", async () => {
            const testUserupdate1 = {
                ...testUserupdate,
                birthdate: "3025-09-15",
            }
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "updateUserInfo")

            const response = await request(app).patch(`${baseURL}/users/${testUserupdate.username}`).send(testUserupdate1)
            expect(response.status).toBe(400)
            expect(response.body).toHaveProperty("error")
            expect(response.body.error).toEqual("Input date is not compatible with the current date")
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(0)
        })

        test("With no date", async () => {
            const { birthdate, ...testUserupdate1 } = testUserupdate
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "updateUserInfo")

            const response = await request(app).patch(`${baseURL}/users/${testUserupdate.username}`).send(testUserupdate1)
            expect(response.status).toBe(422)
            expect(response.body).toHaveProperty("error")
            expect(response.body.error).toMatch("\*\*birthdate\*\*")
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(0)
        })

        test("Bad parameters", async () => {
            const testUserupdate1 = {
                birthdate: "not-a-real-date",
            }
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(UserController.prototype, "updateUserInfo")

            const response = await request(app).patch(`${baseURL}/users/${testUserupdate.username}`).send(testUserupdate1)
            expect(response.status).toBe(422)
            expect(response.body).toHaveProperty("error")
            expect(response.body.error).toMatch("\*\*name\*\*")
            expect(response.body.error).toMatch("\*\*surname\*\*")
            expect(response.body.error).toMatch("\*\*address\*\*")
            expect(response.body.error).toMatch("\*\*birthdate\*\*")
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(0)
        })
    })
})

describe("Auth Routes Unit Tests", () => {
    describe("POST /sessions - Login", () => {
        const testUser = new User("test", "test", "test", Role.MANAGER, "test", "test")

        test("Successfully", async () => {
            jest.spyOn(Authenticator.prototype, 'login').mockResolvedValue(testUser)

            const response = await request(app)
                .post(`${baseURL}/sessions`)
                .send({ username: "test", password: "password" })
            expect(response.status).toBe(200)
            expect(response.body).toEqual(testUser)
            expect(Authenticator.prototype.login).toHaveBeenCalledTimes(1)
        })

        test("Unsuccessfully", async () => {
            jest.spyOn(Authenticator.prototype, 'login').mockRejectedValue(null)

            const response = await request(app)
                .post(`${baseURL}/sessions`)
                .send({ username: "test", password: "password" })
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.login).toHaveBeenCalledTimes(1)
        })
    })

    describe("DELETE /sessions/current - Logout", () => {
        test("As logged in User", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, 'logout').mockResolvedValue(null)

            const response = await request(app).delete(`${baseURL}/sessions/current`).send()
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(Authenticator.prototype.logout).toHaveBeenCalledTimes(1)
        })

        test("As not logged in User", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, res, _next) => {
                return res.status(401).end()
            })
            jest.spyOn(Authenticator.prototype, 'logout')

            const response = await request(app).delete(`${baseURL}/sessions/current`).send()
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
            expect(Authenticator.prototype.logout).toHaveBeenCalledTimes(0)
        })
    })

    describe("GET /sessions/current - Current Session", () => {
        test("As logged in User", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, _res, next) => {
                return next()
            })

            const response = await request(app).get(`${baseURL}/sessions/current`).send()
            expect(response.status).toBe(200)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
        })

        test("As not logged in User", async () => {
            jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((_req, res, _next) => {
                return res.status(401).end()
            })

            const response = await request(app).get(`${baseURL}/sessions/current`).send()
            expect(response.status).toBe(401)
            expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1)
        })
    })
})

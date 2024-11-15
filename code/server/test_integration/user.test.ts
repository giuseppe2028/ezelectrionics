import { describe, test, expect } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { promisedCleanup} from "../src/db/cleanup"
import { Role } from "../src/components/user"
import UserDAO from "../src/dao/userDAO"

const basePath = "/ezelectronics"

// Helper function that creates a new user in the database.
// Can be used to create a user before the tests or in the tests
// Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${basePath}/users`)
        .send(userInfo)
        .expect(200)
}

// Helper function that logs in a user and returns the cookie
// Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${basePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}




// Default user information. We use them to create users and evaluate the returned values
const customerUser = { username: "customer", name: "customer", surname: "customer", password: "customer", role: Role.CUSTOMER }
const adminUser = { username: "admin", name: "admin", surname: "admin", password: "admin", role: Role.ADMIN }
const managerUser = { username: "manager", name: "manager", surname: "manager", password: "manager", role: Role.MANAGER }
let customerCookie: string
let adminCookie: string
let managerCookie: string

describe("User Integration Tests", () => {
    beforeEach(async () => {
        await promisedCleanup()
        await postUser(adminUser)
        adminCookie = await login(adminUser)
        await postUser(customerUser)
        customerCookie = await login(customerUser)
        await postUser(managerUser)
        managerCookie = await login(managerUser)
    })
    afterEach(async () => {
        await promisedCleanup()
    })

    describe("POST /users - Create a new User", () => {
        const testUser = {
            username: "test",
            name: "test",
            surname: "test",
            password: "test",
            role: Role.CUSTOMER
        }
        test("New Customer", async () => {
            const testUser1 = {
                ...testUser,
                role: Role.CUSTOMER
            }
            const result = await request(app)
                .post(`${basePath}/users`)
                .send(testUser1)
            expect(result.status).toBe(200)

            // Check if it was actually created
            const userDAO = new UserDAO
            await expect(userDAO.getUserByUsername(testUser1.username))
                .resolves.toEqual({
                    address: null,
                    birthdate: null,
                    name: testUser1.name,
                    role: testUser1.role,
                    surname: testUser1.surname,
                    username: testUser1.username
                })
        })

        test("New Manager", async () => {
            const testUser1 = {
                ...testUser,
                role: Role.MANAGER
            }
            const result = await request(app)
                .post(`${basePath}/users`)
                .send(testUser1)
            expect(result.status).toBe(200)

            // Check if it was actually created
            const userDAO = new UserDAO
            await expect(userDAO.getUserByUsername(testUser1.username))
                .resolves.toEqual({
                    address: null,
                    birthdate: null,
                    name: testUser1.name,
                    role: testUser1.role,
                    surname: testUser1.surname,
                    username: testUser1.username
                })
        })

        test("New Admin", async () => {
            const testUser1 = {
                ...testUser,
                role: Role.ADMIN
            }
            const result = await request(app)
                .post(`${basePath}/users`)
                .send(testUser1)
            expect(result.status).toBe(200)

            // Check if it was actually created
            const userDAO = new UserDAO
            await expect(userDAO.getUserByUsername(testUser1.username))
                .resolves.toEqual({
                    address: null,
                    birthdate: null,
                    name: testUser1.name,
                    role: testUser1.role,
                    surname: testUser1.surname,
                    username: testUser1.username
                })
        })

        test("New duplicate User", async () => {
            const testUser1 = {
                ...customerUser
            }
            const result = await request(app)
                .post(`${basePath}/users`)
                .send(testUser1)
            expect(result.status).toBe(409)
        })

        test("Bad Parameters - empty strings", async () => {
            const testUser1 = {
                "username": "",
                "name": "",
                "surname": "",
                "password": "",
                "role": ""
            }
            const result = await request(app)
                .post(`${basePath}/users`)
                .send(testUser1)
            expect(result.status).toBe(422)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toMatch("\*\*username\*\*")
            expect(result.body.error).toMatch("\*\*name\*\*")
            expect(result.body.error).toMatch("\*\*surname\*\*")
            expect(result.body.error).toMatch("\*\*password\*\*")
            expect(result.body.error).toMatch("\*\*role\*\*")
        })

        test("Bad Parameters - missing parameters", async () => {
            const testUser1 = {
            }
            const result = await request(app)
                .post(`${basePath}/users`)
                .send(testUser1)
            expect(result.status).toBe(422)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toMatch("\*\*username\*\*")
            expect(result.body.error).toMatch("\*\*name\*\*")
            expect(result.body.error).toMatch("\*\*surname\*\*")
            expect(result.body.error).toMatch("\*\*password\*\*")
            expect(result.body.error).toMatch("\*\*role\*\*")
        })

        test("Bad Parameters - invalid role", async () => {
            const testUser1 = {
                ...testUser,
                role: "bad-role"
            }
            const result = await request(app)
                .post(`${basePath}/users`)
                .send(testUser1)
            expect(result.status).toBe(422)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).not.toMatch("\*\*username\*\*")
            expect(result.body.error).not.toMatch("\*\*name\*\*")
            expect(result.body.error).not.toMatch("\*\*surname\*\*")
            expect(result.body.error).not.toMatch("\*\*password\*\*")
            expect(result.body.error).toMatch("\*\*role\*\*")
        })
    })

    describe("GET /users - Get all Users", () => {
        test("As Admin", async () => {
            const result = await request(app)
                .get(`${basePath}/users`)
                .set("Cookie", adminCookie)
            expect(result.status).toBe(200)
            expect(result.body).toHaveLength(3)
            expect(result.body).toEqual(expect.arrayContaining([
                {
                    username: customerUser.username,
                    name: customerUser.name,
                    surname: customerUser.surname,
                    role: customerUser.role,
                    birthdate: null,
                    address: null,
                },
                {
                    username: managerUser.username,
                    name: managerUser.name,
                    surname: managerUser.surname,
                    role: managerUser.role,
                    birthdate: null,
                    address: null,
                },
                {
                    username: adminUser.username,
                    name: adminUser.name,
                    surname: adminUser.surname,
                    role: adminUser.role,
                    birthdate: null,
                    address: null,
                }
            ]))
        })

        test("As Customer", async () => {
            const result = await request(app)
                .get(`${basePath}/users`)
                .set("Cookie", customerCookie)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("User is not an admin")
        })

        test("As Manager", async () => {
            const result = await request(app)
                .get(`${basePath}/users`)
                .set("Cookie", managerCookie)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("User is not an admin")
        })

        test("As not authenticated", async () => {
            const result = await request(app)
                .get(`${basePath}/users`)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("User is not an admin")
        })
    })

    describe("GET /users/roles/:role - Get all Users by Role", () => {
        test("As Admin - Customer Role", async () => {
            const result = await request(app)
                .get(`${basePath}/users/roles/Customer`)
                .set("Cookie", adminCookie)
            expect(result.status).toBe(200)
            expect(result.body).toHaveLength(1)
            expect(result.body).toEqual(expect.arrayContaining([
                {
                    username: customerUser.username,
                    name: customerUser.name,
                    surname: customerUser.surname,
                    role: customerUser.role,
                    birthdate: null,
                    address: null,
                }
            ]))
        })

        test("As Customer", async () => {
            const result = await request(app)
                .get(`${basePath}/users/roles/Customer`)
                .set("Cookie", customerCookie)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("User is not an admin")
        })

        test("As Manager", async () => {
            const result = await request(app)
                .get(`${basePath}/users/roles/Customer`)
                .set("Cookie", managerCookie)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("User is not an admin")
        })

        test("As not authenticated", async () => {
            const result = await request(app)
                .get(`${basePath}/users/roles/Customer`)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("User is not an admin")
        })

        test("As Admin - invalid Role", async () => {
            const result1 = await request(app)
                .get(`${basePath}/users/roles/not-valid`)
                .set("Cookie", adminCookie)
            expect(result1.status).toBe(422)
            expect(result1.body).toHaveProperty("error")
            expect(result1.body.error).toMatch("\*\*role\*\*")

            const result2 = await request(app)
                .get(`${basePath}/users/roles/customer`) // lower-case C
                .set("Cookie", adminCookie)
            expect(result2.status).toBe(422)
            expect(result2.body).toHaveProperty("error")
            expect(result2.body.error).toMatch("\*\*role\*\*")
        })
    })

    describe("GET /users/:username - Get an User by Username", () => {
        test("As logged in User", async () => {
            const result = await request(app)
                .get(`${basePath}/users/${customerUser.username}`)
                .set("Cookie", customerCookie)
            expect(result.status).toBe(200)
            expect(result.body).toEqual({
                username: customerUser.username,
                name: customerUser.name,
                surname: customerUser.surname,
                role: customerUser.role,
                birthdate: null,
                address: null,
            })
        })

        test("As not logged in User", async () => {
            const result = await request(app)
                .get(`${basePath}/users/${customerUser.username}`)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("Unauthenticated user")
        })

        test("Non-existing User", async () => {
            const result = await request(app)
                .get(`${basePath}/users/non_existing_username`)
                .set("Cookie", adminCookie)
            expect(result.status).toBe(404)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("The user does not exist")
        })

        test("Not same User nor Admin", async () => {
            const result = await request(app)
                .get(`${basePath}/users/different_username`)
                .set("Cookie", customerCookie)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("This operation can be performed only by an admin")
        })
    })

    describe("DELETE /users/:username - Delete an User", () => {
        const toBeDeletedCustomer = { username: "c1", name: "c1", surname: "c1", password: "c1", role: Role.CUSTOMER }
        const toBeDeletedManager = { username: "m1", name: "m1", surname: "m1", password: "m1", role: Role.MANAGER }
        const toBeDeletedAdmin = { username: "a1", name: "a1", surname: "a1", password: "a1", role: Role.ADMIN }
        let toBeDeletedCustomerCookie: string
        let toBeDeletedManagerCookie: string
        let toBeDeletedAdminCookie: string
        // parent afterEach will cleanup the new users
        beforeEach(async () => {
            await postUser(toBeDeletedCustomer)
            toBeDeletedCustomerCookie = await login(toBeDeletedCustomer)
            await postUser(toBeDeletedManager)
            toBeDeletedManagerCookie = await login(toBeDeletedManager)
            await postUser(toBeDeletedAdmin)
            toBeDeletedAdminCookie = await login(toBeDeletedAdmin)
        })

        test("As Customer", async () => {
            const result = await request(app)
                .delete(`${basePath}/users/${toBeDeletedCustomer.username}`)
                .set("Cookie", toBeDeletedCustomerCookie)
            expect(result.status).toBe(200)
            expect(result.body).toEqual({})
        })

        test("As Manager", async () => {
            const result = await request(app)
                .delete(`${basePath}/users/${toBeDeletedManager.username}`)
                .set("Cookie", toBeDeletedManagerCookie)
            expect(result.status).toBe(200)
            expect(result.body).toEqual({})
        })

        test("As Admin", async () => {
            const result = await request(app)
                .delete(`${basePath}/users/${toBeDeletedAdmin.username}`)
                .set("Cookie", toBeDeletedAdminCookie)
            expect(result.status).toBe(200)
            expect(result.body).toEqual({})
        })

        test("As not logged in User", async () => {
            const result = await request(app)
                .delete(`${basePath}/users/${toBeDeletedCustomer.username}`)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("Unauthenticated user")
        })

        test("Non-existing User", async () => {
            const result = await request(app)
                .delete(`${basePath}/users/non_existing_username`)
                .set("Cookie", adminCookie)
            expect(result.status).toBe(404)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("The user does not exist")
        })

        test("Not same User nor Admin", async () => {
            const result = await request(app)
                .delete(`${basePath}/users/different_username`)
                .set("Cookie", toBeDeletedCustomerCookie)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("This operation can be performed only by an admin")
        })

        test("To-be-deleted User is Admin", async () => {
            const result = await request(app)
                .delete(`${basePath}/users/${toBeDeletedAdmin.username}`)
                .set("Cookie", adminCookie)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("Admins cannot be deleted or edited")
        })
    })

    describe("DELETE /users - Delete every non-Admin User", () => {
        test("As Admin", async () => {
            const result = await request(app)
                .delete(`${basePath}/users`)
                .set("Cookie", adminCookie)
            expect(result.status).toBe(200)
            expect(result.body).toEqual({})
        })

        test("As Customer", async () => {
            const result = await request(app)
                .delete(`${basePath}/users`)
                .set("Cookie", customerCookie)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("User is not an admin")
        })

        test("As Manager", async () => {
            const result = await request(app)
                .delete(`${basePath}/users`)
                .set("Cookie", managerCookie)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("User is not an admin")
        })

        test("As non authenticated User", async () => {
            const result = await request(app)
                .delete(`${basePath}/users`)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("User is not an admin")
        })
    })

    describe("PATCH /users/:username - Update User information", () => {
        const updatedUser = {
            name: "test",
            surname: "test",
            address: "test",
            birthdate: "2000/01/01"
        }
        const toBeUpdatedAdmin = { username: "a1", name: "a1", surname: "a1", password: "a1", role: Role.ADMIN }
        // parent afterEach will cleanup the new users
        beforeEach(async () => {
            await postUser(toBeUpdatedAdmin)
        })

        test("As logged in User", async () => {
            const result = await request(app)
                .patch(`${basePath}/users/${customerUser.username}`)
                .set("Cookie", customerCookie)
                .send(updatedUser)
            expect(result.status).toBe(200)
            expect(result.body).toEqual({
                username: customerUser.username,
                role: customerUser.role,
                name: updatedUser.name,
                surname: updatedUser.surname,
                address: updatedUser.address,
                birthdate: updatedUser.birthdate,
            })
        })

        test("As Admin for different User", async () => {
            const result = await request(app)
                .patch(`${basePath}/users/${customerUser.username}`)
                .set("Cookie", adminCookie)
                .send(updatedUser)
            expect(result.status).toBe(200)
            expect(result.body).toEqual({
                username: customerUser.username,
                role: customerUser.role,
                name: updatedUser.name,
                surname: updatedUser.surname,
                address: updatedUser.address,
                birthdate: updatedUser.birthdate,
            })
        })

        test("As Admin for self", async () => {
            const result = await request(app)
                .patch(`${basePath}/users/${adminUser.username}`)
                .set("Cookie", adminCookie)
                .send(updatedUser)
            expect(result.status).toBe(200)
            expect(result.body).toEqual({
                username: adminUser.username,
                role: adminUser.role,
                name: updatedUser.name,
                surname: updatedUser.surname,
                address: updatedUser.address,
                birthdate: updatedUser.birthdate,
            })
        })

        test("As not logged in User", async () => {
            const result = await request(app)
                .patch(`${basePath}/users/${customerUser.username}`)
                .send(updatedUser)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("Unauthenticated user")
        })

        test("Not same User nor Admin", async () => {
            const result = await request(app)
                .patch(`${basePath}/users/different_username`)
                .set("Cookie", customerCookie)
                .send(updatedUser)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("This operation can be performed only by an admin")
        })

        test("To-be-updated User is Admin", async () => {
            const result = await request(app)
                .patch(`${basePath}/users/${toBeUpdatedAdmin.username}`)
                .set("Cookie", adminCookie)
                .send(updatedUser)
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toBe("Admins cannot be deleted or edited")
        })

        test("With bad date", async () => {
            const result = await request(app)
                .patch(`${basePath}/users/${customerUser.username}`)
                .set("Cookie", customerCookie)
                .send({
                    ...updatedUser,
                    birthdate: "3025-09-15"
                })
            expect(result.status).toBe(400)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toEqual("Input date is not compatible with the current date")
        })

        test("With no date", async () => {
            const { birthdate, ...updatedUser1 } = updatedUser
            const result = await request(app)
                .patch(`${basePath}/users/${customerUser.username}`)
                .set("Cookie", customerCookie)
                .send({
                    ...updatedUser1
                })
            expect(result.status).toBe(422)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toMatch("\*\*birthdate\*\*")
        })

        test("Bad parameters", async () => {
            const result = await request(app)
                .patch(`${basePath}/users/${customerUser.username}`)
                .set("Cookie", customerCookie)
                .send({
                    birthdate: "not-a-real-date",
                })
            expect(result.status).toBe(422)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toMatch("\*\*name\*\*")
            expect(result.body.error).toMatch("\*\*surname\*\*")
            expect(result.body.error).toMatch("\*\*address\*\*")
            expect(result.body.error).toMatch("\*\*birthdate\*\*")
        })
    })
})

describe("Auth Routes Unit Tests", () => {
    beforeEach(async () => {
        await promisedCleanup()
        await postUser(adminUser)
        adminCookie = await login(adminUser)
        await postUser(customerUser)
        customerCookie = await login(customerUser)
        await postUser(managerUser)
        managerCookie = await login(managerUser)
    })
    afterEach(async () => {
        await promisedCleanup()
    })

    describe("POST /sessions - Login", () => {
        test("As Customer", async () => {
            const result = await request(app)
                .post(`${basePath}/sessions`)
                .send({
                    username: customerUser.username,
                    password: customerUser.password
                })
            expect(result.status).toBe(200)
            expect(result.body).toEqual({
                username: customerUser.username,
                name: customerUser.name,
                surname: customerUser.surname,
                role: customerUser.role,
                address: null,
                birthdate: null
            })
        })

        test("As Manager", async () => {
            const result = await request(app)
                .post(`${basePath}/sessions`)
                .send({
                    username: managerUser.username,
                    password: managerUser.password
                })
            expect(result.status).toBe(200)
            expect(result.body).toEqual({
                username: managerUser.username,
                name: managerUser.name,
                surname: managerUser.surname,
                role: managerUser.role,
                address: null,
                birthdate: null
            })
        })

        test("As Admin", async () => {
            const result = await request(app)
                .post(`${basePath}/sessions`)
                .send({
                    username: adminUser.username,
                    password: adminUser.password
                })
            expect(result.status).toBe(200)
            expect(result.body).toEqual({
                username: adminUser.username,
                name: adminUser.name,
                surname: adminUser.surname,
                role: adminUser.role,
                address: null,
                birthdate: null
            })
        })

        test("As a non-existing User", async () => {
            const result = await request(app)
                .post(`${basePath}/sessions`)
                .send({
                    username: "non-existing-user",
                    password: "password"
                })
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("message")
            expect(result.body.message).toEqual("Incorrect username and/or password")
        })

        test("With wrong password", async () => {
            const result = await request(app)
                .post(`${basePath}/sessions`)
                .send({
                    username: customerUser.username,
                    password: "wrong-password"
                })
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("message")
            expect(result.body.message).toEqual("Incorrect username and/or password")
        })
    })

    describe("DELETE /sessions/current - Logout", () => {
        test("As logged in User", async () => {
            const result = await request(app)
                .delete(`${basePath}/sessions/current`)
                .set("Cookie", customerCookie)
                .send()
            expect(result.status).toBe(200)
            expect(result.body).toEqual({})
        })

        test("As not logged in User", async () => {
            const result = await request(app)
                .delete(`${basePath}/sessions/current`)
                .send()
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toEqual("Unauthenticated user")
        })
    })

    describe("GET /sessions/current - Current Session", () => {
        test("As logged in User", async () => {
            const result = await request(app)
                .get(`${basePath}/sessions/current`)
                .set("Cookie", customerCookie)
                .send()
            expect(result.status).toBe(200)
            expect(result.body).toEqual({
                username: customerUser.username,
                name: customerUser.name,
                surname: customerUser.surname,
                role: customerUser.role,
                address: null,
                birthdate: null
            })
        })

        test("As not logged in User", async () => {
            const result = await request(app)
                .get(`${basePath}/sessions/current`)
                .send()
            expect(result.status).toBe(401)
            expect(result.body).toHaveProperty("error")
            expect(result.body.error).toEqual("Unauthenticated user")
        })
    })
})

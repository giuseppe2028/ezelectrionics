import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import {cleanup, cleanupCart, promisedCleanup, promisedCleanupCart} from "../src/db/cleanup"
import request from "supertest";
import {app} from "../index";
import {body} from "express-validator";
import CartController from "../src/controllers/cartController";
import {threadId} from "node:worker_threads";
import dayjs from "dayjs";

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
const product1 = {
    "model": "test",
    "category": "Smartphone",
    "quantity": 1,
    "sellingPrice": 9.99,
    "arrivalDate": "2024-05-24"
}
const product2 = {
    "model": "test1",
    "category": "Smartphone",
    "quantity": 9,
    "sellingPrice": 59.99,
    "arrivalDate": "2024-05-24"
}
const product3 = {
    "model": "test2",
    "category": "Smartphone",
    "quantity": 3,
    "sellingPrice": 29.99,
    "arrivalDate": "2024-05-24"
}
const model1 = {model: "test"}
const model2 = {model: "test1"}
const model3 = {model: "test2"}
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string
let managerCookie:string

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
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

const addProduct = async (productInfo:any) =>{
    return new Promise<void>((resolve, reject) => {
        request(app)
            .post(`${routePath}/products`)
            .set("Cookie",adminCookie)
            .send(productInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve()
            })
    })
}

const addProductsToCart = async (productInfo:any) =>{

    return new Promise<void>((resolve, reject) => {
        request(app)
            .post(`${routePath}/carts`)
            .set("Cookie",customerCookie)
            .send(productInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve()
            })
    })
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
     await promisedCleanup()
    await postUser(admin)
    adminCookie = await login(admin)
    await postUser(customer)
    customerCookie = await login(customer)
    await postUser(manager)
    managerCookie = await login(manager)
    //add a product
    await addProduct(product1);
    await addProduct(product2);
    await addProduct(product3);
})

//After executing tests, we remove everything from our test database
afterAll(async () => {
    await promisedCleanup()
})


//A 'describe' block is a way to group tests. It can be used to group tests that are related to the same functionality
//In this example, tests are for the user routes
//Inner 'describe' blocks define tests for each route
describe("User routes integration tests", () => {

    describe("GET /carts", () => {
        beforeEach(async () => {
            await promisedCleanupCart()
        })
        //A 'test' block is a single test. It should be a single logical unit of testing for a specific functionality and use case (e.g. correct behavior, error handling, authentication checks)
        test("It should return a 200 success code and retrive the all product of the cart", async () => {


            const carts = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts.body.customer).toBe(customer.username)
            expect(carts.body.products).toHaveLength(0)
            expect(carts.body.paid).toBe(false)
            expect(carts.body.paymentDate).toBe(null)
            expect(carts.body.total).toBe(0)

        })
        test("It should return a 200 success code and retrive the all product of the cart - Add one product to the cart", async () => {

            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model1)
                .expect(200)

            const carts1 = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts1.body.products).toHaveLength(1)
            expect(carts1.body.paid).toBe(false)
            expect(carts1.body.paymentDate).toBe(null)
            expect(carts1.body.total).toBe(product1.sellingPrice)
            expect(carts1.body.products[0].quantity).toBe(1)

        })
        test("It should return a 200 success code and retrive the all product of the cart - Add more product and more quantity to the cart", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model1)
                .expect(200)
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model2)
                .expect(200)
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model2)
                .expect(200)
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model2)
                .expect(200)
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model3)
                .expect(200)
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model3)
                .expect(200)

            const carts1 = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts1.body.products).toHaveLength(3)
            expect(carts1.body.paid).toBe(false)
            expect(carts1.body.paymentDate).toBe(null)
            expect(carts1.body.total).toBe((product1.sellingPrice) + (product2.sellingPrice) * 3 + (product3.sellingPrice) * 2)

        })
        test("It should return a 401 error code: admin", async () => {
            await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", adminCookie)
                .expect(401)

        })
        test("It should return a 401 error code: manager", async () => {
            await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", managerCookie)
                .expect(401)

        })


    })

    describe("POST /carts", () => {
        beforeEach(async () => {
            await promisedCleanupCart()
        })
        //A 'test' block is a single test. It should be a single logical unit of testing for a specific functionality and use case (e.g. correct behavior, error handling, authentication checks)
        test("It should return a 200 success code and add a product", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model1)
                .expect(200)
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model1)
                .expect(200)

            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model1)
                .expect(200)

            const carts = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts.body.customer).toBe(customer.username)
            expect(carts.body.products).toHaveLength(1)
            expect(carts.body.paid).toBe(false)
            expect(carts.body.paymentDate).toBe(null)
            expect(carts.body.total).toBe(29.97)

        })
        test("It should return a 404 success code and not insert the cart", async () => {
            const model4 = {model: "test4"}
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model4)
                .expect(404)

            const carts1 = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts1.body.products).toHaveLength(0)
            expect(carts1.body.paid).toBe(false)
            expect(carts1.body.paymentDate).toBe(null)
            expect(carts1.body.total).toBe(0)

        })
        test("It should return a 409 code and not insert the cart", async () => {
            const product2 = {
                "model": "testa",
                "category": "Smartphone",
                "quantity": 1,
                "sellingPrice": 9.99,
                "arrivalDate": "2024-05-24"
            }

            await addProduct(product2)

            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({model: "prova123"})
                .expect(404)

            const carts1 = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts1.body.products).toHaveLength(0)
            expect(carts1.body.paid).toBe(false)
            expect(carts1.body.paymentDate).toBe(null)
            expect(carts1.body.total).toBe(0)

        })

        test("It should return a 422 success code and not insert the cart", async () => {
            const product2 = {
                "model": "prova",
                "category": "Smartphone",
                "quantity": 1,
                "sellingPrice": 9.99,
                "arrivalDate": "2024-05-24"
            }
            const model = {model: ""}
            await addProduct(product2)

            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model)
                .expect(422)

            const carts1 = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts1.body.products).toHaveLength(0)
            expect(carts1.body.paid).toBe(false)
            expect(carts1.body.paymentDate).toBe(null)
            expect(carts1.body.total).toBe(0)

        })
        test("It should return a 422 success code and not insert the cart space", async () => {
            const product2 = {
                "model": " ",
                "category": "Smartphone",
                "quantity": 1,
                "sellingPrice": 9.99,
                "arrivalDate": "2024-05-24"
            }
            const model = {model: " "}
            await addProduct(product2)
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send(model)
                .expect(422)

            const carts1 = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts1.body.products).toHaveLength(0)
            expect(carts1.body.paid).toBe(false)
            expect(carts1.body.paymentDate).toBe(null)
            expect(carts1.body.total).toBe(0)

        })
        test("It should return a 401 error code: admin", async () => {
            const product2 = {
                "model": "test1",
                "category": "Smartphone",
                "quantity": 1,
                "sellingPrice": 9.99,
                "arrivalDate": "2024-05-24"
            }
            const model = {model: "test1"}
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", adminCookie)
                .send(model)
                .expect(401)


        })
        test("It should return a 401 error code: manager", async () => {
            const product2 = {
                "model": "test1",
                "category": "Smartphone",
                "quantity": 1,
                "sellingPrice": 9.99,
                "arrivalDate": "2024-05-24"
            }
            const model = {model: "p1"}
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", managerCookie)
                .send(model)
                .expect(401)

        })
    })


    describe("PATCH /carts", () => {
        beforeEach(async () => {
            await promisedCleanupCart()
        })
        //A 'test' block is a single test. It should be a single logical unit of testing for a specific functionality and use case (e.g. correct behavior, error handling, authentication checks)
        test("It should return a 200 success code and add pay the current cart", async () => {

            //3 products of model2 beacuse it has 9 products and success the cart
            await addProductsToCart(model2)
            await addProductsToCart(model2)
            await addProductsToCart(model2)

            let products = await request(app)
                .get(`${routePath}/products?grouping=model&model=test1`)
                .set("Cookie", adminCookie)
                .expect(200);

            const previousQuantity = products.body[0].quantity

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            //check if the cart is paid

            const carts = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts.body).toHaveLength(1)
            expect(carts.body[0].products).toHaveLength(1)
            expect(carts.body[0].paid).toBe(true)
            expect(carts.body[0].paymentDate).toEqual(dayjs().format('YYYY-MM-DD'))
            expect(carts.body[0].total).toBe(product2.sellingPrice*3)

            //check if the amount is scaled
             products = await request(app)
                .get(`${routePath}/products?grouping=model&model=test1`)
                .set("Cookie", adminCookie)
                .expect(200);

            expect(products.body[0].quantity).toBe(previousQuantity-3)

        })

        test("It should return a 200 success code and add pay the current cart case: more product in the cart", async () => {

            //3 products of model2 beacuse it has 9 products and success the cart
            await addProductsToCart(model2)
            await addProductsToCart(model2)
            await addProductsToCart(model2)
            await addProductsToCart(model3)
            await addProductsToCart(model3)

            let products = await request(app)
                .get(`${routePath}/products?grouping=model&model=test1`)
                .set("Cookie", adminCookie)
                .expect(200);

            const previousQuantityModel2 = products.body[0].quantity

             products = await request(app)
                .get(`${routePath}/products?grouping=model&model=test2`)
                .set("Cookie", adminCookie)
                .expect(200);

            const previousQuantityModel3 = products.body[0].quantity

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            //check if the cart is paid

            const carts = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts.body).toHaveLength(1)
            expect(carts.body[0].products).toHaveLength(2)
            expect(carts.body[0].paid).toBe(true)
            expect(carts.body[0].paymentDate).toEqual(dayjs().format('YYYY-MM-DD'))
            expect(carts.body[0].total).toBe((product2.sellingPrice*3) + (product3.sellingPrice*2))

            //check if the amount is scaled
            products = await request(app)
                .get(`${routePath}/products?grouping=model&model=test1`)
                .set("Cookie", adminCookie)
                .expect(200);

            expect(products.body[0].quantity).toBe(previousQuantityModel2-3)

            //check if the amount is scaled
            products = await request(app)
                .get(`${routePath}/products?grouping=model&model=test2`)
                .set("Cookie", adminCookie)
                .expect(200);

            expect(products.body[0].quantity).toBe(previousQuantityModel3-2)

        })



        test("It should return a 404 error code", async () => {
            await promisedCleanupCart()

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(404)
        })

        test("It should return a 400 error code", async () => {
            //create a cart
            await addProductsToCart(model2)
            //remove the product

            await request(app)
                .delete(`${routePath}/carts/products/test1`)
                .set("Cookie", customerCookie)
                .expect(200)

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(400)

        })

        test("It should return a 409 error code", async () => {

            //create a product
            const product5 = {
                "model": "test5",
                "category": "Smartphone",
                "quantity": 1,
                "sellingPrice": 59.99,
                "arrivalDate": "2024-05-24"
            }
            const model5 = {model:"test5"}
            const body = {quantity:1, sellingDate: "2024-05-30"}

            await addProduct(product5)

            await addProductsToCart(model5)


            //sell 3 products
            await request(app)
                .patch(`${routePath}/products/${product5.model}/sell`)
                .send(body)
                .set("Cookie",managerCookie)
                .expect(200)




            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(409)

        })

        test("It should return a 409 error code quantityRequest > quantityStored", async () => {

            //create a product
            const product6 = {
                "model": "test6",
                "category": "Smartphone",
                "quantity": 3,
                "sellingPrice": 59.99,
                "arrivalDate": "2024-05-24"
            }
            const model6 = {model:"test6"}
            const sellBody = {sellingDate: "2024-01-02", quantity: 1}


            await addProduct(product6)
            await addProductsToCart(model6)
            await addProductsToCart(model6)
            await addProductsToCart(model6)
            await addProductsToCart(model6)
            await addProductsToCart(model6)

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(409)

        })
        test("It should return a 401 error code: Admin", async () => {

            //3 products of model2 beacuse it has 9 products and success the cart
            await addProductsToCart(model2)

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", adminCookie)
                .expect(401)
        })

        test("It should return a 401 error code: Admin", async () => {

            //3 products of model2 beacuse it has 9 products and success the cart
            await addProductsToCart(model2)

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", managerCookie)
                .expect(401)
        })
    })


    describe("GET /carts/history", () => {
        let product4:any;
        let model4:any;
        beforeAll(()=>{
            product4 = {
                "model": "test4",
                "category": "Smartphone",
                "quantity": 20,
                "sellingPrice": 29.99,
                "arrivalDate": "2024-05-24"
            }
            model4 = {model:"test4"}
            addProduct(product4)
        })
        beforeEach(async () => {

            await promisedCleanupCart()
        })
        //A 'test' block is a single test. It should be a single logical unit of testing for a specific functionality and use case (e.g. correct behavior, error handling, authentication checks)
        test("It should return a 200 success code and retrive the history: case one cart paid", async () => {

            await addProductsToCart(model4)
            await addProductsToCart(model4)
            await addProductsToCart(model4)

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            //check if the cart is paid

            const carts = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts.body).toHaveLength(1)
            expect(carts.body[0].products).toHaveLength(1)
            expect(carts.body[0].paid).toBe(true)
            expect(carts.body[0].paymentDate).toEqual(dayjs().format('YYYY-MM-DD'))
            expect(carts.body[0].total).toBe(product4.sellingPrice*3)

        })

        test("It should return a 200 success code and retrive the history: case more than one cart paid", async () => {

            await addProductsToCart(model4)
            await addProductsToCart(model4)
            await addProductsToCart(model4)

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            await addProductsToCart(model4)
            await addProductsToCart(model4)
            await addProductsToCart(model4)

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            //check if the cart is paid

            const carts = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts.body).toHaveLength(2)

        })

        test("It should return a 401 error code: admin", async () => {

            await addProductsToCart(model4)

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            //check if the cart is paid

            const carts = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", adminCookie)
                .expect(401)

        })

        test("It should return a 401 error code: manager", async () => {

            await addProductsToCart(model4)

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            //check if the cart is paid

            const carts = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", managerCookie)
                .expect(401)

        })

    })

    describe("DELETE /carts/products/:model", () => {

            let product4:any;
            let model4:any;
        beforeAll(async () => {
            product4 = {
                "model": "test4",
                "category": "Smartphone",
                "quantity": 20,
                "sellingPrice": 29.99,
                "arrivalDate": "2024-05-24"
            }
            model4 = {model: "test4"}
            await promisedCleanupCart()
        })
        beforeEach(async () => {
            await promisedCleanupCart()
        })

        test("It should return a 200 success code and delete a product of the current cart: case one product in the cart", async () => {

            await addProductsToCart(model4)

            await request(app)
                .delete(`${routePath}/carts/products/test4`)
                .set("Cookie", customerCookie)
                .expect(200)

            //check if the cart is empty
            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)
            expect(cart.body.products).toHaveLength(0)
            expect(cart.body.total).toBe(0)
        })
        test("It should return a 200 success code and delete a product of the current cart: case more istance of product in the cart", async () => {

            await promisedCleanupCart()
            await addProductsToCart(model4)
            await addProductsToCart(model4)
            await addProductsToCart(model4)

            await request(app)
                .delete(`${routePath}/carts/products/test4`)
                .set("Cookie", customerCookie)
                .expect(200)

            //check if the cart is empty
            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(cart.body.products).toHaveLength(1)
            expect(cart.body.total).toBe(product4.sellingPrice*2)
            expect(cart.body.products[0].quantity).toBe(2)
        })

        test("It should return a 200 success code and delete a product of the current cart: case more istance of product in the cart", async () => {
            await promisedCleanupCart()
            await addProductsToCart(model4)
            await addProductsToCart(model4)
            await addProductsToCart(model3)

            await request(app)
                .delete(`${routePath}/carts/products/test2`)
                .set("Cookie", customerCookie)
                .expect(200)

            //check if the cart is empty
            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(cart.body.products).toHaveLength(1)
            expect(cart.body.total).toBe(product4.sellingPrice*2)

        })
        test("It should return a 404 error model represents a product that is not in the cart", async () => {
            await addProductsToCart(model2)
            await request(app)
                .delete(`${routePath}/carts/products/test4`)
                .set("Cookie", customerCookie)
                .expect(404)

        })
        test("It should return a 404 error there is no information about an _unpaid_ cart for the user, or if there is such information but there are no products in the cart", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/test4`)
                .set("Cookie", customerCookie)
                .expect(404)

        })
        test("It should return a 404 error model does not represent an existing product", async () => {
            await addProductsToCart(model2)
            await request(app)
                .delete(`${routePath}/carts/products/test4123`)
                .set("Cookie", customerCookie)
                .expect(404)

        })
        test("It should return a 401 error code:Admin", async () => {
            await addProductsToCart(model4)

            await request(app)
                .delete(`${routePath}/carts/products/test4`)
                .set("Cookie", adminCookie)
                .expect(401)

        })
        test("It should return a 401 error code: Manager", async () => {
            await addProductsToCart(model4)

            await request(app)
                .delete(`${routePath}/carts/products/test4`)
                .set("Cookie", managerCookie)
                .expect(401)

        })
    })




    describe("DELETE /carts/current", () => {
        beforeAll(async () => {
            await promisedCleanupCart()
        })

        test("It should return a 200 success code and delete the current cart", async () => {
            const model4 = {model: "test4"}
            await addProductsToCart(model4)
            await addProductsToCart(model4)
            await addProductsToCart(model4)

            await request(app)
                .delete(`${routePath}/carts/current`)
                .set("Cookie", customerCookie)
                .expect(200)

            //check if both the hostory and current cart are 0
            const cart = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)
            expect(cart.body.products).toHaveLength(0)
            expect(cart.body.total).toBe(0)
        })
        test("It should return a 404 error code", async () => {
            await request(app)
                .delete(`${routePath}/carts`)
                .set("Cookie", adminCookie)
                .expect(200)
            await request(app)
                .delete(`${routePath}/carts/current`)
                .set("Cookie", customerCookie)
                .expect(404)

        })

        test("It should return a 401 success code: Admin", async () => {
            const model4 = {model: "test4"}
            await addProductsToCart(model4)

            await request(app)
                .delete(`${routePath}/carts/current`)
                .set("Cookie", adminCookie)
                .expect(401)

        })
        test("It should return a 401 success code: Manager", async () => {
            const model4 = {model: "test4"}
            await addProductsToCart(model4)

            await request(app)
                .delete(`${routePath}/carts/current`)
                .set("Cookie", managerCookie)
                .expect(401)

        })
    })

    describe("DELETE /carts", () => {

        test("It should return a 200 success code and retrive the history: case one cart paid", async () => {


            await request(app)
                .delete(`${routePath}/carts`)
                .set("Cookie", adminCookie)
                .expect(200)

            //check if both the hostory and current cart are 0
            const Allcarts = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", adminCookie)
                .expect(200)
            expect(Allcarts.body).toHaveLength(0)
        })
        test("It should return a 401 error code: customer", async () => {


            await request(app)
                .delete(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(401)

        })

        test("It should return a 200 success code and retrive the history: case one cart paid", async () => {


            await request(app)
                .delete(`${routePath}/carts`)
                .set("Cookie", managerCookie)
                .expect(200)

            //check if both the hostory and current cart are 0
            const Allcarts = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", adminCookie)
                .expect(200)
            expect(Allcarts.body).toHaveLength(0)
        })

        })



    describe("GET /carts/all", () => {
        beforeAll(async () => {
            await promisedCleanupCart()
        })
        test("It should return a 200 success code and retrive all the carts", async () => {
            const model4 = {model: "test4"}
            //add two carts and paythem
            await addProductsToCart(model4)
            await addProductsToCart(model4)
            await addProductsToCart(model4)

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            await addProductsToCart(model4)
            await addProductsToCart(model4)
            await addProductsToCart(model4)

            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200)

            //check if the cart is paid

            const carts = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", customerCookie)
                .expect(200)

            expect(carts.body).toHaveLength(2)

            await addProductsToCart(model4)
            await addProductsToCart(model4)
            await addProductsToCart(model4)

            //TEST ALL THE CART
            const Allcarts = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", adminCookie)
                .expect(200)

            expect(Allcarts.body).toHaveLength(3)
            expect(Allcarts.body[0].paid).toBe(true)
            expect(Allcarts.body[0].paymentDate).toEqual(dayjs().format('YYYY-MM-DD'))
            expect(Allcarts.body[1].paid).toBe(true)
            expect(Allcarts.body[1].paymentDate).toEqual(dayjs().format('YYYY-MM-DD'))
            expect(Allcarts.body[2].paid).toBe(false)
            expect(Allcarts.body[2].paymentDate).toBe(null)

        })

        test("It should return a 401 error code: customer", async () => {
            const model4 = {model: "test4"}
            //add two carts and paythem
            await addProductsToCart(model4)

            //TEST ALL THE CART
            const Allcarts = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", customerCookie)
                .expect(401)


        })
        test("It should return a 200 success code", async () => {
            const model4 = {model: "test4"}
            //add two carts and paythem
            await addProductsToCart(model4)

            //TEST ALL THE CART
            const Allcarts = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", managerCookie)
                .expect(200)
        })
    })
})

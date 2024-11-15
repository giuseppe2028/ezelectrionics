import { describe, test, expect, beforeAll, afterAll,beforeEach,afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup, promisedCleanup } from "../src/db/cleanup"
import { Category } from "../src/components/product"


const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const Customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const Admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const Manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string
let managerCookie: string

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


//-------------------------TEST INTEGRATION PRODUCTS:----------------------------

//------------------------------POST /products ----------------------------------

describe("POST /products",()=>{

    beforeEach(async () => {
        await promisedCleanup()
        await postUser(Manager);
        managerCookie=await login(Manager);
    })
    afterAll(async ()=>{
        await promisedCleanup()
    })
    
    test("should return 200 success and create new product",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con modello m
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //prendo il prodotto con il modello m
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(200)
        //il prodotto esiste
        expect(prod.body).toHaveLength(1)
        //il prodotto è uguale a quello creato
        let data_prod = prod.body.find((prod:any)=>prod.model==product.model)
        expect(data_prod).toBeDefined() //We expect the user we have created to exist in the array. The parameter should also be equal to those we have sent
        expect(data_prod.category).toBe(product.category)
        expect(data_prod.quantity).toBe(product.quantity)
        expect(data_prod.details).toBe(product.details)
        expect(data_prod.sellingPrice).toBe(product.sellingPrice)
        expect(data_prod.arrivalDate).toBe(product.arrivalDate)
        
    })

    test("should return 409 error duplicate product",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model",category:"Smartphone",quantity:4,details:"details1",sellingPrice:13.30,arrivalDate:"2024-05-02"}
        //creo due prodotti che condividono il campo modello
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(409)
        //prendo il prodotto con il modello m
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(200)
        //il prodotto esiste ed è unico, solo il primo è stato creato
        expect(prod.body).toHaveLength(1)
        //il prodotto è uguale a quello creato
        let data_prod = prod.body.find((prod:any)=>prod.model==product.model)
        expect(data_prod).toBeDefined() 
        expect(data_prod.category).toBe(product.category)
        expect(data_prod.quantity).toBe(product.quantity)
        expect(data_prod.details).toBe(product.details)
        expect(data_prod.sellingPrice).toBe(product.sellingPrice)
        expect(data_prod.arrivalDate).toBe(product.arrivalDate)
        
    })

    test("should return 400 error inavlid date after current date",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2025-06-07"}
        //creo un prodotto con data successiva a quella odierna
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(400)

        //prendo il prodotto con il modello m
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(404)
        //il prodotto non esiste, error 404 not found
        expect(prod.body.error).toBe("Product not found")
        
    })

    test("should return 422 error inavlid date format",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"20 August 2020"}
        //creo un prodotto con data successiva a quella odierna
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(422)

        //prendo il prodotto con il modello m
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(404)
        //il prodotto non esiste, error 404 not found
        expect(prod.body.error).toBe("Product not found")
        
    })

    test("should return 422 error sellingPrice <=0",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:0,arrivalDate:"1212-12-12"}
        //creo un prodotto con sellingprice <=0
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(422)

        //prendo il prodotto con il modello m
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(404)
        //il prodotto non esiste, error 404 not found
        expect(prod.body.error).toBe("Product not found")
        
    })

    test("should return 422 error Category not in 'Smartphone', 'Laptop', 'Appliance'",async ()=>{
        const product = {model:"model",category:"Dishwasher",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"1212-12-12"}
        //creo un prodotto con categoria non esistente
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(422)

        //prendo il prodotto con il modello m
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(404)
        //il prodotto non esiste, error 404 not found
        expect(prod.body.error).toBe("Product not found")
        
    })

    test("should return 422 error quantity<=0",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:-2,details:"details",sellingPrice:13.50,arrivalDate:"1212-12-12"}
        //creo un prodotto con quantity <=0
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(422)

        //prendo il prodotto con il modello m
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(404)
        //il prodotto non esiste, error 404 not found
        expect(prod.body.error).toBe("Product not found")
        
    })

    test("should return 422 error model not a string",async ()=>{
        const product = {model:32,category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"1212-12-12"}
        //creo un prodotto con modello numerico
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(422)

        //prendo il prodotto con il modello m
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(404)
        //il prodotto non esiste, error 404 not found
        expect(prod.body.error).toBe("Product not found")
        
    })

    test("should return 401 error not authorized",async ()=>{
        const product = {model:"modello",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"1212-12-12"}
        //creo e loggo un customer
        await postUser(Customer);
        customerCookie=await login(Customer);
        //creo un prodotto con autenticazione da customer non autorizzato
        const p= await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",customerCookie)
                .expect(401)

        expect(p.body.error).toBe("User is not an admin or manager")
        //prendo il prodotto con il modello m
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(404)
        //il prodotto non esiste, error 404 not found
        expect(prod.body.error).toBe("Product not found")
        
    })
})

//------------------------------PATCH /products/:model ----------------------------------

describe("PATCH /products/:model",()=>{

    beforeEach(async () => {
        await promisedCleanup()
        await postUser(Manager);
        managerCookie=await login(Manager);
    })
    afterAll(async ()=>{
        await promisedCleanup()
    })

    test("should return 200 success and increase product quantity",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //aggiungo 3 prodotti 
        const body = {quantity:3, changeDate: "2024-05-05"}
        const res_body = {quantity:6}
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(200)
        //quantità risultante : 6
        expect(new_quantity.body).toBeDefined()
        expect(new_quantity.body).toEqual(res_body)  
    })

    test("should return 404 error product not found",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        
        //prodotto non creato

        //aggiungo 3 prodotti 
        const body = {quantity:3, changeDate: "2024-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(404)
        //error product not found
        expect(new_quantity.body.error).toBe("Product not found")
    })

    
    test("should return 422 error quantity <=0",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //aggiungo una quantità negativa
        const body = {quantity:-1, changeDate: "2024-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(422)
        //param error
        expect(new_quantity.body.error).toContain("The parameters are not formatted properly")
        
    })

    test("should return 422 error quantity <=0",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //aggiungo una quantità uguale a zero
        const body = {quantity:0, changeDate: "2024-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(422)
        //param error
        expect(new_quantity.body.error).toContain("The parameters are not formatted properly")
        
    })

    test("should return 422 error changeDate format error",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //aggiungo 3 prodotti con data non YYYY-MM-DD
        const body = {quantity:3, changeDate: "05 June 2024"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(422)
        //param error
        expect(new_quantity.body.error).toContain("The parameters are not formatted properly")
        
    })

    test("should return 400 error changeDate before arrival date",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //aggiungo 3 prodotti con data precedente all'arrival date
        const body = {quantity:3, changeDate: "2023-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(400)
        //date error
        expect(new_quantity.body.error).toBe("Provided date is incompatible with product arrival date")
        
    })

    test("should return 409 error changeDate after current date",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //aggiungo 3 prodotti con data successiva a data odierna
        const body = {quantity:3, changeDate: "2025-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(400)
        //date error
        expect(new_quantity.body.error).toBe("Input date is not compatible with the current date")
        
    })

    test("should return 401 error not authorized",async ()=>{

        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}

        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //creo e loggo customer
        await postUser(Customer);
        customerCookie=await login(Customer);
        
        //aggiungo 3 prodotti con il customer
        const body = {quantity:3, changeDate: "2025-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}`)
                    .send(body)
                    .set("Cookie",customerCookie)
                    .expect(401)
        //errore autenticazione
        expect(new_quantity.body.error).toBe("User is not an admin or manager")
        
    })

    
})

//------------------------------PATCH /products/:model/sell ----------------------------------

describe("PATCH /products/:model/sell",()=>{

    beforeEach(async () => {
        await promisedCleanup()
        await postUser(Manager);
        managerCookie=await login(Manager);
    })
    afterAll(async ()=>{
        await promisedCleanup()
    })

    test("should return 200 success and decrease product quantity",async ()=>{

        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //vendo 3 prodotti 
        const body = {quantity:3, sellingDate: "2024-05-05"}
        const res_body = {quantity:0}
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}/sell`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(200)
        //quantità risultante : 0
        expect(new_quantity.body).toBeDefined()
        expect(new_quantity.body).toEqual(res_body)  
    })

    test("should return 404 error product not found",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        
        //prodotto non creato

        //vendo 3 prodotti di un prodotto non creato
        const body = {quantity:3, sellingDate: "2024-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}/sell`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(404)
        //error product not found
        expect(new_quantity.body.error).toBe("Product not found")
    })

    
    test("should return 422 error quantity <=0",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //vendo quantità negativa
        const body = {quantity:-1, sellingDate: "2024-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}/sell`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(422)
        //param error
        expect(new_quantity.body.error).toContain("The parameters are not formatted properly")
        
    })

    test("should return 422 error quantity <=0",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //vendo quantità uguale a 0
        const body = {quantity:0, sellingDate: "2024-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}/sell`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(422)
        //param error
        expect(new_quantity.body.error).toContain("The parameters are not formatted properly")
        
    })

    test("should return 409 error quantity of product = 0",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        
        const body = {quantity:3, sellingDate: "2024-05-05"}
        //sell 3 products
        await request(app)
                    .patch(`${routePath}/products/${product.model}/sell`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(200)
        //try to sell other 3 products
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}/sell`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(409)
        //empty stock error
        expect(new_quantity.body.error).toBe("Product stock is empty")
        
    })

    test("should return 409 error quantity of product < quantity sold",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //vendo 4 prodotti 
        const body = {quantity:4, sellingDate: "2024-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}/sell`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(409)
        //error quantity
        expect(new_quantity.body.error).toBe("Product stock cannot satisfy the requested quantity")
        
    })

    test("should return 422 error changeDate format error",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //vendo 3 prodotti con data non nel format YYYY-MM-DD
        const body = {quantity:3, sellingDate: "05 June 2024"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}/sell`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(422)
        //date error
        expect(new_quantity.body.error).toContain("The parameters are not formatted properly")
        
    })

    test("should return 400 error changeDate before arrival date",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //vendo 3 prodotti con data precedente all'arrival date
        const body = {quantity:3, sellingDate: "2023-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}/sell`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(400)
        //date error
        expect(new_quantity.body.error).toBe("Provided date is incompatible with product arrival date")
        
    })

    test("should return 409 error changeDate after current date",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //vendo 3 prodotti con data successiva alla corrente
        const body = {quantity:3, sellingDate: "2025-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}/sell`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(400)
        //date error
        expect(new_quantity.body.error).toBe("Input date is not compatible with the current date")
        
    })

    test("should return 401 error not authorized",async ()=>{

        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}

        //creo un prodotto con quantità 3
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
        //creo e loggo customer
        await postUser(Customer);
        customerCookie=await login(Customer);
        
        //vendo 3 prodotti con il customer
        const body = {quantity:3, sellingDate: "2025-05-05"}
        
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product.model}/sell`)
                    .send(body)
                    .set("Cookie",customerCookie)
                    .expect(401)
        //errore non autorizzato
        expect(new_quantity.body.error).toBe("User is not an admin or manager")
        
    })

})

//------------------------------GET /products ----------------------------------

describe("GET /products",()=>{

    beforeEach(async () => {
        await promisedCleanup()
        await postUser(Manager);
        managerCookie=await login(Manager);
    })
    afterAll(async ()=>{
        await promisedCleanup()
    })

    test("should return 200 success and return all products",async ()=>{

        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //prendo tutti i prodotti
        const prod=await request(app)
                .get(`${routePath}/products`)
                .set("Cookie",managerCookie)
                .expect(200)
        //ci sono 2 prodotti
        expect(prod.body).toHaveLength(2)
    })

    test("should return 200 success and return products with model 'model'",async ()=>{

        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //prendo tutti i prodotti con model 'model'
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(200)
        //c'è un prodotto
        expect(prod.body).toHaveLength(1)
        //il prodotto è quello giusto
        let data_prod = prod.body.find((prod:any)=>prod.model==product.model)
        expect(data_prod).toBeDefined() 
        expect(data_prod.category).toBe(product.category)
        expect(data_prod.quantity).toBe(product.quantity)
        expect(data_prod.details).toBe(product.details)
        expect(data_prod.sellingPrice).toBe(product.sellingPrice)
        expect(data_prod.arrivalDate).toBe(product.arrivalDate)
    })

    test("should return 200 success and return all products with category Laptop",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //prendo tutti i prodotti con category Laptop
        const prod=await request(app)
                .get(`${routePath}/products?grouping=category&category=${product.category}`)
                .set("Cookie",managerCookie)
                .expect(200)
        //c'è un prodotto
        expect(prod.body).toHaveLength(1)
        //il prodotto è giusto
        let data_prod = prod.body.find((prod:any)=>prod.model==product.model)
        expect(data_prod).toBeDefined() 
        expect(data_prod.category).toBe(product.category)
        expect(data_prod.quantity).toBe(product.quantity)
        expect(data_prod.details).toBe(product.details)
        expect(data_prod.sellingPrice).toBe(product.sellingPrice)
        expect(data_prod.arrivalDate).toBe(product.arrivalDate)
    })

    test("should return 422 error grouping null & category defined",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //non specifico grouping ma solo category
        const prod=await request(app)
                .get(`${routePath}/products?category=${product.category}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 422 error grouping null & model defined",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //non specifico grouping ma solo model
        const prod=await request(app)
                .get(`${routePath}/products?model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 422 error grouping defined & model null",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping= model ma niente model
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 422 error grouping defined & category null",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping= category ma niente category
        const prod=await request(app)
                .get(`${routePath}/products?grouping=category`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 422 error grouping=model & model null & category defined",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping=model ma specifico category
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&category=${product.category}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 422 error grouping=category & category null & model defined",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping=category ma specifico model
        const prod=await request(app)
                .get(`${routePath}/products?grouping=category&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 404 error grouping=model & wrong model",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotti

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping=model ma specifico un modello che non esiste
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(404)
        //error not found
        expect(prod.body.error).toBe("Product not found")
    })

    test("should return 422 error grouping=category & wrong model",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotto

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping=category ma specifico un modello che non esiste
        const prod=await request(app)
                .get(`${routePath}/products?grouping=category&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 422 error grouping=category & both category and model specified ",async ()=>{
        
        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping=category e specifico sia model che category
        const prod=await request(app)
                .get(`${routePath}/products?grouping=category&model=${product.model}&category=${product1.category}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
        
    })

    test("should return 422 error grouping=model & both category and model specified ",async ()=>{
        
        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping=model e specifico sia model che category
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}&category=${product1.category}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
        
    })

    test("should return 401 error not authenticated ",async ()=>{
        
        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //creo e loggo un customer
        await postUser(Customer)
        customerCookie = await login(Customer)
        //provo a utilizzare la route con l'autenticazione da customer
        const prod=await request(app)
                .get(`${routePath}/products?grouping=model&model=${product.model}`)
                .set("Cookie",customerCookie)
                .expect(401)
        //error not authorized
        expect(prod.body.error).toBe("User is not an admin or manager")
        
    })

})

//------------------------------POST /products/available ----------------------------------

describe("POST /products/available",()=>{

    beforeEach(async () => {
        await promisedCleanup()
        await postUser(Manager);
        managerCookie=await login(Manager);
    })
    afterAll(async ()=>{
        await promisedCleanup()
    })

    test("should return 200 success and return all available products",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo 2 prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)

        //vendo 2 prodotti del product1 in modo che non sia piu disponibile (quantity=0)
        const body = {quantity:2, sellingDate: "2024-05-05"}
        const res ={quantity:0}       
        const new_quantity = await request(app)
                    .patch(`${routePath}/products/${product1.model}/sell`)
                    .send(body)
                    .set("Cookie",managerCookie)
                    .expect(200)
        expect(new_quantity.body).toEqual(res)

        //prendo tutti i prodotti disponibili
        const prod=await request(app)
                .get(`${routePath}/products/available`)
                .set("Cookie",managerCookie)
                .expect(200)
        //c'è solo un prodotto disponibile
        expect(prod.body).toHaveLength(1)
        //il prodotto è quello che non è stato venduto
        let data_prod = prod.body.find((prod:any)=>prod.model==product.model)
        expect(data_prod).toBeDefined() 
        expect(data_prod.category).toBe(product.category)
        expect(data_prod.quantity).toBe(product.quantity)
        expect(data_prod.details).toBe(product.details)
        expect(data_prod.sellingPrice).toBe(product.sellingPrice)
        expect(data_prod.arrivalDate).toBe(product.arrivalDate)
    })

    test("should return 200 success and return available products with model 'model'",async ()=>{

        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //prendo tutti i prodotti per modello
        const prod=await request(app)
                .get(`${routePath}/products/available?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(200)
        //c'è un prodotto
        expect(prod.body).toHaveLength(1)
        //il prodotto è corretto
        let data_prod = prod.body.find((prod:any)=>prod.model==product.model)
        expect(data_prod).toBeDefined() 
        expect(data_prod.category).toBe(product.category)
        expect(data_prod.quantity).toBe(product.quantity)
        expect(data_prod.details).toBe(product.details)
        expect(data_prod.sellingPrice).toBe(product.sellingPrice)
        expect(data_prod.arrivalDate).toBe(product.arrivalDate)
    })

    test("should return 200 success and return all available products with category Laptop",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //prendo tutti i prodotti per categoria
        const prod=await request(app)
                .get(`${routePath}/products/available?grouping=category&category=${product.category}`)
                .set("Cookie",managerCookie)
                .expect(200)
        //c'è un prodotto
        expect(prod.body).toHaveLength(1)
        //il prodotto è corretto
        let data_prod = prod.body.find((prod:any)=>prod.model==product.model)
        expect(data_prod).toBeDefined() 
        expect(data_prod.category).toBe(product.category)
        expect(data_prod.quantity).toBe(product.quantity)
        expect(data_prod.details).toBe(product.details)
        expect(data_prod.sellingPrice).toBe(product.sellingPrice)
        expect(data_prod.arrivalDate).toBe(product.arrivalDate)
    })

    test("should return 422 error grouping null & category defined",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //non specifico grouping ma solo category
        const prod=await request(app)
                .get(`${routePath}/products/available?category=${product.category}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 422 error grouping null & model defined",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //non specifico grouping ma solo model
        const prod=await request(app)
                .get(`${routePath}/products/available?model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 422 error grouping defined & model null",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping = model ma non specifico model
        const prod=await request(app)
                .get(`${routePath}/products/available?grouping=model`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 422 error grouping defined & category null",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping = category ma non specifico category
        const prod=await request(app)
                .get(`${routePath}/products/available?grouping=category`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 422 error grouping=model & model null & category defined",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping=model ma specifico category
        const prod=await request(app)
                .get(`${routePath}/products/available?grouping=model&category=${product.category}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 422 error grouping=category & category null & model defined",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping=category ma specifico model
        const prod=await request(app)
                .get(`${routePath}/products/available?grouping=category&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 404 error grouping=model & wrong model",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotti

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping=model ma specifico modello non esistente
        const prod=await request(app)
                .get(`${routePath}/products/available?grouping=model&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(404)
        //error product not found
        expect(prod.body.error).toContain("Product not found")
    })

    test("should return 422 error grouping=category & wrong model",async ()=>{

        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo un prodotti

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping=category ma specifico un modello che non esiste
        const prod=await request(app)
                .get(`${routePath}/products/available?grouping=category&model=${product.model}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //c'è un prodotto
        expect(prod.body.error).toContain("The parameters are not formatted properly")
    })

    test("should return 422 error grouping=category & both category and model specified ",async ()=>{
        /*
        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping=category ma specifico sia model che category
        const prod=await request(app)
                .get(`${routePath}/products/available?grouping=category&model=${product.model}&category=${product1.category}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
        */
    })

    test("should return 422 error grouping=model & both category and model specified ",async ()=>{
        /*
        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //grouping=model ma specifico sia model che category
        const prod=await request(app)
                .get(`${routePath}/products/available?grouping=model&model=${product.model}&category=${product1.category}`)
                .set("Cookie",managerCookie)
                .expect(422)
        //query error
        expect(prod.body.error).toContain("The parameters are not formatted properly")
        */
    })

    test("should return 401 error not authenticated ",async ()=>{
        
        const product = {model:"model",category:"Smartphone",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:2,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo due prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //creo customer senza login
        await postUser(Customer)
        customerCookie=""  //no authenticated cookie
        //provo ad accedere alla route senza autenticazione
        const prod=await request(app)
                .get(`${routePath}/products/available?grouping=model&model=${product.model}`)
                .set("Cookie",customerCookie)
                .expect(401)
        //error non autorizzato
        expect(prod.body.error).toBe("Unauthenticated user")
        
    })
})

//------------------------------DELETE /products/:model ----------------------------------

describe("DELETE /products/:model",()=>{

    beforeEach(async () => {
        await promisedCleanup()
        await postUser(Manager);
        managerCookie=await login(Manager);
    })
    afterAll(async ()=>{
        await promisedCleanup()
    })

    test("should return 200 success and delete a product",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo 2 prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //ne cancello uno
        await request(app)
                .delete(`${routePath}/products/${product1.model}`)
                .set("Cookie",managerCookie)
                .expect(200)
        
        //prendo tutti i prodotti
        const prod=await request(app)
                .get(`${routePath}/products`)
                .set("Cookie",managerCookie)
                .expect(200)

        expect(prod.body).toHaveLength(1)
        //il prodotto è quello che non è stato cancellato
        let data_prod = prod.body.find((prod:any)=>prod.model==product.model)
        expect(data_prod).toBeDefined() 
        expect(data_prod.category).toBe(product.category)
        expect(data_prod.quantity).toBe(product.quantity)
        expect(data_prod.details).toBe(product.details)
        expect(data_prod.sellingPrice).toBe(product.sellingPrice)
        expect(data_prod.arrivalDate).toBe(product.arrivalDate)
    })

    test("should return 404 error product not found",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo 1 prodotto
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)
  
        //tento di cancellare un prodotto non creato
        const res = await request(app)
                .delete(`${routePath}/products/${product1.model}`)
                .set("Cookie",managerCookie)
                .expect(404)

        expect(res.body.error).toBe("Product not found")
        //prendo tutti i prodotti
        const prod=await request(app)
                .get(`${routePath}/products`)
                .set("Cookie",managerCookie)
                .expect(200)
        //Nulla è stato cancellato
        expect(prod.body).toHaveLength(1)
        
    })

    test("should return 401 error not authorized",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo 2 prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //creo e loggo customer
        await postUser(Customer)
        customerCookie=await login(Customer)
        //provo a cancellarne uno con l'autenticazione da customer
        const res = await request(app)
                .delete(`${routePath}/products/${product1.model}`)
                .set("Cookie",customerCookie)
                .expect(401)
        //error non autorizzato
        expect(res.body.error).toBe("User is not an admin or manager")
        //prendo tutti i prodotti
        const prod=await request(app)
                .get(`${routePath}/products`)
                .set("Cookie",managerCookie)
                .expect(200)
        //ci sono ancora tutti e due i prodotti
        expect(prod.body).toHaveLength(2)
        
    })
})

//------------------------------DELETE /products ----------------------------------

describe("DELETE /products",()=>{

    beforeEach(async () => {
        await promisedCleanup()
        await postUser(Manager);
        managerCookie=await login(Manager);
    })
    afterAll(async ()=>{
        await promisedCleanup()
    })

    test("should return 200 success and delete all product",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo 2 prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //cancello tutti i prodotti
        await request(app)
                .delete(`${routePath}/products`)
                .set("Cookie",managerCookie)
                .expect(200)

        //prendo tutti i prodotti
        const prod=await request(app)
                .get(`${routePath}/products`)
                .set("Cookie",managerCookie)
                .expect(200)
        //non ci sono prodotti
        expect(prod.body).toHaveLength(0)
        
    })

    test("should return 401 error not authorized",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo 2 prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //creo e loggo customer
        await postUser(Customer)
        customerCookie=await login(Customer)

        //provo a cancellare tutti i prodotti con autenticazione da customer

        const res = await request(app)
                .delete(`${routePath}/products`)
                .set("Cookie",customerCookie)
                .expect(401)
        //error non autorizzato
        expect(res.body.error).toBe("User is not an admin or manager")

        //prendo tutti i prodotti
        const prod=await request(app)
                .get(`${routePath}/products`)
                .set("Cookie",managerCookie)
                .expect(200)
        //ci sono tutti i prodotti
        expect(prod.body).toHaveLength(2)        
    })

    test("should return 401 error not authenticated",async ()=>{
        const product = {model:"model",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        const product1 = {model:"model1",category:"Laptop",quantity:3,details:"details",sellingPrice:13.50,arrivalDate:"2024-05-05"}
        //creo 2 prodotti
        await request(app)
                .post(`${routePath}/products`)
                .send(product)
                .set("Cookie",managerCookie)
                .expect(200)

        await request(app)
                .post(`${routePath}/products`)
                .send(product1)
                .set("Cookie",managerCookie)
                .expect(200)
        //creo e loggo customer
        await postUser(Customer)
        customerCookie=""

        //provo a cancellare tutti i prodotti con autenticazione da customer

        const res = await request(app)
                .delete(`${routePath}/products`)
                .set("Cookie",customerCookie)
                .expect(401)
        //error non autorizzato
        expect(res.body.error).toBe("User is not an admin or manager")

        //prendo tutti i prodotti
        const prod=await request(app)
                .get(`${routePath}/products`)
                .set("Cookie",managerCookie)
                .expect(200)
        //ci sono tutti i prodotti
        expect(prod.body).toHaveLength(2)        
    })
})

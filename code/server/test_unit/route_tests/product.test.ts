import { describe, test, expect, jest, afterAll, afterEach, beforeEach, beforeAll} from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import {User,Role} from "../../src/components/user"

import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
import { Category } from "../../src/components/product"
import ProductController from "../../src/controllers/productController"
import { DateIncompatibleWithProductArrivalError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError"
import { Utility } from "../../src/utilities"
import ProductDAO from "../../src/dao/productDAO"
const baseURL = "/ezelectronics"

jest.mock("../../src/dao/productDAO")
jest.mock("../../src/controllers/productController")

jest.mock("../../src/routers/auth");

describe("test routes create product", () => {
    beforeEach(()=>{
        jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req,res,next)=>{
            return next()
        })
    })
    afterEach( ()=>{
        jest.clearAllMocks();
    })

    test("It should return a 200 success code",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }
        jest.spyOn(Utility, "getDateString");
        jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValue() //Mock the createUser method of the controller
        const response = await request(app).post(baseURL + "/products").send(sampleProduct); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        expect(Utility.getDateString).toHaveBeenCalledTimes(0)
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.quantity,
            sampleProduct.details,
            sampleProduct.sellingPrice,
            sampleProduct.arrivalDate)
    });
    
    test("It should return a 409 error code", async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        jest.spyOn(Utility, "getDateString");
        const mock= jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new ProductAlreadyExistsError) //Mock the createUser method of the controller
        const response1 = await request(app).post(baseURL + "/products").send(sampleProduct) //Send a POST request to the route
        expect(response1.status).toBe(409) //Check if the response status is 409
        
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
        expect(Utility.getDateString).toHaveBeenCalledTimes(0)
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.quantity,
            sampleProduct.details,
            sampleProduct.sellingPrice,
            sampleProduct.arrivalDate)
            
        mock.mockRestore()
    });

    test("It should return a 400 Date error code", async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2025-06-04"
        }

        
        const response1 = await request(app).post(baseURL + "/products").send(sampleProduct) //Send a POST request to the route
        expect(response1.status).toBe(400) //Check if the response status is 409
        
        expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0) //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        
    });
});

describe("test routes change product", () => {
    beforeEach(()=>{
        jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req,res,next)=>{
            return next()
        })
    })
    afterEach( ()=>{
        jest.clearAllMocks();
    })

    test("It should return a 200 success code",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const change = {
            quantity: 2,
            changeDate: "2024-06-05"
        }

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(12) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/" +sampleProduct.model).send(change); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(
            sampleProduct.model,
            change.quantity,
            change.changeDate)
    });

    test("It should return a 200 without date success code",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const change = {
            quantity: 2,
        }

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(12) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/" +sampleProduct.model).send(change); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(
            sampleProduct.model,
            change.quantity,
            null)
    });

    test("It should return a Date Error 400 code",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const change = {
            quantity: 2,
            changeDate: "2025-06-04"
        }

        const response = await request(app).patch(baseURL + "/products/" +sampleProduct.model).send(change); //Send a POST request to the route
        expect(response.status).toBe(400) //Check if the response status is 200
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0); //Check if the createUser method has been called once

    });

    test("It should return a Date format error 422",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const change = {
            quantity: 2,
            changeDate: "05-06-2024"
        }

        const response = await request(app).patch(baseURL + "/products/" +sampleProduct.model).send(change); //Send a POST request to the route
        expect(response.status).toBe(422) //Check if the response status is 200
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(0); //Check if the createUser method has been called once

    });

    test("It should return a Controller Error",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const change = {
            quantity: 2,
            changeDate: "2024-05-04"
        }

        jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new DateIncompatibleWithProductArrivalError) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/" +sampleProduct.model).send(change); //Send a POST request to the route
        expect(response.status).toBe(400) //Check if the response status is 200
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(
            sampleProduct.model,
            change.quantity,
            change.changeDate)
    });
});

describe("test routes sell product", () => {
    beforeEach(()=>{
        jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req,res,next)=>{
            return next()
        })
    })
    afterEach( ()=>{
        jest.clearAllMocks();
    })

    test("It should return a 200 success code",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const change = {
            quantity: 2,
            sellingDate: "2024-06-05"
        }

        jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(8) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/" +sampleProduct.model + "/sell").send(change); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(
            sampleProduct.model,
            change.quantity,
            change.sellingDate)
    });

    test("It should return a 200 without date success code",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            sellingDate: "2024-06-04"
        }

        const change = {
            quantity: 2,
        }

        jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(8) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/" +sampleProduct.model + "/sell").send(change); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(
            sampleProduct.model,
            change.quantity,
            null)
    });

    test("It should return a Date Error 400 code",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const change = {
            quantity: 2,
            sellingDate: "2025-06-04"
        }

        const response = await request(app).patch(baseURL + "/products/" +sampleProduct.model + "/sell").send(change); //Send a POST request to the route
        expect(response.status).toBe(400) //Check if the response status is 200
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(0); //Check if the createUser method has been called once

    });

    test("It should return a Date format error 422",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const change = {
            quantity: 2,
            sellingDate: "05-06-2024"
        }

        const response = await request(app).patch(baseURL + "/products/" +sampleProduct.model + "/sell").send(change); //Send a POST request to the route
        expect(response.status).toBe(422) //Check if the response status is 200
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(0); //Check if the createUser method has been called once

    });

    test("It should return a Controller Error",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const change = {
            quantity: 2,
            sellingDate: "2024-05-04"
        }

        jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new DateIncompatibleWithProductArrivalError) //Mock the createUser method of the controller
        const response = await request(app).patch(baseURL + "/products/" +sampleProduct.model + "/sell").send(change); //Send a POST request to the route
        expect(response.status).toBe(400) //Check if the response status is 200
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(
            sampleProduct.model,
            change.quantity,
            change.sellingDate)
    });
});

describe("test routes get all products", () => {
    beforeEach(()=>{
        jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req,res,next)=>{
            return next()
        })
    })
    afterEach( ()=>{
        jest.clearAllMocks();
    })

    test("It should return a 200 success code without grouping",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const sampleProduct1 = {
            model: "model1",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const grouping="";

        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([sampleProduct,sampleProduct1]) //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/products"); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(undefined,undefined,undefined)
    });

    test("It should return a 200 success code with grouping=model and model",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const sampleProduct1 = {
            model: "model1",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const grouping="model";

        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([sampleProduct]) //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/products?grouping=" + grouping +"&model=" + sampleProduct.model); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(grouping,undefined,sampleProduct.model)
    });

    test("It should return a 200 success code with grouping=category and category",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const sampleProduct1 = {
            model: "model1",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const grouping="category";

        jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([sampleProduct]) //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/products?grouping=" + grouping +"&category=" + sampleProduct.category); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(grouping,sampleProduct.category,undefined)
    });

    test("It should return a 422 success code with grouping=category and both category and model specified",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const sampleProduct1 = {
            model: "model1",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const grouping="category";

        
        const response = await request(app).get(baseURL + "/products?grouping=" + grouping +"&category=" + sampleProduct.category + +"&model=" + sampleProduct1.model); //Send a POST request to the route
        expect(response.status).toBe(422) //Check if the response status is 200
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0); //Check if the createUser method has been called once
        
    });

    test("It should return a Controller Error",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const sampleProduct1 = {
            model: "model1",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const grouping="model";

        jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new ProductNotFoundError) //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/products?grouping=" + grouping +"&model=" + sampleProduct.model); //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(grouping,undefined,sampleProduct.model)
    });
});

describe("test routes get all available products", () => {
    beforeEach(()=>{
        jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementation((req,res,next)=>{
            return next()
        })
    })
    afterEach( ()=>{
        jest.clearAllMocks();
    })

    test("It should return a 200 success code without grouping",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const sampleProduct1 = {
            model: "model1",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const grouping="";

        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([sampleProduct,sampleProduct1]) //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/products/available"); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(undefined,undefined,undefined)
    });

    test("It should return a 200 success code with grouping=model and model",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const sampleProduct1 = {
            model: "model1",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const grouping="model";

        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([sampleProduct]) //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/products/available?grouping=" + grouping +"&model=" + sampleProduct.model); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping,undefined,sampleProduct.model)
    });

    test("It should return a 200 success code with grouping=category and category",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const sampleProduct1 = {
            model: "model1",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const grouping="category";

        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([sampleProduct]) //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/products/available?grouping=" + grouping +"&category=" + sampleProduct.category); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping,sampleProduct.category,undefined)
    });

    test("It should return a 422 success code with grouping=category and both category and model specified",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const sampleProduct1 = {
            model: "model1",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const grouping="category";

        
        const response = await request(app).get(baseURL + "/products/available?grouping=" + grouping +"&category=" + sampleProduct.category + +"&model=" + sampleProduct1.model); //Send a POST request to the route
        expect(response.status).toBe(422) //Check if the response status is 200
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(0); //Check if the createUser method has been called once
        
    });

    test("It should return a Controller Error",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const sampleProduct1 = {
            model: "model1",
            category: Category.SMARTPHONE,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        const grouping="model";

        jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new ProductNotFoundError) //Mock the createUser method of the controller
        const response = await request(app).get(baseURL + "/products/available?grouping=" + grouping +"&model=" + sampleProduct.model); //Send a POST request to the route
        expect(response.status).toBe(404) //Check if the response status is 200
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping,undefined,sampleProduct.model)
    });
});

describe("test routes delete all products", () => {
    beforeEach(()=>{
        jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req,res,next)=>{
            return next()
        })
    })
    afterEach( ()=>{
        jest.clearAllMocks();
    })

    test("It should return a 200 success delete",async () => {

        jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).delete(baseURL + "/products"); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledWith()
    });

    test("It should return a Contoller error delete",async () => {

        jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValueOnce(new Error) //Mock the createUser method of the controller
        const response = await request(app).delete(baseURL + "/products"); //Send a POST request to the route
        expect(response.status).toBe(503) //Check if the response status is 200
        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledWith()
    });
    
});

describe("test routes delete a product", () => {
    beforeEach(()=>{
        jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req,res,next)=>{
            return next()
        })
    })
    afterEach( ()=>{
        jest.clearAllMocks();
    })

    test("It should return a 200 success delete",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }

        jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true) //Mock the createUser method of the controller
        const response = await request(app).delete(baseURL + "/products/" + sampleProduct.model); //Send a POST request to the route
        expect(response.status).toBe(200) //Check if the response status is 200
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(sampleProduct.model)
    });

    test("It should return a Contoller error delete",async () => {
        const sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            sellingPrice: 99.99,
            arrivalDate: "2024-06-04"
        }
        jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(new Error) //Mock the createUser method of the controller
        const response = await request(app).delete(baseURL +"/products/" + sampleProduct.model); //Send a POST request to the route
        expect(response.status).toBe(503) //Check if the response status is 200
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledTimes(1); //Check if the createUser method has been called once
        
        //Check if the product method has been called with the correct parameters
        expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(sampleProduct.model)
    });
});


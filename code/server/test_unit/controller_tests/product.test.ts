import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import ProductController from "../../src/controllers/productController";
import { Category, Product } from "../../src/components/product";
import ProductDAO from "../../src/dao/productDAO";
import { Utility } from "../../src/utilities";
import { DateIncompatibleWithProductArrivalError, EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError";

describe("Product Controller Unit Tests", () => {
    const sampleProduct = {
        model: "model",
        category: Category.LAPTOP,
        quantity: 10,
        details: "details",
        price: 99.99,
        arrivalDate: "2024-06-04"
    }

    const sampleProduct1 = {
        model: "model1",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        price: 99.99,
        arrivalDate: "2024-06-04"
    }

    var controller: ProductController
    beforeEach(() => {
        controller = new ProductController
    })
    afterEach(() => {
        jest.clearAllMocks()
    })

    describe("Register Product", () => {
        test("Register a Product", async () => {
            jest.spyOn(ProductDAO.prototype, "createProduct")
                .mockResolvedValueOnce()

            expect(await controller.registerProducts(
                sampleProduct.model,
                sampleProduct.category,
                sampleProduct.quantity,
                sampleProduct.details,
                sampleProduct.price,
                sampleProduct.arrivalDate
            )).toBeUndefined()

            expect(ProductDAO.prototype.createProduct)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.createProduct)
                .toHaveBeenCalledWith(
                    sampleProduct.model,
                    sampleProduct.category,
                    sampleProduct.quantity,
                    sampleProduct.details,
                    sampleProduct.price,
                    sampleProduct.arrivalDate
                )
        })

        test("Duplicate Product", async () => {
            jest.spyOn(ProductDAO.prototype, "createProduct")
                .mockRejectedValueOnce(new ProductAlreadyExistsError)

            await expect(controller.registerProducts(
                sampleProduct.model,
                sampleProduct.category,
                sampleProduct.quantity,
                sampleProduct.details,
                sampleProduct.price,
                sampleProduct.arrivalDate
            )).rejects.toBeInstanceOf(ProductAlreadyExistsError)

            expect(ProductDAO.prototype.createProduct)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.createProduct)
                .toHaveBeenCalledWith(
                    sampleProduct.model,
                    sampleProduct.category,
                    sampleProduct.quantity,
                    sampleProduct.details,
                    sampleProduct.price,
                    sampleProduct.arrivalDate
                )
        })

        test("Product with no date", async () => {
            const mockedDate = "2024-06-04"
            jest.spyOn(ProductDAO.prototype, "createProduct")
                .mockResolvedValueOnce()
            jest.spyOn(Utility, "getDateString")
                .mockReturnValueOnce(mockedDate)

            expect(await controller.registerProducts(
                sampleProduct.model,
                sampleProduct.category,
                sampleProduct.quantity,
                sampleProduct.details,
                sampleProduct.price,
                null
            )).toBeUndefined()

            expect(ProductDAO.prototype.createProduct)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.createProduct)
                .toHaveBeenCalledWith(
                    sampleProduct.model,
                    sampleProduct.category,
                    sampleProduct.quantity,
                    sampleProduct.details,
                    sampleProduct.price,
                    mockedDate
                )
        })
    })

    describe("Change Product Quantity", () => {
        test("With no date", async () => {
            const mockedDate = "2024-06-04"
            const product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                mockedDate,
                sampleProduct.details,
                sampleProduct.quantity
            )
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockResolvedValueOnce(product)
            jest.spyOn(ProductDAO.prototype, "updateProductQuantity")
                .mockResolvedValueOnce(product.quantity + 1)
            jest.spyOn(Utility, "getDateString")
                .mockReturnValueOnce(mockedDate)

            expect(await controller.changeProductQuantity(product.model, 1, null))
                .toBe(product.quantity + 1)

            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledWith(product.model)

            expect(Utility.getDateString)
                .toHaveBeenCalledTimes(1)
            expect(Utility.getDateString)
                .toHaveBeenCalledWith()

            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledWith(product.model, 1, mockedDate)
        })

        test("With valid date", async () => {
            const changeDate = "2024-06-04"
            const product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                changeDate,
                sampleProduct.details,
                sampleProduct.quantity
            )
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockResolvedValueOnce(product)
            jest.spyOn(ProductDAO.prototype, "updateProductQuantity")
                .mockResolvedValueOnce(product.quantity + 1)
            jest.spyOn(Utility, "getDateString")

            expect(await controller.changeProductQuantity(product.model, 1, changeDate))
                .toBe(product.quantity + 1)

            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledWith(product.model)

            expect(Utility.getDateString)
                .toHaveBeenCalledTimes(0)

            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledWith(product.model, 1, changeDate)
        })

        test("With invalid date", async () => {
            const changeDate = "2024-06-03"
            const product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                "2024-06-04",
                sampleProduct.details,
                sampleProduct.quantity
            )
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockResolvedValueOnce(product)
            jest.spyOn(ProductDAO.prototype, "updateProductQuantity")
            jest.spyOn(Utility, "getDateString")

            await expect(controller.changeProductQuantity(product.model, 1, changeDate))
                .rejects.toBeInstanceOf(DateIncompatibleWithProductArrivalError)

            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledWith(product.model)

            expect(Utility.getDateString)
                .toHaveBeenCalledTimes(0)

            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledTimes(0)
        })

        test("With invalid Product", async () => {
            const product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                sampleProduct.arrivalDate,
                sampleProduct.details,
                sampleProduct.quantity
            )
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockRejectedValueOnce(new ProductNotFoundError)
            jest.spyOn(ProductDAO.prototype, "updateProductQuantity")
            jest.spyOn(Utility, "getDateString")

            await expect(controller.changeProductQuantity(product.model, 1, null))
                .rejects.toBeInstanceOf(ProductNotFoundError)

            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledWith(product.model)

            expect(Utility.getDateString)
                .toHaveBeenCalledTimes(0)

            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledTimes(0)
        })
    })

    describe("Sell Product", () => {
        
        test("With no date", async () => {
            const mockedDate = "2024-06-04"
            const product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                mockedDate,
                sampleProduct.details,
                sampleProduct.quantity
            )
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockResolvedValueOnce(product)
            jest.spyOn(ProductDAO.prototype, "updateProductQuantity")
                .mockResolvedValueOnce(product.quantity - 1)
            jest.spyOn(Utility, "getDateString")
                .mockReturnValueOnce(mockedDate)

            expect(await controller.sellProduct(product.model, 1, null))
                .toBe(product.quantity - 1)

            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledWith(product.model)

            expect(Utility.getDateString)
                .toHaveBeenCalledTimes(1)
            expect(Utility.getDateString)
                .toHaveBeenCalledWith()

            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledWith(product.model, -1, mockedDate)
        })

        test("With valid date", async () => {
            const changeDate = "2024-06-04"
            const product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                changeDate,
                sampleProduct.details,
                sampleProduct.quantity
            )
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockResolvedValueOnce(product)
            jest.spyOn(ProductDAO.prototype, "updateProductQuantity")
                .mockResolvedValueOnce(product.quantity - 1)
            jest.spyOn(Utility, "getDateString")

            expect(await controller.sellProduct(product.model, 1, changeDate))
                .toBe(product.quantity - 1)

            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledWith(product.model)

            expect(Utility.getDateString)
                .toHaveBeenCalledTimes(0)

            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledWith(product.model, -1, changeDate)
        })

        test("With invalid date", async () => {
            const changeDate = "2024-06-03"
            const product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                "2024-06-04",
                sampleProduct.details,
                sampleProduct.quantity
            )
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockResolvedValueOnce(product)
            jest.spyOn(ProductDAO.prototype, "updateProductQuantity")
            jest.spyOn(Utility, "getDateString")

            await expect(controller.sellProduct(product.model, 1, changeDate))
                .rejects.toBeInstanceOf(DateIncompatibleWithProductArrivalError)

            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledWith(product.model)

            expect(Utility.getDateString)
                .toHaveBeenCalledTimes(0)

            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledTimes(0)
        })

        test("With product quantity = 0", async () => {
            const changeDate = "2024-06-03"
            const product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                changeDate,
                sampleProduct.details,
                0
            )
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockResolvedValueOnce(product)
            jest.spyOn(ProductDAO.prototype, "updateProductQuantity")
            jest.spyOn(Utility, "getDateString")

            await expect(controller.sellProduct(product.model, 1, changeDate))
                .rejects.toBeInstanceOf(EmptyProductStockError)

            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledWith(product.model)

            expect(Utility.getDateString)
                .toHaveBeenCalledTimes(0)

            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledTimes(0)
        })

        test("With product quantity < sell quantity", async () => {
            const changeDate = "2024-06-03"
            const product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                changeDate,
                sampleProduct.details,
                sampleProduct.quantity
            )
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockResolvedValueOnce(product)
            jest.spyOn(ProductDAO.prototype, "updateProductQuantity")
            jest.spyOn(Utility, "getDateString")

            await expect(controller.sellProduct(product.model, 11, changeDate))
                .rejects.toBeInstanceOf(LowProductStockError)

            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledWith(product.model)

            expect(Utility.getDateString)
                .toHaveBeenCalledTimes(0)

            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledTimes(0)
        })

        test("With invalid Product", async () => {
            const product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                sampleProduct.arrivalDate,
                sampleProduct.details,
                sampleProduct.quantity
            )
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockRejectedValueOnce(new ProductNotFoundError)
            jest.spyOn(ProductDAO.prototype, "updateProductQuantity")
            jest.spyOn(Utility, "getDateString")

            await expect(controller.sellProduct(product.model, 1, null))
                .rejects.toBeInstanceOf(ProductNotFoundError)

            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledWith(product.model)

            expect(Utility.getDateString)
                .toHaveBeenCalledTimes(0)

            expect(ProductDAO.prototype.updateProductQuantity)
                .toHaveBeenCalledTimes(0)
        })
    })

    describe("get Products",()=>{
        let product:Product;
        let product1:Product;
        beforeEach(()=>{
             product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                sampleProduct.arrivalDate,
                sampleProduct.details,
                sampleProduct.quantity
            )

             product1 = new Product(
                sampleProduct1.price,
                sampleProduct1.model,
                sampleProduct1.category,
                sampleProduct1.arrivalDate,
                sampleProduct1.details,
                sampleProduct1.quantity
            )
        })
        test("grouping no specified", async ()=>{

            jest.spyOn(ProductDAO.prototype, "getProducts")
                .mockResolvedValueOnce([product,product1])
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory")
            
            expect(await controller.getProducts(null,null,null))
                .toEqual([product,product1])

            expect(ProductDAO.prototype.getProducts)
                .toHaveBeenCalledTimes(1)
             
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(0)
            
            expect(ProductDAO.prototype.getProductsByCategory)
                .toHaveBeenCalledTimes(0)

        })

        test("grouping specified with model", async ()=>{
            
            jest.spyOn(ProductDAO.prototype, "getProducts")
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockResolvedValueOnce(product)
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory")
            
            expect(await controller.getProducts("model",null,"model"))
                .toEqual([product])

            expect(ProductDAO.prototype.getProducts)
                .toHaveBeenCalledTimes(0)
             
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(1)
            
            expect(ProductDAO.prototype.getProductsByCategory)
                .toHaveBeenCalledTimes(0)

        })

        test("grouping specified with category", async ()=>{
            
            jest.spyOn(ProductDAO.prototype, "getProducts")
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory")
                .mockResolvedValueOnce([product1])
            
            expect(await controller.getProducts("category","Laptop",null))
                .toEqual([product1])

            expect(ProductDAO.prototype.getProducts)
                .toHaveBeenCalledTimes(0)
             
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(0)
            
            expect(ProductDAO.prototype.getProductsByCategory)
                .toHaveBeenCalledTimes(1)

        })
    })

    describe("get Avaliable Products",()=>{
        let product:Product;
        let product1:Product;
        beforeEach(()=>{
             product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                sampleProduct.arrivalDate,
                sampleProduct.details,
                sampleProduct.quantity
            )

             product1 = new Product(
                sampleProduct1.price,
                sampleProduct1.model,
                sampleProduct1.category,
                sampleProduct1.arrivalDate,
                sampleProduct1.details,
                sampleProduct1.quantity
            )
        })
        test("grouping no specified", async ()=>{

            jest.spyOn(ProductDAO.prototype, "getProducts")
                .mockResolvedValueOnce([product,product1])
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory")
            
            expect(await controller.getAvailableProducts(null,null,null))
                .toEqual([product,product1])

            expect(ProductDAO.prototype.getProducts)
                .toHaveBeenCalledTimes(1)
             
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(0)
            
            expect(ProductDAO.prototype.getProductsByCategory)
                .toHaveBeenCalledTimes(0)

        })

        test("grouping specified with model", async ()=>{
            
            jest.spyOn(ProductDAO.prototype, "getProducts")
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockResolvedValueOnce(product)
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory")
            
            expect(await controller.getAvailableProducts("model",null,"model"))
                .toEqual([product])

            expect(ProductDAO.prototype.getProducts)
                .toHaveBeenCalledTimes(0)
             
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(1)
            
            expect(ProductDAO.prototype.getProductsByCategory)
                .toHaveBeenCalledTimes(0)

        })

        test("grouping specified with category", async ()=>{
            
            jest.spyOn(ProductDAO.prototype, "getProducts")
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
            jest.spyOn(ProductDAO.prototype, "getProductsByCategory")
                .mockResolvedValueOnce([product1])
            
            expect(await controller.getAvailableProducts("category","Laptop",null))
                .toEqual([product1])

            expect(ProductDAO.prototype.getProducts)
                .toHaveBeenCalledTimes(0)
             
            expect(ProductDAO.prototype.getProductByModel)
                .toHaveBeenCalledTimes(0)
            
            expect(ProductDAO.prototype.getProductsByCategory)
                .toHaveBeenCalledTimes(1)

        })
    })

    describe("DeleteAllProducts",()=>{
        test("should delete all products",async ()=>{
            jest.spyOn(ProductDAO.prototype, "deleteAllProducts")
                .mockResolvedValueOnce(true);

            expect(await controller.deleteAllProducts())
                .toBe(true)
        })
    })

    describe("DeleteAllProducts",()=>{
        test("should delete a products",async ()=>{
            const product = new Product(
                sampleProduct.price,
                sampleProduct.model,
                sampleProduct.category,
                sampleProduct.arrivalDate,
                sampleProduct.details,
                sampleProduct.quantity
            )

            jest.spyOn(ProductDAO.prototype, "deleteProduct")
                .mockResolvedValueOnce(true);

            expect(await controller.deleteProduct(product.model))
                .toBe(true)
        })
    })
})

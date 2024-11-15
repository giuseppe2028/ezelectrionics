import CartDAO from "../../src/dao/cartDAO";
import {Cart, ProductInCart} from "../../src/components/cart";
import {Category, Product} from "../../src/components/product";
import {Role, User} from "../../src/components/user";
import CartController from "../../src/controllers/cartController";
import {CartNotFoundError, EmptyCartError, ProductNotInCartError} from "../../src/errors/cartError";
import ProductDAO from "../../src/dao/productDAO";
import {EmptyProductStockError, LowProductStockError, ProductNotFoundError} from "../../src/errors/productError";

describe("CartController",()=>{
    const user = new User("test","test","test",Role.CUSTOMER, "","")
    const product = new ProductInCart("test",0,Category.SMARTPHONE, 0)
    const customer = user.name+" " + user.username
    const cart:Cart = new Cart(customer,true,"",0,[product])
    let cartController:CartController;
    let databaseError:string;
    beforeEach(()=>{
        cartController = new CartController();
        databaseError = "database Error"
    });
    afterEach(()=>{
        jest.restoreAllMocks();
    });

    describe("getCart",()=>{
        let cart:Cart
        let user:User
        beforeAll(()=>{
            cart = new Cart(customer,true,"",0,[product])
            user = new User("test","test","test",Role.CUSTOMER, "","")
        })

        test("getProduct success",async () => {
            const mockGetProduct = jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(cart)

            const response = await cartController.getCart(user)
            expect(mockGetProduct).toHaveBeenCalledTimes(1)
            expect(mockGetProduct).toHaveBeenCalledWith(user)

            expect(response).toEqual(cart)

        })

        test("getProduct error",async () => {
            const mockGetProduct = jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockRejectedValue(new Error("err"))

            const response = cartController.getCart(user)
            await expect(response).rejects.toThrow("err")

        })
    })

    describe("AddToCart",()=>{
        const idCart = 1;
        const quantity = 1;
        const product = "test"
        let productElement:Product = new Product(0,"test",Category.APPLIANCE,"","",1)

        test("addToCart: Product not in database",async () => {

            const mockGetProductByModel = jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(productElement)
            const mockGetProduct = jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(idCart)
            const mockcheckProductExistsInCart = jest.spyOn(CartDAO.prototype,"checkProductExistsInCart").mockResolvedValueOnce(false)
            const mockAddProductToUserCart = jest.spyOn(CartDAO.prototype,"addProductToUserCart").mockResolvedValueOnce(true);
            const mockUpdateTotalAndQuantity = jest.spyOn(CartDAO.prototype,"updateTotalAndQuantity").mockResolvedValueOnce(true)

            const response = await cartController.addToCart(user,product)

            expect(mockAddProductToUserCart).toHaveBeenCalledTimes(1)
            expect(mockAddProductToUserCart).toHaveBeenCalledWith(idCart,product,quantity)


            expect(mockcheckProductExistsInCart).toHaveBeenCalledTimes(1)
            expect(mockcheckProductExistsInCart).toHaveBeenCalledWith(product,idCart)

            expect(mockGetProduct).toHaveBeenCalledTimes(1)
            expect(mockGetProduct).toHaveBeenCalledWith(user)

            expect(mockUpdateTotalAndQuantity).not.toHaveBeenCalled()

            expect(response).toBe(true)



        })

        test("addToCart success",async () => {

            const mockGetProductByModel = jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(productElement)
            const mockGetProduct = jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(idCart)
            const mockcheckProductExistsInCart = jest.spyOn(CartDAO.prototype,"checkProductExistsInCart").mockResolvedValueOnce(true)
            const mockAddProductToUserCart = jest.spyOn(CartDAO.prototype,"addProductToUserCart").mockResolvedValueOnce(true);
            const mockUpdateTotalAndQuantity = jest.spyOn(CartDAO.prototype,"updateTotalAndQuantity").mockResolvedValueOnce(true)

            const response = await cartController.addToCart(user,product)

            expect(response).toBe(true)
            expect(mockAddProductToUserCart).not.toHaveBeenCalled()


            expect(mockcheckProductExistsInCart).toHaveBeenCalledTimes(1)
            expect(mockcheckProductExistsInCart).toHaveBeenCalledWith(product,idCart)

            expect(mockGetProduct).toHaveBeenCalledTimes(1)
            expect(mockGetProduct).toHaveBeenCalledWith(user)

            expect(mockUpdateTotalAndQuantity).toHaveBeenCalledTimes(1)
            expect(mockUpdateTotalAndQuantity).toHaveBeenCalledWith(idCart,productElement.sellingPrice,product)

            expect(response).toBe(true)


        })

        test("addToCart create cart",async () => {

            const mockGetProductByModel = jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(productElement)
            const mockGetProduct = jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(undefined).mockResolvedValue(idCart)
            const mockCreateCart = jest.spyOn(CartDAO.prototype,"createCart").mockResolvedValueOnce()
            const mockcheckProductExistsInCart = jest.spyOn(CartDAO.prototype,"checkProductExistsInCart").mockRejectedValueOnce(true)
            const mockAddProductToUserCart = jest.spyOn(CartDAO.prototype,"addProductToUserCart").mockResolvedValueOnce(true);

            const response = await cartController.addToCart(user,product)

            expect(response).toBe(true)
            expect(mockAddProductToUserCart).toHaveBeenCalledTimes(1)
            expect(mockAddProductToUserCart).toHaveBeenCalledWith(idCart,product,quantity)


            expect(mockcheckProductExistsInCart).not.toHaveBeenCalled()

            expect(mockGetProduct).toHaveBeenCalledTimes(2)
            expect(mockGetProduct).toHaveBeenCalledWith(user)

            expect(mockCreateCart).toHaveBeenCalledTimes(1)
            expect(mockCreateCart).toHaveBeenCalledWith(user)



            expect(response).toBe(true)


        })
        test("addToCart empty stock",async () => {
            let productElement:Product = new Product(0,"test",Category.APPLIANCE,"","",0)
            const mockGetProductByModel = jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(productElement)
            const mockGetProduct = jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(undefined).mockResolvedValue(idCart)
            const mockCreateCart = jest.spyOn(CartDAO.prototype,"createCart").mockResolvedValueOnce()
            const mockcheckProductExistsInCart = jest.spyOn(CartDAO.prototype,"checkProductExistsInCart").mockRejectedValueOnce(true)
            const mockAddProductToUserCart = jest.spyOn(CartDAO.prototype,"addProductToUserCart").mockResolvedValueOnce(true);

            expect(mockAddProductToUserCart).not.toHaveBeenCalled()
            expect(mockcheckProductExistsInCart).not.toHaveBeenCalled()
            expect(mockGetProduct).not.toHaveBeenCalled()
            expect(mockCreateCart).not.toHaveBeenCalled()
            let error;
            try{
                await cartController.addToCart(user, product)
            }
            catch(err){
                error = err;
            }
            expect(error).toBeInstanceOf(EmptyProductStockError)

        })

    })

    describe("checkout cart",()=>{

        let user:User;
        let cart:Cart;
        let prod1:ProductInCart;
        let prod2:ProductInCart;
        let idCart:number;
        beforeEach(()=>{
            prod2 = new ProductInCart("1",5,Category.APPLIANCE,0)
            prod1 = new ProductInCart("1",5,Category.APPLIANCE,0)
            user = new User("customer", "test","test",Role.CUSTOMER, "","")
            idCart = 1;
            cart = new Cart("customer",false,"",0,[prod1,prod2])
        })


        test("checkout success", async () => {
            jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(idCart);
            jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(cart);
            jest.spyOn(CartDAO.prototype, "checkProductQuantity").mockResolvedValue(8);
            jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValueOnce(true);

            const response = await cartController.checkoutCart(user);
            expect(response).toBe(true);
        });

        test("cart not found", async () => {
            jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(undefined);

            await expect(cartController.checkoutCart(user)).rejects.toThrow(CartNotFoundError);
        });

        test("empty cart", async () => {
            jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(new Cart("customer", false, "", 0, []));
            let error;
            try{
              await  cartController.checkoutCart((user))
            }catch (err) {
                error = err
            }
            expect(error).toBeInstanceOf(EmptyCartError)
        });

        test("low product stock", async () => {
            jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(cart);
            jest.spyOn(CartDAO.prototype, "checkProductQuantity").mockResolvedValueOnce(0);

             await expect(cartController.checkoutCart((user))).rejects.toBeInstanceOf(LowProductStockError);
        });

        test("empty product stock", async () => {
            const prod2 = new ProductInCart("1",5,Category.APPLIANCE,0)
            const prod1 = new ProductInCart("1",5,Category.APPLIANCE,0)
            const user = new User("customer", "test","test",Role.CUSTOMER, "","")
            const idCart = 1;
            const cart = new Cart("customer",false,"",0,[prod1,prod2])
            jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(idCart);
            jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(cart);
            jest.spyOn(CartDAO.prototype, "checkProductQuantity").mockResolvedValueOnce(3);

            await expect(cartController.checkoutCart((user))).rejects.toThrow(EmptyProductStockError);
        });



        test("get all Cart error",async () => {
            const mockGetCartHistory = jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error('db Error'))
            const response = cartController.deleteAllCarts()
            await expect(response).rejects.toThrow("db Error")

        })

    })

    describe("Get cart history",()=>{
        const idCart = 1;
        const quantity = 1;
        const product = "test"
        let cart1:Cart
        let cart2:Cart;
        let prod1:ProductInCart
        let prod2:ProductInCart

        beforeAll(()=>{
            prod1 = new ProductInCart("test",0,Category.SMARTPHONE,0)
            prod2 = new ProductInCart("test1",0,Category.APPLIANCE, 0)
            cart1 = new Cart("test",true,"",0,[prod1,prod2])
            cart1 = new Cart("test1",true,"",0,[prod1,prod2])
        })


        test("get Cart history success",async () => {
            const mockGetCartHistory = jest.spyOn(CartDAO.prototype, "getCartHistory").mockResolvedValueOnce([cart1,cart2])
            const response = await cartController.getCustomerCarts(user)
            expect(response).toEqual([cart1,cart2])



        })

        test("get Cart history error",async () => {
            const mockGetCartHistory = jest.spyOn(CartDAO.prototype, "getCartHistory").mockRejectedValueOnce(new Error(databaseError))
            const response = cartController.getCustomerCarts(user)
            await expect(response).rejects.toThrow(databaseError)

        })
    })


    describe("Remove Product From Cart",()=>{
        const idCart = 1;
        const quantity = 1;
        const product = "test"
        let cart1:Cart
        let cart2:Cart;
        let prod1:ProductInCart
        let prod2:ProductInCart

        beforeAll(()=>{
            prod1 = new ProductInCart("test",0,Category.SMARTPHONE,0)
            prod2 = new ProductInCart("test1",0,Category.APPLIANCE, 0)
            cart1 = new Cart("test",true,"",0,[prod1,prod2])
            cart2 = new Cart("test1",true,"",0,[])
        })


        test("Remove product from cart success",async () => {
            const idCart:number = 1;
            const mockGetCurrentIdCart = jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(idCart)
            const mockGetUserCurrentCart = jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(cart1)
            const mockCheckProductExistsInCart = jest.spyOn(CartDAO.prototype, "checkProductExistsInCart").mockResolvedValueOnce(true)
            const mockcheckProductExistsByModel = jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(true)
            const mockremoveProductFromCart = jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockResolvedValueOnce(true)

            const response = await cartController.removeProductFromCart(user,"test")
            expect(response).toBe(true)


        })

        test("Remove product from cart error",async () => {
            const idCart:number = 1;
            const mockGetCurrentIdCart = jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(idCart)
            const mockGetUserCurrentCart = jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(cart1)
            const mockCheckProductExistsInCart = jest.spyOn(CartDAO.prototype, "checkProductExistsInCart").mockResolvedValueOnce(true)
            const mockcheckProductExistsByModel = jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(true)
            const mockremoveProductFromCart = jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockRejectedValue(new Error("Error"))

            const response = cartController.removeProductFromCart(user,"test")
            await expect(response).rejects.toThrow("Error")


        })

        test("Remove product from cart error: ProductNotInCartError",async () => {
            const idCart:number = 1;
            const mockGetCurrentIdCart = jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(idCart)
            const mockGetUserCurrentCart = jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(cart1)
            const mockCheckProductExistsInCart = jest.spyOn(CartDAO.prototype, "checkProductExistsInCart").mockResolvedValueOnce(false)
            const mockcheckProductExistsByModel = jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(true)
            const mockremoveProductFromCart = jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockRejectedValue(new Error("Error"))

            const response = cartController.removeProductFromCart(user,"test")

            await expect(response).rejects.toThrow(ProductNotInCartError)
            expect(mockGetCurrentIdCart).toHaveBeenCalledTimes(1);
            expect(mockGetUserCurrentCart).toHaveBeenCalledTimes(1);
            expect(mockCheckProductExistsInCart).toHaveBeenCalledTimes(1);
            expect(mockcheckProductExistsByModel).not.toHaveBeenCalled()
            expect(mockremoveProductFromCart).not.toHaveBeenCalled()



        })

        test("Remove product from cart error: EmptyCartError first condition",async () => {
            const idCart:number = 1;
            const mockGetCurrentIdCart = jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(idCart)
            const mockGetUserCurrentCart = jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(cart2)
            const mockCheckProductExistsInCart = jest.spyOn(CartDAO.prototype, "checkProductExistsInCart").mockResolvedValueOnce(true)
            const mockcheckProductExistsByModel = jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(true)
            const mockremoveProductFromCart = jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockRejectedValue(new Error("Error"))

            const response = cartController.removeProductFromCart(user,"test")

            await expect(response).rejects.toThrow(EmptyCartError)
            expect(mockGetCurrentIdCart).toHaveBeenCalledTimes(1);
            expect(mockGetUserCurrentCart).toHaveBeenCalledTimes(1);
            expect(mockCheckProductExistsInCart).toHaveBeenCalledTimes(1);
            expect(mockcheckProductExistsByModel).not.toHaveBeenCalled()
            expect(mockremoveProductFromCart).not.toHaveBeenCalled()

        })
        test("Remove product from cart error: EmptyCartError second condition",async () => {
            const idCart:number = null;
            const mockGetCurrentIdCart = jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(idCart)
            const mockGetUserCurrentCart = jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(cart1)
            const mockCheckProductExistsInCart = jest.spyOn(CartDAO.prototype, "checkProductExistsInCart").mockResolvedValueOnce(true)
            const mockcheckProductExistsByModel = jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(true)
            const mockremoveProductFromCart = jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockRejectedValue(new Error("Error"))

            const response = cartController.removeProductFromCart(user,"test")

            await expect(response).rejects.toThrow(EmptyCartError)
            expect(mockGetCurrentIdCart).toHaveBeenCalledTimes(1);
            expect(mockGetUserCurrentCart).toHaveBeenCalledTimes(1);
            expect(mockCheckProductExistsInCart).toHaveBeenCalledTimes(1);
            expect(mockcheckProductExistsByModel).not.toHaveBeenCalled()
            expect(mockremoveProductFromCart).not.toHaveBeenCalled()

        })

        test("Remove product from cart error: ProductNotFoundError",async () => {
            const idCart:number = 1;
            const mockGetCurrentIdCart = jest.spyOn(CartDAO.prototype, "getCurrentIdCart").mockResolvedValueOnce(idCart)
            const mockGetUserCurrentCart = jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(cart1)
            const mockCheckProductExistsInCart = jest.spyOn(CartDAO.prototype, "checkProductExistsInCart").mockResolvedValueOnce(true)
            const mockcheckProductExistsByModel = jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(false)
            const mockremoveProductFromCart = jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockRejectedValue(new Error("Error"))

            const response = cartController.removeProductFromCart(user,"test")

            await expect(response).rejects.toThrow(ProductNotFoundError)
            expect(mockGetCurrentIdCart).toHaveBeenCalledTimes(1);
            expect(mockGetUserCurrentCart).toHaveBeenCalledTimes(1);
            expect(mockCheckProductExistsInCart).toHaveBeenCalledTimes(1);
            expect(mockcheckProductExistsByModel).toHaveBeenCalledTimes(1)
            expect(mockremoveProductFromCart).not.toHaveBeenCalled()


        })
    })
    describe("clear Cart",()=>{

        test("clear Cart success",async () => {
            const mockGetCartHistory = jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValueOnce(true)
            const response = await cartController.clearCart(user)
            expect(response).toBe(true)

        })

        test("clear cart Error",async () => {
            const mockGetCartHistory = jest.spyOn(CartDAO.prototype, "clearCart").mockRejectedValueOnce(new CartNotFoundError())
            const response = cartController.clearCart(user)
            await expect(response).rejects.toThrow(CartNotFoundError)

        })

    })
    describe("get all carts",()=>{
        let cart1:Cart
        let cart2:Cart;
        let prod1:ProductInCart
        let prod2:ProductInCart

        beforeAll(()=>{
            prod1 = new ProductInCart("test",0,Category.SMARTPHONE,0)
            prod2 = new ProductInCart("test1",0,Category.APPLIANCE, 0)
            cart1 = new Cart("test",true,"",0,[prod1,prod2])
            cart1 = new Cart("test1",true,"",0,[prod1,prod2])
        })
        test("get all Cart success",async () => {
            const mockGetCartHistory = jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValue([cart1,cart2])
            const response = await cartController.getAllCarts()
            expect(response).toEqual([cart1,cart2])

        })

        test('get all carts error', async () => {
            jest.spyOn(CartDAO.prototype, 'getAllCarts').mockRejectedValueOnce(new Error('db Error'));

            await expect(cartController.getAllCarts()).rejects.toThrow('db Error');
        });

    })
    describe("delete all carts",()=>{

        test("delete all Carts success",async () => {
            const mockGetCartHistory = jest.spyOn(CartDAO.prototype, "deleteAllCarts")
            const response = await cartController.deleteAllCarts()
            expect(response).toEqual(true)

        })

        test("get all Cart error",async () => {
            const mockGetCartHistory = jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error('db Error'))
            const response = cartController.deleteAllCarts()
            await expect(response).rejects.toThrow("db Error")

        })

    })



})

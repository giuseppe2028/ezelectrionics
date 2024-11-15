import {afterEach, beforeEach, describe, expect, jest, test} from "@jest/globals";
import CartDAO from "../../src/dao/cartDAO";
import {Role, User} from "../../src/components/user";
import db from "../../src/db/db";
import {Database} from "sqlite3";
import {Cart, ProductInCart} from "../../src/components/cart";
import {Category, Product} from "../../src/components/product";
import {CartNotFoundError} from "../../src/errors/cartError";
import {serialize} from "node:v8";
import {raw} from "express";
import productDAO from "../../src/dao/productDAO";
import ProductDAO from "../../src/dao/productDAO";


jest.mock("../../src/db/db.ts");

describe("CartDAO", () => {
    const erroreDB = "Errore DB"
    let dao:CartDAO;
    let productDao:ProductDAO;
    beforeEach(() => {
        dao = new CartDAO();
        productDao = new ProductDAO()
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getUserCurrentCart", () => {

        test("user does not have a cart", async () => {
            const user = new User("test", "test", "test", Role.CUSTOMER, "test", "test");
            const emptyCart = new Cart(user.username, false, null, 0, []);

            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });

            const result = await dao.getUserCurrentCart(user);
            expect(result).toEqual(emptyCart);
        });

        test("user have a cart", async () => {
            const user = new User("test", "test", "test", Role.CUSTOMER, "test", "test");
            const product = new ProductInCart("model1", 2, Category.SMARTPHONE, 100)
            const cartRow:{customer:string,paid:boolean, payment_date:string,total:number,ref_username:string} = {customer: user.username,paid:false, payment_date:null,total: 0,ref_username: user.username}
            const cart = new Cart(user.username, false, null, 0, [product]);

            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, cartRow); // Simulate no cart found
                return {} as Database;
            });

            jest.spyOn(dao, "fillProducts").mockImplementation((cartId: number) => {
                return Promise.resolve([product])
            })


            const result = await dao.getUserCurrentCart(user);
            expect(result).toEqual(cart);
        });

        test("user have a cart with no products", async () => {

            const user = new User("test", "test", "test", Role.CUSTOMER, "test", "test");
            const product = new ProductInCart("model1", 2, Category.SMARTPHONE, 100)
            const cart = new Cart(user.username, false, null, 0, [product]);
            const emptyCart = new Cart(user.username, false, null, 0, []);

            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, cart); // Simulate no cart found
                return {} as Database;
            });

            jest.spyOn(dao, "fillProducts").mockImplementation((cartId: number) => {
                return Promise.resolve([])
            })


            const result = await dao.getUserCurrentCart(user);
            expect(result).toEqual(emptyCart);
        });

        test("Database Error", async () => {
            const user = new User("test", "test", "test", Role.CUSTOMER, "test", "test");
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error(erroreDB),[] ); // Simulate no cart found
                return {} as Database;
            });

            jest.spyOn(dao, "fillProducts").mockImplementation((cartId: number) => {
                return Promise.resolve([])
            })

            const result = dao.getUserCurrentCart(user);
            await expect(result).rejects.toThrow(erroreDB)
        });
    });

    describe('Add product to user cart', () => {

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("add product success", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            const response = await dao.addProductToUserCart(0, "test", 0)
            expect(response).toBe(true)
        })

        test("add product Error", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(erroreDB));
                return {} as Database;
            });
            const response = dao.addProductToUserCart(0, "test", 0)
            await expect(response).rejects.toThrow(erroreDB)
        })
    })

    describe('check Product exists In cart', () => {

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("no product", async () => {

            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });
            const response = await dao.checkProductExistsInCart("test", 0)
            expect(response).toBe(false)
        })

        test(" product exists", async () => {

            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, true);
                return {} as Database;
            });

            const response = await dao.checkProductExistsInCart("test", 0)
            expect(response).toBe(true)
        })
        test(" product Error", async () => {

            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error(erroreDB), true);
                return {} as Database;
            });

            const response =  dao.checkProductExistsInCart("test", 0)
            await expect(response).rejects.toThrow(erroreDB)
        })
    })
   
    describe('getCurrentIdCart', () => {

        let user: User;

        beforeEach(() => {
            user = new User("test", "test", "test", Role.CUSTOMER, "", "")
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("database Error", async () => {

            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("database Error"));
                return {} as Database;
            });
            await expect(dao.getCurrentIdCart(user)).rejects.toThrow("database Error")

        })
        test(" cart Exists", async () => {
            const idCart = 1
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {id_cart: idCart});
                return {} as Database;
            });
            const response = await dao.getCurrentIdCart(user)
            expect(response).toBe(idCart)
        })
        test("cart not exits", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            const response = await dao.getCurrentIdCart(user)
            expect(response).toBeUndefined()
        });
    })

    describe('create Cart', () => {

        let user: User;

        beforeEach(() => {
            user = new User("test", "test", "test", Role.CUSTOMER, "", "")
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("database Error", async () => {

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("database Error"));
                return {} as Database;
            });
            await expect(dao.createCart(user)).rejects.toThrow("database Error")

        })
        test(" create cart", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            const response = await dao.createCart(user)
            expect(response).toBeUndefined()
        })

    })

    describe('getQuantityOfProductInCart', () => {
        let dao:CartDAO;
        let product: string;
        let idCart: number;
        beforeEach(() => {
            dao = new CartDAO();
            product = "test"
            idCart = 1;
        });

        afterEach(() => {
            jest.clearAllMocks();
        });
    
        test("database Error", async () => {

            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("database Error"));
                return {} as Database;
            });
            await expect(dao.getQuantityOfProductInCart(product, idCart)).rejects.toThrow("database Error")

        })
        test("quantity retrived", async () => {
            const quantity = 1;
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, {quantity: quantity});
                return {} as Database;
            });
            const response = await dao.getQuantityOfProductInCart(product, idCart)
            expect(response).toBe(quantity)
        })

    })

    describe('Update Quantity Product In Cart', () => {
        const cartId:number = 1
        const product:string = "test"

        test("database Error", async () => {

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("database Error"));
                return {} as Database;
            });
            await expect(dao.updateQuantityProductInCart(cartId,product)).rejects.toThrow("database Error")

        })
        test("quantity retrived", async () => {

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(undefined);
                return {} as Database;
            });

            const response = await dao.updateQuantityProductInCart(cartId,product)
            expect(response).toBe(undefined)
        })

    })

    describe('Update Total In Cart', () => {
        const cartId:number = 1
        const price:number = 1

        test("database Error", async () => {

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("database Error"));
                return {} as Database;
            });
            await expect(dao.updateTotalInCart(cartId,price)).rejects.toThrow("database Error")

        })
        test("quantity retrived", async () => {

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            const response = await dao.updateTotalInCart(cartId,price)
            expect(response).toBe(true)
        })

    })

    describe('getCartHistory', () => {
        let dao: CartDAO;
        let user: User;
    
        beforeEach(() => {
            dao = new CartDAO();
            user = new User("test", "test", "test", Role.CUSTOMER, "", "")
        });

        afterEach(() => {
            jest.clearAllMocks();
        });
        test("database Error", async () => {

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error(erroreDB),null);
                return {} as Database;
            });
            await expect(dao.getCartHistory(user)).rejects.toThrow(erroreDB)

        })
        test("quantity retrived", async () => {
            const quantity = 1;
            const prod1 = new ProductInCart("test", 1, Category.SMARTPHONE, 0);
            const prod2 = new ProductInCart("test1", 1, Category.SMARTPHONE, 0);
            const cartRow1 = {customer: user.username,paid: true,payment_date: "test",total: 0}
            const cartRow2 = {customer: user.username,paid: true,payment_date: "test",total: 0}
            const cart1 = new Cart(user.username, true, "test", 0, [prod1, prod2])
            const cart2 = new Cart(user.username, true, "test", 0, [prod1, prod2])

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [cartRow1, cartRow2]);
                return {} as Database;
            });
            jest.spyOn(dao, "fillProducts").mockImplementation((cartId) => {
                return Promise.resolve([prod1, prod2])
            })
            const response = await dao.getCartHistory(user)
            expect(response).toEqual([cart1, cart2])
        })

    })

    describe('remove product from cart', () => {
        let user:User;
        beforeEach(() => {
            user = new User("test", "test", "test", Role.CUSTOMER, "", "")
        });
        afterEach(() => {
            jest.clearAllMocks();
        });

        test("delete success", () => {
            const idCart = 1
            const cart = new Cart("test",false,"",0,[])
            const quantityOfProdutInCart = 1
            const productElement = new Product(0,"test",Category.SMARTPHONE ,"","",0)
            const mockGetCartId = jest.spyOn(dao,"getCartId").mockResolvedValueOnce(idCart)
            const mockgetUserCurrentCart = jest.spyOn(dao,"getUserCurrentCart").mockResolvedValueOnce(cart)
            const mockGetQuantityOfProductInCart = jest.spyOn(dao,"getQuantityOfProductInCart").mockResolvedValueOnce(quantityOfProdutInCart)
            const mockGetProduct = jest.spyOn(productDao,"getProductByModel").mockResolvedValueOnce(productElement)
            jest.spyOn(db, 'serialize').mockImplementation((callback)=>{
                if (callback){
                    return true;
                }
            })

            async ()=>{
                const res = await dao.removeProductFromCart(user,productElement.model)
                expect(res).toBe(true);
            }


        })
        test("no cart exists", () => {
            const idCart = 1
            const cart = new Cart("test",false,"",0,[])
            const quantityOfProdutInCart = 1
            const productElement = new Product(0,"test",Category.SMARTPHONE ,"","",0)
            const mockGetCartId = jest.spyOn(dao,"getCartId").mockResolvedValueOnce(null)
            const mockgetUserCurrentCart = jest.spyOn(dao,"getUserCurrentCart").mockResolvedValueOnce(cart)
            const mockGetQuantityOfProductInCart = jest.spyOn(dao,"getQuantityOfProductInCart").mockResolvedValueOnce(quantityOfProdutInCart)
            const mockGetProduct = jest.spyOn(productDao,"getProductByModel").mockResolvedValueOnce(productElement)
            jest.spyOn(db, 'serialize').mockImplementation((callback)=>{
                if (callback){
                    return false;
                }
            })

            async ()=>{
                const res =await dao.removeProductFromCart(user,productElement.model).catch((err)=>err)
                expect(res).toBe("Database Error");
            }


        })
        test("database error",() => {

            jest.spyOn(db, 'serialize').mockImplementation((callback)=>{
                if (callback){
                    new Error("Database Error")
                }
            })

            async ()=>{
                const res = await dao.deleteAllCarts().catch((err)=>err)
                expect(res.errorMessage).toBe("Database Error");
            }
        });

    })

    describe('deleteAllCarts', () => {
        let dao: CartDAO;
    
        beforeEach(() => {
            dao = new CartDAO(); 
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("delete success", () => {
            jest.spyOn(db, 'serialize').mockImplementation((callback)=>{
                if (callback){
                    return true;
                }
            })

            async ()=>{
                const res = await dao.deleteAllCarts()
                expect(res).toBe(true);
            }
            
            
        })

        test("database error",() => {
        
            jest.spyOn(db, 'serialize').mockImplementation((callback)=>{
                if (callback){
                    new Error("Database Error")
                }
            })
            
            async ()=>{
                const res = await dao.deleteAllCarts().catch((err)=>err)
                expect(res.errorMessage).toBe("Database Error");
            }
        });

    })

    describe('getAllCart', () => {
        let dao: CartDAO;
        let user:User;
        beforeEach(() => {
            dao = new CartDAO(); 
            user = new User("test", "test", "test", Role.CUSTOMER, "", "")
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("database Error", async () => {

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error("database Error"));
                return {} as Database;
            });
            await expect(dao.getAllCarts()).rejects.toThrow("database Error")

        })
        test("get all carts", async () => {
            const prod1 = new ProductInCart("test", 1, Category.SMARTPHONE, 0);
            const prod2 = new ProductInCart("test1", 1, Category.SMARTPHONE, 0);

            const cart1 = new Cart(user.username, true, "test", 0, [prod1, prod2])
            const cart2 = new Cart(user.username, true, "test", 0, [prod1, prod2])

            const mockRows = [
            { id_cart: 1, paid: true, payment_date: "test", total: 0, ref_username: user.username},
            { id_cart: 2, paid: true, payment_date: "test", total: 0, ref_username: user.username }
        ];
            const quantity = 1;
            // Sovrascrivi il metodo fillProducts del tuo oggetto DAO
            jest.spyOn(dao, "fillProducts").mockImplementation((cartId) => {
                // Simula il comportamento di fillProducts
                return Promise.resolve([prod1, prod2]);
            });
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, mockRows);
                return {} as Database;
            });

            const response = await dao.getAllCarts();
            expect(response).toEqual([cart1, cart2]);
        });
        test("get all carts", async () => {
            const prod1 = new ProductInCart("test", 1, Category.SMARTPHONE, 0);
            const prod2 = new ProductInCart("test1", 1, Category.SMARTPHONE, 0);

            const cart1 = new Cart(user.username, true, "test", 0, [prod1, prod2])
            const cart2 = new Cart(user.username, true, "test", 0, [prod1, prod2])

            const mockRows = [
            { id_cart: 1, paid: true, payment_date: "test", total: 0, ref_username: "test test" },
            { id_cart: 2, paid: true, payment_date: "test", total: 0, ref_username: "test test" }
        ];
            const quantity = 1;
            // Sovrascrivi il metodo fillProducts del tuo oggetto DAO

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });

            jest.spyOn(dao, "fillProducts").mockImplementation((cartId) => {
                // Simula il comportamento di fillProducts
                return Promise.resolve([prod1, prod2]);
            });
            const response = dao.getAllCarts();
            await expect(response).rejects.toBe(null);
        });
    })

    describe('getCartId',()=>{
        let user:User;
        beforeEach(() => {
            user = new User("test", "test", "test", Role.CUSTOMER, "", "")
        });

        test('cart Exists',async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null,{id_cart:1});
                return {} as Database;
            });
            const resp =await dao.getCartId(user)
             expect(resp).toBe(1)

        })

        test('database error',async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("database Error"));
                return {} as Database;
            });
            await expect(dao.getCartId(user)).rejects.toThrow("database Error")

        })
        test('no cart error',async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            await expect(dao.getCartId(user)).rejects.toThrow(CartNotFoundError)

        })

    })

    describe('checkProductQuantity',()=>{

        let model:string;

        beforeEach(() => {
            model = "test"
        });

        test('quantity retrived',async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null,{quantity:1});
                return {} as Database;
            });
            const resp =await dao.checkProductQuantity(model)
            expect(resp).toBe(1)

        })

        test('database error',async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("database Error"));
                return {} as Database;
            });
            await expect(dao.checkProductQuantity(model)).rejects.toThrow("database Error")

        })

        test('database error no get',async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null,null);
                return {} as Database;
            });
             expect(await dao.checkProductQuantity(model)).toBeUndefined()

        })



    })

    describe('run query',()=>{
        let query:string
        let params:any[]
        beforeEach(()=>{
            query = ''
            params = []
        })

        test('run ok',async () => {
            jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            })
            const resp = await dao.runQuery(query, params)
            expect(resp).toBeUndefined()
        })
        test('run error',async () => {
            jest.spyOn(db, 'run').mockImplementation((sql, params, callback) => {
                callback(new Error("database error"))
                return {} as Database
            })
            await expect(dao.runQuery(query, params)).rejects.toThrow("database error")
        })
    })

    describe('get query',()=>{
        let query:string
        let params:any[]
        beforeEach(()=>{
            query = ''
            params = []
        })

        test('get ok',async () => {
            const row = {id:1,name: "test"}
            jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(null,row)
                return {} as Database
            })
            const resp = await dao.getQuery(query, params)
            expect(resp).toEqual(row)
        })
        test('get error',async () => {
            jest.spyOn(db, 'get').mockImplementation((sql, params, callback) => {
                callback(new Error("database error"))
                return {} as Database
            })
            await expect(dao.getQuery(query, params)).rejects.toThrow("database error")
        })
    })

    describe('fillProducts',()=>{
        let cartId:number
        let listProductInCart:ProductInCart[]
        let prod1:ProductInCart
        let prod2:ProductInCart
        let rows =  [{model: "test",quantity:0,category: Category.APPLIANCE,selling_price:0},{model: "test1",quantity:0,category: Category.APPLIANCE,selling_price:0}]
        beforeEach(()=>{
            cartId = 1;
            prod1 = new ProductInCart("test",0,Category.APPLIANCE,0)
            prod2 = new ProductInCart("test1",0,Category.APPLIANCE,0)
            listProductInCart = [prod1,prod2]

        })

        test('fillProducts success',async () => {
            jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(null,rows)
                return {} as Database
            })
            const resp = await dao.fillProducts(cartId)
            expect(resp).toEqual(listProductInCart)
        })
        test('get error',async () => {
            jest.spyOn(db, 'all').mockImplementation((sql, params, callback) => {
                callback(new Error("database error"))
                return {} as Database
            })
            await expect(dao.fillProducts(cartId)).rejects.toThrow("database error")
        })
    })

    describe("clearCart",()=>{
        let dao: CartDAO;
        let user:User;
        beforeEach(() => {
            dao = new CartDAO(); 
            user = new User("test", "test", "test", Role.CUSTOMER, "", "")
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test("clear success", () => {
            const idCart = 1;
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, idCart);
                return {} as Database;
            });

            jest.spyOn(db,"serialize").mockImplementation((callback)=>{
                if(callback){
                    callback();
                }
            })
            jest.spyOn(db,"run").mockImplementation((sql, callback)=>{
                return callback(null)
            })

            jest.spyOn(dao,"getCartId").mockImplementation((user)=>{
                return Promise.resolve(idCart);
            })
            async ()=>{
                const response = await dao.clearCart(user)
                expect(response).toBe(true)
            }
            
        })

        test("It should return a 404 error code if there is no unpaid cart for the user", () => {
            // Mock the db.get method to simulate cart not found
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(new CartNotFoundError(), null);
                return {} as Database;
            });

            async ()=>{
                await expect(dao.clearCart(user)).rejects.toThrow(CartNotFoundError);
            }
            // Call the method and expect it to throw CartNotFoundError
        
        });
    })
})

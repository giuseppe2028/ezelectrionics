import {ProductReview} from "../../src/components/review";
import {Role, User} from "../../src/components/user";
import Authenticator from "../../src/routers/auth";
import ReviewController from "../../src/controllers/reviewController";
import request from "supertest";
import {app} from "../../index";
import {Cart} from "../../src/components/cart";
import CartController from "../../src/controllers/cartController";
const baseURL = "/ezelectronics"
describe("Route Cart",()=>{



describe("GET /carts", () => {
    let testUser: User;
    let mockIsCustomer: jest.SpyInstance;
    let mockGetCart: jest.SpyInstance;

    beforeEach(() => {
        testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");

        // Mock the authenticator's isCustomer method
        mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });

        // Mock the cart controller's getCart method

    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should return the cart with status 200", async () => {

        mockGetCart = jest.spyOn(CartController.prototype, 'getCart').mockResolvedValueOnce(new Cart("test", false, "", 0, []));

        const response = await request(app).get('/ezelectronics/carts');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            customer: "test",
            paid: false,
            paymentDate: "",
            total: 0,
            products: []
        });
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);
        expect(mockGetCart).toHaveBeenCalledTimes(1);
        expect(mockGetCart).toHaveBeenCalledWith(testUser);
    });

    test("should handle errors from getCart", async () => {
        mockGetCart = jest.spyOn(CartController.prototype, 'getCart').mockRejectedValue(new Error("db error"));

        const response = await request(app).get('/ezelectronics/carts');

        expect(response.status).toBe(503);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);
        expect(mockGetCart).toHaveBeenCalledTimes(1);
        expect(mockGetCart).toHaveBeenCalledWith(testUser);
    });
});

describe("POST /carts", () => {
    let testUser: User;



    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should return the cart with status 200", async () => {
        const model1 = {model:"model"}
        testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");

        // Mock the authenticator's isCustomer method
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });
        const mockPostCart = jest.spyOn(CartController.prototype, 'addToCart').mockResolvedValueOnce(true);

        const response = await request(app).post('/ezelectronics/carts').send(model1);

        expect(response.status).toBe(200);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);

        expect(mockPostCart).toHaveBeenCalledTimes(1);
    });

    test("should return the cart with status 422", async () => {
        const model1 = {model:""}
        testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");

        // Mock the authenticator's isCustomer method
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });
        const mockPostCart = jest.spyOn(CartController.prototype, 'addToCart').mockResolvedValueOnce(true);

        const response = await request(app).post('/ezelectronics/carts').send(model1);

        expect(response.status).toBe(422);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);

    });
    test("should return the cart with status 422", async () => {
        const model1 = {model:" "}
        testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");

        // Mock the authenticator's isCustomer method
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });
        const mockPostCart = jest.spyOn(CartController.prototype, 'addToCart').mockResolvedValueOnce(true);

        const response = await request(app).post('/ezelectronics/carts').send(model1);

        expect(response.status).toBe(422);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);

    });

    test("should return the cart with status 401", async () => {
        const model1 = {model:" "}
        testUser = new User("test", "test", "test", Role.ADMIN, "", "");

        // Mock the authenticator's isCustomer method
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            req.user = testUser;
            return res.status(401).json({ error: "Unauthorized" });
        });
        const mockPostCart = jest.spyOn(CartController.prototype, 'addToCart').mockResolvedValueOnce(true);

        const response = await request(app).post('/ezelectronics/carts').send(model1);

        expect(response.status).toBe(401);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);

    });
});

describe("PATCH /carts", () => {
    let testUser: User;



    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should return the cart with status 200", async () => {
        testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");

        // Mock the authenticator's isCustomer method
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });
        // Mock the controller's checkoutCart method
        const mockCheckoutCart = jest.spyOn(CartController.prototype, 'checkoutCart').mockResolvedValueOnce(true);

        const response = await request(app).patch('/ezelectronics/carts');

        expect(response.status).toBe(200);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);
        expect(mockCheckoutCart).toHaveBeenCalledTimes(1);
        expect(mockCheckoutCart).toHaveBeenCalledWith(testUser);
    });


});

describe("GET /history", () => {
    let testUser: User;



    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should return the cart with status 200", async () => {
        testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");
        const listCart = [
            new Cart(testUser.username,false,"",0,[])
        ]
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });
        const mockgetCustomerCarts = jest.spyOn(CartController.prototype, 'getCustomerCarts').mockResolvedValueOnce(listCart);

        const response = await request(app).get('/ezelectronics/carts/history');

        expect(response.status).toBe(200);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledWith(testUser);
    });

    test("should return the cart with status 500", async () => {
        testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");
        const listCart = [
            new Cart(testUser.username,false,"",0,[])
        ]
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });
        const mockgetCustomerCarts = jest.spyOn(CartController.prototype, 'getCustomerCarts').mockRejectedValue(new Error("err"));

        const response = await request(app).get('/ezelectronics/carts/history');

        expect(response.status).toBe(503);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledWith(testUser);
    });


});


describe("DELETE /products/:model", () => {
    let testUser: User;



    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should return the cart with status 200", async () => {
        testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");
        const listCart = [
            new Cart(testUser.username,false,"",0,[])
        ]
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });
        const mockgetCustomerCarts = jest.spyOn(CartController.prototype, 'removeProductFromCart').mockResolvedValueOnce(true);

        const response = await request(app).delete('/ezelectronics/carts/products/3');

        expect(response.status).toBe(200);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledWith(testUser,"3");
    });

    test("should return the cart with status 500", async () => {
        testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");
        const listCart = [
            new Cart(testUser.username,false,"",0,[])
        ]
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });
        const mockgetCustomerCarts = jest.spyOn(CartController.prototype, 'removeProductFromCart').mockRejectedValue(new Error("err"));

        const response = await request(app).delete('/ezelectronics/carts/products/3');

        expect(response.status).toBe(503);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledWith(testUser,"3");
    });


});


describe("DELETE /current", () => {
    let testUser: User;


    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should return the cart with status 200", async () => {
        testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");
        const listCart = [
            new Cart(testUser.username, false, "", 0, [])
        ]
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });
        const mockgetCustomerCarts = jest.spyOn(CartController.prototype, 'clearCart').mockResolvedValueOnce(true);

        const response = await request(app).delete('/ezelectronics/carts/current');

        expect(response.status).toBe(200);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledWith(testUser);
    });

    test("should return the cart with status 500", async () => {
        testUser = new User("test", "test", "test", Role.CUSTOMER, "", "");
        const listCart = [
            new Cart(testUser.username, false, "", 0, [])
        ]
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });
        const mockgetCustomerCarts = jest.spyOn(CartController.prototype, 'clearCart').mockRejectedValue(new Error("err"));

        const response = await request(app).delete('/ezelectronics/carts/current');

        expect(response.status).toBe(503);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledWith(testUser);
    });
})
    describe("DELETE /", () => {
        let testUser: User;



        afterEach(() => {
            jest.restoreAllMocks();
        });

        test("should return the cart with status 200", async () => {
            testUser = new User("test", "test", "test", Role.ADMIN, "", "");
            const listCart = [
                new Cart(testUser.username,false,"",0,[])
            ]
            const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });
            const mockgetCustomerCarts = jest.spyOn(CartController.prototype, 'deleteAllCarts').mockResolvedValueOnce(true);

            const response = await request(app).delete('/ezelectronics/carts');

            expect(response.status).toBe(200);
            expect(mockIsCustomer).toHaveBeenCalledTimes(1);
            expect(mockgetCustomerCarts).toHaveBeenCalledTimes(1);
        });

        test("should return the cart with status 500", async () => {
            testUser = new User("test", "test", "test", Role.ADMIN, "", "");
            const listCart = [
                new Cart(testUser.username,false,"",0,[])
            ]
            const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req, res, next) => {
                req.user = testUser;
                return next();
            });
            const mockgetCustomerCarts = jest.spyOn(CartController.prototype, 'deleteAllCarts').mockRejectedValue(new Error("err"));

            const response = await request(app).delete('/ezelectronics/carts');

            expect(response.status).toBe(503);
            expect(mockIsCustomer).toHaveBeenCalledTimes(1);
            expect(mockgetCustomerCarts).toHaveBeenCalledTimes(1);
        });


});


describe("GET /all", () => {
    let testUser: User;



    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should return the cart with status 200", async () => {
        testUser = new User("test", "test", "test", Role.ADMIN, "", "");
        const listCart = [
            new Cart(testUser.username,false,"",0,[])
        ]
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });
        const mockgetCustomerCarts = jest.spyOn(CartController.prototype, 'getAllCarts').mockResolvedValueOnce(listCart);

        const response = await request(app).get('/ezelectronics/carts/all');

        expect(response.status).toBe(200);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledTimes(1);
    });

    test("should return the cart with status 500", async () => {
        testUser = new User("test", "test", "test", Role.ADMIN, "", "");
        const listCart = [
            new Cart(testUser.username,false,"",0,[])
        ]
        const mockIsCustomer = jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementation((req, res, next) => {
            req.user = testUser;
            return next();
        });
        const mockgetCustomerCarts = jest.spyOn(CartController.prototype, 'getAllCarts').mockRejectedValue(new Error("err"));

        const response = await request(app).get('/ezelectronics/carts/all');

        expect(response.status).toBe(503);
        expect(mockIsCustomer).toHaveBeenCalledTimes(1);
        expect(mockgetCustomerCarts).toHaveBeenCalledTimes(1);
    });


});
})
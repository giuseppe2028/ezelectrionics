import {ProductReview} from "../../src/components/review";
import ReviewController from "../../src/controllers/reviewController";
import request from "supertest";
import {app} from "../../index";
import Authenticator from "../../src/routers/auth";
import {Role, User} from "../../src/components/user";

const baseURL = "/ezelectronics"
describe("add review to a product",()=>{

    const testReivew = new ProductReview("test","test",1,"test","test");
    let testUser:User;
   beforeEach(()=>{
       testUser = new User("test","test","test",Role.CUSTOMER, "","");
        jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req,res,next)=>{
           req.user = testUser
           return next();
       });
   });

    afterEach(()=>{
         jest.restoreAllMocks();
    });

    test("function: add a review",async () => {
        const model = "testmodel";
        const mockController = jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce();
        const response = await request(app).post(`${baseURL}/reviews/${model}`).send(
            {
                user: testUser,
                model: model,
                score: 4,
                comment: "Great product!"
            }
        );
        expect(response.status).toBe(200);
        expect(mockController).toHaveBeenCalledWith("testmodel", testUser, 4, "Great product!");
    });

});


describe("Retrive a product",()=>{
    const model = "test";
    const productTest = new ProductReview("test","test",1,"test","test");
   beforeEach(()=>{
       jest.spyOn(Authenticator.prototype,'isLoggedIn').mockImplementation((req,res,next)=>{
           return next();
       });
   });
   test("retrive all review of a product",async () => {
       const mockController = jest.spyOn(ReviewController.prototype, 'getProductReviews').mockResolvedValueOnce([productTest]);
       const response = await request(app).get(`${baseURL}/reviews/${model}`);

       expect(response.status).toBe(200);
       expect(response.body).toEqual([productTest])
       expect(mockController).toHaveBeenCalledWith(model);
   });
});

describe("delete a review of product",()=>{
    const model = "test";
    let testUser:User;
    beforeEach(()=>{
        testUser  = new User("test","test","test",Role.CUSTOMER, "","");
        jest.spyOn(Authenticator.prototype,'isCustomer').mockImplementation((req,res,next)=>{
            req.user = testUser
            return next();
        });
    });
    test("delete a review of a product",async () => {
        const mockController = jest.spyOn(ReviewController.prototype, 'deleteReview').mockResolvedValueOnce();
        const response = await request(app).delete(`${baseURL}/reviews/${model}`);

        expect(response.status).toBe(200);
        expect(mockController).toHaveBeenCalledWith(model,testUser);
    });
});


describe("delete all reviews of a product",()=>{
    const model = "test";
    let testUser:User;
    beforeEach(()=>{
        jest.spyOn(Authenticator.prototype,'isAdminOrManager').mockImplementation((req,res,next)=>{
            return next();
        });
    });
    test("delete all reviews of a product",async () => {
        const mockController = jest.spyOn(ReviewController.prototype, 'deleteReviewsOfProduct').mockResolvedValueOnce();
        const response = await request(app).delete(`${baseURL}/reviews/${model}/all`);

        expect(response.status).toBe(200);
        expect(mockController).toHaveBeenCalledWith(model);
    });
});


describe("delete a product",()=>{
    beforeEach(()=>{
        jest.spyOn(Authenticator.prototype,'isAdminOrManager').mockImplementation((req,res,next)=>{
            return next();
        });
    });
    test("delete a product",async () => {
        const mockController = jest.spyOn(ReviewController.prototype, 'deleteAllReviews').mockResolvedValueOnce();
        const response = await request(app).delete(`${baseURL}/reviews/`);

        expect(response.status).toBe(200);
    });
});



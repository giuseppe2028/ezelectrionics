import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
import request from 'supertest';
import { app } from "../index";
import {cleanup, promisedCleanup} from "../src/db/cleanup";

const routePath = "/ezelectronics"; // Base route path for the API

// Default user information.
const Customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" };
const user = { username: "user", name: "user", surname: "user", password: "user", role: "Customer" };
const Manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" };
const Admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" };
const product1 = {
    "model": "test",
    "category": "Smartphone",
    "quantity": 6,
    "sellingPrice": 9.99,
    "arrivalDate": "2024-05-24"
}

// Cookies for the users.
let customerCookie: string;
let userCookie: string;
let managerCookie: string;
let adminCookie: string;

// Helper function that creates a new user in the database.
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200);
}

// Helper function that logs in a user and returns the cookie.
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                resolve(res.header["set-cookie"][0]);
            });
    });
}

const addProduct = async (productInfo:any) =>{
    return new Promise<void>((resolve, reject) => {
        request(app)
            .post(`${routePath}/products`)
            .set("Cookie",managerCookie)
            .send(productInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(productInfo)
            })
    })
}

const addReview = async (reviewInfo:any, userCookie:any) =>{
    return new Promise<void>((resolve, reject) => {
        request(app)
            .post(`${routePath}/reviews/test`)
            .set("Cookie",userCookie)
            .send(reviewInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve()
            })
    })
}

//-------------------------TEST INTEGRATION REVIEWS:----------------------------

describe("POST /reviews/:model", () => {
    beforeEach(async () => {
        await promisedCleanup();
        await postUser(Customer);
        customerCookie = await login(Customer);
        await postUser(Manager);
        managerCookie = await login(Manager);
        await addProduct(product1);
    });

    afterEach(async () => {
        await promisedCleanup();
    });

    test("should return 200 success and create new review", async () => {

        const review = {
            score: 5,
            comment: 'comment',
        };

        await request(app)
            .post(`${routePath}/reviews/test`)
            .set("Cookie",customerCookie)
            .send(review)
            .expect(200)

        const reviews = await request(app)
            .get(`${routePath}/reviews/test`)
            .set("Cookie", customerCookie)
            .expect(200);

        expect(reviews.body).toHaveLength(1);
        const data_review = reviews.body.find((rev: any) => rev.comment === review.comment);
        expect(data_review).toBeDefined();
        expect(data_review.score).toBe(review.score);
        expect(data_review.comment).toBe(review.comment);
    });

    test("should return 404 error for non-existent product", async () => {
        const review = { score: 4, comment: "Great product!" };
        await request(app)
            .post(`${routePath}/reviews/nonexistent_product`)
            .send(review)
            .set("Cookie", customerCookie)
            .expect(404);
    });

    test("should return 409 error for existing review by the same customer", async () => {
        const review = { score: 4, comment: "Great product!", };

        await request(app)
            .post(`${routePath}/reviews/test`)
            .send(review)
            .set("Cookie", customerCookie)
            .expect(200);

        await request(app)
            .post(`${routePath}/reviews/test`)
            .send(review)
            .set("Cookie", customerCookie)
            .expect(409);
    });

    test("should return 422 score is > 5", async () => {
        const review = { score: 6, comment: "Great product!", };

        await request(app)
            .post(`${routePath}/reviews/test`)
            .send(review)
            .set("Cookie", customerCookie)
            .expect(422);
    });
});

describe("GET /reviews/:model", () => {

    beforeEach(async () => {
        await promisedCleanup()
        await postUser(Customer);
        customerCookie=await login(Customer);
        await postUser(Manager);
        managerCookie=await login(Manager);
        await addProduct(product1);
    });

    afterAll(async () => {
        await promisedCleanup();
    });

    test("should return 200 success and retrieve reviews for a product", async () => {

        const review1 = {            
            score: 4,
            comment: 'Great product'
        }
        const review2 = {
            score: 3,
            comment: 'Great'
        }
        await postUser(user);
        userCookie=await login(user);
        await addReview(review1, customerCookie);
        await addReview(review2, userCookie);

        const reviews = await request(app)
            .get(`${routePath}/reviews/${product1.model}`)
            .set("Cookie", customerCookie)
            .expect(200);

            expect(reviews.body).toHaveLength(2);
            expect(reviews.body[0].comment).toBe(review1.comment)
            expect(reviews.body[1].comment).toBe(review2.comment)
            expect(reviews.body[0].score).toBe(review1.score)
            expect(reviews.body[1].score).toBe(review2.score)
            expect(reviews.body[0].user).toBe(Customer.username)
            expect(reviews.body[1].user).toBe(user.username)
            expect(reviews.body[0].model).toBe(product1.model)
            expect(reviews.body[1].model).toBe(product1.model)
    });

    test("should return 404 but it does not find products", async () => {
        await request(app)
            .get(`${routePath}/reviews/nonexistent_product`)
            .set("Cookie", customerCookie)
            .expect(404);
    });

    test("should return 401 error if not authenticated", async () => {
        await request(app)
            .get(`${routePath}/reviews/${product1.model}`)
            .expect(401);
    });
    
    test("should return 422 because model not exists", async () => {
        await request(app)
            .get(`${routePath}/reviews/ /`)
            .set("Cookie", customerCookie)
            .expect(422);
    });

});

describe("DELETE /reviews/:model", () => {
    beforeEach(async () => {
        await promisedCleanup();
        await postUser(Customer);
        customerCookie = await login(Customer);
        await postUser(Manager);
        managerCookie = await login(Manager);
        await addProduct(product1);
    });

    afterEach(async () => {
        await promisedCleanup();
    });

    test("should return 200 success and delete a review", async () => {
        const review = { score: 4, comment: "Great product!", };
        
        await request(app)
            .post(`${routePath}/reviews/test`)
            .send(review)
            .set("Cookie", customerCookie)
            .expect(200);

        await request(app)
            .delete(`${routePath}/reviews/test`)
            .set("Cookie", customerCookie)
            .expect(200);

        const reviews = await request(app)
            .get(`${routePath}/reviews/test`)
            .set("Cookie", customerCookie)
            .expect(200);

        expect(reviews.body).toHaveLength(0);
    });

    test("should return 404 error for review not found", async () => {
        await request(app)
            .delete(`${routePath}/reviews/nonexistent_review`)
            .set("Cookie", customerCookie)
            .expect(404);
    });
});

describe("DELETE /reviews/:model", () => {
    beforeEach(async () => {
        await promisedCleanup();
        await postUser(Customer);
        customerCookie = await login(Customer);
        await postUser(Manager);
        managerCookie = await login(Manager);
        await postUser(Admin);
        adminCookie = await login(Admin);
        await addProduct(product1);
    });

    afterEach(async() => {
        await promisedCleanup();
    });

    test("should return 200 success and delete a review", async () => {
        const review = { score: 4, comment: "Great product!", };
        
        await request(app)
            .post(`${routePath}/reviews/test`)
            .send(review)
            .set("Cookie", customerCookie)
            .expect(200);

        await request(app)
            .delete(`${routePath}/reviews/test`)
            .set("Cookie", customerCookie)
            .expect(200);

        const reviews = await request(app)
            .get(`${routePath}/reviews/test`)
            .set("Cookie", customerCookie)
            .expect(200);

        expect(reviews.body).toHaveLength(0);
    });

    test("should return 404 error for review not found", async () => {
        await request(app)
            .delete(`${routePath}/reviews/nonexistent_review`)
            .set("Cookie", customerCookie)
            .expect(404);
    });

    test("should return 401 Unauthorized (manager)", async () => {
        const review = { score: 4, comment: "Great product!", };
        
        await request(app)
            .post(`${routePath}/reviews/test`)
            .send(review)
            .set("Cookie", customerCookie)
            .expect(200);

        await request(app)
            .delete(`${routePath}/reviews/test`)
            .set("Cookie", managerCookie)
            .expect(401);
    });

    test("should return 401 Unauthorized (admin)", async () => {
        const review = { score: 4, comment: "Great product!", };
        
        await request(app)
            .post(`${routePath}/reviews/test`)
            .send(review)
            .set("Cookie", customerCookie)
            .expect(200);

        await request(app)
            .delete(`${routePath}/reviews/test`)
            .set("Cookie", adminCookie)
            .expect(401);
    });
});

describe("DELETE /reviews", () => {
    beforeEach(async () => {
        await promisedCleanup();
        await postUser(Admin);
        adminCookie = await login(Admin);
        await postUser(Manager);
        managerCookie = await login(Manager);
        await postUser(Customer);
        customerCookie = await login(Customer);
        await addProduct(product1);
    });

    afterEach(async() => {
        await promisedCleanup();
    });

    test("should return 200 success and delete all reviews of all products (admin)", async () => {
        await postUser(user);
        userCookie = await login(user);

        const review1 = { score: 5, comment: "Great product!" };
        const review2 = { score: 4, comment: "Good product!"};

        await addReview(review1, customerCookie)
        await addReview(review2, userCookie)
       
        await request(app)
            .delete(`${routePath}/reviews`)
            .set("Cookie", adminCookie)
            .expect(200);

        const reviews1 = await request(app)
            .get(`${routePath}/reviews/test`)
            .set("Cookie", adminCookie)
            .expect(200);

        expect(reviews1.body).toHaveLength(0);
    });
    
    test("should return 200 success and delete all reviews of all products (manager)", async () => {
        await postUser(user);
        userCookie = await login(user);

        const review1 = { score: 5, comment: "Great product!" };
        const review2 = { score: 4, comment: "Good product!"};

        await addReview(review1, customerCookie)
        await addReview(review2, userCookie)
       
        await request(app)
            .delete(`${routePath}/reviews`)
            .set("Cookie", managerCookie)
            .expect(200);

        const reviews1 = await request(app)
            .get(`${routePath}/reviews/test`)
            .set("Cookie", managerCookie)
            .expect(200);

        expect(reviews1.body).toHaveLength(0);
    });

    test("should return 401 Unauthorized (customer)", async () => {
        await postUser(user);
        userCookie = await login(user);

        const review1 = { score: 5, comment: "Great product!" };
        const review2 = { score: 4, comment: "Good product!"};

        await addReview(review1, customerCookie)
        await addReview(review2, userCookie)
       
        await request(app)
            .delete(`${routePath}/reviews`)
            .set("Cookie", customerCookie)
            .expect(401);

        const reviews1 = await request(app)
            .get(`${routePath}/reviews/test`)
            .set("Cookie", customerCookie)
            .expect(200);

        expect(reviews1.body).toHaveLength(2);
    });
});






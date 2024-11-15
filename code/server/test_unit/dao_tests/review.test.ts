import ReviewDAO from "../../src/dao/reviewDAO";
import {Role, User} from "../../src/components/user";
import db from "../../src/db/db";
import {param} from "express-validator";
import {Database} from "sqlite3";
import {ExistingReviewError} from "../../src/errors/reviewError";
import {throws} from "node:assert";
import {UserAlreadyExistsError} from "../../src/errors/userError";
import {ProductReview} from "../../src/components/review";
jest.mock("../../src/db/db.db");
describe("Insert Review", ()=> {
    let dao:ReviewDAO;
    beforeEach(()=>{
         dao = new ReviewDAO();
    });
    afterEach(()=>{
        jest.restoreAllMocks();
    });

    test("insertReview", async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const result = await dao.insertReview("Iphone13", new User("Giuseppe123", "Giuseppe", "Barone", Role.CUSTOMER, "", ""), 3, "Bel prodotto");
        expect(result).toBeUndefined();

    });
    test("insertReviewJustAdded", async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("UNIQUE constraint failed: Review.ref_utente, Review.ref_product_descriptor"))
            return {} as Database
        });
        expect(dao.insertReview("Iphone13", new User("Giuseppe123", "Giuseppe", "Barone", Role.CUSTOMER, "", ""), 3, "Bel prodotto"))
            .rejects
            .toThrow(ExistingReviewError)
    });
});

describe("get-All-Review", ()=> {

    const review = {
        score: 2,
        date: "test",
        comment: "test",
        ref_user:"test",
        ref_product_descriptor:"test"
    }
    let dao:ReviewDAO;
    beforeEach(()=>{
        dao = new ReviewDAO();
    });
    afterEach(()=>{
        jest.restoreAllMocks();
    });

    test("product-found", async ()=>{
        jest.spyOn(db,"all").mockImplementation((sql,params,callback)=>{

            callback(null,[review]);
            return {} as Database
        });
        const result = await dao.getAllReviews("iphone13");
        expect(result).toEqual([new ProductReview("test","test",2,"test","test")])
    });
});

describe("delete Review", ()=> {
    let dao:ReviewDAO;
    beforeEach(()=>{
        dao = new ReviewDAO();
    });
    afterEach(()=>{
        jest.restoreAllMocks();
    });
    test("delete Review", async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });
        const result = await dao.deleteReview('iphone13',new User("ciao","ciao","ciao",Role.CUSTOMER,"ciao","ciao"));
        expect(result).toBeUndefined();
    });

});
describe("delete Review of product", ()=> {
    let dao:ReviewDAO;
    beforeEach(()=>{
        dao = new ReviewDAO();
    });
    afterEach(()=>{
        jest.restoreAllMocks();
    });
    test("delete Review of product", async () => {
        jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as Database
        });
        const result = await dao.deleteReviewOfProduct('iphone13');
        expect(result).toBeUndefined();
    });

});
describe("delete all reviews", ()=> {
    let dao:ReviewDAO;
    beforeEach(()=>{
        dao = new ReviewDAO();
    });
    afterEach(()=>{
        jest.restoreAllMocks();
    });

    test("delete all reviews", async () => {
        jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            callback(null);
            return {} as Database
        });
        const result = await dao.deleteAllReviews();
        expect(result).toBeUndefined();
    });
});









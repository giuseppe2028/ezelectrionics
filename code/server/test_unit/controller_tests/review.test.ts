import ReviewController from "../../src/controllers/reviewController";
import ReviewDAO from "../../src/dao/reviewDAO";
import ProductDAO from "../../src/dao/productDAO";
import {Role, User} from "../../src/components/user";
import {ExistingReviewError, NoReviewProductError} from "../../src/errors/reviewError";
import {ProductNotFoundError} from "../../src/errors/productError";
import {ProductReview} from "../../src/components/review";

describe("function: addReviewController", ()=>{
    const testReview = {
        model: "test",
        user: new User("username","name","surname",Role.CUSTOMER, "address","birtdate"),
        score: 10,
        description: "test"
    }

    let reviewController:ReviewController;
    beforeEach(()=>{
        reviewController = new ReviewController();
    });
    afterEach(()=>{
        jest.clearAllMocks();
    });

    test("Case: Product exists, reivew Added correctly",async () => {

        //create a mock of review dao
        jest.spyOn(ReviewDAO.prototype, "insertReview").mockResolvedValueOnce();
        //create a mock of product in order to verify if the product exits
        jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(true);

        //the product exits and it is added correctly
        const response = await reviewController.addReview(testReview.model, testReview.user, testReview.score, testReview.description);

        expect(ReviewDAO.prototype.insertReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.insertReview).toHaveBeenCalledWith(
            testReview.model, testReview.user, testReview.score, testReview.description
        );
        expect(response).toBeUndefined();

    });
    test("Case: Product not exists, review not added", async () => {
        const mock1 = jest.spyOn(ReviewDAO.prototype, "insertReview").mockResolvedValueOnce();

        const mock2 =  jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockRejectedValueOnce(new ProductNotFoundError());

        let error;

        try {

            await reviewController.addReview(testReview.model, testReview.user, testReview.score, testReview.description);
        } catch (err) {
            error = err;
        }

        // verify that insertReview haven't been called
        expect(ReviewDAO.prototype.insertReview).not.toHaveBeenCalled();
        // verify that error is an istance of ProductNotFoundError
        expect(error).toBeInstanceOf(ProductNotFoundError);

        mock1.mockRestore();
        mock2.mockRestore();

    });
    test("Case: Product exists, review not added correctly", async () => {

        jest.spyOn(ReviewDAO.prototype, "insertReview").mockRejectedValueOnce(new ExistingReviewError());

        jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(true);

        let error;
        try {
            await reviewController.addReview(testReview.model, testReview.user, testReview.score, testReview.description);
        } catch (err) {
            error = err;
        }

        expect(ReviewDAO.prototype.insertReview).toHaveBeenCalledTimes(1);
        expect(ReviewDAO.prototype.insertReview).toHaveBeenCalledWith(
            testReview.model, testReview.user, testReview.score, testReview.description
        );

        expect(error).toBeInstanceOf(ExistingReviewError);

    });
    test("Case: Product not exists, review not added correctly",async () => {
        jest.spyOn(ReviewDAO.prototype, "insertReview").mockRejectedValueOnce(new ExistingReviewError());

        jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockRejectedValueOnce(new ProductNotFoundError());

        let error;
        try {
            await reviewController.addReview(testReview.model, testReview.user, testReview.score, testReview.description);
        } catch (err) {
            error = err;
        }

        expect(ReviewDAO.prototype.insertReview).not.toHaveBeenCalled();
        expect(error).toBeInstanceOf(ProductNotFoundError);

    });
});

describe("function: getProductReviews",()=>{
    const testReviewRetrived =  {
        model: "test",
        user: "test",
        data: "test",
        score: 10,
        comment: "test"
    }
    let reviewController:ReviewController;
    beforeEach(()=>{
        reviewController = new ReviewController();
    });
    afterEach(()=>{
        jest.clearAllMocks();
    });

    test("Case: allReviewRetrived", async () => {
        const mockGetAllReviews = jest.spyOn(ReviewDAO.prototype, "getAllReviews").mockResolvedValueOnce([new ProductReview(
            testReviewRetrived.model,
            testReviewRetrived.user,
            testReviewRetrived.score,
            testReviewRetrived.data,
            testReviewRetrived.comment
        )]);
        const mockcheckProductExistsByModel = jest.spyOn(ProductDAO.prototype,"checkProductExistsByModel").mockResolvedValueOnce(true)

        const response = await reviewController.getProductReviews("test");
        expect(mockGetAllReviews).toHaveBeenCalledTimes(1);
        expect(mockGetAllReviews).toHaveBeenCalledWith(
            testReviewRetrived.model
        );
        expect(mockcheckProductExistsByModel).toHaveBeenCalledTimes(1);
        expect(mockGetAllReviews).toHaveBeenCalledWith(testReviewRetrived.model);

        expect(response).toEqual([
            new ProductReview(
                testReviewRetrived.model,
                testReviewRetrived.user,
                testReviewRetrived.score,
                testReviewRetrived.data,
                testReviewRetrived.comment
            )
        ]);
    });

})

describe("function: deleteReview",()=>{

    let reviewController:ReviewController;

    beforeEach(()=>{
        reviewController = new ReviewController();
    });

    afterEach(()=>{
        jest.clearAllMocks();
    });

    test("Case: the product exists, the user has the review",async () => {
        const userTest = new User("test", "test", "test", Role.CUSTOMER, "test", "test");

        const mockProductExists = jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(true);
        const mockReviewExists = jest.spyOn(ReviewDAO.prototype, "checkReviewExists").mockResolvedValueOnce(true);
        const mockDeleteReview = jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce();

        const response = await reviewController.deleteReview("test", userTest);

        expect(response).toBeUndefined();

        expect(mockProductExists).toHaveBeenCalledTimes(1);
        expect(mockProductExists).toHaveBeenCalledWith("test");

        expect(mockReviewExists).toHaveBeenCalledTimes(1);
        expect(mockReviewExists).toHaveBeenCalledWith("test",userTest);

        expect(mockDeleteReview).toHaveBeenCalledTimes(1)
        expect(mockDeleteReview).toHaveBeenCalledWith("test",userTest);

        expect(response).toBeUndefined();

    });
    test("Case: the product not exists, the user has the review",async () => {
        const userTest = new User("test", "test", "test", Role.CUSTOMER, "test", "test");

        const mockProductExists = jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(false);
        const mockReviewExists = jest.spyOn(ReviewDAO.prototype, "checkReviewExists").mockResolvedValueOnce(true);
        const mockDeleteReview = jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce();

        let error;
        try{
            await reviewController.deleteReview("test", userTest);
        }
        catch(err){
           error = err;
        }

        expect(mockProductExists).toHaveBeenCalledTimes(1);
        expect(mockProductExists).toHaveBeenCalledWith("test");

        expect(mockReviewExists).not.toHaveBeenCalled();
        expect(mockDeleteReview).not.toHaveBeenCalled();

        expect(error).toBeInstanceOf(ProductNotFoundError);

        mockProductExists.mockRestore();
        mockDeleteReview.mockRestore();
        mockReviewExists.mockRestore();
    });
    test("Case: the product exists, the user hasn't the review",async () => {
        const userTest = new User("test", "test", "test", Role.CUSTOMER, "test", "test");

        const mockProductExists = jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(true);
        const mockReviewExists = jest.spyOn(ReviewDAO.prototype, "checkReviewExists").mockResolvedValueOnce(false);
        const mockDeleteReview = jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce();

        let error;
        try {
            await reviewController.deleteReview("test", userTest);
        }catch (err){
            error = err;
        }
        expect(mockProductExists).toHaveBeenCalledTimes(1);
        expect(mockProductExists).toHaveBeenCalledWith("test");

        expect(mockReviewExists).toHaveBeenCalledTimes(1);
        expect(mockReviewExists).toHaveBeenCalledWith("test",userTest);

        expect(mockDeleteReview).not.toHaveBeenCalled();

        expect(error).toBeInstanceOf(NoReviewProductError);

    });
    test("Case: the product not exists, the user hasn't the review",async () => {
        const userTest = new User("test", "test", "test", Role.CUSTOMER, "test", "test");

        const mockProductExists = jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(false);
        const mockReviewExists = jest.spyOn(ReviewDAO.prototype, "checkReviewExists").mockResolvedValueOnce(false);
        const mockDeleteReview = jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce();

        let error;
        try{
             await reviewController.deleteReview("test", userTest);
        }catch (err){
            error = err;
        }


        expect(mockProductExists).toHaveBeenCalledTimes(1);
        expect(mockProductExists).toHaveBeenCalledWith("test");

        expect(mockReviewExists).not.toHaveBeenCalled();
        expect(mockDeleteReview).not.toHaveBeenCalled();

        expect(error).toBeInstanceOf(ProductNotFoundError);

    });

});

describe("function: deleteReviewsOfProduct",()=>{
    let reviewController:ReviewController;

    beforeEach(()=>{
        reviewController = new ReviewController();
    });

    afterEach(()=>{
        jest.clearAllMocks();
    });


    test("Case: the product exists",async () => {
        const mockProductExists = jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(true);
        const mockDeleteReviewOfProduct = jest.spyOn(ReviewDAO.prototype, "deleteReviewOfProduct").mockResolvedValueOnce()

        const response = await reviewController.deleteReviewsOfProduct("test");

        expect(mockProductExists).toHaveBeenCalledTimes(1);
        expect(mockProductExists).toHaveBeenCalledWith("test");

        expect(mockDeleteReviewOfProduct).toHaveBeenCalledTimes(1);
        expect(mockDeleteReviewOfProduct).toHaveBeenCalledWith("test");

        expect(response).toBeUndefined();

    });
    test("Case: the product not exists",async () => {
        const mockProductExists = jest.spyOn(ProductDAO.prototype, "checkProductExistsByModel").mockResolvedValueOnce(false);
        const mockDeleteReviewOfProduct = jest.spyOn(ReviewDAO.prototype, "deleteReviewOfProduct").mockResolvedValueOnce()

        let error;
        try{
            await reviewController.deleteReviewsOfProduct("test");
        }catch (err){
            error = err;
        }

        expect(mockProductExists).toHaveBeenCalledTimes(1);
        expect(mockProductExists).toHaveBeenCalledWith("test");

        expect(mockDeleteReviewOfProduct).not.toHaveBeenCalled();

        expect(error).toBeInstanceOf(ProductNotFoundError);

    });

});

describe("function: deleteAllReviews",()=>{
    let reviewController:ReviewController;

    beforeEach(()=>{
        reviewController = new ReviewController();
    });

    afterEach(()=>{
        jest.clearAllMocks();
    });

    test("deleteAllReviews",async () => {
        const mockDeleteAllReview = jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce();

        const response = await reviewController.deleteAllReviews();

        expect(mockDeleteAllReview).toHaveBeenCalledTimes(1);
        expect(response).toBeUndefined();

    });

});





import { User } from "../components/user";
import ReviewDAO from "../dao/reviewDAO";
import {Utility} from "../utilities";
import ProductDAO from "../dao/productDAO";
import productDAO from "../dao/productDAO";
import {ExistingReviewError, NoReviewProductError} from "../errors/reviewError";
import {ProductNotFoundError} from "../errors/productError";
import {ProductReview} from "../components/review";
class ReviewController {
    private dao: ReviewDAO
    private productDAO:ProductDAO
    constructor() {
        this.dao = new ReviewDAO
        this.productDAO = new ProductDAO
    }

    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */
    async addReview(model: string, user: User, score: number, comment: string) :Promise<void>  {

            //product does not exixsts
            if (!await this.productDAO.checkProductExistsByModel(model)) {
                throw new ProductNotFoundError()
            }
            return this.dao.insertReview(model, user, score, comment)
    }

    /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    async getProductReviews(model: string) :Promise<ProductReview[]> {
        if (!await this.productDAO.checkProductExistsByModel(model)) {
            throw new ProductNotFoundError()
        }
        return this.dao.getAllReviews(model)
    }

    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */
    async deleteReview(model: string, user: User) :Promise<void>  {
        //check if the product is in the database
        if(!await this.productDAO.checkProductExistsByModel(model)){
            throw new ProductNotFoundError()
        }
        //the user does not have a review
        if (!await this.dao.checkReviewExists(model,user)){
            throw new NoReviewProductError();
        }
        return this.dao.deleteReview(model,user);
    }

    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    async deleteReviewsOfProduct(model: string) :Promise<void>  {
        //check if the product is in the database
        if(!await this.productDAO.checkProductExistsByModel(model)){
            throw new ProductNotFoundError()
        }
        return this.dao.deleteReviewOfProduct(model)
    }

    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */
    async deleteAllReviews() :Promise<void> {
        return this.dao.deleteAllReviews();
    }
}

export default ReviewController;
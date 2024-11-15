import express, { Router } from "express"
import ErrorHandler from "../helper"
import { body, param, query } from "express-validator"
import ReviewController from "../controllers/reviewController"
import Authenticator from "./auth"
import { ProductReview } from "../components/review"
import auth from "./auth";

class ReviewRoutes {
    private controller: ReviewController
    private router: Router
    private errorHandler: ErrorHandler
    private authenticator: Authenticator

    constructor(authenticator: Authenticator) {
        this.authenticator = authenticator
        this.controller = new ReviewController()
        this.router = express.Router()
        this.errorHandler = new ErrorHandler()
        this.initRoutes()
    }

    getRouter(): Router {
        return this.router
    }

    initRoutes() {

        /**
         * Route for adding a review to a product.
         * It requires the user calling it to be authenticated and to be a customer
         * It expects a product model as a route parameter. This parameter must be a non-empty string and the product must exist.
         * It requires the following body parameters:
         * - score: number. It must be an integer between 1 and 5.
         * - comment: string. It cannot be empty.
         * It returns a 200 status code.
         */
            this.router.post(
                "/:model",
                param("model").isString().isLength({min : 1}).trim().toLowerCase(),
                body("score").isInt({allow_leading_zeroes: false, lt:6,gt:0} ),
                body("comment").isString().isLength({min : 1}).trim(),
                this.errorHandler.validateRequest,
                (req: any, res: any, next: any) => this.authenticator.isCustomer(req,res,next),
                (req: any, res: any, next: any) => this.controller.addReview(req.params.model, req.user, req.body.score, req.body.comment)
                    .then(() => res.status(200).send())
                    .catch((err: Error) => {
                        next(err)
                    })
            );

        /**
         * Route for retrieving all reviews of a product.
         * It requires the user to be authenticathed
         * It expects a product model as a route parameter. This parameter must be a non-empty string and the product must exist.
         * It returns an array of reviews
         */
        this.router.get(
            "/:model", 
            param("model").isString().trim().notEmpty().toLowerCase(),
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.authenticator.isLoggedIn(req,res,next),
            (req: any, res: any, next: any) => this.controller.getProductReviews(req.params.model)
                .then((reviews: any/*ProductReview[]*/) => res.status(200).json(reviews))
                .catch((err: Error) => {
                    next(err)})
        )

        /**
         * Route for deleting the review made by a user for one product.
         * It requires the user to be authenticated and to be a customer
         * It expects a product model as a route parameter. This parameter must be a non-empty string and the product must exist. The user must also have made a review for the product
         * It returns a 200 status code.
         */
        this.router.delete(
            "/:model",
            param("model").isString().isLength({min : 1}).trim().toLowerCase(),
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.authenticator.isCustomer(req,res,next),
            (req: any, res: any, next: any) => this.controller.deleteReview(req.params.model, req.user)
                .then(() => res.status(200).send())
                .catch((err: Error) => {
                    next(err)
                })
        )

        /**
         * Route for deleting all reviews of a product.
         * It requires the user to be authenticated and to be either an admin or a manager
         * It expects a product model as a route parameter. This parameter must be a non-empty string and the product must exist.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/:model/all",
            param("model").isString().isLength({min : 1}).trim().toLowerCase(),
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.authenticator.isAdminOrManager(req,res,next),
            (req: any, res: any, next: any) => this.controller.deleteReviewsOfProduct(req.params.model)
                .then(() => res.status(200).send())
                .catch((err: Error) => next(err))
        )

        /**
         * Route for deleting all reviews of all products.
         * It requires the user to be authenticated and to be either an admin or a manager
         * It returns a 200 status code.
         */
        this.router.delete(
            "/",
            (req: any, res: any, next: any) => this.authenticator.isAdminOrManager(req,res,next),
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => this.controller.deleteAllReviews()
                .then(() => res.status(200).send())
                .catch((err: Error) => next(err))
        )
    }
}

export default ReviewRoutes;
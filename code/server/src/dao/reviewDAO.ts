import {User} from "../components/user";
import db from "../db/db";
import {param} from "express-validator";
import {UserAlreadyExistsError} from "../errors/userError";
import {ExistingReviewError, NoReviewProductError} from "../errors/reviewError";
import {ProductReview} from "../components/review";
import { Utility } from "../utilities";

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {


    /**
     * Insert a review inside a database. It is called only by a customer, who is just been controlled
     * @param model
     * @param user
     * @param score
     * @param comment
     * */
    
    insertReview(model:string, user:User,score:number,comment:string): Promise<void>{

        return new Promise( (resolve,reject)=> {
            try {
                const sql = "INSERT INTO Review(ref_user,ref_product_descriptor,date,score,comment) VALUES (?,?,?,?,?)";
                db.run(sql, [user.username, model,Utility.getDateString(), score, comment], (err: Error | null) => {
                    if (err) {
                        if (
                            err.message.includes("UNIQUE constraint failed: Review.ref_utente, Review.ref_product_descriptor") ||
                            err.message.includes("UNIQUE constraint failed: Review.ref_user, Review.ref_product_descriptor")
                        ) {
                            reject(new ExistingReviewError)}
                        reject(err)
                    }
                    resolve();
                });
            } catch (error) {
                reject(error)
            }
        });
    }

    getAllReviews(model:string):Promise<ProductReview[]>{
        return new Promise((resolve, reject)=>{
            try{
               const sql = "SELECT * FROM Review WHERE ref_product_descriptor = ? ";
               db.all(sql, [model], (err:Error | null, rows:any) => {
                    if(err){
                        reject(err);
                    }
                    resolve(rows.map((row:any) => new ProductReview(row.ref_product_descriptor, row.ref_user, row.score, row.date, row.comment)));
               });
            }
            catch (error){
                reject(error);
            }
        })
    }

    deleteReview(model:string, user:User):Promise<void>{
        return new Promise((resolve, reject)=>{
           try {
               const sql = "DELETE FROM Review WHERE ref_product_descriptor = ? and ref_user = ?";
               db.run(sql,[model,user.username], function (err:Error | null) {
                   if(err){

                       reject(err);
                   }else{
                       resolve();
                   }
               });
           }catch (error){
               reject(error);
           }
        });
    }

    deleteReviewOfProduct(model:string):Promise<void>{
        return new Promise(
            (resolve, reject)=>{
                try {
                    const sql = "DELETE FROM Review WHERE ref_product_descriptor = ?";
                    db.run(sql,[model], (err:Error | null)=>{
                        if(err){
                            reject(err);
                        }
                        resolve();
                    });
                }
                catch (err){
                    reject(err)
                }
            }
        );
    }
    deleteAllReviews():Promise<void>{
        return new Promise(
            (resolve, reject)=>{
                try {
                    const sql = "DELETE FROM Review";
                    db.run(sql, (err:Error | null)=>{
                        if(err){
                            reject(err);
                        }else{
                            resolve();

                        }
                    });
                }
                catch (err){
                    reject(err)
                }
            }
        );
    }
    
    checkReviewExists(model:string,user:User):Promise<boolean>{
        return new Promise(
            (resolve, reject)=>{
                const sql = "SELECT * FROM Review WHERE ref_user= ? and ref_product_descriptor = ?";
                db.get(sql,[user.username,model], (err:Error|null, row:any)=>{
                 if(err){
                     reject(err);
                 }
                    if(!row || row.ref_product_descriptor != model){
                         resolve(false);
                    }
                    resolve(true);
                });
            }
        )
    }

}

export default ReviewDAO;

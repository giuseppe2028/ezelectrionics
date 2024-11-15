import db from "../db/db"
import { User } from "../components/user"
import { Cart, ProductInCart } from "../components/cart"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../errors/cartError"
import dayjs from "dayjs"
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../errors/productError"
import {Product} from "../components/product";
import productDAO from "./productDAO";
import ProductDAO from "./productDAO";


/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {
    private productDao;
    constructor() {
        this.productDao = new ProductDAO
    }

    /**
     * Method that retrives the current unpaid cart of a specific user
     * */
    getUserCurrentCart(user: User): Promise<Cart> {
        return new Promise((resolve, reject) => {
            try {
                const sql = "Select * from Cart where ref_username = ? and paid = 0";
                const emptyCart = new Cart(user.username, false, null, 0, []);

                db.get(sql, [user.username], async (err: Error | null, row: any) => {

                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        resolve(emptyCart)
                        return
                    }

                    const productsOfCart = await this.fillProducts(row.id_cart);
                    if(productsOfCart.length == 0){
                        resolve(emptyCart)
                        return
                    }

                    resolve(new Cart(user.username, row.paid != 0, row.payment_date == "" ? null : row.payment_date, parseFloat(row.total.toFixed(2)), productsOfCart))
                })
            } catch (error) {
                reject(error);
            }
        })
    }

    addProductToUserCart(currentIdCart: number, product: string, quantity: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO ProductUser(ref_product_descriptor,id_cart,quantity) values (?,?,?)";
            db.run(sql, [product, currentIdCart, quantity], (err: Error | null) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(true)
            })
        })

    }

    checkProductExistsInCart(product: string, idCart: number): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * from ProductUser where ref_product_descriptor = ? and id_cart = ? and quantity > 0 "
            db.get(sql, [product, idCart], (err: Error | null, row: any) => {
                if (err) {
                    reject(err)
                    return
                }
                if (!row) {
                    resolve(false)
                    return;
                }
                resolve(true)
            })
        })
    }

    /**
     * Method that retrives the current id of an unpaid cart of a specific user
     * */
    getCurrentIdCart(user: User): Promise<number> {

        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM Cart WHERE ref_username = ? AND paid = 0";
            db.get(sql, [user.username], (err: Error | null, row: any) => {

                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    resolve(undefined);
                    return;
                }
                resolve(row.id_cart);
            });
        });
    }


    createCart(user: User): Promise<void> {
        return new Promise((resolve, reject) => {

            const sql = "INSERT INTO Cart(paid,payment_date,total,ref_username) values (0,'',0,?)";
            db.run(sql, user.username, (err: Error | null) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve()
            })
        })
    }

    getQuantityOfProductInCart(product: string, idCart: number): Promise<number> {
        return new Promise((resolve, reject) => {
            const sql = "Select quantity from ProductUser where ref_product_descriptor = ? and id_cart = ?";
            db.get(sql, [product, idCart], (err: Error | null, row: any) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(row.quantity)
            })
        })
    }

    updateQuantityProductInCart(cartId: number,product:string):Promise<void>{
        return new Promise((resolve,reject)=>{
            const sql = `UPDATE ProductUser SET quantity = quantity + 1 WHERE id_cart = ? AND ref_product_descriptor = ?`;
            db.run(sql,[cartId,product],(err)=>{
                if(err){
                    reject(err)
                    return
                }
                resolve()
            })

        })
    }

    updateTotalInCart(cartId:number,price:number):Promise<boolean>{
        return new Promise((resolve,reject)=>{
            const sql = `UPDATE Cart SET total = total + ? WHERE id_cart = ?`;
            db.run(sql,[price.toFixed(2),cartId],(err)=>{
                if(err){
                    reject(err)
                    return
                }
                resolve(true)
            })
        })
    }

    updateTotalAndQuantity(cartId:number,price:number,product: string):Promise<boolean>{
       return  new Promise((resolve, reject) => {
            db.serialize(async () => {
                await this.updateQuantityProductInCart(cartId, product)
                await this.updateTotalInCart(cartId, price)
                resolve(true)
            })

        })
     }

    checkoutCart(user: User, cartId: number): Promise<Boolean> {
        return new Promise((resolve, reject) => {

            const paymentDate = dayjs().format('YYYY-MM-DD');

            const updateCartQuery = `UPDATE Cart 
                                         SET paid = 1,
                                             payment_date = ?
                                         WHERE ref_username = ? AND paid = 0`;

            const updateProductQuantityQuery = `
                    UPDATE ProductDescriptor 
                    SET quantity = quantity - (
                        SELECT pu.quantity 
                        FROM ProductUser pu 
                        JOIN Cart c ON c.id_cart = pu.id_cart 
                        WHERE pu.ref_product_descriptor = ProductDescriptor.model AND c.ref_username = ? AND c.paid = 0
                    ) 
                    WHERE model IN (
                        SELECT pu.ref_product_descriptor 
                        FROM ProductUser pu 
                        JOIN Cart c ON c.id_cart = pu.id_cart 
                        WHERE c.ref_username = ? AND c.paid = 0
                    )`;

            db.serialize( () => {
                try{
                    db.run('BEGIN TRANSACTION',  (err) => {
                        if(err){

                            reject(err)
                        }

                    })
                    db.run(updateProductQuantityQuery, [user.username, user.username],async (err) => {
                        if(err){
                            await this.runQuery('ROLLBACK', []);
                            throw err
                        }
                    })
                    db.run(updateCartQuery, [paymentDate, user.username],async (err) => {
                        if(err){
                            await this.runQuery('ROLLBACK', []);
                            throw err
                        }

                    })

                    db.run('COMMIT',async (err) => {
                        if(err){
                            await this.runQuery('ROLLBACK', []);
                            throw err
                        }
                    })
                    resolve(true)
                }catch (err){
                    reject(err)
                }


            })

        });


    }

    getCartHistory(user: User): Promise<Cart[]> {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM Cart WHERE ref_username = ? AND paid = 1";
            const cartList: Cart[] = [];

            db.all(sql, [user.username], async (err: Error | null, rows: any) => {
                if (err) {
                    reject(err);
                    return;
                }

                for (const row of rows) {
                    const products = await this.fillProducts(row.id_cart);
                    cartList.push(new Cart(user.username, row.paid != 0, row.payment_date, parseFloat(row.total.toFixed(2)), products));
                }
                resolve(cartList);
            });
        });
    }

    removeProductFromCart(user: User, product: string): Promise<Boolean> {
        return new Promise(async (resolve, reject) => {
            try {


                const cartId = await this.getCartId(user);
                if (cartId === null) {
                    reject(new CartNotFoundError())
                }
                const cart = await this.getUserCurrentCart(user);

                //prendo il prodotto dal db

                const quantityProductIncart = await this.getQuantityOfProductInCart(product,cartId)
                //controllo che il prodotto sia nel cart
                if (!quantityProductIncart || cart.products.length === 0) {
                    reject(new ProductNotInCartError())
                }

                const productElement:Product = await this.productDao.getProductByModel(product)
                if (!productElement) {
                    //il prodotto non esiste
                    reject(new ProductNotFoundError());
                }
                let query: string = ``;
                quantityProductIncart > 1 ? query = `UPDATE ProductUser SET quantity = quantity - 1 WHERE id_cart = ? AND ref_product_descriptor = ?` :
                    query = `DELETE FROM ProductUser WHERE id_cart = ? AND ref_product_descriptor = ?`;

                const decreaseTotalQuery = `UPDATE Cart SET total = total - ? WHERE id_cart = ?`;

                db.serialize(  () => {

                        db.run('BEGIN TRANSACTION',async (err) => {
                            if(err){
                                await this.runQuery('ROLLBACK', []);
                                reject(err)
                            }

                        })
                        db.run(query, [cartId, product],async (err) => {
                            if(err){
                                await this.runQuery('ROLLBACK', []);
                                reject(err)
                            }
                        })
                        db.run(decreaseTotalQuery, [productElement.sellingPrice, cartId],async (err) => {
                            if(err){
                                await this.runQuery('ROLLBACK', []);
                                reject(err)
                            }
                        })
                        db.run('COMMIT',async (err) => {
                            if(err){
                                await this.runQuery('ROLLBACK', []);
                                reject(err)
                            }
                        })
                        resolve(true);
                })

            } catch (error) {
                reject(error);
            }
        })
    }

    clearCart(user: User):Promise<Boolean>{
        return new Promise(async(resolve, reject) => {
            try {
                const cartId = await this.getCartId(user);
                if(cartId === null)
                    reject(new CartNotFoundError());

                const deleteProductsQuery = `DELETE FROM ProductUser WHERE id_cart = ?`;
                const updateCartQueery = `UPDATE cart SET total = 0 WHERE id_cart = ?`;
                db.serialize( () =>{


                        db.run('BEGIN TRANSACTION')
                        db.run(deleteProductsQuery,[cartId])
                        db.run(updateCartQueery,[cartId])
                        db.run("COMMIT")
                    resolve(true)

                })
            } catch (error) {
                reject(error);
            }
        })
    }

    deleteAllCarts():Promise<boolean>{
        return new Promise((resolve, reject) => {
            try {
                const deleteAllCartsQuery = `DELETE FROM cart`;
                const deleteAllProductUserQuery = `DELETE FROM ProductUser`
                db.serialize(()=>{
                    db.run(deleteAllProductUserQuery, (err: Error | null) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                    })
                    db.run(deleteAllCartsQuery, (err: Error | null) => {
                        if (err) {
                            reject(err);
                            return;
                        }})
                })
                resolve(true)
            } catch (error) {
                reject(error);
            }
        })
    }

    getAllCarts():Promise<Cart[]>{
        return new Promise((resolve, reject) => {
            try {
                const getAllCartsQuery = `SELECT * FROM cart`;
                const cartList: Cart[] = [];

                db.all(getAllCartsQuery,[], async(err: Error | null, rows: any[])=>{

                    if (err) {
                        reject(err);
                        return;
                    }
                    if(!rows){
                        reject(null);
                        return;
                    }

                    for (const row of rows) {
                        const products = await this.fillProducts(row.id_cart);
                        cartList.push(new Cart(row.ref_username, row.paid != 0, row.payment_date == "" ? null : row.payment_date, parseFloat(row.total.toFixed(2)), products));
                    }
                    resolve(cartList);
                });
            } catch (error) {
                reject(error);
            }
        })
    }

    //utili
     getCartId(user: User): Promise<number> {
        return new Promise((resolve, reject) => {
            const cartIdQuery = `SELECT id_cart
                                 FROM Cart
                                 WHERE ref_username = ? AND paid = 0`;
    
            db.get(cartIdQuery, [user.username], (err, row:any) => {
                if (err){
                    reject(err);
                    return
                }
                if (!row){
                    reject(new CartNotFoundError())
                    return;
                }
                resolve(row.id_cart)
            });

        });
    }   

     runQuery(query: string, params: any[]): Promise<void>{
        return new Promise((resolve,reject)=>{
            db.run(query, params, (err: Error | null) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        })
    }

     getQuery(query: string, params: any[]): Promise<any>{
        return new Promise((resolve,reject)=>{
            db.get(query, params, (err: Error | null, row:any) => {
                if (err) {
                    reject(err);
                    return
                }
                        resolve(row);

            });
        })
    }

    checkProductQuantity(model: string): Promise<number>{
        return new Promise((resolve, reject)=>{
            const query = `SELECT quantity FROM ProductDescriptor WHERE model = ?`;
            db.get(query, [model], (err: Error, row: any) => {
                if (err) {
                     reject(err);
                    return
                }
                if(!row){
                    resolve(undefined)
                    return;
                }
                resolve(row.quantity);
            });
        })
    }

    fillProducts(cartId:number):Promise<ProductInCart[]>{
        return new Promise((resolve,reject)=>{
            const getCartProducts = `SELECT model, pu.quantity as quantity, category, selling_price 
                                                    FROM ProductUser pu, ProductDescriptor pd 
                                                    WHERE model = ref_product_descriptor AND id_cart = ?`;

            db.all(getCartProducts,[cartId],(err:Error|null,rows:any)=>{
                if(err){
                    reject(err);
                    return
                }
                resolve(rows.map((row: any) => new ProductInCart(row.model,row.quantity,row.category,row.selling_price)))
            })
        })
    }
}


export default CartDAO
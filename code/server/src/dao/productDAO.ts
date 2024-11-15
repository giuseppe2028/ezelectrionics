import { ProductAlreadyExistsError, ProductNotFoundError } from "../errors/productError";
import { Product } from "../components/product";
import db from "../db/db";

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
    /**
     * Returns the Product with the specified model.
     * @param model The model of the Product to return.
     * @returns A Promise that resolves to the Product.
     */
    getProductByModel(model: String): Promise<Product> {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM ProductDescriptor WHERE model = ?"
            db.get(sql, [model], (err: Error | null, row: any) => {
                if (err) {
                    return reject(err)
                }
                if (!row) {
                    return reject(new ProductNotFoundError())
                }
                const product: Product = new Product(row.selling_price, row.model, row.category, row.arrival_date, row.details, row.quantity)
                resolve(product)
            })
        })
    }

    /**
     * Returns all the Products.
     * @param availableOnly Whether to return only available Products.
     * @returns A Promise that resolves to an array of Products.
     */
    getProducts(availableOnly: boolean = false): Promise<Product[]> {
        return new Promise((resolve, reject) => {
            const products: Product[] = []
            const sql = availableOnly
                ? "SELECT * FROM ProductDescriptor WHERE quantity > 0"
                : "SELECT * FROM ProductDescriptor"
            db.each(
                sql,
                (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err)
                    }
                    products.push(new Product(row.selling_price, row.model, row.category, row.arrival_date, row.details, row.quantity))
                },
                (err: Error | null, _elements: number) => {
                    if (err) {
                        return reject(err)
                    }
                    resolve(products)
                }
            )
        })
    }

    /**
     * Returns all the Products of the specified category.
     * @param category The category to filter Products by.
     * @param availableOnly Whether to return only available Products.
     * @returns A Promise that resolves to an array of Products.
     */
    getProductsByCategory(category: string, availableOnly: boolean = false): Promise<Product[]> {
        return new Promise((resolve, reject) => {
            const products: Product[] = []
            const sql = availableOnly
                ? "SELECT * FROM ProductDescriptor WHERE category = ? AND quantity > 0"
                : "SELECT * FROM ProductDescriptor WHERE category = ?"
            db.each(
                sql,
                [category],
                (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err)
                    }
                    products.push(new Product(row.selling_price, row.model, row.category, row.arrival_date, row.details, row.quantity))
                },
                (err: Error | null, _elements: number) => {
                    if (err) {
                        return reject(err)
                    }
                    resolve(products)
                }
            )
        })
    }

    /**
     * Updates the history of Product quantity of the specified Product.
     * @param model The Product to update the history of.
     * @param offset The change in product quantity.
     * @param changeDate The date of the change.
     * @returns A Promise that resolves to true if the history has been updated.
     */
    #updateHistory(model: string, offset: number, changeDate: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const sql = "INSERT INTO ProductHistory(ref_product, quantity, change_date) VALUES(?, ?, ?)"
            db.run(sql, [model, offset, changeDate], function(err: Error | null) {
                if (err) {
                    if (err.message.includes("SQLITE_CONSTRAINT: FOREIGN KEY constraint failed"))
                        return reject(new ProductNotFoundError)
                    return reject(err)
                }
                return resolve(true)
            })
        })
    }

    /**
     * Adds a new Product.
     * @param model The Product to create.
     * @param category The Product category.
     * @param quantity The initial available quantity of the Product.
     * @param details Optional description of the product.
     * @param sellingPrice The price of a single unit of the Product.
     * @param arrivalDate The date of the Product arrival.
     * @returns A Promise that resolves to nothing if the Product has been created.
     */
    createProduct(
        model: string,
        category: string,
        quantity: number,
        details: string | null,
        sellingPrice: number,
        arrivalDate: string | null
    ): Promise<void> {
        const self = this
        return new Promise((resolve, reject) => {
            // This should be in a transaction, but we don't have them...
            const sql = "INSERT INTO ProductDescriptor(model, category, arrival_date, selling_price, quantity, details) VALUES(?, ?, ?, ?, ?, ?)"
            db.run(sql, [model, category, arrivalDate, sellingPrice, quantity, details], function(err: Error | null) {
                if (err) {
                    if (err.message.includes("UNIQUE constraint failed: ProductDescriptor.model"))
                        return reject(new ProductAlreadyExistsError)
                    return reject(err)
                }
                // Ideally if this fails we should rollback the product creation...
                return self.#updateHistory(model, quantity, arrivalDate).then(() => resolve()).catch(err => reject(err))
            })
        })
    }



    checkProductExistsByModel(model:String){
        return new Promise<Boolean>(
            (resolve, reject)=>{
                const sql = "SELECT * FROM ProductDescriptor WHERE model = ?";
                db.get(sql,[model], (err: Error | null, row: any) => {
                    if(err) {reject(err)};
                    if(!row) resolve(false)
                    resolve(true)
                });

            }
        );
    }

    /**
     * Updates the quantity of the specified Product.
     * @param model The Product to update the quantity of.
     * @param offset The change in product quantity.
     * @param changeDate The date of the change.
     * @returns A Promise that resolves to the new available total quantity of the Product.
     */
    updateProductQuantity(model: string, offset: number, changeDate: string): Promise<number> {
        const self = this
        return new Promise((resolve, reject) => {
            const sql = "UPDATE ProductDescriptor SET quantity = quantity + ? WHERE model = ?"
            db.run(sql, [offset, model], function(err: Error | null) {
                if (err) {
                    return reject(err)
                }
                if (this.changes == 0) return reject(new ProductNotFoundError)
                self.#updateHistory(model, offset, changeDate).then(() => {
                    self.getProductByModel(model).then(product => resolve(product.quantity)).catch(err => reject(err))
                }).catch(err => reject(err))
            })
        })
    }

    /**
     * Removes the specified Product.
     * @param model The Product to remove.
     * @returns A Promise that resolves to true if the Product has been deleted.
     */
    deleteProduct(model: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const sql = "DELETE FROM ProductDescriptor WHERE model = ?"
            db.run(sql, [model], function(err: Error | null) {
                if (err) {
                    return reject(err)
                }
                if (this.changes == 0) return reject(new ProductNotFoundError)
                return resolve(true)
            })
        })
    }

    /**
     * Removes every Product.
     * @returns A Promise that resolves to true if all Products have been deleted.
     */
    deleteAllProducts(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const sql = "DELETE FROM ProductDescriptor"
            db.run(sql, function(err: Error | null) {
                if (err) {
                    return reject(err)
                }
                return resolve(true)
            })
        })
    }
}

export default ProductDAO

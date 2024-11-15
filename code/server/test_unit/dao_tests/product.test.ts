import { describe, test, expect, beforeAll,beforeEach,afterEach, afterAll, jest } from "@jest/globals"

import ProductDAO from "../../src/dao/productDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Category, Product } from "../../src/components/product"
import { ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError"

jest.mock("../../src/db/db.ts")

describe("create Product",()=>{
    let dao:ProductDAO;
    let sampleProduct:any;
    beforeEach(()=>{
        dao = new ProductDAO();
        sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            selling_price: 99.99,
            arrival_date: "2024-06-04"
        }
   });
   afterEach(()=>{
       jest.restoreAllMocks();
   });

   test("should crate a product",async ()=>{
        const product = new Product(
            sampleProduct.selling_price,
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.arrival_date,
            sampleProduct.details,
            sampleProduct.quantity
        )
        jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
            callback(null)
            return {} as Database
        })

        jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
            callback(null)
            return {} as Database
        })
        
        const res = await dao.createProduct(
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.quantity,
            sampleProduct.details,
            sampleProduct.selling_price,
            sampleProduct.arrival_date
        )
        expect(res).toBeUndefined()  
   })

   test("should return product already exists",async ()=>{
    
    jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
        callback(new Error("UNIQUE constraint failed: ProductDescriptor.model"),null)
        return {} as Database
    })
    
    const res = await dao.createProduct(
        sampleProduct.model,
        sampleProduct.category,
        sampleProduct.quantity,
        sampleProduct.details,
        sampleProduct.selling_price,
        sampleProduct.arrival_date
    ).catch((err)=>err)

    expect(res).toBeInstanceOf(ProductAlreadyExistsError)
    })

    test("should return product not found error from update history",async ()=>{
    
        jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
            callback(null,null)
            return {} as Database
        })

        jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
            callback(new Error("SQLITE_CONSTRAINT: FOREIGN KEY constraint failed"),null)
            return {} as Database
        })
        
        const res = await dao.createProduct(
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.quantity,
            sampleProduct.details,
            sampleProduct.selling_price,
            sampleProduct.arrival_date
        ).catch((err)=>err)
    
        expect(res).toBeInstanceOf(ProductNotFoundError)
    })

    test("should return product generic error",async ()=>{
    
        jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
            callback(new Error(),null)
            return {} as Database
        })
        
        const res = await dao.createProduct(
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.quantity,
            sampleProduct.details,
            sampleProduct.selling_price,
            sampleProduct.arrival_date
        ).catch((err)=>err)
    
        expect(res).toBeInstanceOf(Error)
    })

    test("should return product generic error from update history",async ()=>{
    
        jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
            callback(null,null)
            return {} as Database
        })

        jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
            callback(new Error(),null)
            return {} as Database
        })
        
        const res = await dao.createProduct(
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.quantity,
            sampleProduct.details,
            sampleProduct.selling_price,
            sampleProduct.arrival_date
        ).catch((err)=>err)
    
        expect(res).toBeInstanceOf(Error)
    })

})

describe("get Product by model",()=>{
    let dao:ProductDAO;
    let sampleProduct:any;
    beforeEach(()=>{
        dao = new ProductDAO();
        sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            selling_price: 99.99,
            arrival_date: "2024-06-04"
        }
   });
   afterEach(()=>{
       jest.restoreAllMocks();
   });

   test("should return a product by model",async ()=>{
        const product = new Product(
            sampleProduct.selling_price,
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.arrival_date,
            sampleProduct.details,
            sampleProduct.quantity
        )
        jest.spyOn(db,"get").mockImplementationOnce((sql,param,callback)=>{
            callback(null,sampleProduct)
            return {} as Database
        })

        const res = await dao.getProductByModel(sampleProduct.model)
        expect(res).toEqual(product)  
   })

   test("should return a product not found",async ()=>{
    
    jest.spyOn(db,"get").mockImplementationOnce((sql,param,callback)=>{
        callback.call({row:undefined},null)
        return {} as Database
    })

    const res = await dao.getProductByModel(sampleProduct.model).catch((err)=>err)
    expect(res).toBeInstanceOf(ProductNotFoundError)  
    })

    test("should return generic error",async ()=>{
    
        jest.spyOn(db,"get").mockImplementationOnce((sql,param,callback)=>{
            callback(new Error,null)
            return {} as Database
        })
    
        const res = await dao.getProductByModel(sampleProduct.model).catch((err)=>err)
        expect(res).toBeInstanceOf(Error)  
        })
    
})

describe("get Product by category",()=>{
    let dao:ProductDAO;
    let sampleProduct:any;
    beforeEach(()=>{
        dao = new ProductDAO();
        sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            selling_price: 99.99,
            arrival_date: "2024-06-04"
        }
   });
   afterEach(()=>{
       jest.restoreAllMocks();
   });

   test("should return products by category",async ()=>{
        const product = new Product(
            sampleProduct.selling_price,
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.arrival_date,
            sampleProduct.details,
            sampleProduct.quantity
        )
        jest.spyOn(db,"each").mockImplementationOnce((sql,param,callback1,callback2)=>{
            callback1(null,sampleProduct)
            callback2(null,[sampleProduct])
            return {} as Database
        })

        const res = await dao.getProductsByCategory(sampleProduct.category)
        expect(res).toEqual([product])  
   })

   test("should return products by available category",async ()=>{
    const product = new Product(
        sampleProduct.selling_price,
        sampleProduct.model,
        sampleProduct.category,
        sampleProduct.arrival_date,
        sampleProduct.details,
        sampleProduct.quantity
    )
    jest.spyOn(db,"each").mockImplementationOnce((sql,param,callback1,callback2)=>{
        callback1(null,sampleProduct)
        callback2(null,[sampleProduct])
        return {} as Database
    })

    const res = await dao.getProductsByCategory(sampleProduct.category,true)
    expect(res).toEqual([product])  
    })

    test("should return generic error",async ()=>{
    
        jest.spyOn(db,"each").mockImplementationOnce((sql,param,callback1,callback2)=>{
            callback1(new Error)
            callback2(new Error)
            return {} as Database
        })
    
        const res = await dao.getProductsByCategory(sampleProduct.category).catch((err)=>err)
        expect(res).toBeInstanceOf(Error)  
        })
    
})

describe("get All Product",()=>{
    let dao:ProductDAO;
    let sampleProduct:any;
    beforeEach(()=>{
        dao = new ProductDAO();
        sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            selling_price: 99.99,
            arrival_date: "2024-06-04"
        }
   });
   afterEach(()=>{
       jest.restoreAllMocks();
   });

   test("should return all products",async ()=>{
        const product = new Product(
            sampleProduct.selling_price,
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.arrival_date,
            sampleProduct.details,
            sampleProduct.quantity
        )
        jest.spyOn(db,"each").mockImplementationOnce((sql,callback1,callback2)=>{
            callback1(null,sampleProduct);
            callback2(null,[sampleProduct]);
            return {} as Database
        })

        const res = await dao.getProducts()
        expect(res).toEqual([product])  
   })

   test("should return available products",async ()=>{
    const product = new Product(
        sampleProduct.selling_price,
        sampleProduct.model,
        sampleProduct.category,
        sampleProduct.arrival_date,
        sampleProduct.details,
        sampleProduct.quantity
    )
    jest.spyOn(db,"each").mockImplementationOnce((sql,callback1,callback2)=>{
        callback1(null,sampleProduct)
        callback2(null,[sampleProduct])
        return {} as Database
    })

    const res = await dao.getProducts(true)
    expect(res).toEqual([product])  
    })

    test("should return generic error",async ()=>{
    
    jest.spyOn(db,"each").mockImplementationOnce((sql,callback1,callback2)=>{
        callback1(new Error)
        callback2(new Error)
        return {} as Database
    })

    const res = await dao.getProducts(sampleProduct.category).catch((err)=>err)
    expect(res).toBeInstanceOf(Error)  
    })
    
})

describe("check model exists Product",()=>{
    let dao:ProductDAO;
    let sampleProduct:any;
    beforeEach(()=>{
        dao = new ProductDAO();
        sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            selling_price: 99.99,
            arrival_date: "2024-06-04"
        }
   });
   afterEach(()=>{
       jest.restoreAllMocks();
   });

   test("should check existance",async ()=>{
        const product = new Product(
            sampleProduct.selling_price,
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.arrival_date,
            sampleProduct.details,
            sampleProduct.quantity
        )
        jest.spyOn(db,"get").mockImplementationOnce((sql,params,callback)=>{
            callback(null,true);
            return {} as Database
        })

        const res = await dao.checkProductExistsByModel(sampleProduct.model)
        expect(res).toEqual(true)  
   })
    
})

describe("update product quantity Product",()=>{
    let dao:ProductDAO;
    let sampleProduct:any;
    beforeEach(()=>{
        dao = new ProductDAO();
        sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            selling_price: 99.99,
            arrival_date: "2024-06-04"
        }
   });
   afterEach(()=>{
       jest.restoreAllMocks();
   });

   test("should update product",async ()=>{
        const product = new Product(
            sampleProduct.selling_price,
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.arrival_date,
            sampleProduct.details,
            sampleProduct.quantity
        )

        const updatedproduct = new Product(
            sampleProduct.selling_price,
            sampleProduct.model,
            sampleProduct.category,
            sampleProduct.arrival_date,
            sampleProduct.details,
            sampleProduct.quantity + 2
        )
        jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
            callback.call({ changes: 1 }, null);
            return {} as Database
        })

        jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
            callback(null)
            return {} as Database
        })

        jest.spyOn(db,"get").mockImplementationOnce((sql,param,callback)=>{
            callback(null,updatedproduct)
            return {} as Database
        })

        const res = await dao.updateProductQuantity(
            sampleProduct.model,
            2,
            "2024-05-05"
        )
        expect(res).toEqual(12)  
   })

   test("should return generic error",async ()=>{
    
    jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
        callback(new Error,null)
        return {} as Database
    })

    const res = await dao.updateProductQuantity(
        sampleProduct.model,
        2,
        "2024-05-05"
    ).catch((err)=>err)

    expect(res).toBeInstanceOf(Error)  
    })
    
    test("should return generic error from update history",async ()=>{
    
        jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
            callback.call({ changes: 1 }, null);
            return {} as Database
        })

        jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
            callback(new Error)
            return {} as Database
        })
    
        const res = await dao.updateProductQuantity(
            sampleProduct.model,
            2,
            "2024-05-05"
        ).catch((err)=>err)
        
        expect(res).toBeInstanceOf(Error)  
        })
    
})


describe("delete product by model Product",()=>{
    let dao:ProductDAO;
    let sampleProduct:any;
    beforeEach(()=>{
        dao = new ProductDAO();
        sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            selling_price: 99.99,
            arrival_date: "2024-06-04"
        }
   });
   afterEach(()=>{
       jest.restoreAllMocks();
   });

   test("should delete a product",async ()=>{
        
        jest.spyOn(db,"run").mockImplementationOnce((sql,params,callback)=>{
            callback.call({changes: 1},null);
            return {} as Database
        })

        const res = await dao.deleteProduct(sampleProduct.model)
        expect(res).toEqual(true)  
   })

   test("should return generic error",async ()=>{
    
    jest.spyOn(db,"run").mockImplementationOnce((sql,param,callback)=>{
        callback(new Error,null)
        return {} as Database
    })

    const res = await dao.deleteProduct(sampleProduct.model).catch((err)=>err)

    expect(res).toBeInstanceOf(Error)  
    })
    
})

describe("delete all products Product",()=>{
    let dao:ProductDAO;
    let sampleProduct:any;
    beforeEach(()=>{
        dao = new ProductDAO();
        sampleProduct = {
            model: "model",
            category: Category.LAPTOP,
            quantity: 10,
            details: "details",
            selling_price: 99.99,
            arrival_date: "2024-06-04"
        }
   });
   afterEach(()=>{
       jest.restoreAllMocks();
   });

   test("should delete a product",async ()=>{
        
        jest.spyOn(db,"run").mockImplementationOnce((sql,callback)=>{
            callback(null);
            return {} as Database
        })

        const res = await dao.deleteAllProducts()
        expect(res).toEqual(true)  
   })

   test("should return generic error",async ()=>{
    
    jest.spyOn(db,"run").mockImplementationOnce((sql,callback)=>{
        callback(new Error,null)
        return {} as Database
    })

    const res = await dao.deleteAllProducts().catch((err)=>err)

    expect(res).toBeInstanceOf(Error)  
    })
    
})


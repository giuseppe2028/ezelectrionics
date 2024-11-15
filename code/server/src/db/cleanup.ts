"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export function cleanup(done?: Function) {
    db.serialize(() => {
        // Delete all data from the database.
        db.run("DELETE FROM Review")
        db.run("DELETE FROM ProductHistory")
        db.run("DELETE FROM users")
        db.run("DELETE FROM ProductDescriptor")
        db.run("DELETE FROM Cart")
        db.run("DELETE FROM ProductUser")
        db.run("DELETE FROM Review")
        db.run("DELETE FROM ProductHistory")
        // Make use of an empty sqlite call to invoke the callback
        // after all the other calls have completed
        db.run("", () => {
            if (done)
                done()
        })
    })

}

export function cleanupCart(done?:Function) {
       db.serialize(()=>{
           db.run("DELETE FROM Cart")
           db.run("DELETE FROM ProductUser")
           db.run("", () => {
               if (done)
                   done()
           })
       })
}


// Promisified function so that we don't need to change the return type of `cleanup`,
// but only add an optional parameter
export function promisedCleanup(): Promise<void> {
    return new Promise((resolve, _reject) => {
        cleanup(resolve)
    })
}

export function promisedCleanupCart(): Promise<void> {
    return new Promise((resolve, _reject) => {
        cleanupCart(resolve)
    })
}
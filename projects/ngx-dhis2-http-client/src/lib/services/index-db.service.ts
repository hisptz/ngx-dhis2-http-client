import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { switchMap, mergeMap, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class IndexDbService {
  private _indexedDB: any;
  private _dbName: string;

  constructor() {
    this._indexedDB = indexedDB;
    this._dbName = 'db'; // by default
  }

  setName(dbName: string): void {
    if (dbName) {
      this._dbName = dbName;
    }
  }

  /**
   * Function to update existing data in the db
   */
  put(schema: any, data: any): Observable<any> {
    return Observable.create((observer: any) => {
      this.create(schema)
        .pipe(switchMap(() => this.open()))
        .subscribe((db: any) => {
          const transaction = db.transaction(schema.name, 'readwrite');
          const store = transaction.objectStore(schema.name);

          if (_.isArray(data)) {
            _.each(data, dataItem => {
              store.put(dataItem);
            });
          } else {
            store.put(data);
          }

          transaction.oncomplete = () => {
            observer.next(data);
            db.close();
            observer.complete();
          };
          db.onerror = (errorEvent: any) => {
            db.close();
            observer.error(errorEvent.target.errorCode);
          };
        });
    });
  }

  /**
   * Function to add new data in the db
   */
  post(schema: any, data: any): Observable<any> {
    return Observable.create((observer: any) => {
      this.create(schema)
        .pipe(mergeMap(() => this.open()))
        .subscribe((db: any) => {
          const transaction = db.transaction(schema.name, 'readwrite');
          const store = transaction.objectStore(schema.name);

          // Check if data is array or an object
          if (_.isArray(data)) {
            _.each(data, dataItem => {
              store.add(dataItem);
            });
          } else {
            store.add(data);
          }

          transaction.onsuccess = () => {
            observer.next(data);
            db.close();
            observer.complete();
          };
          db.onerror = () => {
            observer.next(data);
            db.close();
            observer.complete();
          };
        });
    });
  }

  /**
   * Function to get value for a particular key from the table
   */
  findOne(schema: any, key: string | number): Observable<any[]> {
    return new Observable((observer: any) => {
      this.create(schema)
        .pipe(mergeMap(() => this.open()))
        .subscribe((db: any) => {
          const transaction = db.transaction(schema.name, 'readwrite');
          const store = transaction.objectStore(schema.name);
          const request = store.get(key);
          request.onsuccess = successEvent => {
            observer.next(successEvent.target.result);
            db.close();
            observer.complete();
          };
          db.onerror = (event: any) => {
            console.log(event.target.errorCode);
            db.close();
            observer.error(event.target.errorCode);
          };
        });
    });
  }

  /**
   * Function to find all values for a particular table in the db
   */
  findAll(schema: any): Observable<any[]> {
    return Observable.create((observer: any) => {
      this.create(schema)
        .pipe(switchMap(() => this.open()))
        .subscribe((db: any) => {
          const transaction = db.transaction(schema.name, 'readwrite');
          const store = transaction.objectStore(schema.name);
          const storeIndex = store.index(schema.keyPath);
          const request = storeIndex.openCursor();
          let results: any[] = [];

          request.onsuccess = successEvent => {
            const cursor = successEvent.target.result;
            if (cursor) {
              results = [...results, cursor.value];
              cursor.continue();
            } else {
              observer.next(results);
              db.close();
              observer.complete();
            }
          };
          db.onerror = (event: any) => {
            db.close();
            observer.error(event.target.errorCode);
          };
        });
    });
  }

  /**
   * Delete data from the db
   */
  delete(schema: any, key: string | string[]): Observable<any> {
    return Observable.create((observer: any) => {
      this.open().subscribe((db: any) => {
        if (!db.objectStoreNames.contains(schema.name)) {
          const transaction = db.transaction(schema.name, 'readwrite');
          const store = transaction.objectStore(schema.name);

          if (_.isArray(key)) {
            _.each(key, keyItem => {
              store.delete(keyItem);
            });
          } else {
            store.delete(key);
          }

          transaction.oncomplete = () => {
            observer.next(key);
            db.close();
            observer.complete();
          };
          db.onerror = (errorEvent: any) => {
            db.close();
            observer.error(errorEvent.target.errorCode);
          };
        }
      });
    });
  }

  /**
   * Create a schema/table
   */
  create(schema: any): Observable<any> {
    return Observable.create((observer: any) => {
      this.open().subscribe((requestResult: any) => {
        if (!requestResult.objectStoreNames.contains(schema.name)) {
          /**
           * Close database to allow opening with new version
           */
          requestResult.close();

          /**
           * Set a new connection with new version to allows creating schema
           */
          const request = this._indexedDB.open(
            this._dbName,
            requestResult.version + 1
          );

          request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(schema.name)) {
              /**
               * Create corresponding schema
               */
              const store = db.createObjectStore(schema.name, {
                keyPath: schema.keyPath
              });
              store.createIndex(schema.keyPath, schema.keyPath, {
                unique: true
              });

              /**
               * Create indexes for schema if supplied
               */
              if (schema.indexes) {
                _.each(schema.indexes, (schemaIndex: any) => {
                  store.createIndex(schemaIndex, schemaIndex);
                });
              }

              /**
               * Add data if supplied
               */
              if (schema.data) {
                _.each(schema.data, (dataItem: any) => {
                  store.put(dataItem);
                });
              }
            }

            observer.next('done');
            observer.complete();
          };

          request.onerror = errorEvent => {
            observer.error(errorEvent.target.errorCode);
          };

          request.onsuccess = successEvent => {
            successEvent.target.result.close();
            observer.next('done');
            observer.complete();
          };
        } else {
          observer.next('done');
          observer.complete();
        }
      });
    });
  }

  /**
   * Delete the whole database
   */
  clear(): Observable<any> {
    return Observable.create((observer: any) => {
      const request = this._indexedDB.deleteDatabase(this._dbName);

      request.onsuccess = () => {
        observer.next('done');
        observer.complete();
      };
      request.onerror = errorEvent => {
        observer.error(errorEvent.target.errorCode);
      };
      request.onblocked = blockEvent => {
        observer.error(blockEvent.target.errorCode);
      };
    });
  }

  private open(): Observable<any> {
    return Observable.create((observer: any) => {
      const request = this._indexedDB.open(this._dbName);

      request.onsuccess = successEvent => {
        observer.next(successEvent.target.result);
        observer.complete();
      };
      request.onerror = errorEvent =>
        observer.error(errorEvent.target.errorCode);
    });
  }
}

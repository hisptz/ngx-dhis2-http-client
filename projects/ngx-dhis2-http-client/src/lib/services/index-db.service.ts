import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { Observable } from 'rxjs';
import { IndexDBParams } from '../models/index-db-params.model';

export interface IndexDbConfig {
    namespace: string;
    version: number;
    models: { [name: string]: string };
}

export class IndexDbServiceConfig implements IndexDbConfig {
    namespace = 'db';
    version = 1;
    models = {};
}
@Injectable({
    providedIn: 'root',
})
export class IndexDbService extends Dexie {
    constructor(config: IndexDbServiceConfig) {
        super(config.namespace);
        this.version(config.version).stores(config.models);
    }

    findById(schemaName: string, id: string) {
        return new Observable(observer => {
            this.table(schemaName)
                .where({ id })
                .first()
                .then(
                    (data: any) => {
                        observer.next(data);
                        observer.complete();
                    },
                    (error: any) => {
                        observer.next(error);
                    }
                );
        });
    }

    findAll(schemaName: string, params: IndexDBParams): Observable<any> {
        return new Observable(observer => {
            this._getTableSchema(schemaName, params)
                .toArray()
                .then(
                    (dataArray: any[]) => {
                        observer.next({
                            [schemaName]: dataArray,
                        });
                        observer.complete();
                    },
                    (error: any) => {
                        observer.next(error);
                    }
                );
        });
    }

    saveOne(schemaName: string, data: any) {
        return new Observable(observer => {
            this.table(schemaName)
                .put(data)
                .then(
                    () => {
                        observer.next(data);
                        observer.complete();
                    },
                    error => {
                        observer.error(error);
                    }
                );
        });
    }

    saveBulk(schemaName: string, data: any[]): Observable<any> {
        return new Observable(observer => {
            this.table(schemaName)
                .bulkPut(data)
                .then(
                    () => {
                        observer.next({ [schemaName]: data });
                        observer.complete();
                    },
                    error => {
                        observer.error(error);
                    }
                );
        });
    }

    private _getTableSchema(schemaName: string, params: IndexDBParams) {
        if (!params || !params.pageSize) {
            return this.table(schemaName);
        }
        const page = params.page || 1;

        return this.table(schemaName)
            .reverse()
            .offset(page * params.pageSize)
            .limit(params.pageSize);
    }
}

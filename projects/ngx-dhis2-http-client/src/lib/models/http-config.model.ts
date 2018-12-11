export interface HttpConfig {
  includeVersionNumber?: boolean;
  preferPreviousApiVersion?: boolean;
  useRootUrl?: boolean;
  isExternalLink?: boolean;
  useIndexDb?: boolean;
  indexDbConfig?: {
    schema: IndexDbSchema;
    key?: string | number;
    arrayKey?: string;
  };
}

export interface IndexDbSchema {
  name: string;
  keyPath: string;
}

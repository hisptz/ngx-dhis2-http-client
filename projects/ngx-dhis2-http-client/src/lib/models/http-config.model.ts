export interface HttpConfig {
  includeVersionNumber?: boolean;
  preferPreviousApiVersion?: boolean;
  useRootUrl?: boolean;
  isExternaLink?: boolean;
  useIndexDb?: boolean;
  indexDbConfig?: {
    schema: any;
    keyPath: string;
  };
}

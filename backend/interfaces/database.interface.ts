export interface Database {
  connect(url?: string): Promise<void>;
}

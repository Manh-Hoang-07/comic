export interface MenuTreeItem {
  id: any;
  code: string;
  name: string;
  path?: string | null;
  icon?: string | null;
  type: string;
  status: string;
  is_public?: boolean;
  children?: MenuTreeItem[];
  allowed?: boolean;
}

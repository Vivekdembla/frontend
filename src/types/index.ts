export interface FileStructure {
  name: string;
  type: 'file' | 'folder';
  children?: FileStructure[];
  content?: string;
}

export interface Step {
  id: number;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description: string;
}
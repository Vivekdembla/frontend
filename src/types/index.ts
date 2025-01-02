export interface FileStructure {
  name: string;
  type: 'file' | 'folder';
  children?: FileStructure[];
  content?: string;
}

export interface Step {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description: string;
}
export interface ICreateFileDTO {
  folder_id: string;
  files: Array<{
    name: string;
    file: string;
  }>;
}

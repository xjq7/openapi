export enum ApiMethod {
  get = 'Get',
  post = 'Post',
  put = 'Put',
  delete = 'Delete',
}

export const methods: (ApiMethod | undefined)[] = [ApiMethod.get, ApiMethod.post, ApiMethod.put, ApiMethod.delete];
